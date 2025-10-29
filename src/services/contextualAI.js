import { GoogleGenAI } from '@google/genai'
import { getGeminiApiKey } from './aiService'

let genAI = null

const initializeAI = () => {
  const apiKey = getGeminiApiKey()
  if (apiKey && !genAI) {
    genAI = new GoogleGenAI({
      apiKey: apiKey
    })
  }
  return genAI
}

// Generate quick contextual tips based on recent workout data
export const getQuickTip = async (workoutData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { recentWorkouts, stats } = workoutData
    
    // Create a concise prompt for quick insights
    const prompt = `As a fitness coach, give ONE brief, actionable tip (max 15 words) based on this data:
- Last workout: ${recentWorkouts[0]?.exercises?.length || 0} exercises
- This week: ${stats?.thisWeek || 0} workouts
- Muscle groups today: ${recentWorkouts[0]?.exercises?.map(e => e.muscleGroup).join(', ') || 'none'}

Tip (15 words max):`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Quick tip error:', error)
    return null
  }
}

// Suggest next exercise during workout based on what's been done
export const suggestNextExercise = async (currentExercises, musclesTrained) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const prompt = `Current workout has: ${currentExercises.map(e => e.name).join(', ')}
Muscles hit: ${musclesTrained.join(', ')}

Suggest ONE complementary exercise name only (max 3 words):`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Exercise suggestion error:', error)
    return null
  }
}

// Get real-time form tips for specific exercise
export const getFormTip = async (exerciseName, setNumber) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const prompt = `For ${exerciseName} set ${setNumber}, give ONE brief form cue (max 12 words):

Tip:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Form tip error:', error)
    return null
  }
}

// Get motivational message based on progress
export const getMotivationalMessage = async (streak, progress) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const prompt = `Workout streak: ${streak} days. Progress: ${progress}%. 
Give ONE motivating message (max 12 words):

Message:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Motivation error:', error)
    return null
  }
}

// Smart rest day suggestion
export const shouldRestToday = async (recentWorkouts, muscleRecovery) => {
  try {
    const ai = initializeAI()
    if (!ai) return { shouldRest: false, reason: null }

    const lastWorkouts = recentWorkouts.slice(0, 7)
    const workoutDays = lastWorkouts.length

    const prompt = `Last 7 days: ${workoutDays} workouts
Recent muscles: ${muscleRecovery.join(', ')}

Should user rest today? Reply with just "YES - [reason in 8 words]" or "NO - [suggestion in 8 words]":`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    const text = response.text?.trim()
    const shouldRest = text?.startsWith('YES')
    const reason = text?.split(' - ')[1] || text

    return { shouldRest, reason }
  } catch (error) {
    console.error('Rest day suggestion error:', error)
    return { shouldRest: false, reason: null }
  }
}

// Quick workout summary after completion
export const generateQuickSummary = async (workout) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalVolume = workout.exercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0)
    }, 0)

    const prompt = `Workout: ${workout.exercises.length} exercises, ${totalSets} sets, ${Math.round(totalVolume)} kg volume.

Give ONE celebratory message (max 15 words):

Message:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Summary error:', error)
    return null
  }
}

// Smart suggestion for muscle group balance
export const getMuscleBalanceTip = async (muscleDistribution) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const muscleList = Object.entries(muscleDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([muscle, sets]) => `${muscle}: ${sets} sets`)
      .join(', ')

    const prompt = `This week's muscle groups: ${muscleList}

Suggest ONE muscle group to focus on next (max 10 words):

Tip:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Balance tip error:', error)
    return null
  }
}

export { initializeAI }
