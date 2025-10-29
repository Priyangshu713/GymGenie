import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import AppleCalendar from '../components/AppleCalendar'
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
import { format, subDays, isAfter, isToday, isSameDay } from 'date-fns'
import { isBodyweightExercise } from '../data/exercises'

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
  
  // PDF Export date range state
  const [pdfTimeRange, setPdfTimeRange] = useState('30') // Default to last 30 days
  const [pdfCustomDate, setPdfCustomDate] = useState(null)
  const [showPdfDatePicker, setShowPdfDatePicker] = useState(false)
  
  // PDF Export split selection state
  const [selectedSplitsForPdf, setSelectedSplitsForPdf] = useState([])
  const [availableSplits, setAvailableSplits] = useState([])
  
  // Time period comparison state
  const [enableTimeComparison, setEnableTimeComparison] = useState(false)
  const [comparisonPeriod1, setComparisonPeriod1] = useState('30') // Current period
  const [comparisonPeriod2, setComparisonPeriod2] = useState('90') // Comparison period
  const [comparisonCustomDate1, setComparisonCustomDate1] = useState(null)
  const [comparisonCustomDate2, setComparisonCustomDate2] = useState(null)
  
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

  // Update available splits when time range or workouts change
  useEffect(() => {
    const splits = getAvailableSplits()
    setAvailableSplits(splits)
    // Reset selected splits if they're no longer available
    setSelectedSplitsForPdf(prev => prev.filter(split => splits.includes(split)))
  }, [pdfTimeRange, pdfCustomDate, workouts])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim())
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 3000)
    }
  }

  // PDF Export date range handlers
  const handlePdfTimeRangeChange = (value) => {
    if (value === 'custom') {
      setShowPdfDatePicker(true)
    } else {
      setPdfTimeRange(value)
      setPdfCustomDate(null)
    }
  }

  const handlePdfDateSelect = (date) => {
    setPdfCustomDate(date)
    setPdfTimeRange('custom')
    setShowPdfDatePicker(false)
  }

  // Handle split selection for PDF
  const handleSplitSelection = (splitName) => {
    setSelectedSplitsForPdf(prev => {
      if (prev.includes(splitName)) {
        return prev.filter(s => s !== splitName)
      } else {
        return [...prev, splitName]
      }
    })
  }

  // Filter workouts based on selected PDF time range
  const getFilteredWorkoutsForPdf = () => {
    if (pdfTimeRange === '0') {
      // Today only
      return workouts.filter(workout => 
        isToday(new Date(workout.date))
      )
    } else if (pdfTimeRange === 'custom' && pdfCustomDate) {
      // Specific date
      return workouts.filter(workout => 
        isSameDay(new Date(workout.date), new Date(pdfCustomDate))
      )
    } else {
      // Range of days
      const cutoffDate = subDays(new Date(), parseInt(pdfTimeRange))
      return workouts.filter(workout => 
        isAfter(new Date(workout.date), cutoffDate)
      )
    }
  }

  // Get workouts from a specific time period for comparison
  const getWorkoutsFromTimePeriod = (periodType, customDate = null, periodNumber = 1) => {
    const now = new Date()
    let startDate, endDate
    
    if (periodType === 'custom' && customDate) {
      // For custom date, get that specific day
      startDate = new Date(customDate)
      endDate = new Date(customDate)
      endDate.setDate(endDate.getDate() + 1)
    } else {
      const days = parseInt(periodType)
      
      if (periodNumber === 1) {
        // Current period (most recent)
        endDate = now
        startDate = subDays(now, days)
      } else {
        // Previous period (going back further)
        endDate = subDays(now, days * (periodNumber - 1))
        startDate = subDays(endDate, days)
      }
    }
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date)
      return workoutDate >= startDate && workoutDate < endDate
    })
  }

  // Get available splits from filtered workouts
  const getAvailableSplits = () => {
    const filteredWorkouts = getFilteredWorkoutsForPdf()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const splits = new Set()
    
    // Get user's workout split from localStorage
    let userSplit = null
    try {
      const savedSplit = localStorage.getItem('gymgenie-workout-split')
      userSplit = savedSplit ? JSON.parse(savedSplit) : null
    } catch (error) {
      console.error('Error parsing workout split:', error)
    }
    
    filteredWorkouts.forEach(workout => {
      const dayOfWeek = new Date(workout.date).getDay()
      const dayName = dayNames[dayOfWeek]
      
      let key = dayName
      
      // If user has a configured split, use it
      if (userSplit && userSplit.schedule) {
        const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek // Convert Sunday from 0 to 7
        const plannedSplit = userSplit.schedule[dayNumber]
        
        if (plannedSplit && plannedSplit.name && plannedSplit.name !== 'Rest') {
          key = `${dayName} (${plannedSplit.name})`
        }
      }
      
      splits.add(key)
    })
    
    return Array.from(splits).sort()
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

  // Professional report export function with AI analysis
  const exportProfessionalReportWithAI = async () => {
    try {
      // Show loading state
      const button = document.querySelector('.export-report-ai-btn')
      if (button) button.textContent = 'Generating AI Insights...'

      // Get filtered workouts based on selected time range
      const filteredWorkouts = getFilteredWorkoutsForPdf()

      // Generate AI insights for the report
      let aiInsights = null
      let splitAnalysisForReport = null
      
      try {
        // Generate workout insights if we have workout data
        if (filteredWorkouts && filteredWorkouts.length > 0) {
          const insightsResult = await generateWorkoutInsights({
            workouts: filteredWorkouts,
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

      await generatePDFReport(true, aiInsights, splitAnalysisForReport, filteredWorkouts, enableTimeComparison)
    } catch (error) {
      console.error('Error generating professional report with AI:', error)
      alert('Failed to generate professional report with AI analysis. Please try again.')
    } finally {
      // Reset button text
      const button = document.querySelector('.export-report-ai-btn')
      if (button) button.textContent = 'PDF + AI'
    }
  }

  // Professional report export function without AI analysis
  const exportProfessionalReportBasic = async () => {
    try {
      // Show loading state
      const button = document.querySelector('.export-report-basic-btn')
      if (button) button.textContent = 'Generating PDF...'

      // Get filtered workouts based on selected time range
      const filteredWorkouts = getFilteredWorkoutsForPdf()

      await generatePDFReport(false, null, null, filteredWorkouts, enableTimeComparison)
    } catch (error) {
      console.error('Error generating basic professional report:', error)
      alert('Failed to generate professional report. Please try again.')
    } finally {
      // Reset button text
      const button = document.querySelector('.export-report-basic-btn')
      if (button) button.textContent = 'PDF Only'
    }
  }

  // Unified PDF generation function
  const generatePDFReport = async (includeAI, aiInsights, splitAnalysisForReport, filteredWorkouts = workouts, includeTimeComparison = false) => {
    try {
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
          totalWorkouts: filteredWorkouts.length,
          totalExercises: filteredWorkouts.reduce((sum, w) => sum + w.exercises.length, 0),
          totalSets: filteredWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0),
          totalVolume: filteredWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0),
          avgDifficulty: filteredWorkouts.length > 0 ? filteredWorkouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.difficulty || 0), 0) / Math.max(e.sets.length, 1), 0) / Math.max(w.exercises.length, 1), 0) / filteredWorkouts.length : 0
        },
        summaryByMuscleGroup: {},
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
        // Cardio analytics data
        cardioAnalytics: {
          beforeWorkout: { slow: 0, fast: 0, totalDuration: 0, totalDistance: 0 },
          afterWorkout: { slow: 0, fast: 0, totalDuration: 0, totalDistance: 0 },
          insights: []
        },
        // Split comparison data
        splitComparison: {},
        splitProgress: {},
        // Time period comparison data
        timeComparison: includeTimeComparison ? {
          enabled: true,
          currentPeriod: {
            label: `Last ${comparisonPeriod1} days`,
            workouts: getWorkoutsFromTimePeriod(comparisonPeriod1, null, 1),
            data: {}
          },
          previousPeriod: {
            label: `${comparisonPeriod2} days before that`,
            workouts: getWorkoutsFromTimePeriod(comparisonPeriod2, null, 2),
            data: {}
          },
          comparison: {}
        } : { enabled: false },
        // AI-generated insights (only include if requested)
        aiInsights: includeAI ? aiInsights : null,
        splitAnalysis: includeAI ? splitAnalysisForReport : null,
        includeAI: includeAI
      }

      // Calculate cardio analytics
      filteredWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.type === 'cardio') {
            exercise.sets.forEach(set => {
              const timing = set.timing || 'after'
              const intensity = set.intensity || 'slow'
              const duration = set.duration || 0
              const distance = set.distance || 0
              const workoutDate = new Date(workout.date)
              const formattedDate = workoutDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }).replace(',', '')
              
              reportData.cardioAnalytics[`${timing}Workout`][intensity] += 1
              reportData.cardioAnalytics[`${timing}Workout`].totalDuration += duration
              reportData.cardioAnalytics[`${timing}Workout`].totalDistance += distance
              
              // Store cardio session dates
              if (!reportData.cardioAnalytics[`${timing}Workout`].dates) {
                reportData.cardioAnalytics[`${timing}Workout`].dates = []
              }
              if (!reportData.cardioAnalytics[`${timing}Workout`].dates.includes(formattedDate)) {
                reportData.cardioAnalytics[`${timing}Workout`].dates.push(formattedDate)
              }
              
              // Store detailed session info
              if (!reportData.cardioAnalytics[`${timing}Workout`].sessions) {
                reportData.cardioAnalytics[`${timing}Workout`].sessions = []
              }
              reportData.cardioAnalytics[`${timing}Workout`].sessions.push({
                date: formattedDate,
                exercise: exercise.name,
                intensity: intensity,
                duration: duration,
                distance: distance
              })
            })
          }
        })
      })
      
      // Generate cardio insights
      const cardioData = reportData.cardioAnalytics
      const totalCardio = cardioData.beforeWorkout.slow + cardioData.beforeWorkout.fast + 
                         cardioData.afterWorkout.slow + cardioData.afterWorkout.fast
      
      if (totalCardio > 0) {
        if (cardioData.afterWorkout.slow > cardioData.beforeWorkout.fast) {
          reportData.cardioAnalytics.insights.push("✅ Excellent strategy: More slow cardio after workouts helps preserve muscle mass")
        } else {
          reportData.cardioAnalytics.insights.push("💡 Consider more slow cardio after workouts to preserve muscle mass")
        }
        
        if (cardioData.beforeWorkout.fast > 2) {
          reportData.cardioAnalytics.insights.push("⚠️ High-intensity cardio before workouts may impact strength performance")
        }
        
        const totalDuration = cardioData.beforeWorkout.totalDuration + cardioData.afterWorkout.totalDuration
        if (totalDuration > 180) {
          reportData.cardioAnalytics.insights.push(`⚠️ Excessive cardio (${totalDuration} min) may interfere with muscle growth goals`)
        } else if (totalDuration > 0) {
          reportData.cardioAnalytics.insights.push(`✅ Good cardio volume (${totalDuration} min) for bodybuilding goals`)
        }
        
        if (cardioData.afterWorkout.slow > cardioData.afterWorkout.fast) {
          reportData.cardioAnalytics.insights.push("✅ Smart approach: Prioritizing slow cardio post-workout for recovery")
        }
      }

      // Calculate comprehensive analytics
      filteredWorkouts.forEach(workout => {
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

            if (!reportData.summaryByMuscleGroup[exercise.muscleGroup]) {
              reportData.summaryByMuscleGroup[exercise.muscleGroup] = { exercises: 0, sets: 0, volume: 0 }
            }
            reportData.summaryByMuscleGroup[exercise.muscleGroup].exercises += 1
            reportData.summaryByMuscleGroup[exercise.muscleGroup].sets += exercise.sets.length
            reportData.summaryByMuscleGroup[exercise.muscleGroup].volume += muscleVolume
          }

          // Top exercises
          reportData.topExercises[exercise.name] = 
            (reportData.topExercises[exercise.name] || 0) + exercise.sets.length

          exercise.sets.forEach(set => {
            // Difficulty distribution (only for strength exercises)
            if (exercise.type === 'strength' && set.difficulty && set.difficulty >= 1 && set.difficulty <= 10) {
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
        
        const weekWorkouts = filteredWorkouts.filter(w => {
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

      // Intelligent exercise grouping function for PDF comparison
      const getExerciseCategory = (exerciseName) => {
        const name = exerciseName.toLowerCase()
        
        // Chest exercises
        if (name.includes('bench') || name.includes('press') && (name.includes('chest') || name.includes('incline') || name.includes('decline'))) {
          if (name.includes('incline')) return 'incline_press'
          if (name.includes('decline')) return 'decline_press'
          return 'bench_press'
        }
        if (name.includes('fly') || name.includes('flye')) return 'chest_fly'
        if (name.includes('dip') && !name.includes('tricep')) return 'chest_dip'
        
        // Back exercises
        if (name.includes('pulldown') || name.includes('lat pull')) return 'lat_pulldown'
        if (name.includes('row') && !name.includes('upright')) return 'row'
        if (name.includes('pullup') || name.includes('pull up') || name.includes('chin up')) return 'pullup'
        if (name.includes('deadlift')) return 'deadlift'
        
        // Shoulder exercises
        if (name.includes('shoulder press') || name.includes('overhead press') || name.includes('military press')) return 'shoulder_press'
        if (name.includes('lateral raise') || name.includes('side raise')) return 'lateral_raise'
        if (name.includes('rear delt') || name.includes('reverse fly')) return 'rear_delt'
        if (name.includes('upright row')) return 'upright_row'
        
        // Bicep exercises
        if (name.includes('curl') && (name.includes('bicep') || name.includes('barbell') || name.includes('dumbbell') || name.includes('hammer'))) {
          if (name.includes('hammer')) return 'hammer_curl'
          return 'bicep_curl'
        }
        
        // Tricep exercises
        if (name.includes('tricep') || name.includes('overhead extension') || name.includes('skull crusher')) return 'tricep_extension'
        if (name.includes('dip') && name.includes('tricep')) return 'tricep_dip'
        
        // Leg exercises
        if (name.includes('squat')) return 'squat'
        if (name.includes('leg press')) return 'leg_press'
        if (name.includes('lunge')) return 'lunge'
        if (name.includes('leg curl')) return 'leg_curl'
        if (name.includes('leg extension')) return 'leg_extension'
        if (name.includes('calf raise')) return 'calf_raise'
        
        // Core exercises
        if (name.includes('crunch') || name.includes('sit up')) return 'crunch'
        if (name.includes('plank')) return 'plank'
        
        // Default: return the original name if no category matches
        return exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      }

      // Calculate split comparison data with intelligent exercise grouping
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const splits = {}
      
      // Get user's workout split from localStorage
      let userSplit = null
      try {
        const savedSplit = localStorage.getItem('gymgenie-workout-split')
        userSplit = savedSplit ? JSON.parse(savedSplit) : null
      } catch (error) {
        console.error('Error parsing workout split:', error)
      }
      
      filteredWorkouts.forEach(workout => {
        const dayOfWeek = new Date(workout.date).getDay()
        const dayName = dayNames[dayOfWeek]
        
        let key = dayName
        
        // If user has a configured split, use it
        if (userSplit && userSplit.schedule) {
          const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek // Convert Sunday from 0 to 7
          const plannedSplit = userSplit.schedule[dayNumber]
          
          if (plannedSplit && plannedSplit.name && plannedSplit.name !== 'Rest') {
            key = `${dayName} (${plannedSplit.name})`
          }
        } else {
          // Fallback: use day name only (same as SplitComparison component)
          key = dayName
        }
        
        if (!splits[key]) {
          splits[key] = {
            sessions: [],
            totalVolume: 0,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0,
            muscleGroups: {},
            exercises: {}
          }
        }

        let workoutVolume = 0
        let workoutSets = 0
        let workoutReps = 0
        let workoutMaxWeight = 0
        const sessionMuscleGroups = {}
        const sessionExercises = {}

        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name || 'Unknown Exercise'
          const exerciseCategory = getExerciseCategory(exerciseName)
          const muscleGroup = exercise.muscleGroup || 'General'
          
          let exerciseVolume = 0
          let exerciseSets = exercise.sets.length
          let exerciseReps = 0
          let exerciseMaxWeight = 0

          exercise.sets.forEach(set => {
            const isBodyweight = set.isBodyweight || (isBodyweightExercise(exercise.name) && (set.weight === 0 || set.weight === undefined));
            const bodyweight = JSON.parse(localStorage.getItem('gymgenie-measurements'))?.weight || 0;
            const effectiveWeight = isBodyweight ? (bodyweight + (set.weight || 0)) : (set.weight || 0);
            const reps = set.reps || 0;
            const volume = effectiveWeight * reps;

            exerciseReps += reps;
            exerciseVolume += volume;
            exerciseMaxWeight = Math.max(exerciseMaxWeight, effectiveWeight);
            
            workoutReps += reps;
            workoutVolume += volume;
            workoutMaxWeight = Math.max(workoutMaxWeight, effectiveWeight);
          })

          workoutSets += exerciseSets

          // Track muscle group data
          if (!sessionMuscleGroups[muscleGroup]) {
            sessionMuscleGroups[muscleGroup] = {
              volume: 0,
              sets: 0,
              reps: 0,
              maxWeight: 0
            }
          }
          sessionMuscleGroups[muscleGroup].volume += exerciseVolume
          sessionMuscleGroups[muscleGroup].sets += exerciseSets
          sessionMuscleGroups[muscleGroup].reps += exerciseReps
          sessionMuscleGroups[muscleGroup].maxWeight = Math.max(sessionMuscleGroups[muscleGroup].maxWeight, exerciseMaxWeight)

          // Track exercise data by category for intelligent comparison
          if (!sessionExercises[exerciseCategory]) {
            sessionExercises[exerciseCategory] = {
              muscleGroup: muscleGroup,
              volume: 0,
              sets: 0,
              reps: 0,
              maxWeight: 0,
              exerciseNames: new Set()
            }
          }
          sessionExercises[exerciseCategory].volume += exerciseVolume
          sessionExercises[exerciseCategory].sets += exerciseSets
          sessionExercises[exerciseCategory].reps += exerciseReps
          sessionExercises[exerciseCategory].maxWeight = Math.max(sessionExercises[exerciseCategory].maxWeight, exerciseMaxWeight)
          sessionExercises[exerciseCategory].exerciseNames.add(exerciseName)

          // Update split totals for muscle groups
          if (!splits[key].muscleGroups[muscleGroup]) {
            splits[key].muscleGroups[muscleGroup] = {
              totalVolume: 0,
              totalSets: 0,
              totalReps: 0,
              maxWeight: 0,
              sessions: 0
            }
          }
          splits[key].muscleGroups[muscleGroup].totalVolume += exerciseVolume
          splits[key].muscleGroups[muscleGroup].totalSets += exerciseSets
          splits[key].muscleGroups[muscleGroup].totalReps += exerciseReps
          splits[key].muscleGroups[muscleGroup].maxWeight = Math.max(splits[key].muscleGroups[muscleGroup].maxWeight, exerciseMaxWeight)

          // Update split totals for exercise categories
          if (!splits[key].exercises[exerciseCategory]) {
            splits[key].exercises[exerciseCategory] = {
              muscleGroup: muscleGroup,
              totalVolume: 0,
              totalSets: 0,
              totalReps: 0,
              maxWeight: 0,
              sessions: 0,
              exerciseNames: new Set()
            }
          }
          splits[key].exercises[exerciseCategory].totalVolume += exerciseVolume
          splits[key].exercises[exerciseCategory].totalSets += exerciseSets
          splits[key].exercises[exerciseCategory].totalReps += exerciseReps
          splits[key].exercises[exerciseCategory].maxWeight = Math.max(splits[key].exercises[exerciseCategory].maxWeight, exerciseMaxWeight)
          splits[key].exercises[exerciseCategory].exerciseNames.add(exerciseName)
        })

        // Mark muscle groups as used in this session
        Object.keys(sessionMuscleGroups).forEach(muscleGroup => {
          splits[key].muscleGroups[muscleGroup].sessions += 1
        })

        // Mark exercise categories as used in this session
        Object.keys(sessionExercises).forEach(exerciseCategory => {
          splits[key].exercises[exerciseCategory].sessions += 1
        })

        splits[key].sessions.push({
          date: workout.date,
          volume: workoutVolume,
          sets: workoutSets,
          reps: workoutReps,
          maxWeight: workoutMaxWeight,
          muscleGroups: sessionMuscleGroups,
          exercises: sessionExercises
        })

        splits[key].totalVolume += workoutVolume
        splits[key].totalSets += workoutSets
        splits[key].totalReps += workoutReps
        splits[key].maxWeight = Math.max(splits[key].maxWeight, workoutMaxWeight)
      })

      // Calculate averages and progress for each split
      Object.entries(splits).forEach(([key, split]) => {
        const sessionCount = split.sessions.length
        if (sessionCount > 0) {
          // Calculate muscle group averages
          const muscleGroupsData = {}
          Object.entries(split.muscleGroups).forEach(([muscle, data]) => {
            muscleGroupsData[muscle] = {
              avgVolume: Math.round(data.totalVolume / data.sessions),
              avgSets: Math.round(data.totalSets / data.sessions),
              avgReps: Math.round(data.totalReps / data.sessions),
              maxWeight: data.maxWeight,
              sessions: data.sessions
            }
          })

          // Calculate exercise averages with exercise names
          const exercisesData = {}
          Object.entries(split.exercises).forEach(([exerciseCategory, data]) => {
            const exerciseNames = Array.from(data.exerciseNames)
            exercisesData[exerciseCategory] = {
              muscleGroup: data.muscleGroup,
              avgVolume: Math.round(data.totalVolume / data.sessions),
              avgSets: Math.round(data.totalSets / data.sessions),
              avgReps: Math.round(data.totalReps / data.sessions),
              maxWeight: data.maxWeight,
              sessions: data.sessions,
              exerciseNames: exerciseNames,
              displayName: exerciseNames.length === 1 ? exerciseNames[0] : `${exerciseNames[0]} (+ ${exerciseNames.length - 1} similar)`
            }
          })

          // Only include this split if it's selected for PDF or if no splits are selected (show all)
          if (selectedSplitsForPdf.length === 0 || selectedSplitsForPdf.includes(key)) {
            reportData.splitComparison[key] = {
              avgVolume: Math.round(split.totalVolume / sessionCount),
              avgSets: Math.round(split.totalSets / sessionCount),
              avgReps: Math.round(split.totalReps / sessionCount),
              maxWeight: split.maxWeight,
              sessions: sessionCount,
              muscleGroups: muscleGroupsData,
              exercises: exercisesData
            }
          }
          
          // Store session data for later comparison
          const recentSessions = split.sessions
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-4)
          
          if (recentSessions.length >= 2) {
            // Calculate average volume for this split
            const avgVolume = recentSessions.reduce((sum, s) => sum + s.volume, 0) / recentSessions.length
            
            // Store split data for comparison (will be processed after all splits are collected)
            if (selectedSplitsForPdf.length === 0 || selectedSplitsForPdf.includes(key)) {
              if (!reportData.splitProgressTemp) {
                reportData.splitProgressTemp = []
              }
              reportData.splitProgressTemp.push({
                key: key,
                avgVolume: avgVolume,
                recentSessions: recentSessions.map(s => ({
                  date: new Date(s.date).toLocaleDateString(),
                  volume: s.volume,
                  sets: s.sets
                }))
              })
            }
          }
        }
      })

      // Process split progress comparisons (baseline vs others)
      const splitComparisonEntries = Object.entries(reportData.splitComparison);
      if (splitComparisonEntries.length > 0) {
        // Sort splits to ensure consistent ordering (Thursday first, then Saturday, etc.)
        const dayOrder = ['Thursday', 'Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Friday', 'Sunday'];
        splitComparisonEntries.sort(([a], [b]) => {
          const getDayFromSplit = (splitName) => {
            const day = splitName.split(' ')[0];
            return dayOrder.indexOf(day);
          };
          return getDayFromSplit(a) - getDayFromSplit(b);
        });

        // First split is the baseline
        const [baselineKey, baselineData] = splitComparisonEntries[0];
        const baselineSplit = reportData.splitProgressTemp?.find(s => s.key === baselineKey);
        
        reportData.splitProgress[baselineKey] = {
          trend: 'Base Trend',
          progressPercent: 0,
          isBaseline: true,
          recentSessions: baselineSplit ? baselineSplit.recentSessions : []
        };

        // Compare other splits to the baseline using median session volume for more accuracy
        for (let i = 1; i < splitComparisonEntries.length; i++) {
          const [currentKey, currentData] = splitComparisonEntries[i];
          const currentSplit = reportData.splitProgressTemp?.find(s => s.key === currentKey);
          
          // Calculate median session volume for more stable comparison
          const getMedianVolume = (sessions) => {
            if (!sessions || sessions.length === 0) return 0;
            const volumes = sessions.map(s => s.volume).sort((a, b) => a - b);
            const mid = Math.floor(volumes.length / 2);
            return volumes.length % 2 === 0 ? (volumes[mid - 1] + volumes[mid]) / 2 : volumes[mid];
          };
          
          const baselineMedian = getMedianVolume(baselineSplit?.recentSessions);
          const currentMedian = getMedianVolume(currentSplit?.recentSessions);
          
          if (baselineMedian > 0) {
            const progressPercent = ((currentMedian - baselineMedian) / baselineMedian) * 100;
            
            // Cap at reasonable limits and use more conservative thresholds
            const cappedPercent = Math.max(-50, Math.min(50, progressPercent));
            
            reportData.splitProgress[currentKey] = {
              trend: cappedPercent > 15 ? 'Higher' : cappedPercent < -15 ? 'Lower' : 'Similar',
              progressPercent: Math.round(cappedPercent),
              isBaseline: false,
              recentSessions: currentSplit ? currentSplit.recentSessions : []
            };
          } else {
            // Handle edge case where baseline is 0
            reportData.splitProgress[currentKey] = {
              trend: currentMedian > 0 ? 'Higher' : 'Similar',
              progressPercent: currentMedian > 0 ? 25 : 0,
              isBaseline: false,
              recentSessions: currentSplit ? currentSplit.recentSessions : []
            };
          }
        }
        
        // Clean up temporary data
        delete reportData.splitProgressTemp;
      }

      // Get top 10 exercises
      const sortedExercises = Object.entries(reportData.topExercises)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
      reportData.topExercises = Object.fromEntries(sortedExercises)

      // Calculate time period comparison data if enabled
      if (includeTimeComparison && reportData.timeComparison.enabled) {
        const calculatePeriodStats = (workouts) => {
          return {
            totalWorkouts: workouts.length,
            totalVolume: workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0),
            totalSets: workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0),
            avgDifficulty: workouts.length > 0 ? workouts.reduce((sum, w) => {
              const strengthExercises = w.exercises.filter(e => e.type === 'strength')
              if (strengthExercises.length === 0) return sum
              return sum + strengthExercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.difficulty || 0), 0) / Math.max(e.sets.length, 1), 0) / strengthExercises.length
            }, 0) / workouts.length : 0,
            muscleGroups: {},
            topExercises: {}
          }
        }

        // Calculate stats for both periods
        reportData.timeComparison.currentPeriod.data = calculatePeriodStats(reportData.timeComparison.currentPeriod.workouts)
        reportData.timeComparison.previousPeriod.data = calculatePeriodStats(reportData.timeComparison.previousPeriod.workouts)

        // Calculate muscle group data for both periods
        const calculateMuscleGroupData = (workouts) => {
          const muscleGroups = {}
          workouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
              if (exercise.muscleGroup) {
                if (!muscleGroups[exercise.muscleGroup]) {
                  muscleGroups[exercise.muscleGroup] = { volume: 0, sets: 0 }
                }
                const exerciseVolume = exercise.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0)
                muscleGroups[exercise.muscleGroup].volume += exerciseVolume
                muscleGroups[exercise.muscleGroup].sets += exercise.sets.length
              }
            })
          })
          return muscleGroups
        }

        reportData.timeComparison.currentPeriod.data.muscleGroups = calculateMuscleGroupData(reportData.timeComparison.currentPeriod.workouts)
        reportData.timeComparison.previousPeriod.data.muscleGroups = calculateMuscleGroupData(reportData.timeComparison.previousPeriod.workouts)

        // Calculate comparison metrics
        const current = reportData.timeComparison.currentPeriod.data
        const previous = reportData.timeComparison.previousPeriod.data
        
        reportData.timeComparison.comparison = {
          workoutChange: current.totalWorkouts - previous.totalWorkouts,
          workoutChangePercent: previous.totalWorkouts > 0 ? ((current.totalWorkouts - previous.totalWorkouts) / previous.totalWorkouts * 100) : 0,
          volumeChange: current.totalVolume - previous.totalVolume,
          volumeChangePercent: previous.totalVolume > 0 ? ((current.totalVolume - previous.totalVolume) / previous.totalVolume * 100) : 0,
          setsChange: current.totalSets - previous.totalSets,
          setsChangePercent: previous.totalSets > 0 ? ((current.totalSets - previous.totalSets) / previous.totalSets * 100) : 0,
          difficultyChange: current.avgDifficulty - previous.avgDifficulty,
          trend: current.totalVolume > previous.totalVolume ? 'improving' : current.totalVolume < previous.totalVolume ? 'declining' : 'stable'
        }
      }

      // Generate HTML report
      const htmlContent = generateProfessionalReportHTML(reportData)
      
      // Create and download HTML file (can be opened in browser and printed to PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const reportType = includeAI ? 'with-ai' : 'basic'
      a.download = `gymgenie-professional-report-${reportType}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      const reportTypeText = includeAI ? 'with AI analysis' : 'basic'
      alert(`Professional report ${reportTypeText} generated! Open the HTML file in your browser and use Print > Save as PDF to create a PDF report.`)
    } catch (error) {
      console.error('Error generating professional report:', error)
      alert('Error generating professional report. Please try again.')
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
                <h2>🧩 Muscle Group Summary</h2>
                <div class="grid">
                    ${(() => {
                        const entries = Object.entries(data.summaryByMuscleGroup || {})
                          .sort(([a], [b]) => a.localeCompare(b));
                        if (entries.length === 0) return '<div class="card">No muscle group data available for this period.</div>';
                        return entries.map(([group, s]) => `
                            <div class="card metric" style="border-left: 4px solid ${muscleGroupColors[group] || '#6b7280'};">
                                <div style="text-transform: capitalize; font-weight: 600; color: #111827; margin-bottom: 6px;">${group}</div>
                                <div class="metric-value" style="font-size: 1.6rem;">${s.sets}</div>
                                <div class="metric-label">Sets</div>
                                <div style="margin-top: 6px; color: #6b7280; font-size: 0.85rem;">${s.exercises} exercises • ${Math.round(s.volume)} kg</div>
                            </div>
                        `).join('')
                    })()}
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

            ${Object.keys(data.splitComparison).length > 0 ? `
            <div class="section">
                <h2>🔄 Split Comparison Analysis</h2>
                <p style="color: #6b7280; margin-bottom: 30px;">Compare your performance across different workout splits and days</p>
                
                <!-- Intelligent Exercise Comparison -->
                ${(() => {
                    const splitEntries = Object.entries(data.splitComparison);
                    if (splitEntries.length < 2) return '';
                    
                    // Find common exercise categories across splits
                    const commonExercises = {};
                    splitEntries.forEach(([splitName, splitData]) => {
                        Object.keys(splitData.exercises || {}).forEach(exerciseCategory => {
                            if (!commonExercises[exerciseCategory]) {
                                commonExercises[exerciseCategory] = [];
                            }
                            commonExercises[exerciseCategory].push({
                                splitName,
                                data: splitData.exercises[exerciseCategory]
                            });
                        });
                    });
                    
                    // Filter to only show exercises that appear in multiple splits
                    const comparableExercises = Object.entries(commonExercises)
                        .filter(([_, splits]) => splits.length >= 2)
                        .slice(0, 3); // Show top 3 comparable exercises
                    
                    if (comparableExercises.length === 0) {
                        return `
                        <div class="card" style="background: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ No Comparable Exercises Found</h4>
                            <p style="color: #78350f; font-size: 0.9rem; margin: 0;">
                                Your workout splits contain different exercise types. Comparison is based on overall workout volume and intensity instead of specific exercises.
                            </p>
                        </div>`;
                    }
                    
                    return `
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 1.2rem;">🔄 Exercise Category Comparisons</h3>
                        <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 20px;">
                            Comparing similar exercises across different workout days/splits
                        </p>
                        ${comparableExercises.map(([exerciseCategory, splits]) => `
                            <div class="card" style="margin-bottom: 20px; border-left: 4px solid #10b981;">
                                <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 1rem;">
                                    ${splits[0].data.displayName}
                                </h4>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                    ${splits.map(split => `
                                        <div style="padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e5e7eb;">
                                            <div style="font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 0.9rem;">
                                                ${split.splitName}
                                            </div>
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem;">
                                                <div>
                                                    <div style="color: #6b7280;">Volume</div>
                                                    <div style="font-weight: 600; color: #ef4444;">${Math.round(split.data.avgVolume)} kg</div>
                                                </div>
                                                <div>
                                                    <div style="color: #6b7280;">Max Weight</div>
                                                    <div style="font-weight: 600; color: #8b5cf6;">${split.data.maxWeight} kg</div>
                                                </div>
                                                <div>
                                                    <div style="color: #6b7280;">Sets</div>
                                                    <div style="font-weight: 600; color: #10b981;">${split.data.avgSets}</div>
                                                </div>
                                                <div>
                                                    <div style="color: #6b7280;">Reps</div>
                                                    <div style="font-weight: 600; color: #f59e0b;">${split.data.avgReps}</div>
                                                </div>
                                            </div>
                                            ${split.data.exerciseNames.length > 1 ? `
                                                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                                                    <div style="color: #6b7280; font-size: 0.7rem;">Variations:</div>
                                                    <div style="color: #374151; font-size: 0.75rem;">${split.data.exerciseNames.join(', ')}</div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <!-- Performance Analysis -->
                                ${(() => {
                                    const bestVolume = Math.max(...splits.map(s => s.data.avgVolume));
                                    const bestWeight = Math.max(...splits.map(s => s.data.maxWeight));
                                    const bestVolumeDay = splits.find(s => s.data.avgVolume === bestVolume);
                                    const bestWeightDay = splits.find(s => s.data.maxWeight === bestWeight);
                                    
                                    return `
                                    <div style="margin-top: 15px; padding: 10px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #10b981;">
                                        <div style="font-size: 0.8rem; color: #166534; font-weight: 600;">Performance Insights:</div>
                                        <div style="font-size: 0.75rem; color: #15803d; margin-top: 4px;">
                                            • Highest volume: <strong>${bestVolumeDay.splitName}</strong> (${Math.round(bestVolume)} kg)
                                            <br>
                                            • Highest weight: <strong>${bestWeightDay.splitName}</strong> (${bestWeight} kg)
                                        </div>
                                    </div>`;
                                })()}
                            </div>
                        `).join('')}
                    </div>`;
                })()}
                
                <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    ${Object.entries(data.splitComparison)
                      .sort(([a], [b]) => {
                        // Sort to ensure consistent ordering: Thursday first, then Saturday
                        const dayOrder = ['Thursday', 'Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Friday', 'Sunday'];
                        const getDayFromSplit = (splitName) => {
                          const day = splitName.split(' ')[0];
                          return dayOrder.indexOf(day);
                        };
                        return getDayFromSplit(a) - getDayFromSplit(b);
                      })
                      .map(([splitName, splitData]) => `
                        <div class="card" style="border-left: 4px solid #3b82f6;">
                            <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 1.1rem;">${splitName}</h4>
                            
                            <!-- Overall Stats -->
                            <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 0.85rem; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 6px;">
                                <div style="text-align: center;">
                                    <div style="color: #6b7280; font-size: 0.75rem;">Avg Volume</div>
                                    <div style="font-weight: 600; color: #ef4444;">${splitData.avgVolume} kg</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #6b7280; font-size: 0.75rem;">Avg Sets</div>
                                    <div style="font-weight: 600; color: #10b981;">${splitData.avgSets}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #6b7280; font-size: 0.75rem;">Sessions</div>
                                    <div style="font-weight: 600; color: #f59e0b;">${splitData.sessions}</div>
                                </div>
                            </div>

                            <!-- Muscle Groups Breakdown -->
                            ${splitData.muscleGroups && Object.keys(splitData.muscleGroups).length > 0 ? `
                                <div style="margin-bottom: 15px;">
                                    <h5 style="color: #374151; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 600;">💪 Muscle Groups</h5>
                                    <div style="display: grid; gap: 8px;">
                                        ${Object.entries(splitData.muscleGroups).map(([muscle, data]) => `
                                            <div style="display: flex; justify-between; align-items: center; padding: 8px 12px; background: #f1f5f9; border-radius: 4px; font-size: 0.8rem;">
                                                <div style="font-weight: 500; color: #1f2937; text-transform: capitalize;">${muscle}</div>
                                                <div style="display: flex; gap: 15px; color: #6b7280;">
                                                    <span><strong style="color: #ef4444;">${Math.round(data.avgVolume || 0)} kg</strong> vol</span>
                                                    <span><strong style="color: #8b5cf6;">${data.maxWeight || 0} kg</strong> max</span>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Top Exercise Categories -->
                            ${splitData.exercises && Object.keys(splitData.exercises).length > 0 ? `
                                <div>
                                    <h5 style="color: #374151; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: 600;">🏋️ Exercise Categories</h5>
                                    <div style="display: grid; gap: 6px;">
                                        ${Object.entries(splitData.exercises).slice(0, 5).map(([exerciseCategory, data]) => `
                                            <div style="display: flex; justify-between; align-items: center; padding: 6px 10px; background: #fef7ff; border-radius: 4px; font-size: 0.75rem;">
                                                <div>
                                                    <div style="font-weight: 500; color: #1f2937;">${data.displayName}</div>
                                                    <div style="color: #8b5cf6; font-size: 0.7rem; text-transform: capitalize;">${data.muscleGroup}</div>
                                                    ${data.exerciseNames.length > 1 ? `<div style="color: #6b7280; font-size: 0.65rem;">Includes: ${data.exerciseNames.join(', ')}</div>` : ''}
                                                </div>
                                                <div style="text-align: right; color: #6b7280;">
                                                    <div><strong style="color: #8b5cf6;">${data.maxWeight || 0} kg</strong></div>
                                                    <div style="font-size: 0.7rem;">${Math.round(data.avgVolume || 0)} kg vol</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Progress Trend -->
                            ${data.splitProgress[splitName] ? `
                                <div style="margin-top: 15px; padding: 10px; background: ${
                                  data.splitProgress[splitName].isBaseline ? '#f8fafc' : 
                                  data.splitProgress[splitName].trend === 'Higher' ? '#f0fdf4' : 
                                  data.splitProgress[splitName].trend === 'Lower' ? '#fef2f2' : '#f8fafc'
                                }; border-radius: 6px; border-left: 3px solid ${
                                  data.splitProgress[splitName].isBaseline ? '#6b7280' :
                                  data.splitProgress[splitName].trend === 'Higher' ? '#10b981' : 
                                  data.splitProgress[splitName].trend === 'Lower' ? '#ef4444' : '#6b7280'
                                };">
                                    <div style="font-size: 0.8rem; color: #6b7280;">Recent Trend</div>
                                    <div style="font-weight: 600; color: ${
                                      data.splitProgress[splitName].isBaseline ? '#6b7280' :
                                      data.splitProgress[splitName].trend === 'Higher' ? '#10b981' : 
                                      data.splitProgress[splitName].trend === 'Lower' ? '#ef4444' : '#6b7280'
                                    };">
                                        ${data.splitProgress[splitName].isBaseline ? 
                                          data.splitProgress[splitName].trend : 
                                          `${data.splitProgress[splitName].trend} (${data.splitProgress[splitName].progressPercent > 0 ? '+' : ''}${data.splitProgress[splitName].progressPercent}%)`
                                        }
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${Object.keys(data.splitProgress).length > 0 ? `
                    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px;">
                        <h4 style="color: #0369a1; margin-top: 0;">📊 Split Progress Insights</h4>
                        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                            ${Object.entries(data.splitProgress)
                              .sort(([a], [b]) => {
                                // Sort to ensure consistent ordering: Thursday first, then Saturday
                                const dayOrder = ['Thursday', 'Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Friday', 'Sunday'];
                                const getDayFromSplit = (splitName) => {
                                  const day = splitName.split(' ')[0];
                                  return dayOrder.indexOf(day);
                                };
                                return getDayFromSplit(a) - getDayFromSplit(b);
                              })
                              .map(([splitName, progress]) => `
                                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0f2fe;">
                                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${splitName}</div>
                                    <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 10px;">
                                        ${progress.isBaseline ? 
                                          `<span style="color: #6b7280; font-weight: 600;">Baseline for comparison</span>` :
                                          `Compared to baseline: <span style="color: ${progress.trend === 'Higher' ? '#10b981' : progress.trend === 'Lower' ? '#ef4444' : '#6b7280'}; font-weight: 600;">${progress.trend} (${progress.progressPercent > 0 ? '+' : ''}${progress.progressPercent}%)</span>`
                                        }
                                    </div>
                                    <div style="font-size: 0.8rem;">
                                        <div style="color: #6b7280; margin-bottom: 5px;">Last 4 sessions:</div>
                                        ${progress.recentSessions.map(session => `
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                                <span>${session.date}</span>
                                                <span>${session.volume} kg (${session.sets} sets)</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            ` : ''}

            ${data.cardioAnalytics && (data.cardioAnalytics.beforeWorkout.slow + data.cardioAnalytics.beforeWorkout.fast + data.cardioAnalytics.afterWorkout.slow + data.cardioAnalytics.afterWorkout.fast) > 0 ? `
            <div class="section">
                <h2>🏃‍♂️ Cardio Strategy Analysis</h2>
                <p style="color: #6b7280; margin-bottom: 30px;">Analyze your cardio timing and intensity for optimal bodybuilding results</p>
                
                <!-- Cardio Overview - Only show sections with actual data -->
                <div style="margin-bottom: 30px;">
                    ${(data.cardioAnalytics.beforeWorkout.slow + data.cardioAnalytics.beforeWorkout.fast) > 0 ? `
                        <div class="card" style="border-left: 4px solid #f97316; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h4 style="color: #1f2937; margin: 0; font-size: 1.1rem;">🔥 Before Workout Cardio</h4>
                                <div style="background: #fef3c7; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; color: #92400e; font-weight: 600;">
                                    ${data.cardioAnalytics.beforeWorkout.slow + data.cardioAnalytics.beforeWorkout.fast} sessions • ${data.cardioAnalytics.beforeWorkout.totalDuration} min
                                </div>
                            </div>
                            
                            <!-- Cardio Dates -->
                            ${data.cardioAnalytics.beforeWorkout.dates && data.cardioAnalytics.beforeWorkout.dates.length > 0 ? `
                                <div style="margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px; font-weight: 600;">📅 Cardio Sessions:</div>
                                    <div style="font-size: 0.85rem; color: #374151;">
                                        ${data.cardioAnalytics.beforeWorkout.dates.sort((a, b) => new Date(b) - new Date(a)).join(' • ')}
                                    </div>
                                </div>
                            ` : ''}
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                                ${data.cardioAnalytics.beforeWorkout.slow > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #15803d; margin-bottom: 5px;">${data.cardioAnalytics.beforeWorkout.slow}</div>
                                        <div style="color: #166534; font-size: 0.9rem; font-weight: 500;">🐌 Slow Cardio</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">LISS / Fat Burn</div>
                                    </div>
                                ` : ''}
                                ${data.cardioAnalytics.beforeWorkout.fast > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626; margin-bottom: 5px;">${data.cardioAnalytics.beforeWorkout.fast}</div>
                                        <div style="color: #991b1b; font-size: 0.9rem; font-weight: 500;">⚡ Fast Cardio</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">HIIT / Intense</div>
                                    </div>
                                ` : ''}
                                ${data.cardioAnalytics.beforeWorkout.totalDistance > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb; margin-bottom: 5px;">${Math.round(data.cardioAnalytics.beforeWorkout.totalDistance * 10) / 10}</div>
                                        <div style="color: #1d4ed8; font-size: 0.9rem; font-weight: 500;">📏 Distance</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">kilometers</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${(data.cardioAnalytics.afterWorkout.slow + data.cardioAnalytics.afterWorkout.fast) > 0 ? `
                        <div class="card" style="border-left: 4px solid #10b981;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h4 style="color: #1f2937; margin: 0; font-size: 1.1rem;">💪 After Workout Cardio</h4>
                                <div style="background: #dcfce7; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; color: #166534; font-weight: 600;">
                                    ${data.cardioAnalytics.afterWorkout.slow + data.cardioAnalytics.afterWorkout.fast} sessions • ${data.cardioAnalytics.afterWorkout.totalDuration} min
                                </div>
                            </div>
                            
                            <!-- Cardio Dates -->
                            ${data.cardioAnalytics.afterWorkout.dates && data.cardioAnalytics.afterWorkout.dates.length > 0 ? `
                                <div style="margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px; font-weight: 600;">📅 Cardio Sessions:</div>
                                    <div style="font-size: 0.85rem; color: #374151;">
                                        ${data.cardioAnalytics.afterWorkout.dates.sort((a, b) => new Date(b) - new Date(a)).join(' • ')}
                                    </div>
                                </div>
                            ` : ''}
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                                ${data.cardioAnalytics.afterWorkout.slow > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #15803d; margin-bottom: 5px;">${data.cardioAnalytics.afterWorkout.slow}</div>
                                        <div style="color: #166534; font-size: 0.9rem; font-weight: 500;">🐌 Slow Cardio</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">Recovery</div>
                                    </div>
                                ` : ''}
                                ${data.cardioAnalytics.afterWorkout.fast > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626; margin-bottom: 5px;">${data.cardioAnalytics.afterWorkout.fast}</div>
                                        <div style="color: #991b1b; font-size: 0.9rem; font-weight: 500;">⚡ Fast Cardio</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">Conditioning</div>
                                    </div>
                                ` : ''}
                                ${data.cardioAnalytics.afterWorkout.totalDistance > 0 ? `
                                    <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb; margin-bottom: 5px;">${Math.round(data.cardioAnalytics.afterWorkout.totalDistance * 10) / 10}</div>
                                        <div style="color: #1d4ed8; font-size: 0.9rem; font-weight: 500;">📏 Distance</div>
                                        <div style="color: #6b7280; font-size: 0.75rem; margin-top: 2px;">kilometers</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Cardio Insights -->
                ${data.cardioAnalytics.insights.length > 0 ? `
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <h4 style="color: #15803d; margin-top: 0;">🎯 Bodybuilding Cardio Insights</h4>
                        <div style="space-y: 10px;">
                            ${data.cardioAnalytics.insights.map(insight => `
                                <div style="margin-bottom: 8px; font-size: 0.9rem; color: #374151;">${insight}</div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Cardio Strategy Recommendations -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
                    <h4 style="color: #92400e; margin-top: 0;">💡 Optimal Cardio Strategy for Bodybuilding</h4>
                    <div style="font-size: 0.9rem; color: #374151; line-height: 1.6;">
                        <p><strong>🐌 Slow Cardio (LISS):</strong> Best after workouts for fat burning without muscle loss</p>
                        <p><strong>⚡ Fast Cardio (HIIT):</strong> Use sparingly, preferably on non-training days</p>
                        <p><strong>⏱️ Duration:</strong> Keep total cardio under 3 hours per week to preserve muscle</p>
                        <p><strong>🎯 Timing:</strong> Post-workout slow cardio is ideal for muscle preservation</p>
                    </div>
                </div>
            </div>
            ` : ''}

            ${data.timeComparison.enabled ? `
            <div class="section">
                <h2>⏰ Time Period Comparison</h2>
                <p style="color: #6b7280; margin-bottom: 30px;">Compare your performance between different time periods to track long-term progress</p>
                
                <!-- Comparison Overview -->
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div class="card" style="border-left: 4px solid #3b82f6;">
                        <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 1.1rem;">📊 ${data.timeComparison.currentPeriod.label}</h4>
                        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.9rem;">
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Workouts</div>
                                <div style="font-weight: 600; color: #3b82f6;">${data.timeComparison.currentPeriod.data.totalWorkouts}</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Total Volume</div>
                                <div style="font-weight: 600; color: #ef4444;">${Math.round(data.timeComparison.currentPeriod.data.totalVolume)} kg</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Total Sets</div>
                                <div style="font-weight: 600; color: #10b981;">${data.timeComparison.currentPeriod.data.totalSets}</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Avg Difficulty</div>
                                <div style="font-weight: 600; color: #f59e0b;">${data.timeComparison.currentPeriod.data.avgDifficulty.toFixed(1)}/10</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card" style="border-left: 4px solid #6b7280;">
                        <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 1.1rem;">📈 ${data.timeComparison.previousPeriod.label}</h4>
                        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 15px; font-size: 0.9rem;">
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Workouts</div>
                                <div style="font-weight: 600; color: #3b82f6;">${data.timeComparison.previousPeriod.data.totalWorkouts}</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Total Volume</div>
                                <div style="font-weight: 600; color: #ef4444;">${Math.round(data.timeComparison.previousPeriod.data.totalVolume)} kg</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Total Sets</div>
                                <div style="font-weight: 600; color: #10b981;">${data.timeComparison.previousPeriod.data.totalSets}</div>
                            </div>
                            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                                <div style="color: #6b7280; font-size: 0.8rem;">Avg Difficulty</div>
                                <div style="font-weight: 600; color: #f59e0b;">${data.timeComparison.previousPeriod.data.avgDifficulty.toFixed(1)}/10</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Progress Analysis -->
                <div style="background: ${data.timeComparison.comparison.trend === 'improving' ? '#f0fdf4' : data.timeComparison.comparison.trend === 'declining' ? '#fef2f2' : '#f8fafc'}; border-left: 4px solid ${data.timeComparison.comparison.trend === 'improving' ? '#10b981' : data.timeComparison.comparison.trend === 'declining' ? '#ef4444' : '#6b7280'}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h4 style="color: ${data.timeComparison.comparison.trend === 'improving' ? '#15803d' : data.timeComparison.comparison.trend === 'declining' ? '#dc2626' : '#374151'}; margin-top: 0;">
                        📊 Progress Analysis: ${data.timeComparison.comparison.trend === 'improving' ? '📈 Improving' : data.timeComparison.comparison.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                    </h4>
                    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">Workout Change</div>
                            <div style="font-weight: 600; color: ${data.timeComparison.comparison.workoutChange >= 0 ? '#10b981' : '#ef4444'};">
                                ${data.timeComparison.comparison.workoutChange >= 0 ? '+' : ''}${data.timeComparison.comparison.workoutChange}
                                <span style="font-size: 0.8rem; margin-left: 5px;">(${data.timeComparison.comparison.workoutChangePercent >= 0 ? '+' : ''}${data.timeComparison.comparison.workoutChangePercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">Volume Change</div>
                            <div style="font-weight: 600; color: ${data.timeComparison.comparison.volumeChange >= 0 ? '#10b981' : '#ef4444'};">
                                ${data.timeComparison.comparison.volumeChange >= 0 ? '+' : ''}${Math.round(data.timeComparison.comparison.volumeChange)} kg
                                <span style="font-size: 0.8rem; margin-left: 5px;">(${data.timeComparison.comparison.volumeChangePercent >= 0 ? '+' : ''}${data.timeComparison.comparison.volumeChangePercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">Sets Change</div>
                            <div style="font-weight: 600; color: ${data.timeComparison.comparison.setsChange >= 0 ? '#10b981' : '#ef4444'};">
                                ${data.timeComparison.comparison.setsChange >= 0 ? '+' : ''}${data.timeComparison.comparison.setsChange}
                                <span style="font-size: 0.8rem; margin-left: 5px;">(${data.timeComparison.comparison.setsChangePercent >= 0 ? '+' : ''}${data.timeComparison.comparison.setsChangePercent.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">Difficulty Change</div>
                            <div style="font-weight: 600; color: ${data.timeComparison.comparison.difficultyChange >= 0 ? '#10b981' : '#ef4444'};">
                                ${data.timeComparison.comparison.difficultyChange >= 0 ? '+' : ''}${data.timeComparison.comparison.difficultyChange.toFixed(1)}
                                <span style="font-size: 0.8rem; margin-left: 5px;">points</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Muscle Group Comparison -->
                ${Object.keys(data.timeComparison.currentPeriod.data.muscleGroups).length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h4 style="color: #1f2937; margin: 0 0 20px 0; font-size: 1.1rem;">💪 Muscle Group Progress</h4>
                        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                            ${Object.keys(data.timeComparison.currentPeriod.data.muscleGroups).map(muscle => {
                                const current = data.timeComparison.currentPeriod.data.muscleGroups[muscle] || { volume: 0, sets: 0 };
                                const previous = data.timeComparison.previousPeriod.data.muscleGroups[muscle] || { volume: 0, sets: 0 };
                                const volumeChange = current.volume - previous.volume;
                                const volumeChangePercent = previous.volume > 0 ? ((current.volume - previous.volume) / previous.volume * 100) : 0;
                                const setsChange = current.sets - previous.sets;
                                
                                return `
                                <div class="card" style="border-left: 4px solid #8b5cf6;">
                                    <h5 style="color: #1f2937; margin: 0 0 15px 0; font-size: 1rem; text-transform: capitalize;">${muscle}</h5>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
                                        <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                                            <div style="color: #6b7280; font-size: 0.75rem;">Current Volume</div>
                                            <div style="font-weight: 600; color: #ef4444;">${Math.round(current.volume)} kg</div>
                                        </div>
                                        <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 4px;">
                                            <div style="color: #6b7280; font-size: 0.75rem;">Previous Volume</div>
                                            <div style="font-weight: 600; color: #6b7280;">${Math.round(previous.volume)} kg</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 10px; padding: 8px; background: ${volumeChange >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius: 4px; text-align: center;">
                                        <div style="font-size: 0.8rem; color: ${volumeChange >= 0 ? '#15803d' : '#dc2626'}; font-weight: 600;">
                                            ${volumeChange >= 0 ? '+' : ''}${Math.round(volumeChange)} kg (${volumeChangePercent >= 0 ? '+' : ''}${volumeChangePercent.toFixed(1)}%)
                                        </div>
                                        <div style="font-size: 0.7rem; color: #6b7280; margin-top: 2px;">
                                            Sets: ${setsChange >= 0 ? '+' : ''}${setsChange}
                                        </div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            ` : ''}

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
        const splitComparisonData = ${JSON.stringify(data.splitComparison)};
        const splitProgressData = ${JSON.stringify(data.splitProgress)};

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
                className="ai-analysis-button"
                style={{ 
                  display: workoutSplit.type === 'none' ? 'none' : 'flex'
                }}
              >
                {isAnalyzingSplit ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    <span>AI Analysis</span>
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
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-white font-semibold text-lg">Export Data</h3>
                <p className="text-gray-400 text-sm mt-1">Generate professional reports and backups</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Date Range Selector for PDF Reports */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-white font-medium">PDF Report Time Range</h4>
                  </div>
                  <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                    <AppleDropdown
                      value={pdfTimeRange}
                      onChange={handlePdfTimeRangeChange}
                      options={[
                        { value: '0', label: 'Today' },
                        { value: '3', label: 'Last 3 days' },
                        { value: '7', label: 'Last 7 days' },
                        { value: '30', label: 'Last 30 days' },
                        { value: '365', label: 'Last year' },
                        { value: 'custom', label: 'Select specific date' }
                      ]}
                      placeholder="Select time range"
                      className="w-full"
                    />
                    {pdfTimeRange === 'custom' && pdfCustomDate && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300">Selected: </span>
                        <span className="text-white font-medium">{format(new Date(pdfCustomDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between bg-gray-600/50 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm">Workouts to include:</span>
                      </div>
                      <span className="text-blue-400 font-semibold text-sm">
                        {getFilteredWorkoutsForPdf().length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Period Comparison Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <h4 className="text-white font-medium">Time Period Comparison</h4>
                    </div>
                    <button
                      onClick={() => setEnableTimeComparison(!enableTimeComparison)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        enableTimeComparison ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enableTimeComparison ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {enableTimeComparison && (
                    <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
                      <p className="text-gray-400 text-sm">
                        Compare your performance between different time periods (e.g., "Last 30 days vs 30 days before that")
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-300 text-sm font-medium mb-2 block">Current Period</label>
                          <AppleDropdown
                            value={comparisonPeriod1}
                            onChange={setComparisonPeriod1}
                            options={[
                              { value: '7', label: 'Last 7 days' },
                              { value: '30', label: 'Last 30 days' },
                              { value: '60', label: 'Last 60 days' },
                              { value: '90', label: 'Last 90 days' },
                              { value: '180', label: 'Last 6 months' },
                              { value: '365', label: 'Last year' }
                            ]}
                            placeholder="Select period"
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="text-gray-300 text-sm font-medium mb-2 block">Compare Against</label>
                          <AppleDropdown
                            value={comparisonPeriod2}
                            onChange={setComparisonPeriod2}
                            options={[
                              { value: '7', label: '7 days before that' },
                              { value: '30', label: '30 days before that' },
                              { value: '60', label: '60 days before that' },
                              { value: '90', label: '90 days before that' },
                              { value: '180', label: '6 months before that' },
                              { value: '365', label: '1 year before that' }
                            ]}
                            placeholder="Select comparison period"
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                          <span className="text-orange-400 font-medium text-sm">Comparison Preview:</span>
                        </div>
                        <div className="text-gray-300 text-xs">
                          <div>📊 Current: Last {comparisonPeriod1} days ({getWorkoutsFromTimePeriod(comparisonPeriod1, null, 1).length} workouts)</div>
                          <div>📈 Previous: {comparisonPeriod2} days before that ({getWorkoutsFromTimePeriod(comparisonPeriod2, null, 2).length} workouts)</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Split Selection for PDF Comparison */}
                {availableSplits.length > 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <h4 className="text-white font-medium">Select Splits to Compare</h4>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
                      <p className="text-gray-400 text-sm">
                        Choose specific workout days/splits to compare. Leave empty to include all splits.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {availableSplits.map(splitName => (
                          <button
                            key={splitName}
                            onClick={() => handleSplitSelection(splitName)}
                            className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 transform active:scale-95 ${
                              selectedSplitsForPdf.includes(splitName)
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50'
                                : 'bg-gray-600/50 text-gray-300 border border-gray-500/50 hover:bg-gray-500/50 hover:border-gray-400/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{splitName}</span>
                              {selectedSplitsForPdf.includes(splitName) && (
                                <div className="w-2 h-2 bg-white rounded-full ml-2 flex-shrink-0"></div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedSplitsForPdf.length > 0 && (
                        <div className="flex items-center justify-between bg-purple-900/20 border border-purple-500/30 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                            <span className="text-gray-300 text-sm">Selected for comparison:</span>
                          </div>
                          <span className="text-purple-400 font-semibold text-sm">
                            {selectedSplitsForPdf.length} split{selectedSplitsForPdf.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              
                {/* Export Actions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h4 className="text-white font-medium">Export Options</h4>
                  </div>
                  
                  {/* JSON Backup */}
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <h5 className="text-white font-medium text-sm">JSON Backup</h5>
                        </div>
                        <p className="text-gray-400 text-xs">Raw data for app restore</p>
                      </div>
                      <button
                        onClick={exportData}
                        className="ml-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium text-sm transition-all duration-300 transform active:scale-95 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Professional Report + AI */}
                  <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <h5 className="text-white font-medium text-sm">Professional Report + AI</h5>
                        </div>
                        <p className="text-gray-400 text-xs">
                          PDF with charts, analysis & AI insights for selected time range
                          {selectedSplitsForPdf.length > 0 && (
                            <span className="text-green-400 font-medium"> ({selectedSplitsForPdf.length} splits)</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={exportProfessionalReportWithAI}
                        className="export-report-ai-btn ml-4 px-4 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium text-sm transition-all duration-300 transform active:scale-95 shadow-lg shadow-green-500/25 flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>PDF + AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Professional Report */}
                  <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <h5 className="text-white font-medium text-sm">Professional Report</h5>
                        </div>
                        <p className="text-gray-400 text-xs">
                          PDF with charts & basic analysis for selected time range
                          {selectedSplitsForPdf.length > 0 && (
                            <span className="text-green-400 font-medium"> ({selectedSplitsForPdf.length} splits)</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={exportProfessionalReportBasic}
                        className="export-report-basic-btn ml-4 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-medium text-sm transition-all duration-300 transform active:scale-95 shadow-lg shadow-green-500/25 flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>PDF Only</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-white font-semibold text-lg">Import Data</h3>
                <p className="text-gray-400 text-sm mt-1">Restore from a previous backup</p>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                        <h5 className="text-white font-medium text-sm">JSON Restore</h5>
                      </div>
                      <p className="text-gray-400 text-xs">Upload a backup file to restore your data</p>
                    </div>
                    <label className="ml-4 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-medium text-sm transition-all duration-300 transform active:scale-95 shadow-lg shadow-orange-500/25 flex items-center space-x-2 cursor-pointer">
                      <Upload size={16} />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
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

      {/* Apple Calendar Modal for PDF Date Selection */}
      {showPdfDatePicker && (
        <AppleCalendar
          selectedDate={pdfCustomDate || format(new Date(), 'yyyy-MM-dd')}
          onDateSelect={handlePdfDateSelect}
          onClose={() => setShowPdfDatePicker(false)}
          workouts={workouts}
        />
      )}
    </div>
  )
}

export default Profile
