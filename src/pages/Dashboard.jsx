import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import ActivityRings from '../components/ActivityRings'
import DateRangeSelector from '../components/DateRangeSelector'
import AISmartTip from '../components/AISmartTip'
import { getQuickTip, shouldRestToday, getMuscleBalanceTip, getRestDayTip } from '../services/contextualAI'
import {
  Plus,
  Calendar,
  ChevronRight,
  Award,
  TrendingUp,
  Activity,
  X,
  Clock,
  Target,
  BarChart3,
  Trophy,
  Timer
} from 'lucide-react'
import { format, isToday, isThisWeek, subDays, isAfter, isSameDay, startOfDay, endOfDay } from 'date-fns'

const Dashboard = () => {
  const { workouts, stats, currentWorkout } = useWorkout()
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [showMuscleDetails, setShowMuscleDetails] = useState(false)
  const [timeRange, setTimeRange] = useState('0') // Default to Today
  const [customDate, setCustomDate] = useState(null)
  const [showDateSelector, setShowDateSelector] = useState(false)
  const [aiTip, setAiTip] = useState(null)
  const [restSuggestion, setRestSuggestion] = useState(null)
  const [muscleTip, setMuscleTip] = useState(null)
  const [restDayTip, setRestDayTip] = useState(null)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [dashboardInsights, setDashboardInsights] = useState([])

  const filteredWorkouts = useMemo(() => {
    if (timeRange === '0') {
      // Today only
      return workouts.filter(workout =>
        isToday(new Date(workout.date))
      )
    } else if (timeRange === 'custom' && customDate) {
      // Specific date
      return workouts.filter(workout =>
        isSameDay(new Date(workout.date), new Date(customDate))
      )
    } else {
      // Range of days
      const cutoffDate = subDays(new Date(), parseInt(timeRange))
      return workouts.filter(workout =>
        isAfter(new Date(workout.date), cutoffDate)
      )
    }
  }, [workouts, timeRange, customDate])

  const todaysWorkouts = useMemo(() => workouts.filter(workout =>
    isToday(new Date(workout.date))
  ), [workouts])

  const thisWeeksWorkouts = useMemo(() => workouts.filter(workout =>
    isThisWeek(new Date(workout.date))
  ), [workouts])

  // Make a non-mutating copy before sorting to avoid changing the original workouts array
  const recentWorkouts = [...workouts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  // Calculate bodybuilding metrics for rings based on selected time range
  const selectedVolume = filteredWorkouts.reduce((total, workout) => {
    return total + workout.exercises.reduce((exerciseTotal, exercise) => {
      return exerciseTotal + exercise.sets.reduce((setTotal, set) => {
        return setTotal + ((set.weight || 0) * (set.reps || 0))
      }, 0)
    }, 0)
  }, 0)

  const selectedFrequency = filteredWorkouts.reduce((total, workout) => total + workout.exercises.length, 0)

  const avgIntensity = filteredWorkouts.length > 0 ? filteredWorkouts.reduce((total, workout) => {
    if (workout.exercises.length === 0) return total

    // Only include strength exercises for difficulty calculation
    const strengthExercises = workout.exercises.filter(ex => ex.type === 'strength')
    if (strengthExercises.length === 0) return total

    const workoutRPE = strengthExercises.reduce((sum, ex) => {
      if (ex.sets.length === 0) return sum
      const avgRPE = ex.sets.reduce((rpeSum, set) => rpeSum + (set.difficulty || 0), 0) / ex.sets.length
      return sum + avgRPE
    }, 0) / strengthExercises.length
    return total + workoutRPE
  }, 0) / filteredWorkouts.length : 0

  // Ring progress based on bodybuilding metrics (KG) - adjusted for time range
  const getTarget = (days, baseTarget) => {
    if (days === 0) return baseTarget / 7 // Today target is 1/7 of weekly
    return (baseTarget / 7) * Math.min(days, 7)
  }

  const days = timeRange === '0' ? 0 : timeRange === 'custom' ? 1 : parseInt(timeRange)
  const volumeTarget = getTarget(days, 4500)
  const frequencyTarget = getTarget(days, 20)

  const volumeProgress = Math.min((selectedVolume / volumeTarget) * 100, 100)
  const frequencyProgress = Math.min((selectedFrequency / frequencyTarget) * 100, 100)
  const intensityProgress = Math.min((avgIntensity / 10) * 100, 100)

  // Load AI tips seamlessly
  // Load AI tips seamlessly
  // Note: include workouts and thisWeeksWorkouts in deps and avoid depending on derived lengths only.
  // Also guard with tipsLoading to prevent re-entrance.
  useEffect(() => {
    if (workouts.length === 0 || tipsLoading) return

    setTipsLoading(true)

    // Load quick tip
    const loadTips = async () => {
      try {
        // Get recent muscle distribution
        const muscleGroups = {}
        thisWeeksWorkouts.forEach(workout => {
          workout.exercises.forEach(exercise => {
            if (exercise.muscleGroup) {
              muscleGroups[exercise.muscleGroup] = (muscleGroups[exercise.muscleGroup] || 0) + exercise.sets.length
            }
          })
        })

        // Check if today is a rest day
        const checkIfRestDay = () => {
          try {
            const savedSplit = localStorage.getItem('gymgenie-workout-split')
            if (!savedSplit) return false
            
            const workoutSplit = JSON.parse(savedSplit)
            if (!workoutSplit || workoutSplit.type === 'none') return false
            
            const today = new Date().getDay()
            const dayOfWeek = today === 0 ? 7 : today
            
            const schedule = workoutSplit.customSplit?.schedule
            if (!schedule) return false
            
            const todaysPlannedWorkout = schedule[dayOfWeek]
            return todaysPlannedWorkout && (todaysPlannedWorkout.name === 'Rest' || todaysPlannedWorkout.muscles.length === 0)
          } catch (error) {
            return false
          }
        }

        const isRestDay = checkIfRestDay()

        // Prepare rest day tip data if needed
        let restDayTipPromise = null
        if (isRestDay) {
          const recentDays = workouts.filter(w => {
            const daysDiff = Math.floor((new Date() - new Date(w.date)) / (1000 * 60 * 60 * 24))
            return daysDiff <= 7
          }).length

          const lastMuscles = Object.keys(muscleGroups)

          restDayTipPromise = getRestDayTip({
            recentDays,
            lastMuscles,
            avgIntensity
          })
        }

        // Load tips in parallel for better performance
        const [tip, rest, muscle, restTip] = await Promise.all([
          getQuickTip({ recentWorkouts, stats: { thisWeek: thisWeeksWorkouts.length } }),
          shouldRestToday(workouts.slice(0, 7), Object.keys(muscleGroups)),
          Object.keys(muscleGroups).length > 0 ? getMuscleBalanceTip(muscleGroups) : null,
          restDayTipPromise
        ])

        setAiTip(tip)
        setRestSuggestion(rest)
        setMuscleTip(muscle)
        setRestDayTip(restTip)
      } catch (error) {
        console.error('AI tips error:', error)
      } finally {
        setTipsLoading(false)
      }
    }

    loadTips()

    // We only want to re-run when workouts or thisWeeksWorkouts change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, thisWeeksWorkouts])

  // Invisible AI: Dashboard insights (no API key required)
  useEffect(() => {
    if (workouts.length === 0) {
      setDashboardInsights([])
      return
    }

    const insights = []

    // Check if today is a rest day according to user's workout split
    const checkIfRestDay = () => {
      try {
        const savedSplit = localStorage.getItem('gymgenie-workout-split')
        if (!savedSplit) return false
        
        const workoutSplit = JSON.parse(savedSplit)
        if (!workoutSplit || workoutSplit.type === 'none') return false
        
        const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
        const dayOfWeek = today === 0 ? 7 : today // Convert Sunday to 7
        
        const schedule = workoutSplit.customSplit?.schedule
        if (!schedule) return false
        
        const todaysPlannedWorkout = schedule[dayOfWeek]
        return todaysPlannedWorkout && (todaysPlannedWorkout.name === 'Rest' || todaysPlannedWorkout.muscles.length === 0)
      } catch (error) {
        console.error('Error checking rest day:', error)
        return false
      }
    }

    const isRestDay = checkIfRestDay()

    // 1) Activity Ring Analysis
    if (volumeProgress < 50 && todaysWorkouts.length === 0) {
      if (isRestDay) {
        // Use AI-generated rest day tip if available, otherwise show fallback
        const restMessage = restDayTip || '🛌 Rest day! Recovery is when your muscles grow. Focus on sleep, nutrition, and hydration.'
        
        insights.push({
          id: 'rest-day',
          type: 'rest',
          text: restMessage
        })
      } else {
        insights.push({
          id: 'low-volume-today',
          type: 'motivation',
          text: `Volume at ${Math.round(volumeProgress)}% today. Start a workout to complete your daily goal!`
        })
      }
    } else if (volumeProgress >= 80 && volumeProgress < 100 && !isRestDay) {
      insights.push({
        id: 'near-goal',
        type: 'motivation',
        text: `Almost there! Volume at ${Math.round(volumeProgress)}%—add a few more sets to hit your target.`
      })
    }

    // 2) Muscle Balance Analysis (this week)
    if (thisWeeksWorkouts.length >= 3) {
      const muscleGroups = {}
      thisWeeksWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups[exercise.muscleGroup] = (muscleGroups[exercise.muscleGroup] || 0) + exercise.sets.length
          }
        })
      })

      const pushMuscles = ['chest', 'shoulders', 'triceps']
      const pullMuscles = ['back', 'biceps', 'forearms']
      const legMuscles = ['legs']

      const pushSets = pushMuscles.reduce((sum, m) => sum + (muscleGroups[m] || 0), 0)
      const pullSets = pullMuscles.reduce((sum, m) => sum + (muscleGroups[m] || 0), 0)
      const legSets = legMuscles.reduce((sum, m) => sum + (muscleGroups[m] || 0), 0)
      const total = pushSets + pullSets + legSets

      if (total > 0) {
        const pushPercent = (pushSets / total) * 100
        const pullPercent = (pullSets / total) * 100
        const legPercent = (legSets / total) * 100

        // Imbalance detection
        if (pushPercent > 45 && !insights.find(i => i.id === 'push-heavy')) {
          insights.push({
            id: 'push-heavy',
            type: 'form',
            text: `Push-heavy week (${Math.round(pushPercent)}%). Add more back/biceps exercises for balance.`
          })
        } else if (pullPercent > 45 && !insights.find(i => i.id === 'pull-heavy')) {
          insights.push({
            id: 'pull-heavy',
            type: 'form',
            text: `Pull-heavy week (${Math.round(pullPercent)}%). Add more chest/shoulders exercises.`
          })
        } else if (legPercent < 15 && total > 20 && !insights.find(i => i.id === 'legs-low')) {
          insights.push({
            id: 'legs-low',
            type: 'form',
            text: `Legs only ${Math.round(legPercent)}% this week. Don't skip leg day!`
          })
        }

        // Muscle group variety check
        const uniqueMuscles = Object.keys(muscleGroups).length
        if (thisWeeksWorkouts.length >= 5 && uniqueMuscles < 4 && !insights.find(i => i.id === 'variety')) {
          insights.push({
            id: 'variety',
            type: 'form',
            text: `Only ${uniqueMuscles} muscle groups this week. Add more variety for balanced development.`
          })
        }
      }
    }

    // 3) Consistency Analysis
    const last7Days = []
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i)
      const dayWorkouts = workouts.filter(w => isSameDay(new Date(w.date), date))
      last7Days.push(dayWorkouts.length > 0 ? 1 : 0)
    }
    const activeDays = last7Days.reduce((sum, val) => sum + val, 0)

    if (activeDays >= 5 && activeDays < 6 && !insights.find(i => i.id === 'consistency-good')) {
      insights.push({
        id: 'consistency-good',
        type: 'motivation',
        text: `Great consistency! ${activeDays}/7 days active. You're building a strong habit! 💪`
      })
    } else if (activeDays < 3 && thisWeeksWorkouts.length > 0 && !insights.find(i => i.id === 'consistency-low')) {
      insights.push({
        id: 'consistency-low',
        type: 'motivation',
        text: `${activeDays}/7 days active. Aim for 4-5 workouts per week for best results.`
      })
    }

    // 4) Intensity Analysis
    if (avgIntensity > 8.5 && thisWeeksWorkouts.length >= 3 && !insights.find(i => i.id === 'high-intensity')) {
      insights.push({
        id: 'high-intensity',
        type: 'rest',
        text: `Avg RPE ${avgIntensity.toFixed(1)}/10 this week. High intensity—ensure adequate recovery.`
      })
    } else if (avgIntensity < 6 && thisWeeksWorkouts.length >= 3 && !insights.find(i => i.id === 'low-intensity')) {
      insights.push({
        id: 'low-intensity',
        type: 'form',
        text: `Avg RPE ${avgIntensity.toFixed(1)}/10. Consider increasing intensity for better gains.`
      })
    }

    // 5) Volume Trend (comparing last week to this week)
    if (workouts.length >= 10) {
      const now = new Date()
      const lastWeekStart = subDays(now, 14)
      const lastWeekEnd = subDays(now, 7)
      const thisWeekStart = subDays(now, 7)

      const lastWeekWorkouts = workouts.filter(w => {
        const d = new Date(w.date)
        return d >= lastWeekStart && d < lastWeekEnd
      })
      const thisWeekWorkouts = workouts.filter(w => {
        const d = new Date(w.date)
        return d >= thisWeekStart
      })

      const lastWeekVolume = lastWeekWorkouts.reduce((sum, w) =>
        sum + w.exercises.reduce((s, e) =>
          s + e.sets.reduce((ss, set) => ss + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0)
      const thisWeekVolume = thisWeekWorkouts.reduce((sum, w) =>
        sum + w.exercises.reduce((s, e) =>
          s + e.sets.reduce((ss, set) => ss + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0)

      if (lastWeekVolume > 0) {
        const volumeChange = ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100
        if (volumeChange > 25 && !insights.find(i => i.id === 'volume-spike')) {
          insights.push({
            id: 'volume-spike',
            type: 'rest',
            text: `Volume up ${Math.round(volumeChange)}% vs last week. Monitor recovery to avoid overtraining.`
          })
        } else if (volumeChange < -30 && !insights.find(i => i.id === 'volume-drop')) {
          insights.push({
            id: 'volume-drop',
            type: 'motivation',
            text: `Volume down ${Math.round(Math.abs(volumeChange))}% vs last week. Time to ramp back up!`
          })
        }
      }
    }

    // Keep only most relevant (max 2 at a time)
    setDashboardInsights(insights.slice(0, 2))
  }, [workouts, thisWeeksWorkouts, todaysWorkouts, volumeProgress, frequencyProgress, intensityProgress, avgIntensity, timeRange, restDayTip])

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Header - Apple Fitness Style */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h1 className="fitness-title">Summary</h1>
            <button
              onClick={() => setShowDateSelector(!showDateSelector)}
              className="fitness-subtitle hover:text-gray-300 transition-colors cursor-pointer flex items-center space-x-2"
            >
              <span>
                {timeRange === '0'
                  ? format(new Date(), 'EEEE, MMMM d')
                  : timeRange === 'custom' && customDate
                    ? format(new Date(customDate), 'EEEE, MMMM d')
                    : timeRange === '3'
                      ? `Last 3 days`
                      : timeRange === '7'
                        ? `Last 7 days`
                        : timeRange === '30'
                          ? `Last 30 days`
                          : timeRange === '365'
                            ? `Last year`
                            : format(new Date(), 'EEEE, MMMM d')
                }
              </span>
              <Calendar size={16} className="text-gray-400" />
            </button>
            {showDateSelector && (
              <div className="mt-3">
                <DateRangeSelector
                  selectedRange={timeRange}
                  onRangeChange={(range, date) => {
                    console.log('Range changed:', range, 'Date:', date)
                    setTimeRange(range)
                    if (date) {
                      setCustomDate(date)
                    } else if (range !== 'custom') {
                      setCustomDate(null) // Clear custom date when not using custom range
                    }
                    setShowDateSelector(false)
                  }}
                  showCustomDate={true}
                  workouts={workouts}
                />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/achievements"
              className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              title="Achievements"
            >
              <Trophy size={16} className="text-white" />
            </Link>
            <Link to="/profile" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
            </Link>
          </div>
        </div>

        {/* Activity Rings - Bodybuilding Metrics */}
        <div className="flex justify-center mb-8">
          <ActivityRings
            moveProgress={volumeProgress}
            exerciseProgress={frequencyProgress}
            standProgress={intensityProgress}
            size={200}
          />
        </div>

        {/* Bodybuilding Ring Labels */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#FA114F' }}></div>
            <div className="fitness-metric-small apple-red">{Math.round(selectedVolume).toLocaleString()}</div>
            <div className="fitness-label">Volume (kg)</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#92E82A' }}></div>
            <div className="fitness-metric-small apple-green">{selectedFrequency}</div>
            <div className="fitness-label">Frequency</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: '#40CBE0' }}></div>
            <div className="fitness-metric-small apple-blue">{avgIntensity.toFixed(1)}</div>
            <div className="fitness-label">Avg Intensity</div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Current Workout Alert - Apple Style */}
        {currentWorkout && (
          <div className="fitness-card bg-orange-900/30 border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-white font-semibold">
                    Workout in Progress
                  </h3>
                  <p className="text-orange-300 text-sm">
                    {currentWorkout.exercises.length} exercises logged
                  </p>
                </div>
              </div>
              <Link
                to="/log"
                className="fitness-button bg-orange-600 hover:bg-orange-500 text-sm px-4 py-2"
              >
                Continue
              </Link>
            </div>
          </div>
        )}

        {/* Apple Fitness Style Action Cards */}
        <div className="space-y-3">
          <Link to="/log" className="fitness-card hover:bg-gray-800 transition-all active:scale-95 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Start Workout</h3>
                  <p className="text-gray-400 text-sm">Begin tracking your session</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </div>
          </Link>

          <Link to="/analytics" className="fitness-card hover:bg-gray-800 transition-all active:scale-95 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">View Analytics</h3>
                  <p className="text-gray-400 text-sm">Track your progress</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </div>
          </Link>

        </div>

        {/* Invisible AI Dashboard Insights */}
        {dashboardInsights.map((insight) => (
          <AISmartTip
            key={insight.id}
            tip={insight.text}
            type={insight.type}
            onDismiss={() => setDashboardInsights(prev => prev.filter(i => i.id !== insight.id))}
          />
        ))}

        {/* AI Smart Tips - Seamlessly Integrated */}
        {restSuggestion?.shouldRest && (
          <AISmartTip
            tip={restSuggestion.reason}
            type="rest"
            onDismiss={() => setRestSuggestion(null)}
          />
        )}

        {aiTip && !restSuggestion?.shouldRest && dashboardInsights.length === 0 && (
          <AISmartTip
            tip={aiTip}
            type="default"
            onDismiss={() => setAiTip(null)}
          />
        )}

        {muscleTip && thisWeeksWorkouts.length >= 3 && !restSuggestion?.shouldRest && aiTip && dashboardInsights.length === 0 && (
          <AISmartTip
            tip={muscleTip}
            type="form"
            onDismiss={() => setMuscleTip(null)}
          />
        )}

        {/* Today's Activity - Apple Style */}
        <div className="fitness-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Today</h2>
            <Calendar size={20} className="text-gray-400" />
          </div>

          {todaysWorkouts.length > 0 ? (
            <div className="space-y-3">
              {todaysWorkouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all active:scale-95"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Activity size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {workout.exercises.length > 1
                          ? `${workout.exercises[0].name} +${workout.exercises.length - 1} more`
                          : workout.exercises[0]?.name || 'No exercises'
                        }
                      </p>
                      <p className="text-gray-400 text-sm">
                        {format(new Date(workout.date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                    </p>
                    <p className="text-gray-400 text-xs">sets</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-400 mb-4">No workouts today</p>
              <Link
                to="/log"
                className="fitness-button inline-flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Start Workout
              </Link>
            </div>
          )}
        </div>

        {/* Muscle Group Balance - Bodybuilding Focus */}
        <div className="fitness-card">
          <button
            onClick={() => setShowMuscleDetails(true)}
            className="w-full flex items-center justify-between mb-4 hover:bg-gray-800 p-2 rounded-lg transition-all"
          >
            <h2 className="text-white font-semibold">Muscle Balance</h2>
            <div className="flex items-center space-x-2">
              <Award size={20} className="text-gray-400" />
              <ChevronRight size={16} className="text-gray-500" />
            </div>
          </button>

          {(() => {
            const muscleGroups = {}
            thisWeeksWorkouts.forEach(workout => {
              workout.exercises.forEach(exercise => {
                if (exercise.muscleGroup) {
                  muscleGroups[exercise.muscleGroup] = (muscleGroups[exercise.muscleGroup] || 0) + exercise.sets.length
                }
              })
            })

            const sortedGroups = Object.entries(muscleGroups)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)

            return sortedGroups.length > 0 ? (
              <div className="space-y-3">
                {sortedGroups.map(([group, sets]) => (
                  <div key={group} className="flex items-center justify-between">
                    <span className="text-white capitalize font-medium">{group}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Object.values(muscleGroups).length > 0 ? Math.min((sets / Math.max(...Object.values(muscleGroups))) * 100, 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-400 text-sm w-8">{sets}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">No muscle groups tracked this week</p>
              </div>
            )
          })()}
        </div>

        {/* Cardio Analytics - Bodybuilding Focus */}
        {(() => {
          const cardioData = {
            beforeWorkout: { slow: 0, fast: 0, totalDuration: 0 },
            afterWorkout: { slow: 0, fast: 0, totalDuration: 0 }
          }

          filteredWorkouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
              if (exercise.type === 'cardio') {
                exercise.sets.forEach(set => {
                  const timing = set.timing || 'after'
                  const intensity = set.intensity || 'slow'
                  const duration = set.duration || 0

                  cardioData[`${timing}Workout`][intensity] += 1
                  cardioData[`${timing}Workout`].totalDuration += duration
                })
              }
            })
          })

          const totalCardio = cardioData.beforeWorkout.slow + cardioData.beforeWorkout.fast +
            cardioData.afterWorkout.slow + cardioData.afterWorkout.fast

          return totalCardio > 0 ? (
            <div className="fitness-card">
              <h2 className="text-white font-semibold mb-4 flex items-center">
                <Timer size={20} className="mr-2 text-orange-400" />
                Cardio Strategy
              </h2>

              <div className="space-y-4 mb-4">
                {/* Only show sections that have actual cardio data */}
                {(cardioData.beforeWorkout.slow + cardioData.beforeWorkout.fast) > 0 && (
                  <div className="bg-gray-800 rounded-xl p-4 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-400 font-semibold">🔥 Before Workout</span>
                        <span className="text-xs text-gray-500">({cardioData.beforeWorkout.slow + cardioData.beforeWorkout.fast} sessions)</span>
                      </div>
                      <span className="text-blue-400 font-bold">{cardioData.beforeWorkout.totalDuration} min</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {cardioData.beforeWorkout.slow > 0 && (
                        <div className="bg-green-900/30 rounded-lg p-3 text-center">
                          <div className="text-green-400 font-bold text-lg">{cardioData.beforeWorkout.slow}</div>
                          <div className="text-green-300 text-xs">🐌 Slow Cardio</div>
                        </div>
                      )}
                      {cardioData.beforeWorkout.fast > 0 && (
                        <div className="bg-red-900/30 rounded-lg p-3 text-center">
                          <div className="text-red-400 font-bold text-lg">{cardioData.beforeWorkout.fast}</div>
                          <div className="text-red-300 text-xs">⚡ Fast Cardio</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(cardioData.afterWorkout.slow + cardioData.afterWorkout.fast) > 0 && (
                  <div className="bg-gray-800 rounded-xl p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 font-semibold">💪 After Workout</span>
                        <span className="text-xs text-gray-500">({cardioData.afterWorkout.slow + cardioData.afterWorkout.fast} sessions)</span>
                      </div>
                      <span className="text-blue-400 font-bold">{cardioData.afterWorkout.totalDuration} min</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {cardioData.afterWorkout.slow > 0 && (
                        <div className="bg-green-900/30 rounded-lg p-3 text-center">
                          <div className="text-green-400 font-bold text-lg">{cardioData.afterWorkout.slow}</div>
                          <div className="text-green-300 text-xs">🐌 Slow Cardio</div>
                        </div>
                      )}
                      {cardioData.afterWorkout.fast > 0 && (
                        <div className="bg-red-900/30 rounded-lg p-3 text-center">
                          <div className="text-red-400 font-bold text-lg">{cardioData.afterWorkout.fast}</div>
                          <div className="text-red-300 text-xs">⚡ Fast Cardio</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cardio Insights */}
              <div className="bg-gradient-to-r from-orange-900/20 to-green-900/20 border border-orange-500/30 rounded-xl p-4">
                <h4 className="text-orange-400 font-medium mb-2 flex items-center">
                  <Target size={16} className="mr-2" />
                  Bodybuilding Insights
                </h4>
                <div className="text-sm text-gray-300 space-y-1">
                  {cardioData.afterWorkout.slow > cardioData.beforeWorkout.fast ? (
                    <p>✅ Good strategy: More slow cardio after workouts helps preserve muscle</p>
                  ) : (
                    <p>💡 Consider more slow cardio after workouts to preserve muscle mass</p>
                  )}
                  {cardioData.beforeWorkout.fast > 2 && (
                    <p>⚠️ High-intensity cardio before workouts may impact strength performance</p>
                  )}
                  {(cardioData.beforeWorkout.totalDuration + cardioData.afterWorkout.totalDuration) > 180 && (
                    <p>⚠️ Excessive cardio ({cardioData.beforeWorkout.totalDuration + cardioData.afterWorkout.totalDuration} min) may interfere with muscle growth</p>
                  )}
                </div>
              </div>
            </div>
          ) : null
        })()}

        {/* Recent Activity - Apple Style */}
        {recentWorkouts.length > 0 && (
          <div className="fitness-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">History</h2>
              <Link
                to="/history"
                className="text-blue-400 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentWorkouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all active:scale-95"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Activity size={16} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {workout.exercises.length > 1
                          ? `${workout.exercises[0].name} +${workout.exercises.length - 1} more`
                          : workout.exercises[0]?.name || 'No exercises'
                        }
                      </p>
                      <p className="text-gray-400 text-sm">
                        {format(new Date(workout.date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                    </p>
                    <p className="text-gray-400 text-xs">sets</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Workout Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
          <div className="fitness-card w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fitness-title text-xl">Workout Details</h2>
              <button
                onClick={() => setSelectedWorkout(null)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Clock size={16} className="text-blue-400" />
                  <span className="text-white">Date & Time</span>
                </div>
                <span className="text-gray-400">
                  {format(new Date(selectedWorkout.date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Target size={16} className="text-green-400" />
                  <span className="text-white">Total Sets</span>
                </div>
                <span className="text-gray-400">
                  {selectedWorkout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Exercises</h3>
                {selectedWorkout.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="p-3 bg-gray-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{exercise.name}</span>
                      <span className="text-gray-400 text-sm capitalize">{exercise.muscleGroup}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {exercise.sets.length} sets
                      {exercise.type === 'strength' && (
                        <span className="ml-2">
                          • {exercise.sets.reduce((total, set) => total + (set.weight || 0) * (set.reps || 0), 0)} kg total
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Muscle Balance Details Modal */}
      {showMuscleDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
          <div className="fitness-card w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fitness-title text-xl">Muscle Balance</h2>
              <button
                onClick={() => setShowMuscleDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-400">This week's muscle group distribution</p>
              </div>

              {(() => {
                const muscleGroups = {}
                thisWeeksWorkouts.forEach(workout => {
                  workout.exercises.forEach(exercise => {
                    if (exercise.muscleGroup) {
                      muscleGroups[exercise.muscleGroup] = (muscleGroups[exercise.muscleGroup] || 0) + exercise.sets.length
                    }
                  })
                })

                const sortedGroups = Object.entries(muscleGroups).sort(([, a], [, b]) => b - a)
                const maxSets = Math.max(...Object.values(muscleGroups))

                return sortedGroups.length > 0 ? (
                  <div className="space-y-4">
                    {sortedGroups.map(([group, sets]) => (
                      <div key={group} className="p-3 bg-gray-800 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white capitalize font-medium">{group}</span>
                          <span className="text-blue-400 font-semibold">{sets} sets</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${(sets / maxSets) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {((sets / maxSets) * 100).toFixed(0)}% of highest trained muscle
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 size={48} className="text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No muscle groups tracked this week</p>
                    <p className="text-gray-500 text-sm mt-2">Start logging workouts to see your muscle balance</p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
