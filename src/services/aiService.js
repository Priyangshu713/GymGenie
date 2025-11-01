import { GoogleGenAI } from '@google/genai'

// Initialize Gemini AI
let genAI = null

// Helper function to get split data by type
const getSplitByType = (splitType) => {
  const popularSplits = {
    'push-pull-legs': {
      name: 'Push/Pull/Legs (PPL)',
      schedule: {
        1: { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
        2: { name: 'Pull', muscles: ['back', 'biceps', 'forearms'] },
        3: { name: 'Legs', muscles: ['legs'] },
        4: { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
        5: { name: 'Pull', muscles: ['back', 'biceps', 'forearms'] },
        6: { name: 'Legs', muscles: ['legs'] },
        7: { name: 'Rest', muscles: [] }
      }
    },
    'upper-lower': {
      name: 'Upper/Lower Split',
      schedule: {
        1: { name: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
        2: { name: 'Lower Body', muscles: ['legs'] },
        3: { name: 'Rest', muscles: [] },
        4: { name: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
        5: { name: 'Lower Body', muscles: ['legs'] },
        6: { name: 'Rest', muscles: [] },
        7: { name: 'Rest', muscles: [] }
      }
    },
    'bro-split': {
      name: 'Bro Split',
      schedule: {
        1: { name: 'Chest Day', muscles: ['chest', 'triceps'] },
        2: { name: 'Back Day', muscles: ['back', 'biceps'] },
        3: { name: 'Shoulder Day', muscles: ['shoulders'] },
        4: { name: 'Arm Day', muscles: ['biceps', 'triceps', 'forearms'] },
        5: { name: 'Leg Day', muscles: ['legs'] },
        6: { name: 'Rest', muscles: [] },
        7: { name: 'Rest', muscles: [] }
      }
    },
    'full-body': {
      name: 'Full Body',
      schedule: {
        1: { name: 'Full Body A', muscles: ['chest', 'back', 'legs', 'shoulders', 'biceps'] },
        2: { name: 'Rest', muscles: [] },
        3: { name: 'Full Body B', muscles: ['chest', 'back', 'legs', 'shoulders', 'triceps'] },
        4: { name: 'Rest', muscles: [] },
        5: { name: 'Full Body C', muscles: ['chest', 'back', 'legs', 'shoulders', 'forearms'] },
        6: { name: 'Rest', muscles: [] },
        7: { name: 'Rest', muscles: [] }
      }
    }
  }
  
  return popularSplits[splitType] || null
}

const initializeAI = () => {
  const apiKey = getGeminiApiKey()
  if (apiKey && !genAI) {
    genAI = new GoogleGenAI({
      apiKey: apiKey
    })
  }
  return genAI
}

export const generateWorkoutInsights = async (workoutData) => {
  try {
    // Check if we have valid workout data
    if (!workoutData || !workoutData.workouts || workoutData.workouts.length === 0) {
      throw new Error('No workout data available for analysis')
    }

    const ai = initializeAI()
    if (!ai) {
      throw new Error('AI not initialized')
    }
    
    // Configure tools with Google Search for scientific accuracy
    const tools = [
      {
        googleSearch: {}
      }
    ]
    
    const config = {
      thinkingConfig: {
        thinkingBudget: -1
      },
      tools
    }
    
    // Prepare workout data for analysis
    const analysisPrompt = createAnalysisPrompt(workoutData)
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: analysisPrompt
          }
        ]
      }
    ]
    
    const response = await ai.models.generateContentStream({
      model: 'gemini-flash-lite-latest',
      config,
      contents
    })
    
    let fullText = ''
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text
      }
    }
    
    // Parse the AI response into structured insights
    return parseInsightsResponse(fullText)
  } catch (error) {
    console.error('Error generating workout insights:', error)
    
    // Return fallback insights instead of throwing
    return {
      overall: "Start logging workouts to get personalized AI insights about your training progress and recommendations.",
      strengths: [],
      improvements: ["Begin tracking your workouts consistently", "Log difficulty level (1-10) for each set"],
      recommendations: ["Start with 3-4 workouts per week", "Focus on compound movements", "Track your progress weekly"],
      goals: ["Complete 12 workouts this month", "Maintain consistent difficulty of 7-9"],
      weeklyPlan: "This week, focus on establishing a consistent workout routine. Aim for 3 sessions with proper form and progressive overload."
    }
  }
}

const createAnalysisPrompt = (data) => {
  const { workouts, stats, timeframe } = data
  
  // Get user's workout split
  const workoutSplitData = localStorage.getItem('gymgenie-workout-split')
  const userSplit = workoutSplitData ? JSON.parse(workoutSplitData) : null
  
  // Calculate muscle group distribution
  const muscleGroups = {}
  const exerciseTypes = { strength: 0, cardio: 0 }
  let totalSets = 0
  let totalVolume = 0
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exerciseTypes[exercise.type]++
      totalSets += exercise.sets.length
      
      if (exercise.type === 'strength') {
        if (exercise.muscleGroup) {
          muscleGroups[exercise.muscleGroup] = (muscleGroups[exercise.muscleGroup] || 0) + exercise.sets.length
        }
        
        exercise.sets.forEach(set => {
          totalVolume += (set.weight || 0) * (set.reps || 0)
        })
      }
    })
  })
  
  const workoutFrequency = workouts.length / (parseInt(timeframe) / 7) // workouts per week
  
  // Analyze split adherence
  let splitAnalysis = ""
  if (userSplit && userSplit.type !== 'none') {
    splitAnalysis = `
USER'S WORKOUT SPLIT: ${userSplit.type === 'custom' ? userSplit.customSplit.name : userSplit.type.toUpperCase()}
Split Type: ${userSplit.type}

SPLIT ADHERENCE ANALYSIS:
${workouts.slice(-7).map(workout => {
  const workoutDate = new Date(workout.date)
  const dayOfWeek = workoutDate.getDay() === 0 ? 7 : workoutDate.getDay()
  
  // Get planned workout for that day
  const split = userSplit.type === 'custom' ? userSplit.customSplit : getSplitByType(userSplit.type)
  const plannedWorkout = split?.schedule?.[dayOfWeek]
  
  if (!plannedWorkout) return `- ${workoutDate.toDateString()}: No planned workout data`
  
  const actualMuscles = [...new Set(workout.exercises.map(ex => ex.muscleGroup).filter(Boolean))]
  const plannedMuscles = plannedWorkout.muscles || []
  
  const adherence = plannedMuscles.length > 0 ? 
    actualMuscles.filter(muscle => plannedMuscles.includes(muscle)).length / plannedMuscles.length * 100 : 0
  
  return `- ${workoutDate.toDateString()}: Planned "${plannedWorkout.name}" (${plannedMuscles.join(', ')}) | Actual: ${actualMuscles.join(', ')} | Adherence: ${adherence.toFixed(0)}%`
}).join('\n')}

IMPORTANT: Analyze if the user is following their planned workout split. If they trained different muscle groups than planned, provide specific feedback about why this might not be optimal for their goals.`
  } else {
    splitAnalysis = `
USER'S WORKOUT SPLIT: No specific split selected
Note: User trains without a structured split. Consider recommending a structured approach for better results.`
  }
  
  return `
As a professional fitness coach and exercise physiologist, analyze the following workout data and provide personalized insights and recommendations. Be specific, actionable, and motivating. Note: All weights are in KILOGRAMS (kg), not pounds.

WORKOUT DATA ANALYSIS:
- Time Period: ${timeframe}
- Total Workouts: ${workouts.length}
- Workout Frequency: ${workoutFrequency.toFixed(1)} workouts per week
- Total Sets: ${totalSets}
- Total Volume: ${totalVolume} kg
- Strength Exercises: ${exerciseTypes.strength}
- Cardio Exercises: ${exerciseTypes.cardio}

MUSCLE GROUP DISTRIBUTION:
${Object.entries(muscleGroups).map(([group, sets]) => `- ${group}: ${sets} sets`).join('\n')}

${splitAnalysis}

RECENT WORKOUT PATTERN:
${workouts.slice(-5).map(workout => 
  `- ${workout.exercises.length} exercises, ${workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets`
).join('\n')}

Please provide a comprehensive analysis in the following JSON format:
{
  "overall": "Brief overall assessment of their fitness journey and progress (2-3 sentences)",
  "strengths": ["List 2-3 specific strengths based on their data"],
  "improvements": ["List 2-3 areas that need attention or improvement"],
  "recommendations": ["List 3-4 specific, actionable recommendations"],
  "goals": ["Suggest 2-3 SMART goals for the next 4 weeks"],
  "weeklyPlan": "Specific plan for this week based on their current pattern and needs"
}

Focus on:
1. Workout consistency and frequency
2. Muscle group balance and potential imbalances
3. Progressive overload and volume progression
4. Strength vs cardio balance
5. Recovery and rest patterns
6. Specific exercise recommendations
7. **WORKOUT SPLIT ADHERENCE**: If user has a split, analyze if they're following it correctly. Provide specific feedback about training wrong muscle groups on wrong days.

IMPORTANT: All weight measurements are in KILOGRAMS (kg). When mentioning weights in your response, always use kg, never lbs or pounds.

SPLIT-SPECIFIC ANALYSIS REQUIREMENTS:
- If user trained different muscles than planned for their split, explain why this is suboptimal
- If user did chest on back day (or similar), warn about recovery issues and muscle imbalances
- If user is doing too many sets or too few sets compared to their split plan, provide guidance
- Suggest corrections to get back on track with their planned split

Be encouraging but honest about areas needing improvement. Provide specific numbers, exercises, and timeframes where appropriate.
`
}

const parseInsightsResponse = (aiResponse) => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback: parse structured text response
    return {
      overall: "Based on your workout data, you're showing good consistency in your training routine. Keep focusing on progressive overload and balanced muscle development.",
      strengths: [
        "Consistent workout frequency",
        "Good variety in exercise selection"
      ],
      improvements: [
        "Consider adding more cardio exercises",
        "Focus on balanced muscle group training"
      ],
      recommendations: [
        "Increase workout frequency to 4-5 times per week",
        "Add compound movements for better muscle activation",
        "Include 2-3 cardio sessions weekly"
      ],
      goals: [
        "Complete 16 workouts in the next 4 weeks",
        "Increase total weekly volume by 10%"
      ],
      weeklyPlan: "This week, focus on compound movements and add one cardio session. Aim for 4 workouts with balanced muscle group training."
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    throw new Error('Failed to parse AI insights')
  }
}

export const generateProfileInsights = async (measurements) => {
  try {
    if (!measurements) {
      throw new Error("No measurements data available for analysis");
    }

    const ai = initializeAI();
    if (!ai) {
      throw new Error("AI not initialized");
    }

    const prompt = createProfileAnalysisPrompt(measurements);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model: "gemini-flash-lite-latest",
      contents,
    });

    let fullText = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    return parseProfileInsightsResponse(fullText);
  } catch (error) {
    console.error("Error generating profile insights:", error);
    return {
      success: false,
      insights: {
        bmi: {
          value: "N/A",
          interpretation: "Could not calculate BMI.",
        },
        tdee: {
          value: "N/A",
          interpretation: "Could not calculate TDEE.",
        },
        goalAdvice: {
          title: "Error",
          advice: "Could not generate advice.",
        },
        healthTips: [],
      },
    };
  }
};

const parseProfileInsightsResponse = (aiResponse) => {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, insights: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, insights: null }; // Or some default error structure
  } catch (error) {
    console.error("Error parsing AI profile insights response:", error);
    return { success: false, insights: null }; // Or some default error structure
  }
};

const createProfileAnalysisPrompt = (measurements) => {
  const { height, weight, age, sex, activityLevel, goal } = measurements;

  return `
    As a professional fitness and nutrition coach, analyze the following user profile data. Provide actionable insights and recommendations in a JSON format. The information must be very concise and bite-sized.

    USER PROFILE:
    - Height: ${height || "Not provided"} cm
    - Weight: ${weight || "Not provided"} kg
    - Age: ${age || "Not provided"} years
    - Sex: ${sex || "Not provided"}
    - Activity Level: ${activityLevel || "Not provided"}
    - Goal: ${goal || "Not provided"}

    Please provide a comprehensive analysis in the following JSON format, with each string value being a short, single sentence:
    {
      "bmi": {
        "value": "string",
        "interpretation": "string (e.g., 'This is within the healthy range.')"
      },
      "tdee": {
        "value": "string",
        "interpretation": "string (e.g., 'Calories to maintain your current weight.')"
      },
      "healthyWeight": {
        "range": "string (e.g., '60-75 kg')",
        "interpretation": "string (e.g., 'A healthy weight range for your height.')"
      },
      "macroSplit": {
        "protein": "string (e.g., '150g')",
        "carbs": "string (e.g., '200g')",
        "fat": "string (e.g., '60g')",
        "interpretation": "string (e.g., 'A sample macro split for your goal.')"
      },
      "workoutFrequency": {
        "recommendation": "string (e.g., '3-5 days/week')",
        "interpretation": "string (e.g., 'Recommended workout frequency for your goal.')"
      },
      "goalAdvice": {
        "title": "string (e.g., 'For Your Goal')",
        "advice": "string (a short, actionable tip)"
      },
      "healthTips": [
        {
          "title": "string (e.g., 'Hydration Tip')",
          "tip": "string (a short, single-sentence tip)"
        },
        {
          "title": "string (e.g., 'Sleep Tip')",
          "tip": "string (a short, single-sentence tip)"
        }
      ]
    }

    Keep the tone encouraging and informative. All string values must be very short and easy to read at a glance.
  `;
};

// AI Split Analysis Function
export const analyzeSplit = async (splitData, userGoals = 'muscle_growth') => {
  try {
    // Initialize AI if not already done
    const ai = initializeAI()
    if (!ai) {
      throw new Error('AI not initialized. Please check your API key.')
    }
    
    // Validate split data
    if (!splitData || splitData.type === 'none') {
      throw new Error('No workout split selected for analysis')
    }
    
    // Configure tools with Google Search for scientific accuracy
    const tools = [
      {
        googleSearch: {}
      }
    ]
    
    const config = {
      thinkingConfig: {
        thinkingBudget: -1
      },
      tools
    }
    
    // Create comprehensive split analysis prompt
    const prompt = createSplitAnalysisPrompt(splitData, userGoals)
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
    
    const response = await ai.models.generateContentStream({
      model: 'gemini-flash-lite-latest',
      config,
      contents
    })
    
    let analysis = ''
    for await (const chunk of response) {
      if (chunk.text) {
        analysis += chunk.text
      }
    }
    
    return {
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error analyzing split:', error)
    
    // Provide a fallback analysis if AI is not available
    if (error.message.includes('AI not initialized')) {
      return {
        success: false,
        error: 'AI analysis is not available. Please set up your Gemini API key in the settings to get detailed workout split analysis.',
        fallbackAnalysis: 'To get AI-powered split analysis, please configure your Gemini API key in the app settings. This will enable detailed scientific analysis of your workout split including muscle balance, recovery patterns, and personalized recommendations.'
      }
    }
    
    return {
      success: false,
      error: error.message || 'Failed to analyze workout split'
    }
  }
}

// Create detailed split analysis prompt
const createSplitAnalysisPrompt = (splitData, userGoals) => {
  const { type, customSplit } = splitData
  
  let splitInfo = ''
  let splitSchedule = {}
  
  if (type === 'custom' && customSplit) {
    splitInfo = `Custom Split: "${customSplit.name}"
Description: ${customSplit.description || 'No description provided'}
`
    splitSchedule = customSplit.schedule
  } else if (type !== 'none') {
    const presetSplit = getSplitByType(type)
    if (presetSplit) {
      splitInfo = `Preset Split: ${presetSplit.name}
`
      splitSchedule = presetSplit.schedule
    }
  }

  // Analyze the schedule
  let scheduleAnalysis = ''
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  Object.entries(splitSchedule).forEach(([dayNum, dayData]) => {
    const dayName = dayNames[parseInt(dayNum) - 1]
    const muscles = dayData.muscles || []
    const workoutName = dayData.name || 'Unnamed'
    
    scheduleAnalysis += `${dayName}: ${workoutName}`
    if (muscles.length > 0) {
      scheduleAnalysis += ` - Target: ${muscles.join(', ')}`
    }
    scheduleAnalysis += '\n'
  })

  // Calculate split metrics
  const totalWorkoutDays = Object.values(splitSchedule).filter(day => day.muscles && day.muscles.length > 0).length
  const restDays = 7 - totalWorkoutDays
  
  // Muscle group frequency analysis
  const muscleFrequency = {}
  Object.values(splitSchedule).forEach(day => {
    if (day.muscles) {
      day.muscles.forEach(muscle => {
        muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1
      })
    }
  })

  return `You are a world-class exercise scientist and certified strength & conditioning specialist with expertise in evidence-based training methodologies. Use Google Search to reference current scientific literature, peer-reviewed studies, and established training principles when analyzing this workout split.

IMPORTANT: Base your analysis on scientific evidence and established training principles. Popular splits like Push/Pull/Legs (PPL), Upper/Lower, and Full Body have extensive research backing their effectiveness.

WORKOUT SPLIT TO ANALYZE:
${splitInfo}

WEEKLY SCHEDULE:
${scheduleAnalysis}

SPLIT METRICS:
- Total workout days: ${totalWorkoutDays}/7
- Rest days: ${restDays}/7
- Muscle group frequency: ${JSON.stringify(muscleFrequency, null, 2)}

USER GOAL: ${userGoals}

SEARCH AND REFERENCE: Before providing your analysis, search for recent scientific literature on:
1. Optimal training frequency for muscle hypertrophy
2. Evidence on Push/Pull/Legs vs other split effectiveness
3. Recovery requirements between muscle groups
4. Volume recommendations for different training splits

PROVIDE A SCIENCE-BASED ANALYSIS covering:

🔥 OVERALL RATING (1-10/10):
Rate based on scientific evidence and established training principles. Consider that well-designed splits like PPL typically rate 7-9/10 based on research.

📚 SCIENTIFIC EVIDENCE:
Reference specific studies and research findings that support your analysis. Cite training frequency research, volume studies, and split comparison data.

⚖️ MUSCLE BALANCE ANALYSIS:
Based on research showing optimal push:pull ratios and movement pattern balance:
- Push vs Pull ratio (research shows 1:1 or 1:1.2 ratio is optimal)
- Upper vs Lower body balance (research on training distribution)
- Anterior vs Posterior chain balance
- Muscle group frequency (2-3x per week optimal per research)

🕐 RECOVERY & FREQUENCY:
Based on muscle protein synthesis and recovery research:
- Recovery time between sessions (48-72 hours for same muscle groups)
- Training frequency research (Schoenfeld et al. studies on frequency)
- Volume distribution across the week
- CNS fatigue considerations

📊 VOLUME & INTENSITY:
Reference volume landmark studies and training guidelines:
- Weekly volume recommendations (10-20 sets per muscle group per week)
- Training density and session length
- Progressive overload principles
- Periodization research

🎯 GOAL ALIGNMENT:
- Evidence-based split selection for different goals
- Research on split effectiveness for hypertrophy vs strength
- Time efficiency based on training studies

💡 EVIDENCE-BASED IMPROVEMENTS:
- Specific recommendations backed by research
- Alternative splits with scientific support
- Exercise selection based on biomechanics research
- Frequency and timing adjustments supported by studies

**WEEKLY PLAN RECOMMENDATION:**
If you recommend changes, provide a sample week showing the improved split:

**Week 1:**
Monday: [Workout type] - [Target muscles and key exercises]
Tuesday: [Workout type] - [Target muscles and key exercises]  
Wednesday: REST
Thursday: [Workout type] - [Target muscles and key exercises]
Friday: [Workout type] - [Target muscles and key exercises]
Saturday: [Workout type or REST]
Sunday: REST

**Note:** [Any important notes about progression, intensity, or modifications]

FORMATTING GUIDELINES:
- Use clear section headers with emojis
- Put workout days on separate lines
- Use **bold** for emphasis on important points
- Use - for bullet points
- Keep paragraphs concise and readable
- Be direct, scientific, and don't hold back
- If the split sucks, say it sucks and explain exactly why
- If it's good, explain what makes it effective
- Use fitness science, anatomy, and real-world training experience`
}

export const setGeminiApiKey = (apiKey) => {
  localStorage.setItem('gemini-api-key', apiKey)
  genAI = null // Reset to force reinitialization
}

export const getGeminiApiKey = () => {
  return localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY
}

// Export initializeAI for external use
export { initializeAI }
