import { GoogleGenerativeAI } from '@google/generative-ai'

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
  
  return popularSplits[splitType]
}

const initializeAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini-api-key')
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables or set it in the app settings.')
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

export const generateWorkoutInsights = async (workoutData) => {
  try {
    // Check if we have valid workout data
    if (!workoutData || !workoutData.workouts || workoutData.workouts.length === 0) {
      throw new Error('No workout data available for analysis')
    }

    const model = initializeAI()
    
    // Prepare workout data for analysis
    const analysisPrompt = createAnalysisPrompt(workoutData)
    
    const result = await model.generateContent(analysisPrompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the AI response into structured insights
    return parseInsightsResponse(text)
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

// AI Split Analysis Function
export const analyzeSplit = async (splitData, userGoals = 'muscle_growth') => {
  try {
    // Initialize AI if not already done
    const model = initializeAI()
    
    // Validate split data
    if (!splitData || splitData.type === 'none') {
      throw new Error('No workout split selected for analysis')
    }
    
    // Create comprehensive split analysis prompt
    const prompt = createSplitAnalysisPrompt(splitData, userGoals)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysis = response.text()
    
    return {
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error analyzing split:', error)
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

  return `You are a brutally honest, world-class fitness expert and exercise scientist. Analyze this workout split with complete honesty - don't sugarcoat anything. Point out every flaw, imbalance, and potential issue.

WORKOUT SPLIT TO ANALYZE:
${splitInfo}

WEEKLY SCHEDULE:
${scheduleAnalysis}

SPLIT METRICS:
- Total workout days: ${totalWorkoutDays}/7
- Rest days: ${restDays}/7
- Muscle group frequency: ${JSON.stringify(muscleFrequency, null, 2)}

USER GOAL: ${userGoals}

PROVIDE A BRUTALLY HONEST ANALYSIS covering:

🔥 OVERALL RATING (1-10/10):
Give a harsh but fair rating and explain why.

💀 MAJOR PROBLEMS:
- What's fundamentally wrong with this split?
- Which muscle groups are neglected or overtrained?
- Are there recovery issues?
- Volume distribution problems?
- Any anatomical/biomechanical issues?

⚖️ MUSCLE BALANCE ANALYSIS:
- Push vs Pull ratio
- Upper vs Lower body balance  
- Anterior vs Posterior chain
- Left vs Right side considerations
- Core and stabilizer inclusion

🕐 RECOVERY & FREQUENCY:
- Is recovery time adequate between sessions?
- Muscle group frequency (optimal is 2-3x/week for most)
- Potential overtraining risks
- CNS fatigue considerations

📊 VOLUME & INTENSITY:
- Is the weekly volume appropriate?
- Training density issues
- Potential for progressive overload
- Periodization concerns

🎯 GOAL ALIGNMENT:
- Does this split match the user's goals?
- Better alternatives for their objectives
- Efficiency rating

💡 SPECIFIC IMPROVEMENTS:
- Exact changes needed (be specific)
- Alternative split suggestions
- Exercise selection recommendations
- Timing and frequency adjustments

🚨 RED FLAGS:
- Injury risks
- Unsustainable elements
- Common mistakes being made

Be direct, scientific, and don't hold back. If the split sucks, say it sucks and explain exactly why. If it's good, explain what makes it effective. Use fitness science, anatomy, and real-world training experience.

Format your response with clear sections using emojis and be conversational but authoritative.`
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
