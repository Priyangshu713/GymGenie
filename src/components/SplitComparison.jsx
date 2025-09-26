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
    <div className="bg-gray-900 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-white font-semibold flex items-center mb-2">
            <BarChart3 size={20} className="mr-2 text-blue-400" />
            Split Comparison
          </h2>
          <p className="text-gray-400 text-sm">Compare your {userSplit.name || 'workout split'} performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <DateRangeSelector
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
            showCustomDate={false}
            workouts={workouts}
          />
        </div>
      </div>

      {/* Split Information & Insights */}
      <div className="space-y-6 mb-6">
        {/* Split Header Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">
                  {userSplit.name || 'Custom Workout Split'}
                </h3>
                <p className="text-gray-400 text-sm">Your current training program</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-xl p-3 md:p-4 text-center border border-gray-700">
            <div className="text-xl md:text-2xl font-bold text-blue-400 mb-1">
              {(() => {
                if (!userSplit?.customSplit?.schedule) return 0
                return Object.values(userSplit.customSplit.schedule).filter(day => 
                  day?.name && day.name !== 'Rest' && day.name.trim() !== ''
                ).length
              })()}
            </div>
            <div className="text-gray-400 text-xs">Training</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 md:p-4 text-center border border-gray-700">
            <div className="text-xl md:text-2xl font-bold text-green-400 mb-1">
              {(() => {
                if (!userSplit?.customSplit?.schedule) return 7
                const trainingDays = Object.values(userSplit.customSplit.schedule).filter(day => 
                  day?.name && day.name !== 'Rest' && day.name.trim() !== ''
                ).length
                return 7 - trainingDays
              })()}
            </div>
            <div className="text-gray-400 text-xs">Rest</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 md:p-4 text-center border border-gray-700">
            <div className="text-xl md:text-2xl font-bold text-purple-400 mb-1">
              {(() => {
                if (!userSplit?.customSplit?.schedule) return 0
                const allMuscleGroups = new Set()
                Object.values(userSplit.customSplit.schedule).forEach(day => {
                  if (day?.muscles && Array.isArray(day.muscles)) {
                    day.muscles.forEach(muscle => allMuscleGroups.add(muscle))
                  }
                })
                return allMuscleGroups.size
              })()}
            </div>
            <div className="text-gray-400 text-xs">Muscles</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 md:p-4 text-center border border-gray-700">
            <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-1">
              {(() => {
                if (!userSplit?.customSplit?.schedule) return '0x'
                
                // Count how many times each muscle appears in the week
                const muscleFrequency = {}
                Object.values(userSplit.customSplit.schedule).forEach(day => {
                  if (day?.muscles && Array.isArray(day.muscles)) {
                    day.muscles.forEach(muscle => {
                      muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1
                    })
                  }
                })
                
                // Get the most common frequency (mode) - this represents the typical training frequency
                const frequencies = Object.values(muscleFrequency)
                if (frequencies.length === 0) return '0x'
                
                // Count frequency occurrences
                const frequencyCount = {}
                frequencies.forEach(freq => {
                  frequencyCount[freq] = (frequencyCount[freq] || 0) + 1
                })
                
                // Find the most common frequency (mode)
                let maxCount = 0
                let mostCommonFrequency = 0
                Object.entries(frequencyCount).forEach(([freq, count]) => {
                  if (count > maxCount) {
                    maxCount = count
                    mostCommonFrequency = parseInt(freq)
                  }
                })
                
                return `${mostCommonFrequency}x`
              })()}
            </div>
            <div className="text-gray-400 text-xs">Frequency</div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
          <button 
            onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
            className="w-full flex items-center justify-between text-white font-semibold mb-4 text-base md:text-lg hover:text-blue-400 transition-colors"
          >
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-blue-400 md:w-5 md:h-5" />
              Weekly Schedule
            </div>
            {isScheduleExpanded ? (
              <ChevronUp size={16} className="text-gray-400 md:w-5 md:h-5" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 md:w-5 md:h-5" />
            )}
          </button>
          
          {isScheduleExpanded && (
            <>
              {/* Mobile: Vertical List */}
              <div className="block md:hidden space-y-3">
                {(() => {
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                  
                  try {
                    return dayNames.map((dayName, index) => {
                      const dayNumber = index === 6 ? 7 : index + 1 // Convert Sunday to 7, others to 1-6
                      const actualDayInfo = userSplit?.customSplit?.schedule?.[dayNumber]
                      
                      const dayInfo = {
                        day: dayName,
                        name: actualDayInfo?.name || 'Rest',
                        muscles: Array.isArray(actualDayInfo?.muscles) ? actualDayInfo.muscles : []
                      }
                      
                      const isRest = dayInfo.name === 'Rest'
                  
                    return (
                      <div key={dayInfo.day} className={`p-4 rounded-xl flex items-center justify-between ${
                        isRest 
                          ? 'bg-gray-700/50 border border-gray-600' 
                          : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-white font-medium">{dayInfo.day}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isRest ? 'bg-gray-600 text-gray-400' : 'bg-blue-500/30 text-blue-400'
                            }`}>
                              {dayInfo.name}
                            </span>
                          </div>
                          {!isRest && dayInfo.muscles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {dayInfo.muscles.map((muscle, idx) => (
                                <span key={idx} className="text-xs text-gray-400 bg-gray-700/50 rounded px-2 py-1">
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                  } catch (error) {
                    console.error('Error rendering mobile schedule:', error)
                    return <div className="text-red-400 text-sm">Error loading schedule</div>
                  }
                })()}
              </div>

              {/* Desktop: Grid */}
              <div className="hidden md:grid grid-cols-7 gap-3">
                {(() => {
                  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  
                  try {
                    return dayNames.map((dayAbbr, index) => {
                      const dayNumber = index === 6 ? 7 : index + 1 // Convert Sunday to 7, others to 1-6
                      const actualDayInfo = userSplit?.customSplit?.schedule?.[dayNumber]
                      
                      const dayInfo = {
                        day: dayAbbr,
                        name: actualDayInfo?.name || 'Rest',
                        muscles: Array.isArray(actualDayInfo?.muscles) ? actualDayInfo.muscles : []
                      }
                    
                    const isRest = dayInfo.name === 'Rest'
                  
                    return (
                      <div key={dayInfo.day} className={`p-4 rounded-xl text-center transition-all duration-200 ${
                        isRest 
                          ? 'bg-gray-700/50 border border-gray-600' 
                          : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50'
                      }`}>
                        <div className="text-xs font-medium text-gray-400 mb-2">
                          {dayInfo.day}
                        </div>
                        <div className={`text-sm font-bold mb-2 ${
                          isRest ? 'text-gray-500' : 'text-blue-400'
                        }`}>
                          {dayInfo.name}
                        </div>
                        {!isRest && dayInfo.muscles.length > 0 && (
                          <div className="space-y-1">
                            {dayInfo.muscles.slice(0, 2).map((muscle, idx) => (
                              <div key={idx} className="text-xs text-gray-400 bg-gray-700/50 rounded px-2 py-1">
                                {muscle}
                              </div>
                            ))}
                            {dayInfo.muscles.length > 2 && (
                              <div className="text-xs text-gray-500">+{dayInfo.muscles.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                  } catch (error) {
                    console.error('Error rendering desktop schedule:', error)
                    return <div className="text-red-400 text-sm col-span-7 text-center">Error loading schedule</div>
                  }
                })()}
              </div>
            </>
          )}
        </div>

        {/* Split Benefits */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4 flex items-center text-base md:text-lg">
            <Star size={16} className="mr-2 text-yellow-400 md:w-5 md:h-5" />
            Why This Split Works
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {(() => {
              const splitType = userSplit.type?.toLowerCase()
              const benefits = {
                'push/pull/legs': [
                  { icon: '🎯', title: 'Hypertrophy Focus', desc: 'Optimal for muscle growth' },
                  { icon: '🔄', title: 'High Frequency', desc: 'Train each muscle 2x/week' },
                  { icon: '⚡', title: 'Recovery', desc: 'Perfect rest between sessions' },
                  { icon: '💪', title: 'Proven Results', desc: 'Bodybuilder favorite' }
                ],
                'upper/lower': [
                  { icon: '🏋️', title: 'Strength Focus', desc: 'Perfect for powerlifting' },
                  { icon: '⚖️', title: 'Balanced', desc: 'Equal upper/lower development' },
                  { icon: '🕐', title: 'Time Efficient', desc: 'Great for busy schedules' },
                  { icon: '📈', title: 'Progressive', desc: 'Easy to track progress' }
                ],
                'full body': [
                  { icon: '🌟', title: 'Beginner Friendly', desc: 'Perfect for new lifters' },
                  { icon: '🔥', title: 'High Burn', desc: 'Maximum calorie burn' },
                  { icon: '💯', title: 'Frequent Stimulus', desc: 'Train everything often' },
                  { icon: '⏰', title: 'Flexible', desc: '3-4 days per week' }
                ]
              }

              const currentBenefits = benefits[splitType] || [
                { icon: '💪', title: 'Custom Design', desc: 'Tailored to your goals' },
                { icon: '🎯', title: 'Personal', desc: 'Fits your preferences' },
                { icon: '📈', title: 'Trackable', desc: 'Monitor your progress' },
                { icon: '🔄', title: 'Adaptable', desc: 'Adjust as you grow' }
              ]

              return currentBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 md:p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700/70 transition-colors">
                  <div className="text-xl md:text-2xl flex-shrink-0">{benefit.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm md:text-base mb-1">{benefit.title}</div>
                    <div className="text-gray-400 text-xs md:text-sm">{benefit.desc}</div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex bg-gray-900 rounded-xl p-1 mb-6 overflow-x-auto">
        {['volume', 'sets', 'reps', 'intensity', 'maxWeight'].map(metric => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              selectedMetric === metric
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {metric === 'maxWeight' ? 'Max Weight' : metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedComparisons.length === 0
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
                    className={`p-3 rounded-xl text-left transition-all duration-200 ${
                      selectedComparisons.includes(comparison.key) || selectedComparisons.length === 0
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
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      backgroundColor: '#111827',
                      titleColor: '#F3F4F6',
                      bodyColor: '#F3F4F6',
                      borderColor: '#374151',
                      borderWidth: 1,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          const suffix = selectedMetric === 'intensity' ? '/10' : selectedMetric === 'maxWeight' ? ' kg' : ''
                          return `${context.parsed.y}${suffix}`
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#9CA3AF',
                        font: { size: 12 },
                        maxRotation: 45
                      },
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: '#9CA3AF',
                        font: { size: 12 }
                      },
                      grid: {
                        color: '#374151',
                        lineWidth: 1
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Progress Lines for Each Split */}
          {Object.keys(progressData).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold mb-4">Progress Over Time</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(progressData)
                  .filter(([splitKey]) => {
                    // If no comparisons are selected, show all
                    if (selectedComparisons.length === 0) return true
                    // Otherwise, only show selected comparisons
                    return selectedComparisons.includes(splitKey)
                  })
                  .map(([splitKey, sessions]) => (
                  sessions.length > 1 && (
                    <div key={splitKey} className="bg-gray-800 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-3">{splitKey}</h4>
                      <div className="h-48">
                        <Line
                          data={{
                            labels: [...sessions].reverse().map(s => s.date),
                            datasets: [{
                              label: selectedMetric === 'maxWeight' ? 'Max Weight' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
                              data: [...sessions].reverse().map(s => s[selectedMetric]),
                              borderColor: getMetricColor(selectedMetric),
                              backgroundColor: getMetricColor(selectedMetric) + '20',
                              borderWidth: 3,
                              pointBackgroundColor: getMetricColor(selectedMetric),
                              pointBorderColor: '#1F2937',
                              pointBorderWidth: 2,
                              pointRadius: 5,
                              pointHoverRadius: 7,
                              tension: 0.4
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                backgroundColor: '#111827',
                                titleColor: '#F3F4F6',
                                bodyColor: '#F3F4F6',
                                borderColor: '#374151',
                                borderWidth: 1,
                                cornerRadius: 8
                              }
                            },
                            scales: {
                              x: {
                                ticks: {
                                  color: '#9CA3AF',
                                  font: { size: 11 }
                                },
                                grid: {
                                  color: '#4B5563',
                                  lineWidth: 1
                                }
                              },
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  color: '#9CA3AF',
                                  font: { size: 11 }
                                },
                                grid: {
                                  color: '#4B5563',
                                  lineWidth: 1
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Muscle Group Progress */}
          <MuscleGroupProgress 
            workouts={filteredWorkouts} 
            timeRange={timeRange}
          />

          {/* Summary Stats */}
          <div className="bg-gray-800 rounded-xl p-4">
            <button 
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="w-full flex items-center justify-between text-white font-medium mb-4 hover:text-blue-400 transition-colors"
            >
              <span>Split Summary</span>
              {isSummaryExpanded ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </button>
            
            {isSummaryExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {chartData.map((split) => (
                  <div key={split.name} className="bg-gray-700 rounded-lg p-4">
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
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <Activity size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">No Workout Data</h3>
          <p className="text-gray-400 mb-4">Complete some workouts following your {userSplit.name || 'split'} to see comparisons</p>
          <p className="text-gray-500 text-sm">Try selecting a different time range or log more workouts</p>
        </div>
      )}
    </div>
  )
}

export default SplitComparison
