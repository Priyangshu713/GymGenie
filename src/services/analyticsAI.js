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

// Analyze progressive overload trend
export const analyzeProgressiveOverload = async (exerciseData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { exerciseName, recentWeights, trend } = exerciseData

    const prompt = `Exercise: ${exerciseName}
Recent weights (kg): ${recentWeights.join(' → ')}
Trend: ${trend}

Give ONE brief progressive overload tip (max 12 words):

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
    console.error('Progressive overload analysis error:', error)
    return null
  }
}

// Analyze muscle group volume balance
export const analyzeMuscleBalance = async (muscleData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { muscleGroups, weeklyVolumes } = muscleData
    
    const volumeString = Object.entries(weeklyVolumes)
      .map(([muscle, volume]) => `${muscle}: ${volume} sets`)
      .join(', ')

    const prompt = `Weekly volume: ${volumeString}

Identify ONE muscle group imbalance issue (max 10 words):

Issue:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Muscle balance analysis error:', error)
    return null
  }
}

// Analyze recovery status
export const analyzeRecovery = async (recoveryData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { workoutFrequency, muscleFrequency, totalVolume } = recoveryData

    const prompt = `Workout frequency: ${workoutFrequency}/week
Volume: ${totalVolume} kg/week
Muscle hit frequency: ${muscleFrequency}x/week average

Assess recovery status in ONE brief phrase (max 10 words):

Status:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Recovery analysis error:', error)
    return null
  }
}

// Suggest optimal training frequency for specific muscle
export const suggestTrainingFrequency = async (muscleData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { muscleName, currentFrequency, currentVolume } = muscleData

    const prompt = `Muscle: ${muscleName}
Current: ${currentFrequency}x/week, ${currentVolume} sets total

Suggest optimal frequency adjustment (max 10 words):

Suggestion:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Frequency suggestion error:', error)
    return null
  }
}

// Analyze volume trend for hypertrophy
export const analyzeVolumeTrend = async (volumeData) => {
  try {
    const ai = initializeAI()
    if (!ai) return null

    const { weeklyVolumes, trend } = volumeData

    const prompt = `Weekly volumes (kg): ${weeklyVolumes.join(' → ')}
Trend: ${trend}

Quick volume assessment for muscle growth (max 12 words):

Assessment:`

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Volume trend analysis error:', error)
    return null
  }
}

export { initializeAI }
