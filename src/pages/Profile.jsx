import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import { 
  User, 
  Settings, 
  Key, 
  Download, 
  Upload,
  Trash2,
  Save,
  Info,
  Calculator,
  Activity,
  Scale,
  Ruler,
  ChevronDown,
  Target,
  X
} from 'lucide-react'
import { setGeminiApiKey, getGeminiApiKey, generateWorkoutInsights, analyzeSplit, initializeAI } from '../services/aiService'

const Profile = () => {
  const { isDark, toggleTheme } = useTheme()
  const { workouts, stats } = useWorkout()
  const [apiKey, setApiKey] = useState(getGeminiApiKey() || '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  
  // Body measurements state
  const [measurements, setMeasurements] = useState(() => {
    const saved = localStorage.getItem('gymgenie-measurements')
    return saved ? JSON.parse(saved) : {
      height: '',
      weight: '',
      age: '',
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'maintain'
    }
  })
  
  const [calculatingTDEE, setCalculatingTDEE] = useState(false)
  const [tdee, setTdee] = useState(() => {
    const saved = localStorage.getItem('gymgenie-tdee')
    return saved ? JSON.parse(saved) : null
  })
  
  // Collapsible sections state
  const [aboutExpanded, setAboutExpanded] = useState(false)
  
  // Workout split state
  const [workoutSplit, setWorkoutSplit] = useState(() => {
    const saved = localStorage.getItem('gymgenie-workout-split')
    return saved ? JSON.parse(saved) : {
      type: 'none',
      customSplit: {},
      currentWeek: 1
    }
  })
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [showCustomSplitModal, setShowCustomSplitModal] = useState(false)
  const [splitAnalysis, setSplitAnalysis] = useState(null)
  const [isAnalyzingSplit, setIsAnalyzingSplit] = useState(false)
  const [showSplitAnalysis, setShowSplitAnalysis] = useState(false)
  const [customSplitData, setCustomSplitData] = useState({
    name: '',
    description: '',
    schedule: {
      1: { name: '', muscles: [] },
      2: { name: '', muscles: [] },
      3: { name: '', muscles: [] },
      4: { name: '', muscles: [] },
      5: { name: '', muscles: [] },
      6: { name: '', muscles: [] },
      7: { name: '', muscles: [] }
    }
  })
  
  // Popular workout split presets
  const popularSplits = {
    'push-pull-legs': {
      name: 'Push/Pull/Legs (PPL)',
      description: '6-day split focusing on movement patterns',
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
      description: '4-day split alternating upper and lower body',
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
      description: '5-day split with one muscle group per day',
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
      description: '3-day full body workout',
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

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim())
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 3000)
    }
  }

  // Workout split functions
  const saveWorkoutSplit = (splitData) => {
    localStorage.setItem('gymgenie-workout-split', JSON.stringify(splitData))
    setWorkoutSplit(splitData)
  }

  const selectPresetSplit = (splitType) => {
    const splitData = {
      type: splitType,
      customSplit: popularSplits[splitType],
      currentWeek: 1
    }
    saveWorkoutSplit(splitData)
    setShowSplitModal(false)
  }

  const getTodaysPlannedWorkout = () => {
    if (workoutSplit.type === 'none') return null
    
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayOfWeek = today === 0 ? 7 : today // Convert Sunday to 7
    
    const split = workoutSplit.type === 'custom' ? workoutSplit.customSplit : popularSplits[workoutSplit.type]
    return split?.schedule?.[dayOfWeek] || null
  }

  // Custom split functions
  const availableMuscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'legs', 'core', 'cardio']
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const updateCustomSplitDay = (dayIndex, field, value) => {
    setCustomSplitData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayIndex]: {
          ...prev.schedule[dayIndex],
          [field]: value
        }
      }
    }))
  }

  const toggleMuscleForDay = (dayIndex, muscle) => {
    const currentMuscles = customSplitData.schedule[dayIndex].muscles
    const newMuscles = currentMuscles.includes(muscle)
      ? currentMuscles.filter(m => m !== muscle)
      : [...currentMuscles, muscle]
    
    updateCustomSplitDay(dayIndex, 'muscles', newMuscles)
  }

  const saveCustomSplit = () => {
    console.log('saveCustomSplit called', customSplitData)
    
    if (!customSplitData.name.trim()) {
      alert('Please enter a name for your custom split')
      return
    }

    const splitData = {
      type: 'custom',
      customSplit: customSplitData,
      currentWeek: 1
    }
    
    console.log('Saving split data:', splitData)
    saveWorkoutSplit(splitData)
    setShowCustomSplitModal(false)
    setShowSplitModal(false)
    
    // Reset custom split data
    setCustomSplitData({
      name: '',
      description: '',
      schedule: {
        1: { name: '', muscles: [] },
        2: { name: '', muscles: [] },
        3: { name: '', muscles: [] },
        4: { name: '', muscles: [] },
        5: { name: '', muscles: [] },
        6: { name: '', muscles: [] },
        7: { name: '', muscles: [] }
      }
    })
    
    alert('Custom split created successfully!')
  }

  // Format AI analysis text with proper styling
  const formatAnalysisText = (text) => {
    if (!text) return ''
    
    return text
      // Convert **text** to bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      // Convert *text* to italic
      .replace(/\*(.*?)\*/g, '<em class="text-blue-300 italic">$1</em>')
      // Convert section headers with emojis
      .replace(/^(🔥|💀|⚖️|🕐|📊|🎯|💡|🚨)\s*(.*?):/gm, '<div class="mt-6 mb-3"><span class="text-2xl mr-2">$1</span><span class="text-yellow-400 font-bold text-lg">$2:</span></div>')
      // Format workout days (Week 1: **Monday: REST, etc.)
      .replace(/^(\*\*Week\s+\d+:\*\*)\s*(.*?)$/gm, '<div class="mt-4 mb-3 p-3 bg-gray-800 rounded-lg"><div class="text-purple-400 font-bold mb-2">$1</div><div class="text-gray-300">$2</div></div>')
      // Format individual days within workout plans
      .replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(.*?)$/gm, '<div class="mb-2 p-2 bg-gray-700 rounded"><span class="text-blue-400 font-semibold">$1:</span> <span class="text-gray-200">$2</span></div>')
      // Format exercise descriptions (e.g., "Bicep curls 3 sets of 8-12 reps")
      .replace(/([A-Za-z\s]+)\s+(\d+\s+sets?\s+of\s+\d+-?\d*\s+reps?)/gm, '<div class="ml-2 mb-1"><span class="text-green-400">$1</span> <span class="text-gray-400 text-sm">$2</span></div>')
      // Convert bullet points
      .replace(/^-\s*(.*?)$/gm, '<div class="ml-4 mb-2 flex items-start"><span class="text-blue-400 mr-2">•</span><span>$1</span></div>')
      // Format REST days
      .replace(/\bREST\b/g, '<span class="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">REST</span>')
      // Format muscle groups in parentheses
      .replace(/\(([^)]+)\)/g, '<span class="text-gray-400 text-sm">($1)</span>')
      // Convert line breaks - do this before other formatting
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      // Highlight ratings like "4/10"
      .replace(/(\d+\/10)/g, '<span class="bg-red-600 text-white px-2 py-1 rounded font-bold">$1</span>')
      // Highlight important phrases
      .replace(/(MAJOR PROBLEMS|RED FLAGS|SPECIFIC IMPROVEMENTS)/g, '<span class="bg-red-900 text-red-200 px-2 py-1 rounded font-semibold">$1</span>')
      .replace(/(EXCELLENT|GOOD|PERFECT)/gi, '<span class="bg-green-900 text-green-200 px-2 py-1 rounded font-semibold">$1</span>')
      .replace(/(WARNING|CAUTION|AVOID)/gi, '<span class="bg-yellow-900 text-yellow-200 px-2 py-1 rounded font-semibold">$1</span>')
      // Format notes and tips
      .replace(/\*\*Note:\*\*(.*?)$/gm, '<div class="mt-3 p-2 bg-blue-900 bg-opacity-30 border-l-4 border-blue-400 rounded"><span class="text-blue-400 font-semibold">Note:</span><span class="text-gray-300">$1</span></div>')
  }

  // AI Split Analysis Function
  const handleAnalyzeSplit = async () => {
    if (workoutSplit.type === 'none') {
      alert('Please select a workout split first!')
      return
    }

    setIsAnalyzingSplit(true)
    try {
      const result = await analyzeSplit(workoutSplit, 'muscle_growth')
      if (result.success) {
        setSplitAnalysis(result.analysis)
        setShowSplitAnalysis(true)
      } else {
        alert('Failed to analyze split: ' + result.error)
      }
    } catch (error) {
      console.error('Split analysis error:', error)
      alert('Error analyzing split. Please check your API key and try again.')
    } finally {
      setIsAnalyzingSplit(false)
    }
  }

  // Professional report export function
  const exportProfessionalReport = async () => {
    try {
      // Show loading state
      const originalText = 'Export Professional Report'
      const button = document.querySelector('.export-report-btn')
      if (button) button.textContent = 'Generating AI Insights...'

      // Generate AI insights for the report
      let aiInsights = null
      let splitAnalysisForReport = null
      
      try {
        // Generate workout insights if we have workout data
        if (workouts && workouts.length > 0) {
          const insightsResult = await generateWorkoutInsights({
            workouts: workouts,
            stats: stats,
            measurements: measurements,
            workoutSplit: workoutSplit
          })
          aiInsights = insightsResult
        }

        // Generate split analysis if we have a split selected
        if (workoutSplit && workoutSplit.type !== 'none') {
          const splitResult = await analyzeSplit(workoutSplit, 'muscle_growth')
          if (splitResult.success) {
            splitAnalysisForReport = splitResult.analysis
          }
        }
      } catch (aiError) {
        console.warn('AI insights generation failed:', aiError)
        // Continue without AI insights if they fail
      }

      // Create comprehensive report data
      const reportData = {
        userInfo: {
          name: 'GymGenie User',
          reportDate: new Date().toLocaleDateString(),
          measurements: measurements,
          tdee: tdee,
          workoutSplit: workoutSplit
        },
        summary: {
          totalWorkouts: workouts.length,
          totalExercises: workouts.reduce((sum, w) => sum + w.exercises.length, 0),
          totalSets: workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0),
          totalVolume: workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0),
          avgDifficulty: workouts.length > 0 ? workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.difficulty || 0), 0) / Math.max(e.sets.length, 1), 0) / Math.max(w.exercises.length, 1), 0) / workouts.length : 0
        },
        muscleGroupDistribution: {},
        exerciseTypeDistribution: { strength: 0, cardio: 0 },
        difficultyDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
        volumeByMuscleGroup: {},
        weeklyProgress: [],
        monthlyTrends: [],
        topExercises: {},
        workoutFrequency: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 },
        setRanges: { '1-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21+': 0 },
        repRanges: { '1-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21+': 0 },
        weightRanges: { '0-10': 0, '11-25': 0, '26-50': 0, '51-100': 0, '100+': 0 },
        recommendations: [],
        // AI-generated insights
        aiInsights: aiInsights,
        splitAnalysis: splitAnalysisForReport
      }

      // Calculate comprehensive analytics
      workouts.forEach(workout => {
        const workoutDate = new Date(workout.date)
        const dayName = workoutDate.toLocaleDateString('en-US', { weekday: 'long' })
        reportData.workoutFrequency[dayName]++

        workout.exercises.forEach(exercise => {
          // Exercise type distribution
          reportData.exerciseTypeDistribution[exercise.type]++
          
          // Muscle group distribution
          if (exercise.muscleGroup) {
            reportData.muscleGroupDistribution[exercise.muscleGroup] = 
              (reportData.muscleGroupDistribution[exercise.muscleGroup] || 0) + exercise.sets.length
            
            // Volume by muscle group
            const muscleVolume = exercise.sets.reduce((sum, set) => 
              sum + (set.weight || 0) * (set.reps || 0), 0)
            reportData.volumeByMuscleGroup[exercise.muscleGroup] = 
              (reportData.volumeByMuscleGroup[exercise.muscleGroup] || 0) + muscleVolume
          }

          // Top exercises
          reportData.topExercises[exercise.name] = 
            (reportData.topExercises[exercise.name] || 0) + exercise.sets.length

          exercise.sets.forEach(set => {
            // Difficulty distribution
            if (set.difficulty && set.difficulty >= 1 && set.difficulty <= 10) {
              reportData.difficultyDistribution[set.difficulty]++
            }

            // Rep ranges
            const reps = set.reps || 0
            if (reps <= 5) reportData.repRanges['1-5']++
            else if (reps <= 10) reportData.repRanges['6-10']++
            else if (reps <= 15) reportData.repRanges['11-15']++
            else if (reps <= 20) reportData.repRanges['16-20']++
            else reportData.repRanges['21+']++

            // Weight ranges
            const weight = set.weight || 0
            if (weight <= 10) reportData.weightRanges['0-10']++
            else if (weight <= 25) reportData.weightRanges['11-25']++
            else if (weight <= 50) reportData.weightRanges['26-50']++
            else if (weight <= 100) reportData.weightRanges['51-100']++
            else reportData.weightRanges['100+']++
          })

          // Set ranges per exercise
          const setCount = exercise.sets.length
          if (setCount <= 5) reportData.setRanges['1-5']++
          else if (setCount <= 10) reportData.setRanges['6-10']++
          else if (setCount <= 15) reportData.setRanges['11-15']++
          else if (setCount <= 20) reportData.setRanges['16-20']++
          else reportData.setRanges['21+']++
        })
      })

      // Calculate weekly progress (last 12 weeks)
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const weekWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.date)
          return workoutDate >= weekStart && workoutDate <= weekEnd
        })

        const weekVolume = weekWorkouts.reduce((sum, w) => 
          sum + w.exercises.reduce((s, e) => 
            s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0)

        reportData.weeklyProgress.push({
          week: `Week ${12 - i}`,
          workouts: weekWorkouts.length,
          volume: weekVolume,
          sets: weekWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0)
        })
      }

      // Get top 10 exercises
      const sortedExercises = Object.entries(reportData.topExercises)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
      reportData.topExercises = Object.fromEntries(sortedExercises)

      // Generate HTML report
      const htmlContent = generateProfessionalReportHTML(reportData)
      
      // Create and download HTML file (can be opened in browser and printed to PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gymgenie-professional-report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Professional report generated! Open the HTML file in your browser and use Print > Save as PDF to create a PDF report.')
    } catch (error) {
      console.error('Error generating professional report:', error)
      alert('Error generating professional report. Please try again.')
    } finally {
      // Reset button text
      const button = document.querySelector('.export-report-btn')
      if (button) button.textContent = 'Export Professional Report'
    }
  }

  // Generate HTML report content
  const generateProfessionalReportHTML = (data) => {
    const muscleGroupColors = {
      chest: '#3B82F6', back: '#10B981', shoulders: '#F59E0B', 
      biceps: '#EF4444', triceps: '#8B5CF6', forearms: '#06B6D4',
      legs: '#84CC16', core: '#F97316', cardio: '#EC4899'
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GymGenie Professional Fitness Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5rem; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 1.1rem; opacity: 0.9; }
        .content { padding: 40px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1f2937; font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2rem; font-weight: 700; color: #3b82f6; }
        .metric-label { color: #6b7280; font-size: 0.9rem; margin-top: 5px; }
        .chart-container { height: 300px; margin: 20px 0; }
        .user-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; }
        .recommendations { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        .recommendations li { margin: 5px 0; color: #374151; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️ GymGenie Fitness Report</h1>
            <p>Professional Fitness Analysis & Recommendations</p>
            <p>Generated on ${data.userInfo.reportDate}</p>
        </div>
        
        <div class="content">
            <div class="user-info">
                <h3>User Profile</h3>
                <p><strong>Height:</strong> ${data.userInfo.measurements.height || 'Not set'} cm</p>
                <p><strong>Weight:</strong> ${data.userInfo.measurements.weight || 'Not set'} kg</p>
                <p><strong>Age:</strong> ${data.userInfo.measurements.age || 'Not set'} years</p>
                <p><strong>Activity Level:</strong> ${data.userInfo.measurements.activityLevel || 'Not set'}</p>
                ${data.userInfo.tdee ? `<p><strong>TDEE:</strong> ${data.userInfo.tdee.tdee} kcal/day</p>` : ''}
                ${data.userInfo.workoutSplit.type !== 'none' ? `<p><strong>Workout Split:</strong> ${data.userInfo.workoutSplit.type === 'custom' ? data.userInfo.workoutSplit.customSplit.name : data.userInfo.workoutSplit.type}</p>` : ''}
            </div>

            <div class="section">
                <h2>📊 Training Summary</h2>
                <div class="grid">
                    <div class="card metric">
                        <div class="metric-value">${data.summary.totalWorkouts}</div>
                        <div class="metric-label">Total Workouts</div>
                    </div>
                    <div class="card metric">
                        <div class="metric-value">${data.summary.totalExercises}</div>
                        <div class="metric-label">Total Exercises</div>
                    </div>
                    <div class="card metric">
                        <div class="metric-value">${data.summary.totalSets}</div>
                        <div class="metric-label">Total Sets</div>
                    </div>
                    <div class="card metric">
                        <div class="metric-value">${Math.round(data.summary.totalVolume)} kg</div>
                        <div class="metric-label">Total Volume</div>
                    </div>
                    <div class="card metric">
                        <div class="metric-value">${data.summary.avgDifficulty.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Difficulty</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🎯 Muscle Group Analysis</h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="chart-container">
                        <canvas id="muscleChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="volumeByMuscleChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🏋️ Exercise Analysis</h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="chart-container">
                        <canvas id="exerciseTypeChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="topExercisesChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📊 Training Intensity & Volume</h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr;">
                    <div class="chart-container">
                        <canvas id="difficultyChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="repRangesChart"></canvas>
                    </div>
                </div>
                <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 20px;">
                    <div class="chart-container">
                        <canvas id="weightRangesChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="setRangesChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📈 Progress & Frequency</h2>
                <div class="chart-container" style="height: 400px;">
                    <canvas id="weeklyProgressChart"></canvas>
                </div>
                <div class="chart-container" style="margin-top: 30px;">
                    <canvas id="workoutFrequencyChart"></canvas>
                </div>
            </div>

            ${data.aiInsights ? `
            <div class="section">
                <h2>🤖 AI-Generated Workout Insights</h2>
                <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #0369a1; margin-top: 0;">📊 Performance Analysis</h4>
                    <p><strong>Overall Assessment:</strong> ${data.aiInsights.overallAssessment || 'Analysis in progress...'}</p>
                    <p><strong>Strengths:</strong> ${data.aiInsights.strengths || 'Identifying key strengths...'}</p>
                    <p><strong>Areas for Improvement:</strong> ${data.aiInsights.improvements || 'Analyzing improvement opportunities...'}</p>
                </div>
                
                <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #a16207; margin-top: 0;">🎯 Weekly Focus</h4>
                    <p>${data.aiInsights.weeklyPlan || 'Generating personalized weekly plan...'}</p>
                </div>
                
                <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px;">
                    <h4 style="color: #15803d; margin-top: 0;">💡 Smart Recommendations</h4>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Focus on progressive overload with ${data.aiInsights.recommendedExercises || 'compound movements'}</li>
                        <li>Optimize recovery with ${data.aiInsights.recoveryTips || 'adequate rest between sessions'}</li>
                        <li>Target muscle imbalances through ${data.aiInsights.balanceTips || 'balanced programming'}</li>
                    </ul>
                </div>
            </div>
            ` : ''}

            ${data.splitAnalysis ? `
            <div class="section">
                <h2>🎯 Workout Split Analysis</h2>
                <div style="background: #fdf4ff; border-left: 4px solid #a855f7; padding: 20px; border-radius: 8px;">
                    <h4 style="color: #7c3aed; margin-top: 0;">🔍 Split Evaluation</h4>
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">
                        ${data.splitAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="recommendations">
                <h3>💡 Professional Recommendations</h3>
                <ul>
                    <li><strong>Training Consistency:</strong> ${data.summary.totalWorkouts > 12 ? 'Excellent consistency! Keep up the great work.' : 'Consider increasing workout frequency for better results.'}</li>
                    <li><strong>Volume:</strong> ${data.summary.totalVolume > 5000 ? 'High training volume - ensure adequate recovery.' : 'Consider gradually increasing training volume.'}</li>
                    <li><strong>Difficulty:</strong> ${data.summary.avgDifficulty > 7 ? 'Good intensity levels for muscle growth.' : 'Consider increasing exercise difficulty for better adaptation.'}</li>
                    <li><strong>Balance:</strong> Focus on balanced muscle development across all major muscle groups.</li>
                    <li><strong>Recovery:</strong> Ensure 48-72 hours rest between training the same muscle groups.</li>
                    <li><strong>Rep Ranges:</strong> ${Object.values(data.repRanges).indexOf(Math.max(...Object.values(data.repRanges))) < 2 ? 'Focus more on hypertrophy range (8-12 reps)' : 'Good rep range distribution'}</li>
                    <li><strong>Progressive Overload:</strong> ${data.weeklyProgress.slice(-4).every((week, i, arr) => i === 0 || week.volume >= arr[i-1].volume) ? 'Excellent progressive overload trend' : 'Consider gradually increasing volume each week'}</li>
                </ul>
            </div>
        </div>
    </div>

    <script>
        // Chart data
        const muscleData = ${JSON.stringify(data.muscleGroupDistribution)};
        const muscleColors = ${JSON.stringify(muscleGroupColors)};
        const volumeByMuscleData = ${JSON.stringify(data.volumeByMuscleGroup)};
        const exerciseTypeData = ${JSON.stringify(data.exerciseTypeDistribution)};
        const difficultyData = ${JSON.stringify(data.difficultyDistribution)};
        const topExercisesData = ${JSON.stringify(data.topExercises)};
        const repRangesData = ${JSON.stringify(data.repRanges)};
        const weightRangesData = ${JSON.stringify(data.weightRanges)};
        const setRangesData = ${JSON.stringify(data.setRanges)};
        const weeklyProgressData = ${JSON.stringify(data.weeklyProgress)};
        const workoutFrequencyData = ${JSON.stringify(data.workoutFrequency)};

        // 1. Muscle Group Sets Distribution (Pie Chart)
        new Chart(document.getElementById('muscleChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(muscleData),
                datasets: [{
                    data: Object.values(muscleData),
                    backgroundColor: Object.keys(muscleData).map(muscle => muscleColors[muscle] || '#6b7280'),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } },
                    title: { display: true, text: 'Sets per Muscle Group', font: { size: 14, weight: 'bold' } }
                }
            }
        });

        // 2. Volume by Muscle Group (Bar Chart)
        new Chart(document.getElementById('volumeByMuscleChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(volumeByMuscleData),
                datasets: [{
                    label: 'Volume (kg)',
                    data: Object.values(volumeByMuscleData),
                    backgroundColor: Object.keys(volumeByMuscleData).map(muscle => muscleColors[muscle] || '#6b7280'),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Volume by Muscle Group (kg)', font: { size: 14, weight: 'bold' } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 3. Exercise Type Distribution (Pie Chart)
        new Chart(document.getElementById('exerciseTypeChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: Object.keys(exerciseTypeData),
                datasets: [{
                    data: Object.values(exerciseTypeData),
                    backgroundColor: ['#3b82f6', '#ec4899'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } },
                    title: { display: true, text: 'Exercise Types', font: { size: 14, weight: 'bold' } }
                }
            }
        });

        // 4. Top Exercises (Horizontal Bar Chart)
        new Chart(document.getElementById('topExercisesChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(topExercisesData),
                datasets: [{
                    label: 'Sets',
                    data: Object.values(topExercisesData),
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Top 10 Exercises', font: { size: 14, weight: 'bold' } }
                },
                scales: {
                    x: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                    y: { grid: { display: false } }
                }
            }
        });

        // 5. Difficulty Distribution (Bar Chart)
        new Chart(document.getElementById('difficultyChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(difficultyData),
                datasets: [{
                    label: 'Sets',
                    data: Object.values(difficultyData),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Difficulty Distribution', font: { size: 14, weight: 'bold' } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                    x: { grid: { display: false }, title: { display: true, text: 'Difficulty (1-10)' } }
                }
            }
        });

        // 6. Rep Ranges (Pie Chart)
        new Chart(document.getElementById('repRangesChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(repRangesData),
                datasets: [{
                    data: Object.values(repRangesData),
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } },
                    title: { display: true, text: 'Rep Ranges', font: { size: 14, weight: 'bold' } }
                }
            }
        });

        // 7. Weight Ranges (Pie Chart)
        new Chart(document.getElementById('weightRangesChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(weightRangesData).map(range => range + ' kg'),
                datasets: [{
                    data: Object.values(weightRangesData),
                    backgroundColor: ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } },
                    title: { display: true, text: 'Weight Ranges', font: { size: 14, weight: 'bold' } }
                }
            }
        });

        // 8. Set Ranges (Pie Chart)
        new Chart(document.getElementById('setRangesChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(setRangesData).map(range => range + ' sets'),
                datasets: [{
                    data: Object.values(setRangesData),
                    backgroundColor: ['#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15 } },
                    title: { display: true, text: 'Sets per Exercise', font: { size: 14, weight: 'bold' } }
                }
            }
        });

        // 9. Weekly Progress (Line Chart)
        new Chart(document.getElementById('weeklyProgressChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: weeklyProgressData.map(w => w.week),
                datasets: [{
                    label: 'Volume (kg)',
                    data: weeklyProgressData.map(w => w.volume),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Workouts',
                    data: weeklyProgressData.map(w => w.workouts),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: '12-Week Progress Trend', font: { size: 16, weight: 'bold' } }
                },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', beginAtZero: true },
                    y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
                }
            }
        });

        // 10. Workout Frequency by Day (Bar Chart)
        new Chart(document.getElementById('workoutFrequencyChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(workoutFrequencyData),
                datasets: [{
                    label: 'Workouts',
                    data: Object.values(workoutFrequencyData),
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Workout Frequency by Day', font: { size: 14, weight: 'bold' } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                    x: { grid: { display: false } }
                }
            }
        });
    </script>
</body>
</html>`
  }

  const exportData = () => {
    try {
      // Get all data from localStorage
      const workoutData = localStorage.getItem('gymgenie-data')
      const measurementData = localStorage.getItem('gymgenie-measurements')
      const tdeeData = localStorage.getItem('gymgenie-tdee')
      const apiKeyData = localStorage.getItem('gymgenie-api-key')
      const splitData = localStorage.getItem('gymgenie-workout-split')
      
      const data = {
        workouts: workoutData ? JSON.parse(workoutData) : { workouts: [], stats: {} },
        measurements: measurementData ? JSON.parse(measurementData) : {},
        tdee: tdeeData ? JSON.parse(tdeeData) : null,
        workoutSplit: splitData ? JSON.parse(splitData) : null,
        hasApiKey: !!apiKeyData,
        exportDate: new Date().toISOString(),
        version: '2.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gymgenie-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    }
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          
          // Import workout data
          if (data.workouts) {
            localStorage.setItem('gymgenie-data', JSON.stringify(data.workouts))
          }
          
          // Import measurements
          if (data.measurements) {
            localStorage.setItem('gymgenie-measurements', JSON.stringify(data.measurements))
          }
          
          // Import TDEE data
          if (data.tdee) {
            localStorage.setItem('gymgenie-tdee', JSON.stringify(data.tdee))
          }
          
          // Import workout split data
          if (data.workoutSplit) {
            localStorage.setItem('gymgenie-workout-split', JSON.stringify(data.workoutSplit))
          }
          
          alert('Data imported successfully! The page will refresh.')
          window.location.reload()
        } catch (error) {
          console.error('Import error:', error)
          alert('Invalid file format or corrupted data.')
        }
      }
      reader.readAsText(file)
    }
    // Reset file input
    event.target.value = ''
  }

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL data including workouts, measurements, and settings? This cannot be undone.')) {
      // Clear all GymGenie data
      localStorage.removeItem('gymgenie-data')
      localStorage.removeItem('gymgenie-measurements')
      localStorage.removeItem('gymgenie-tdee')
      localStorage.removeItem('gymgenie-api-key')
      
      alert('All data cleared successfully!')
      window.location.reload()
    }
  }

  // Calculate BMI
  const calculateBMI = () => {
    if (measurements.height && measurements.weight) {
      const heightInM = parseFloat(measurements.height) / 100
      const weightInKg = parseFloat(measurements.weight)
      return (weightInKg / (heightInM * heightInM)).toFixed(1)
    }
    return null
  }

  // Save measurements
  const saveMeasurements = () => {
    localStorage.setItem('gymgenie-measurements', JSON.stringify(measurements))
  }

  // Calculate TDEE using AI
  const calculateTDEEWithAI = async () => {
    if (!measurements.height || !measurements.weight || !measurements.age) {
      alert('Please fill in height, weight, and age first')
      return
    }

    setCalculatingTDEE(true)
    try {
      const prompt = `Calculate the exact TDEE (Total Daily Energy Expenditure) for a person with these details:
      - Sex: ${measurements.sex}
      - Age: ${measurements.age} years
      - Height: ${measurements.height} cm
      - Weight: ${measurements.weight} kg
      - Activity Level: ${measurements.activityLevel}
      - Goal: ${measurements.goal}
      
      Please provide:
      1. BMR (Basal Metabolic Rate)
      2. TDEE based on activity level
      3. Recommended calories for their goal
      4. Macronutrient breakdown (protein, carbs, fats in grams)
      
      Format as JSON: {"bmr": number, "tdee": number, "recommendedCalories": number, "protein": number, "carbs": number, "fats": number}`

      // For now, we'll calculate directly without AI call to avoid errors
      // In future, you can integrate with Gemini AI for more personalized calculations

      // For now, calculate using Mifflin-St Jeor equation
      const bmr = measurements.sex === 'male' 
        ? (10 * parseFloat(measurements.weight)) + (6.25 * parseFloat(measurements.height)) - (5 * parseFloat(measurements.age)) + 5
        : (10 * parseFloat(measurements.weight)) + (6.25 * parseFloat(measurements.height)) - (5 * parseFloat(measurements.age)) - 161

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
      }

      const calculatedTDEE = Math.round(bmr * activityMultipliers[measurements.activityLevel])
      
      const goalAdjustments = {
        lose: -500,
        maintain: 0,
        gain: 300
      }

      const recommendedCalories = calculatedTDEE + goalAdjustments[measurements.goal]
      
      const tdeeResult = {
        bmr: Math.round(bmr),
        tdee: calculatedTDEE,
        recommendedCalories,
        protein: Math.round(parseFloat(measurements.weight) * 2.2), // 2.2g per kg
        carbs: Math.round(recommendedCalories * 0.4 / 4), // 40% of calories
        fats: Math.round(recommendedCalories * 0.25 / 9) // 25% of calories
      }

      setTdee(tdeeResult)
      localStorage.setItem('gymgenie-tdee', JSON.stringify(tdeeResult))
    } catch (error) {
      console.error('Error calculating TDEE:', error)
      alert('Error calculating TDEE. Please try again.')
    } finally {
      setCalculatingTDEE(false)
    }
  }

  useEffect(() => {
    saveMeasurements()
  }, [measurements])

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Apple Fitness Header */}
      <div className="px-4 pt-12 pb-6 border-b border-gray-800">
        <h1 className="fitness-title">Profile</h1>
        <p className="fitness-subtitle">Settings & preferences</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats Overview */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4">
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric text-red-400">{stats.totalWorkouts}</div>
              <div className="fitness-label">Total Workouts</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric text-green-400">{stats.totalExercises}</div>
              <div className="fitness-label">Total Exercises</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric text-blue-400">{Math.round(stats.totalWeight)}</div>
              <div className="fitness-label">Total Weight (kg)</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric text-purple-400">{Math.round(stats.totalCardioTime)}</div>
              <div className="fitness-label">Cardio (min)</div>
            </div>
          </div>
        </div>

        {/* Body Measurements - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <Ruler size={20} className="mr-2 text-blue-400" />
            Body Measurements
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="fitness-label block mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={measurements.height}
                  onChange={(e) => setMeasurements({...measurements, height: e.target.value})}
                  className="fitness-input"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="fitness-label block mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={measurements.weight}
                  onChange={(e) => setMeasurements({...measurements, weight: e.target.value})}
                  className="fitness-input"
                  placeholder="70"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="fitness-label block mb-2">Age</label>
                <input
                  type="number"
                  value={measurements.age}
                  onChange={(e) => setMeasurements({...measurements, age: e.target.value})}
                  className="fitness-input"
                  placeholder="25"
                />
              </div>
              <div>
                <AppleDropdown
                  label="Sex"
                  value={measurements.sex}
                  onChange={(value) => setMeasurements({...measurements, sex: value})}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                  ]}
                  placeholder="Select sex"
                />
              </div>
            </div>

            <div>
              <AppleDropdown
                label="Activity Level"
                value={measurements.activityLevel}
                onChange={(value) => setMeasurements({...measurements, activityLevel: value})}
                options={[
                  { value: 'sedentary', label: 'Sedentary (desk job, no exercise)' },
                  { value: 'light', label: 'Light (light exercise 1-3 days/week)' },
                  { value: 'moderate', label: 'Moderate (moderate exercise 3-5 days/week)' },
                  { value: 'active', label: 'Active (hard exercise 6-7 days/week)' },
                  { value: 'veryActive', label: 'Very Active (physical job + exercise)' }
                ]}
                placeholder="Select activity level"
              />
            </div>

            <div>
              <AppleDropdown
                label="Goal"
                value={measurements.goal}
                onChange={(value) => setMeasurements({...measurements, goal: value})}
                options={[
                  { value: 'lose', label: 'Lose Weight (Cut)' },
                  { value: 'maintain', label: 'Maintain Weight' },
                  { value: 'gain', label: 'Gain Weight (Bulk)' }
                ]}
                placeholder="Select goal"
              />
            </div>

            {/* BMI Display */}
            {calculateBMI() && (
              <div className="p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">BMI</span>
                  <span className="fitness-metric-small text-blue-400">{calculateBMI()}</span>
                </div>
                <div className="text-xs apple-gray mt-1">
                  {parseFloat(calculateBMI()) < 18.5 ? 'Underweight' :
                   parseFloat(calculateBMI()) < 25 ? 'Normal' :
                   parseFloat(calculateBMI()) < 30 ? 'Overweight' : 'Obese'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TDEE Calculator - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <Calculator size={20} className="mr-2 text-blue-400" />
            TDEE Calculator
          </h2>
          
          <button
            onClick={calculateTDEEWithAI}
            disabled={calculatingTDEE || !measurements.height || !measurements.weight || !measurements.age}
            className="fitness-button w-full mb-4 disabled:opacity-50"
          >
            {calculatingTDEE ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Calculating...
              </div>
            ) : (
              'Calculate TDEE with AI'
            )}
          </button>

          {tdee && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-xl">
                  <div className="fitness-metric-small text-red-400">{tdee.bmr}</div>
                  <div className="fitness-label">BMR (kcal)</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-xl">
                  <div className="fitness-metric-small text-green-400">{tdee.tdee}</div>
                  <div className="fitness-label">TDEE (kcal)</div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800">
                <h4 className="text-blue-400 font-semibold mb-2">Recommended Daily Intake</h4>
                <div className="text-center mb-3">
                  <div className="fitness-metric text-blue-400">{tdee.recommendedCalories}</div>
                  <div className="fitness-label">Calories</div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-white font-semibold">{tdee.protein}g</div>
                    <div className="fitness-label">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{tdee.carbs}g</div>
                    <div className="fitness-label">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-semibold">{tdee.fats}g</div>
                    <div className="fitness-label">Fats</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workout Split - Apple Style */}
        <div className="fitness-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center">
              <Target size={20} className="mr-2 text-blue-400" />
              Workout Split
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSplitModal(true)}
                className="fitness-secondary-button text-sm"
              >
                {workoutSplit.type === 'none' ? 'Set Split' : 'Change'}
              </button>
              <button
                onClick={handleAnalyzeSplit}
                disabled={isAnalyzingSplit || workoutSplit.type === 'none'}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center active:scale-95 text-sm"
                style={{ display: workoutSplit.type === 'none' ? 'none' : 'flex' }}
              >
                {isAnalyzingSplit ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    🤖 AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {workoutSplit.type === 'none' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-400 mb-2">No workout split selected</p>
              <p className="text-gray-500 text-sm">Choose a split to get personalized AI insights</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {workoutSplit.type === 'custom' ? workoutSplit.customSplit.name : popularSplits[workoutSplit.type]?.name}
                  </span>
                  <span className="text-blue-400 text-sm">Active</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {workoutSplit.type === 'custom' ? workoutSplit.customSplit.description : popularSplits[workoutSplit.type]?.description}
                </p>
              </div>

              {/* Today's planned workout */}
              {(() => {
                const todaysWorkout = getTodaysPlannedWorkout()
                return todaysWorkout ? (
                  <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-medium">Today's Focus</span>
                      <span className="text-blue-300 text-sm">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                    </div>
                    <p className="text-white font-medium">{todaysWorkout.name}</p>
                    {todaysWorkout.muscles.length > 0 && (
                      <p className="text-blue-300 text-sm mt-1">
                        Target: {todaysWorkout.muscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-800 rounded-xl">
                    <p className="text-white font-medium">Rest Day</p>
                    <p className="text-gray-400 text-sm">Recovery and regeneration</p>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* About Section - Collapsible */}
        <div className="fitness-card">
          <div 
            className="collapsible-header"
            onClick={() => setAboutExpanded(!aboutExpanded)}
          >
            <div className="flex items-center">
              <Info size={20} className="mr-2 text-blue-400" />
              <h2 className="text-white font-semibold">About GymGenie</h2>
            </div>
            <ChevronDown 
              size={20} 
              className={`chevron-icon text-gray-400 ${aboutExpanded ? 'rotated' : ''}`}
            />
          </div>
          
          <div className={`collapsible-content ${aboutExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="pt-4 space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Version</h4>
                <p className="text-gray-400 text-sm">GymGenie v2.0 - Bodybuilding Edition</p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Features</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Volume & Load Tracking (Sets × Reps × Weight)</li>
                  <li>• RPE (Rate of Perceived Exertion) Monitoring</li>
                  <li>• Muscle Group Balance Analysis</li>
                  <li>• TDEE & BMI Calculator</li>
                  <li>• AI-Powered Workout Insights</li>
                  <li>• Apple Fitness UI Design</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Built For</h4>
                <p className="text-gray-400 text-sm">
                  Serious bodybuilders and gym enthusiasts who want to track what actually matters for muscle growth and strength gains.
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Designed with Apple Fitness aesthetics and bodybuilding science.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Settings - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <Key size={20} className="mr-2 text-blue-400" />
            AI Configuration
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800">
              <div className="flex items-start space-x-3">
                <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1 text-blue-400">Gemini API Key Required</p>
                  <p className="text-blue-300">To use AI insights, you need a free Gemini API key from Google AI Studio. 
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                     className="underline hover:no-underline ml-1 text-blue-400">Get your key here</a></p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="fitness-label block mb-2">
                Gemini API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="fitness-input flex-1"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="fitness-button px-4 py-2"
                >
                  <Save size={16} />
                </button>
              </div>
              {apiKeySaved && (
                <p className="text-sm text-green-400 mt-2">
                  API key saved successfully!
                </p>
              )}
            </div>
            
            <div className="p-4 bg-gray-800 rounded-xl">
              <h3 className="text-white font-medium mb-3">Export Data</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">JSON Backup</p>
                    <p className="text-gray-400 text-xs">Raw data for app restore</p>
                  </div>
                  <button
                    onClick={exportData}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center active:scale-95 text-sm"
                  >
                    <Download size={14} className="mr-1" />
                    JSON
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Professional Report</p>
                    <p className="text-gray-400 text-xs">PDF with charts & analysis</p>
                  </div>
                  <button
                    onClick={exportProfessionalReport}
                    className="export-report-btn px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center active:scale-95 text-sm"
                  >
                    <Download size={14} className="mr-1" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
              <div>
                <h3 className="text-white font-medium">Import Data</h3>
                <p className="text-sm text-gray-400">
                  Restore from a previous backup
                </p>
              </div>
              <label className="fitness-secondary-button flex items-center cursor-pointer">
                <Upload size={16} className="mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div>
                <h3 className="font-medium text-red-400">Clear All Data</h3>
                <p className="text-sm text-gray-400">
                  Permanently delete all workout data
                </p>
              </div>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 flex items-center active:scale-95"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Split Selection Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
          <div className="fitness-card w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fitness-title text-xl">Choose Workout Split</h2>
              <button
                onClick={() => setShowSplitModal(false)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* No Split Option */}
              <button
                onClick={() => {
                  saveWorkoutSplit({ type: 'none', customSplit: {}, currentWeek: 1 })
                  setShowSplitModal(false)
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  workoutSplit.type === 'none'
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-left">
                  <h3 className="text-white font-medium mb-1">No Split</h3>
                  <p className="text-gray-400 text-sm">Train without a specific schedule</p>
                </div>
              </button>

              {/* Popular Split Presets */}
              {Object.entries(popularSplits).map(([key, split]) => (
                <button
                  key={key}
                  onClick={() => selectPresetSplit(key)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    workoutSplit.type === key
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="text-white font-medium mb-1">{split.name}</h3>
                    <p className="text-gray-400 text-sm">{split.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.values(split.schedule).map((day, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            day.muscles.length > 0
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {day.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}

              {/* Custom Split Option */}
              <button
                onClick={() => {
                  setShowSplitModal(false)
                  setShowCustomSplitModal(true)
                }}
                className="w-full p-4 rounded-xl border-2 border-gray-700 hover:border-gray-600 transition-all"
              >
                <div className="text-left">
                  <h3 className="text-white font-medium mb-1">Custom Split</h3>
                  <p className="text-gray-400 text-sm">Create your own workout schedule</p>
                  <p className="text-green-400 text-xs mt-1">✨ Available Now</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Split Creation Modal */}
      {showCustomSplitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
          <div className="fitness-card w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fitness-title text-xl">Create Custom Split</h2>
              <button
                onClick={() => setShowCustomSplitModal(false)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Split Name and Description */}
              <div className="space-y-4">
                <div>
                  <label className="fitness-label block mb-2">Split Name</label>
                  <input
                    type="text"
                    value={customSplitData.name}
                    onChange={(e) => {
                      console.log('Name input changed:', e.target.value)
                      setCustomSplitData(prev => ({ ...prev, name: e.target.value }))
                    }}
                    placeholder="e.g., My Custom PPL"
                    className="fitness-input w-full"
                  />
                </div>
                <div>
                  <label className="fitness-label block mb-2">Description</label>
                  <input
                    type="text"
                    value={customSplitData.description}
                    onChange={(e) => setCustomSplitData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., 6-day custom split for muscle building"
                    className="fitness-input w-full"
                  />
                </div>
              </div>

              {/* Weekly Schedule */}
              <div>
                <h3 className="text-white font-semibold mb-4">Weekly Schedule</h3>
                <div className="space-y-4">
                  {dayNames.map((dayName, index) => {
                    const dayIndex = index + 1
                    const dayData = customSplitData.schedule[dayIndex]
                    
                    return (
                      <div key={dayIndex} className="p-4 bg-gray-800 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-medium">{dayName}</h4>
                          <span className="text-gray-400 text-sm">Day {dayIndex}</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="fitness-label block mb-2">Workout Name</label>
                            <input
                              type="text"
                              value={dayData.name}
                              onChange={(e) => updateCustomSplitDay(dayIndex, 'name', e.target.value)}
                              placeholder="e.g., Push Day, Rest, Cardio"
                              className="fitness-input w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="fitness-label block mb-2">Target Muscles</label>
                            <div className="flex flex-wrap gap-2">
                              {availableMuscles.map(muscle => (
                                <button
                                  key={muscle}
                                  onClick={() => toggleMuscleForDay(dayIndex, muscle)}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    dayData.muscles.includes(muscle)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                                </button>
                              ))}
                            </div>
                            {dayData.muscles.length === 0 && dayData.name && (
                              <p className="text-gray-500 text-xs mt-1">
                                Select muscle groups for this workout day
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowCustomSplitModal(false)}
                  className="flex-1 fitness-secondary-button"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomSplit}
                  className={`flex-1 transition-all duration-200 ${
                    customSplitData.name.trim() 
                      ? 'fitness-button' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!customSplitData.name.trim()}
                >
                  {customSplitData.name.trim() ? 'Create Split' : 'Enter Split Name'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Split Analysis Modal */}
      {showSplitAnalysis && splitAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4">
          <div className="fitness-card w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fitness-title text-xl flex items-center">
                🤖 AI Split Analysis
                <span className="ml-2 text-sm bg-purple-600 text-white px-2 py-1 rounded-full">
                  Brutally Honest
                </span>
              </h2>
              <button
                onClick={() => setShowSplitAnalysis(false)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="bg-gray-800 rounded-xl p-4 mb-4 border-l-4 border-purple-500">
                <p className="text-purple-400 font-semibold mb-2">🎯 Split Being Analyzed:</p>
                <p className="text-white">
                  {workoutSplit.type === 'custom' 
                    ? workoutSplit.customSplit.name 
                    : workoutSplit.type.charAt(0).toUpperCase() + workoutSplit.type.slice(1).replace('-', ' ')
                  }
                </p>
              </div>
              
              <div className="bg-gray-900 rounded-xl p-6 text-gray-200 leading-relaxed">
                <div 
                  className="formatted-analysis"
                  dangerouslySetInnerHTML={{ 
                    __html: formatAnalysisText(splitAnalysis) 
                  }}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSplitAnalysis(false)}
                  className="fitness-secondary-button"
                >
                  Close Analysis
                </button>
                <button
                  onClick={handleAnalyzeSplit}
                  disabled={isAnalyzingSplit}
                  className="fitness-button"
                >
                  {isAnalyzingSplit ? 'Re-analyzing...' : '🔄 Re-analyze'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
