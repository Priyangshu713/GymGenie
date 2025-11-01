import React, { useState, useMemo, useEffect } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import AppleCalendar from '../components/AppleCalendar'
import AISmartTip from '../components/AISmartTip'
import { exerciseDatabase } from '../data/exercises.js'
import {
  analyzeMuscleBalance,
  analyzeRecovery,
  analyzeProgressiveOverload,
  analyzeVolumeTrend
} from '../services/analyticsAI'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  PieChart,
  Award,
  ExternalLink,
  Star
} from 'lucide-react'
import { calculateAchievements, calculateTotalPoints, ACHIEVEMENTS, getUserRank, getRankProgress } from '../utils/achievements'
import WorkoutChart from '../components/WorkoutChart'
import MuscleGroupChart from '../components/MuscleGroupChart'
import ProgressChart from '../components/ProgressChart'
import SplitComparison from '../components/SplitComparison'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  isWithinInterval,
  isAfter,
  isToday,
  isSameDay,
  format,
  startOfYear,
  endOfYear
} from 'date-fns'

const Analytics = () => {
  const { workouts, stats, achievements } = useWorkout()
  const [timeRange, setTimeRange] = useState('30') // days
  const [selectedMetric, setSelectedMetric] = useState('workouts')
  const [customDate, setCustomDate] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [aiInsights, setAiInsights] = useState({
    muscleBalance: null,
    recovery: null,
    volumeTrend: null,
    progressOverload: null
  })
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null)

  const handleTimeRangeChange = (value) => {
    if (value === 'custom') {
      setShowDatePicker(true)
    } else {
      setTimeRange(value)
      setCustomDate(null)
    }
  }

  const handleDateSelect = (date) => {
    setCustomDate(date)
    setTimeRange('custom')
    setShowDatePicker(false)
  }

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
    } else if (typeof timeRange === 'string' && timeRange.startsWith('year:')) {
      // Specific calendar year, e.g., 'year:2024'
      const year = parseInt(timeRange.split(':')[1])
      if (isNaN(year)) return []
      const start = startOfYear(new Date(year, 0, 1))
      const end = endOfYear(new Date(year, 0, 1))
      return workouts.filter(workout => {
        const d = new Date(workout.date)
        return d >= start && d <= end
      })
    } else {
      // Range of days
      const cutoffDate = subDays(new Date(), parseInt(timeRange))
      return workouts.filter(workout =>
        isAfter(new Date(workout.date), cutoffDate)
      )
    }
  }, [workouts, timeRange, customDate])

  const muscleGroupData = useMemo(() => {
    const groups = {}
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength' && exercise.muscleGroup) {
          groups[exercise.muscleGroup] = (groups[exercise.muscleGroup] || 0) + exercise.sets.length
        }
      })
    })
    return groups
  }, [filteredWorkouts])

  const weeklyData = useMemo(() => {
    const timeRangeNum = parseInt(timeRange)
    const useDaily = !isNaN(timeRangeNum) && timeRangeNum <= 30 // Use daily data for 30 days or less

    if (useDaily) {
      // Only show data from when user actually started working out
      if (filteredWorkouts.length === 0) {
        return []
      }

      // Find the earliest workout date within the time range
      const workoutDates = filteredWorkouts.map(w => new Date(w.date))
      const earliestWorkout = new Date(Math.min(...workoutDates))
      const today = new Date()

      // Calculate the actual date range to show (from first workout to today, but within time range limit)
      const maxStartDate = subDays(today, (isNaN(timeRangeNum) ? 30 : timeRangeNum) - 1)
      const actualStartDate = earliestWorkout > maxStartDate ? earliestWorkout : maxStartDate

      // Generate daily data only for the period with actual activity
      const daysArray = []
      let currentDate = new Date(actualStartDate)

      while (currentDate <= today) {
        const dayKey = format(currentDate, 'yyyy-MM-dd')
        daysArray.push({
          date: new Date(currentDate),
          week: dayKey,
          workouts: 0,
          exercises: 0,
          sets: 0,
          weight: 0,
          exerciseDetails: []
        })
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day
      }

      // Fill in actual workout data
      filteredWorkouts.forEach(workout => {
        const workoutDate = new Date(workout.date)
        const dayIndex = daysArray.findIndex(day =>
          format(day.date, 'yyyy-MM-dd') === format(workoutDate, 'yyyy-MM-dd')
        )

        if (dayIndex !== -1) {
          daysArray[dayIndex].workouts += 1
          daysArray[dayIndex].exercises += workout.exercises.length

          workout.exercises.forEach(exercise => {
            daysArray[dayIndex].sets += exercise.sets.length

            // Add exercise details for tooltip
            const exerciseVolume = exercise.type === 'strength'
              ? exercise.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0)
              : 0

            daysArray[dayIndex].exerciseDetails.push({
              name: exercise.name,
              type: exercise.type,
              sets: exercise.sets.length,
              volume: exerciseVolume,
              muscleGroup: exercise.muscleGroup || 'Unknown'
            })

            if (exercise.type === 'strength') {
              exercise.sets.forEach(set => {
                daysArray[dayIndex].weight += (set.weight || 0) * (set.reps || 0)
              })
            }
          })
        }
      })

      // Keep exercise details but remove the date property
      const result = daysArray.map(({ date, ...data }) => data)
      return result
    } else {
      // Use weekly data for longer time ranges or year selection
      const weeks = {}
      filteredWorkouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'yyyy-MM-dd') // stable sortable key

        if (!weeks[weekKey]) {
          weeks[weekKey] = {
            date: weekStart,
            workouts: 0,
            exercises: 0,
            sets: 0,
            weight: 0,
            exerciseDetails: []
          }
        }

        weeks[weekKey].workouts += 1
        weeks[weekKey].exercises += workout.exercises.length

        workout.exercises.forEach(exercise => {
          weeks[weekKey].sets += exercise.sets.length

          // Add exercise details for tooltip
          const exerciseVolume = exercise.type === 'strength'
            ? exercise.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0)
            : 0

          weeks[weekKey].exerciseDetails.push({
            name: exercise.name,
            type: exercise.type,
            sets: exercise.sets.length,
            volume: exerciseVolume,
            muscleGroup: exercise.muscleGroup || 'Unknown'
          })

          if (exercise.type === 'strength') {
            exercise.sets.forEach(set => {
              weeks[weekKey].weight += (set.weight || 0) * (set.reps || 0)
            })
          }
        })
      })

      return Object.entries(weeks)
        .sort(([aKey, aData], [bKey, bData]) => new Date(aData.date) - new Date(bData.date))
        .map(([key, data]) => ({
          week: format(new Date(data.date), 'MMM d'),
          workouts: data.workouts,
          exercises: data.exercises,
          sets: data.sets,
          weight: data.weight,
          exerciseDetails: data.exerciseDetails
        }))
    }
  }, [filteredWorkouts, timeRange])

  const exerciseTypeData = useMemo(() => {
    const types = { strength: 0, cardio: 0 }
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        types[exercise.type] = (types[exercise.type] || 0) + 1
      })
    })
    return types
  }, [filteredWorkouts])

  // Muscle building metrics - NORMALIZED TO WEEKLY
  const muscleVolumeMetrics = useMemo(() => {
    const metrics = {}

    // Calculate actual date span of filtered workouts
    let actualWeeksInRange = 1
    if (filteredWorkouts.length > 0) {
      const workoutDates = filteredWorkouts.map(w => new Date(w.date))
      const earliestDate = new Date(Math.min(...workoutDates))
      const latestDate = new Date(Math.max(...workoutDates))
      const daysDiff = Math.max(1, Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)))
      actualWeeksInRange = Math.max(1, Math.ceil(daysDiff / 7))
    }

    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength' && exercise.muscleGroup) {
          if (!metrics[exercise.muscleGroup]) {
            metrics[exercise.muscleGroup] = {
              totalSets: 0,
              volume: 0,
              frequency: new Set(),
              exercises: new Set()
            }
          }
          metrics[exercise.muscleGroup].totalSets += exercise.sets.length
          metrics[exercise.muscleGroup].exercises.add(exercise.name)
          metrics[exercise.muscleGroup].frequency.add(format(new Date(workout.date), 'yyyy-MM-dd'))

          exercise.sets.forEach(set => {
            metrics[exercise.muscleGroup].volume += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })

    // Normalize to weekly and convert sets to arrays
    Object.keys(metrics).forEach(muscle => {
      const uniqueDays = metrics[muscle].frequency.size
      metrics[muscle].exerciseCount = metrics[muscle].exercises.size
      metrics[muscle].exercises = Array.from(metrics[muscle].exercises)

      // Calculate weekly frequency (times per week) based on actual data span
      metrics[muscle].frequencyPerWeek = actualWeeksInRange > 0
        ? Number((uniqueDays / actualWeeksInRange).toFixed(1))
        : uniqueDays
      metrics[muscle].trainingDays = uniqueDays // Keep for reference

      // Calculate weekly average based on actual data span
      metrics[muscle].sets = Math.round(metrics[muscle].totalSets / actualWeeksInRange)
      metrics[muscle].volume = Math.round(metrics[muscle].volume / actualWeeksInRange)
    })

    return metrics
  }, [filteredWorkouts, timeRange])

  // Progressive overload detection
  const progressiveOverloadData = useMemo(() => {
    const exerciseProgress = {}

    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength') {
          const sets = Array.isArray(exercise.sets) ? exercise.sets : []
          if (sets.length === 0) return

          if (!exerciseProgress[exercise.name]) {
            exerciseProgress[exercise.name] = []
          }

          const weights = sets.map(s => s.weight || 0)
          const repsList = sets.map(s => s.reps || 0)
          const maxWeight = Math.max(...weights)
          const validReps = repsList.filter(r => typeof r === 'number')
          const avgReps = validReps.length > 0 ? (validReps.reduce((sum, r) => sum + r, 0) / validReps.length) : 0
          const volume = sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)

          // Skip entries with no load data at all
          if (!isFinite(maxWeight) && volume === 0) return

          exerciseProgress[exercise.name].push({
            date: new Date(workout.date),
            weight: isFinite(maxWeight) ? maxWeight : 0,
            reps: Math.round(avgReps),
            volume
          })
        }
      })
    })

    // Sort by date and calculate trends
    Object.keys(exerciseProgress).forEach(exerciseName => {
      exerciseProgress[exerciseName].sort((a, b) => a.date - b.date)
    })

    return exerciseProgress
  }, [filteredWorkouts])

  // Weekly volume trend
  const volumeTrend = useMemo(() => {
    const weeks = {}
    filteredWorkouts.forEach(workout => {
      const weekKey = format(startOfWeek(new Date(workout.date)), 'yyyy-MM-dd')
      if (!weeks[weekKey]) weeks[weekKey] = 0

      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength') {
          exercise.sets.forEach(set => {
            weeks[weekKey] += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })

    return Object.entries(weeks)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([week, volume]) => ({ week, volume }))
  }, [filteredWorkouts])

  // Workout frequency trend (sessions per week)
  const frequencyTrend = useMemo(() => {
    const weeks = {}
    filteredWorkouts.forEach(workout => {
      const weekKey = format(startOfWeek(new Date(workout.date)), 'yyyy-MM-dd')
      weeks[weekKey] = (weeks[weekKey] || 0) + 1
    })
    const ordered = Object.entries(weeks)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([, count]) => count)
    if (ordered.length === 0) return { avg: 0, trend: 'stable' }
    const lastHalf = ordered.slice(-Math.ceil(ordered.length / 2))
    const firstHalf = ordered.slice(0, Math.floor(ordered.length / 2))
    const avgRecent = lastHalf.reduce((s, v) => s + v, 0) / lastHalf.length
    const avgPrev = firstHalf.length > 0 ? (firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length) : avgRecent
    const diff = avgRecent - avgPrev
    const trend = Math.abs(diff) < 0.2 ? 'stable' : (diff > 0 ? 'up' : 'down')
    return { avg: avgRecent, trend }
  }, [filteredWorkouts])

  // Load AI insights
  useEffect(() => {
    if (filteredWorkouts.length >= 3 && !insightsLoading) {
      setInsightsLoading(true)

      const loadInsights = async () => {
        try {
          // Calculate metrics for AI
          const totalSets = Object.values(muscleVolumeMetrics).reduce((sum, m) => sum + m.sets, 0)
          const avgFrequency = Object.values(muscleVolumeMetrics).reduce((sum, m) => sum + m.frequencyPerWeek, 0) / Object.keys(muscleVolumeMetrics).length
          const totalVolume = Object.values(muscleVolumeMetrics).reduce((sum, m) => sum + m.volume, 0)

          // Calculate workout frequency based on actual data span
          let workoutFreq = 0
          if (filteredWorkouts.length > 0) {
            const workoutDates = filteredWorkouts.map(w => new Date(w.date))
            const earliestDate = new Date(Math.min(...workoutDates))
            const latestDate = new Date(Math.max(...workoutDates))
            const daysDiff = Math.max(1, Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)))
            const weeksDiff = Math.max(1, daysDiff / 7)
            workoutFreq = Number((filteredWorkouts.length / weeksDiff).toFixed(1))
          }

          const weeklyVolumes = {}
          Object.entries(muscleVolumeMetrics).forEach(([muscle, data]) => {
            weeklyVolumes[muscle] = data.sets
          })

          // Load insights in parallel
          const [balance, recovery, volume] = await Promise.all([
            Object.keys(muscleVolumeMetrics).length > 0
              ? analyzeMuscleBalance({ weeklyVolumes })
              : null,
            analyzeRecovery({
              workoutFrequency: workoutFreq,
              muscleFrequency: avgFrequency,
              totalVolume: Math.round(totalVolume)
            }),
            volumeTrend.length > 3
              ? analyzeVolumeTrend({
                weeklyVolumes: volumeTrend.slice(-4).map(w => Math.round(w.volume)),
                trend: volumeTrend.length > 1 && volumeTrend[volumeTrend.length - 1].volume > volumeTrend[0].volume ? 'increasing' : 'stable'
              })
              : null
          ])

          setAiInsights({
            muscleBalance: balance,
            recovery,
            volumeTrend: volume,
            progressOverload: null
          })
        } catch (error) {
          console.error('AI insights error:', error)
        } finally {
          setInsightsLoading(false)
        }
      }

      loadInsights()
    }
  }, [filteredWorkouts.length, timeRange])

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Apple Fitness Header */}
      <div className="px-4 pt-12 pb-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="fitness-title">Fitness</h1>
            <p className="fitness-subtitle">Your activity data</p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <AppleDropdown
              value={timeRange}
              onChange={handleTimeRangeChange}
              options={(() => {
                const base = [
                  { value: '0', label: 'Today' },
                  { value: '3', label: 'Last 3 days' },
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '365', label: 'Last year' },
                  { value: 'custom', label: 'Select specific date' }
                ]
                // Append specific years present in data
                const yearsSet = new Set(workouts.map(w => new Date(w.date).getFullYear()))
                const years = Array.from(yearsSet).sort((a, b) => b - a)
                const yearOptions = years.map(y => ({ value: `year:${y}`, label: `Year ${y}` }))
                return [...yearOptions, ...base]
              })()}
              placeholder="Select time range"
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Apple Fitness Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-900 rounded-xl">
            <div className="fitness-metric-small text-red-400">{filteredWorkouts.length}</div>
            <div className="fitness-label">Workouts</div>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded-xl">
            <div className="fitness-metric-small text-green-400">
              {filteredWorkouts.reduce((sum, w) => sum + w.exercises.length, 0)}
            </div>
            <div className="fitness-label">Exercises</div>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded-xl">
            <div className="fitness-metric-small text-blue-400">
              {filteredWorkouts.reduce((sum, w) =>
                sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0
              )}
            </div>
            <div className="fitness-label">Sets</div>
          </div>
          <div className="text-center p-3 bg-gray-900 rounded-xl">
            <div className="fitness-metric-small text-purple-400">
              {Math.round(filteredWorkouts.reduce((sum, w) =>
                sum + w.exercises.reduce((s, e) =>
                  s + e.sets.reduce((ss, set) =>
                    ss + (set.weight || 0) * (set.reps || 0), 0
                  ), 0
                ), 0
              ))}
            </div>
            <div className="fitness-label">Total kg</div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* AI Insights - Seamlessly Integrated */}
        {aiInsights.recovery && (
          <AISmartTip
            tip={aiInsights.recovery}
            type="rest"
            onDismiss={() => setAiInsights(prev => ({ ...prev, recovery: null }))}
          />
        )}

        {aiInsights.muscleBalance && !aiInsights.recovery && (
          <AISmartTip
            tip={aiInsights.muscleBalance}
            type="form"
            onDismiss={() => setAiInsights(prev => ({ ...prev, muscleBalance: null }))}
          />
        )}

        {aiInsights.volumeTrend && !aiInsights.recovery && !aiInsights.muscleBalance && (
          <AISmartTip
            tip={aiInsights.volumeTrend}
            type="motivation"
            onDismiss={() => setAiInsights(prev => ({ ...prev, volumeTrend: null }))}
          />
        )}

        {/* Muscle Group Volume - Critical for Hypertrophy */}
        {Object.keys(muscleVolumeMetrics).length > 0 && (
          <div className="fitness-card">
            <h2 className="text-white font-semibold mb-4 flex items-center">
              <Target size={20} className="mr-2 text-purple-400" />
              Weekly Volume per Muscle
            </h2>
            <div className="space-y-3">
              {Object.entries(muscleVolumeMetrics)
                .sort(([, a], [, b]) => b.sets - a.sets)
                .map(([muscle, data]) => {
                  const isOptimal = data.frequencyPerWeek >= 2 && data.frequencyPerWeek <= 3 && data.sets >= 10 && data.sets <= 20
                  const needsMore = data.sets < 10 || data.frequencyPerWeek < 2

                  return (
                    <div key={muscle} className="bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold capitalize">{muscle}</p>
                          <p className="text-xs text-gray-400">
                            {data.frequencyPerWeek}x/week • {data.exerciseCount} exercise{data.exerciseCount !== 1 ? 's' : ''} • {data.trainingDays} training day{data.trainingDays !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-400">{data.sets}</p>
                          <p className="text-xs text-gray-400">sets/week</p>
                        </div>
                      </div>

                      {/* Volume indicator */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isOptimal ? 'bg-green-500' : needsMore ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${Math.min((data.sets / 20) * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${isOptimal ? 'text-green-400' : needsMore ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {isOptimal ? 'Optimal' : needsMore ? 'Low' : 'High'}
                        </span>
                      </div>

                      {/* Volume in kg */}
                      <p className="text-xs text-gray-500">
                        {Math.round(data.volume).toLocaleString()} kg total volume
                      </p>
                    </div>
                  )
                })}
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <p className="text-xs text-blue-300">
                💡 Optimal hypertrophy: 10-20 sets per muscle per week, hit 2-3x/week
              </p>
            </div>
          </div>
        )}

        {/* Workout Frequency Chart */}
        <div className="fitness-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold flex items-center">
                <TrendingUp size={20} className="mr-2 text-blue-400" />
                Workout Frequency
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {selectedMetric === 'workouts' && 'Number of workout sessions'}
                {selectedMetric === 'exercises' && 'Total exercises performed'}
                {selectedMetric === 'sets' && 'Total sets completed'}
                {selectedMetric === 'weight' && 'Total volume (kg) lifted'}
              </p>
              <p className="text-xs mt-1">
                <span className="text-gray-300">Avg {frequencyTrend.avg.toFixed(1)} sessions/week</span>
                {frequencyTrend.trend === 'up' && <span className="ml-2 text-green-400">Trending up</span>}
                {frequencyTrend.trend === 'down' && <span className="ml-2 text-yellow-400">Trending down</span>}
                {frequencyTrend.trend === 'stable' && <span className="ml-2 text-gray-500">Stable</span>}
              </p>
            </div>
            <div className="flex bg-gray-900 rounded-xl p-1 min-w-0">
              {['workouts', 'exercises', 'sets', 'weight'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`flex-1 px-1.5 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 min-w-0 ${selectedMetric === metric
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                >
                  <span className="truncate block">
                    {metric === 'weight' ? 'Volume' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {weeklyData.length > 0 ? (
            <WorkoutChart data={weeklyData} metric={selectedMetric} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No data available for the selected time range</p>
              <p className="text-gray-500 text-sm mt-1">Start logging workouts to see your progress</p>
            </div>
          )}
        </div>

        {/* Muscle Group Distribution - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <PieChart size={20} className="mr-2 text-blue-400" />
            Muscle Group Focus
          </h2>

          {Object.keys(muscleGroupData).length > 0 ? (
            <MuscleGroupChart data={muscleGroupData} />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-400">No strength training data available</p>
            </div>
          )}
        </div>

        {/* Progressive Overload Tracker */}
        {Object.keys(progressiveOverloadData).length > 0 && (
          <div className="fitness-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center">
                <TrendingUp size={20} className="mr-2 text-green-400" />
                Progressive Overload Tracker
              </h2>
              {selectedMuscleGroup && (
                <button
                  onClick={() => setSelectedMuscleGroup(null)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  &larr; Back to Muscle Groups
                </button>
              )}
            </div>

            {!selectedMuscleGroup ? (
              <div className="space-y-3">
                {Object.keys(exerciseDatabase).map((muscleGroup) => {
                  const exercises = exerciseDatabase[muscleGroup];
                  const trackedExercises = exercises.filter(
                    (e) => progressiveOverloadData[e] && progressiveOverloadData[e].length >= 2
                  );

                  if (trackedExercises.length === 0) {
                    return null;
                  }

                  let progressingCount = 0;
                  let decreasingCount = 0;
                  let plateauCount = 0;

                  trackedExercises.forEach((exerciseName) => {
                    const sessions = progressiveOverloadData[exerciseName];
                    const firstSession = sessions[0];
                    const lastSession = sessions[sessions.length - 1];
                    const weightIncrease = lastSession.weight - firstSession.weight;
                    const volumeIncrease = lastSession.volume - firstSession.volume;

                    if (weightIncrease > 0 || volumeIncrease > 0) {
                      progressingCount++;
                    } else if (weightIncrease < 0 || volumeIncrease < 0) {
                      decreasingCount++;
                    } else {
                      plateauCount++;
                    }
                  });

                  let overallStatus = { text: '➡️ Plateau', className: 'bg-gray-700 text-gray-400' };
                  if (progressingCount > 0 && progressingCount >= decreasingCount) {
                    overallStatus = { text: '📈 Progressing', className: 'bg-green-900/30 text-green-400' };
                  } else if (decreasingCount > 0) {
                    overallStatus = { text: '📉 Decreasing', className: 'bg-red-900/30 text-red-400' };
                  }


                  return (
                    <div
                      key={muscleGroup}
                      onClick={() => setSelectedMuscleGroup(muscleGroup)}
                      className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium capitalize">{muscleGroup}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${overallStatus.className}`}>
                          {overallStatus.text}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {progressingCount > 0 && <span className="text-green-400">{progressingCount} progressing</span>}
                        {decreasingCount > 0 && <span className="text-red-400 ml-2">{decreasingCount} decreasing</span>}
                        {plateauCount > 0 && <span className="text-gray-500 ml-2">{plateauCount} plateau</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(progressiveOverloadData)
                  .filter(([exerciseName, sessions]) => {
                    const exerciseMuscleGroup = Object.keys(exerciseDatabase).find(group => exerciseDatabase[group].includes(exerciseName));
                    return exerciseMuscleGroup === selectedMuscleGroup && sessions.length >= 2;
                  })
                  .sort(([_, a], [__, b]) => b.length - a.length)
                  .map(([exerciseName, sessions]) => {
                    const firstSession = sessions[0];
                    const lastSession = sessions[sessions.length - 1];
                    const weightIncrease = lastSession.weight - firstSession.weight;
                    const volumeIncrease = lastSession.volume - firstSession.volume;
                    const isProgressing = weightIncrease > 0 || volumeIncrease > 0;
                    const isDecreasing = weightIncrease < 0 || volumeIncrease < 0;

                    let status = { text: '➡️ Plateau', className: 'bg-gray-700 text-gray-400' };
                    if (isProgressing) {
                      status = { text: '📈 Progressing', className: 'bg-green-900/30 text-green-400' };
                    } else if (isDecreasing) {
                        status = { text: '📉 Decreasing', className: 'bg-red-900/30 text-red-400' };
                    }

                    return (
                      <div key={exerciseName} className="bg-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium text-sm">{exerciseName}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                            {status.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400">Weight</p>
                            <p className="text-white font-semibold">
                              {firstSession.weight}kg → {lastSession.weight}kg
                              {weightIncrease !== 0 && (
                                <span className={weightIncrease > 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                                  {weightIncrease > 0 ? `+${weightIncrease}` : weightIncrease}kg
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Volume</p>
                            <p className="text-white font-semibold">
                              {Math.round(firstSession.volume)}kg → {Math.round(lastSession.volume)}kg
                              {volumeIncrease !== 0 && (
                                <span className={volumeIncrease > 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}>
                                  {volumeIncrease > 0 ? `+${Math.round(volumeIncrease)}` : Math.round(volumeIncrease)}kg
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          {sessions.length} sessions tracked
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}

            {Object.entries(progressiveOverloadData).filter(([_, sessions]) => sessions.length >= 2).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Track the same exercises multiple times to see progress</p>
              </div>
            )}

            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-xl">
              <p className="text-xs text-green-300">
                💪 Progressive overload is key! Aim to increase weight or reps each week
              </p>
            </div>
          </div>
        )}

        {/* Push/Pull/Legs Balance - Bodybuilding Focus */}
        {Object.keys(muscleGroupData).length > 0 && (
          <div className="fitness-card">
            <h2 className="text-white font-semibold mb-4 flex items-center">
              <Activity size={20} className="mr-2 text-blue-400" />
              Push/Pull/Legs Balance
            </h2>

            {(() => {
              const pushMuscles = ['chest', 'shoulders', 'triceps']
              const pullMuscles = ['back', 'biceps', 'forearms']
              const legMuscles = ['legs']

              const pushSets = pushMuscles.reduce((sum, m) => sum + (muscleGroupData[m] || 0), 0)
              const pullSets = pullMuscles.reduce((sum, m) => sum + (muscleGroupData[m] || 0), 0)
              const legSets = legMuscles.reduce((sum, m) => sum + (muscleGroupData[m] || 0), 0)
              const total = pushSets + pullSets + legSets

              if (total === 0) return <p className="text-gray-400 text-sm">No data available</p>

              return (
                <>
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">🫸 Push</span>
                        <span className="text-red-400 font-bold">{pushSets} sets</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${(pushSets / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">🫷 Pull</span>
                        <span className="text-blue-400 font-bold">{pullSets} sets</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(pullSets / total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">🦵 Legs</span>
                        <span className="text-green-400 font-bold">{legSets} sets</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(legSets / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                    <p className="text-xs text-yellow-300">
                      ⚖️ Balanced training: Aim for roughly equal push, pull, and leg volume
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Progress Tracking - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <Target size={20} className="mr-2 text-blue-400" />
            Progress Over Time
          </h2>

          {filteredWorkouts.length > 0 ? (
            <ProgressChart workouts={filteredWorkouts} />
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-400">No workout data available for progress tracking</p>
            </div>
          )}
        </div>

        {/* Split Comparison */}
        <SplitComparison workouts={workouts} />

        {/* Recent Achievements */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold flex items-center">
              <Award size={20} className="mr-2 text-blue-400" />
              Recent Achievements
            </h2>
            <a
              href="/achievements"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              <span>View All</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {(() => {
            const { unlockedAchievements } = calculateAchievements(workouts, achievements)
            const totalPoints = calculateTotalPoints(unlockedAchievements)
            const currentRank = getUserRank(totalPoints)
            const rankProgress = getRankProgress(totalPoints)
            const recentAchievements = unlockedAchievements.slice(-3) // Show last 3 unlocked

            return (
              <>
                {/* Rank Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className={`text-lg font-bold mb-1 ${currentRank.color}`}>{currentRank.icon}</div>
                    <div className="text-gray-400 text-xs">{currentRank.title.replace('Gym ', '')}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-400 mb-1">{unlockedAchievements.length}</div>
                    <div className="text-gray-400 text-xs">Unlocked</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-400 mb-1">{Math.round((unlockedAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100)}%</div>
                    <div className="text-gray-400 text-xs">Complete</div>
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="space-y-3">
                  {recentAchievements.length > 0 ? (
                    recentAchievements.map(achievement => (
                      <div key={achievement.id} className="flex items-center p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 text-lg">
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-blue-400 text-sm">
                              {achievement.title}
                            </p>
                            <div className="flex items-center space-x-1">
                              <Star size={12} className="text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-medium">{achievement.points}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Award size={20} className="text-gray-600" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm mb-1">No Achievements Yet</p>
                      <p className="text-gray-500 text-xs">
                        {workouts.length === 0
                          ? 'Log your first workout to unlock "First Steps"!'
                          : 'Complete more workouts to unlock achievements!'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Apple Calendar Modal */}
      {showDatePicker && (
        <AppleCalendar
          selectedDate={customDate || format(new Date(), 'yyyy-MM-dd')}
          onDateSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
          workouts={workouts}
        />
      )}
    </div>
  )
}

export default Analytics
