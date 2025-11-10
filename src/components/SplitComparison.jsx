import React, { useState, useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  BarChart3,
  Users,
  Activity,
  CheckCircle,
  Circle,
  Target,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import DateRangeSelector from './DateRangeSelector'
import MuscleGroupProgress from './MuscleGroupProgress'
import { subDays, isAfter, format, getDay, parseISO } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

const SplitComparison = ({ workouts }) => {
  const [selectedMetric, setSelectedMetric] = useState('volume')
  const [timeRange, setTimeRange] = useState('30')
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false)
  const [selectedComparisons, setSelectedComparisons] = useState([])
  const [showComparisonSelector, setShowComparisonSelector] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Get user's workout split from localStorage
  const userSplit = useMemo(() => {
    try {
      const savedSplit = localStorage.getItem('gymgenie-workout-split')
      const parsed = savedSplit ? JSON.parse(savedSplit) : null
      console.log('User split data:', parsed)
      return parsed
    } catch (error) {
      console.error('Error parsing workout split:', error)
      return null
    }
  }, [])

  const filteredWorkouts = useMemo(() => {
    if (!workouts || workouts.length === 0) return []
    const cutoffDate = subDays(new Date(), parseInt(timeRange))
    return workouts.filter(workout =>
      isAfter(new Date(workout.date), cutoffDate)
    )
  }, [workouts, timeRange])

  // Group workouts by user's actual split configuration
  const splitData = useMemo(() => {
    if (!filteredWorkouts.length) {
      return {}
    }

    // If no split is configured, group by day of week
    if (!userSplit || !userSplit.customSplit || !userSplit.customSplit.schedule) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const splits = {}

      filteredWorkouts.forEach(workout => {
        const dayOfWeek = getDay(new Date(workout.date))
        const dayName = dayNames[dayOfWeek]
        const key = dayName

        if (!splits[key]) {
          splits[key] = {
            day: dayName,
            splitType: 'General',
            sessions: [],
            totalVolume: 0,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0
          }
        }

        // Calculate workout metrics
        let workoutVolume = 0
        let workoutSets = 0
        let workoutReps = 0
        let workoutMaxWeight = 0
        let totalIntensity = 0
        let intensityCount = 0

        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            const weight = set.weight || 0
            const reps = set.reps || 0
            const volume = weight * reps

            workoutVolume += volume
            workoutSets += 1
            workoutReps += reps
            workoutMaxWeight = Math.max(workoutMaxWeight, weight)

            if (set.difficulty) {
              totalIntensity += set.difficulty
              intensityCount += 1
            }
          })
        })

        splits[key].sessions.push({
          date: workout.date,
          volume: workoutVolume,
          sets: workoutSets,
          reps: workoutReps,
          maxWeight: workoutMaxWeight,
          intensity: intensityCount > 0 ? totalIntensity / intensityCount : 0
        })

        splits[key].totalVolume += workoutVolume
        splits[key].totalSets += workoutSets
        splits[key].totalReps += workoutReps
        splits[key].maxWeight = Math.max(splits[key].maxWeight, workoutMaxWeight)
      })

      return splits
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const splits = {}

    filteredWorkouts.forEach(workout => {
      const dayOfWeek = getDay(new Date(workout.date))
      const dayName = dayNames[dayOfWeek]

      // Get the planned split for this day (1-7 corresponds to Sunday-Saturday)
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek // Convert Sunday from 0 to 7
      const plannedSplit = userSplit.customSplit?.schedule?.[dayNumber]

      if (!plannedSplit || !plannedSplit.name || plannedSplit.name === 'Rest') {
        return // Skip rest days or undefined splits
      }

      const key = `${dayName} (${plannedSplit.name})`

      if (!splits[key]) {
        splits[key] = {
          day: dayName,
          splitType: plannedSplit.name,
          sessions: [],
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          maxWeight: 0,
          plannedMuscles: plannedSplit.muscles || []
        }
      }

      // Calculate metrics for this workout
      let workoutVolume = 0
      let workoutSets = 0
      let workoutReps = 0
      let totalIntensity = 0
      let intensityCount = 0
      let workoutMaxWeight = 0

      workout.exercises.forEach(exercise => {
        workoutSets += exercise.sets.length
        exercise.sets.forEach(set => {
          workoutReps += set.reps || 0
          workoutVolume += (set.weight || 0) * (set.reps || 0)
          workoutMaxWeight = Math.max(workoutMaxWeight, set.weight || 0)
          if (set.difficulty) {
            totalIntensity += set.difficulty
            intensityCount++
          }
        })
      })

      const avgIntensity = intensityCount > 0 ? totalIntensity / intensityCount : 0

      splits[key].sessions.push({
        date: format(new Date(workout.date), 'MMM d'),
        volume: workoutVolume,
        sets: workoutSets,
        reps: workoutReps,
        maxWeight: workoutMaxWeight,
        intensity: avgIntensity
      })

      splits[key].totalVolume += workoutVolume
      splits[key].totalSets += workoutSets
      splits[key].totalReps += workoutReps
      splits[key].maxWeight = Math.max(splits[key].maxWeight, workoutMaxWeight)
    })

    return splits
  }, [filteredWorkouts, userSplit])

  const allChartData = useMemo(() => {
    return Object.entries(splitData)
      .sort(([keyA, dataA], [keyB, dataB]) => {
        // Sort by the most recent workout date in each split/day
        const latestDateA = dataA.sessions.length > 0
          ? Math.max(...dataA.sessions.map(s => new Date(s.date).getTime()))
          : 0
        const latestDateB = dataB.sessions.length > 0
          ? Math.max(...dataB.sessions.map(s => new Date(s.date).getTime()))
          : 0

        // Sort by most recent date (chronological order)
        return latestDateA - latestDateB
      })
      .map(([key, data]) => {
        const sessionCount = data.sessions.length
        return {
          name: key,
          volume: sessionCount > 0 ? Math.round(data.totalVolume / sessionCount) : 0,
          sets: sessionCount > 0 ? Math.round(data.totalSets / sessionCount) : 0,
          reps: sessionCount > 0 ? Math.round(data.totalReps / sessionCount) : 0,
          intensity: sessionCount > 0 ? Math.round((data.sessions.reduce((sum, s) => sum + s.intensity, 0) / sessionCount) * 10) / 10 : 0,
          maxWeight: data.maxWeight,
          sessions: sessionCount
        }
      })
  }, [splitData])

  const chartData = useMemo(() => {
    if (selectedComparisons.length === 0) {
      return allChartData
    }
    return allChartData.filter(item => selectedComparisons.includes(item.name))
  }, [allChartData, selectedComparisons])

  const availableComparisons = useMemo(() => {
    return allChartData.map(item => ({
      key: item.name,
      label: item.name,
      sessions: item.sessions
    }))
  }, [allChartData])

  const progressData = useMemo(() => {
    const progressByDay = {}

    Object.entries(splitData).forEach(([key, data]) => {
      const sortedSessions = data.sessions.sort((a, b) => new Date(a.date) - new Date(b.date))
      progressByDay[key] = sortedSessions.map((session, index) => ({
        session: index + 1,
        date: format(new Date(session.date), 'MMM d'),
        volume: session.volume,
        sets: session.sets,
        reps: session.reps,
        intensity: session.intensity,
        maxWeight: session.maxWeight
      }))
    })

    return progressByDay
  }, [splitData])

  const getMetricColor = (metric) => {
    const colors = {
      volume: '#FA114F',
      sets: '#92E82A',
      reps: '#40CBE0',
      intensity: '#FF6B35',
      maxWeight: '#9B59B6'
    }
    return colors[metric] || '#40CBE0'
  }

  const getMetricValue = (data, metric) => {
    return data[metric] || 0
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF'
        }
      }
    }
  }

  // Show message if no split is configured
  if (!userSplit || userSplit.type === 'none') {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 mb-6">
        <div className="text-center py-8">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">No Workout Split Configured</h3>
          <p className="text-gray-400 mb-4">Set up your workout split in Profile to see split comparisons</p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Configure Split
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center">
          <BarChart3 size={20} className="mr-2 text-blue-400" />
          Split Comparison
        </h2>
        <div className="flex items-center space-x-2">
          <DateRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
          >
            {showDetails ? 'Hide Details' : 'More Details'}
          </button>
        </div>
      </div>

      {/* Concise summary */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {chartData.slice(0, 3).map((s) => (
            <div key={s.name} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <div className="text-white font-medium text-sm truncate mb-1">{s.name}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Sessions</span>
                <span className="text-white font-semibold">{s.sessions}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-400">Avg Volume</span>
                <span className="text-blue-400 font-semibold">{Math.round(s.volume)} kg</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Selector */}
      <div className="flex bg-gray-900 rounded-xl p-1 mb-6 overflow-x-auto">
        {['volume', 'sets', 'maxWeight'].map(metric => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${selectedMetric === metric
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              }`}
          >
            {metric === 'maxWeight' ? 'Max Weight' : metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {chartData.length > 0 ? (
        <div className="space-y-8">
          {/* Bar Chart for Comparison */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">Split Performance Comparison</h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: chartData.map(item => item.name),
                  datasets: [{
                    label: selectedMetric === 'maxWeight' ? 'Max Weight' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
                    data: chartData.map(item => getMetricValue(item, selectedMetric)),
                    backgroundColor: getMetricColor(selectedMetric),
                    borderColor: getMetricColor(selectedMetric),
                    borderWidth: 1,
                    borderRadius: 6,
                  }]
                }
                }
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>

          {/* Minimal stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {chartData.slice(0, 8).map((split) => (
              <div key={split.name} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-medium text-sm mb-3 truncate">{split.name}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Sessions</span>
                    <span className="text-white font-medium">{split.sessions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg Volume</span>
                    <span className="text-white font-medium">{Math.round(split.volume)} kg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg Sets</span>
                    <span className="text-white font-medium">{Math.round(split.sets)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Max Weight</span>
                    <span className="text-white font-medium">{Math.round(split.maxWeight)} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced/legacy details hidden behind toggle */}
          {showDetails && (
            <>
              {/* Comparison Selector */}
              {availableComparisons.length > 1 && (
                <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold text-base md:text-lg">
                      Choose What to Compare
                    </h4>
                    <button
                      onClick={() => setShowComparisonSelector(!showComparisonSelector)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      {showComparisonSelector ? 'Hide Options' : 'Select Days/Splits'}
                    </button>
                  </div>

                  {showComparisonSelector && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => setSelectedComparisons([])}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedComparisons.length === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => setSelectedComparisons(availableComparisons.map(c => c.key))}
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                          Select All
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {availableComparisons.map(comparison => (
                          <button
                            key={comparison.key}
                            onClick={() => {
                              setSelectedComparisons(prev =>
                                prev.includes(comparison.key)
                                  ? prev.filter(c => c !== comparison.key)
                                  : [...prev, comparison.key]
                              )
                            }}
                            className={`p-3 rounded-xl text-left transition-all duration-200 ${selectedComparisons.includes(comparison.key) || selectedComparisons.length === 0
                              ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                              : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm mb-1">{comparison.label}</div>
                                <div className="text-xs text-gray-400">
                                  {comparison.sessions} session{comparison.sessions !== 1 ? 's' : ''}
                                </div>
                              </div>
                              {(selectedComparisons.includes(comparison.key) || selectedComparisons.length === 0) && (
                                <CheckCircle size={16} className="text-blue-400" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedComparisons.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-400 text-sm">
                            Comparing {selectedComparisons.length} selected day{selectedComparisons.length !== 1 ? 's' : ''}/split{selectedComparisons.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Any other verbose sections remain here, gated by showDetails */}
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <Activity size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">No Workout Data</h3>
          <p className="text-gray-400 mb-4">Complete some workouts following your {userSplit?.name || 'split'} to see comparisons</p>
          <p className="text-gray-500 text-sm">Try selecting a different time range or log more workouts</p>
        </div>
      )}
    </div>
  )
}

export default SplitComparison
