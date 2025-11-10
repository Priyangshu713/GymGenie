import React, { useState, useMemo, useEffect } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import { 
  Calendar, 
  TrendingUp, 
  Activity, 
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Zap,
  Brain,
  Sparkles,
  BarChart2,
  Target
} from 'lucide-react'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval,
  differenceInDays,
  subWeeks,
  addWeeks,
  isSameDay,
  parseISO
} from 'date-fns'
import MuscleBalancePieChart from '../components/MuscleBalancePieChart'
import { 
  analyzeMuscleBalance, 
  analyzeRecovery, 
  analyzeVolumeTrend 
} from '../services/analyticsAI'

const AdvancedAnalytics = () => {
  const { workouts } = useWorkout()
  const [selectedTab, setSelectedTab] = useState('muscle') // muscle, workout, exercise
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.
  const [aiInsights, setAiInsights] = useState({
    muscle: null,
    workout: null,
    exercise: null
  })
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    muscleEngagement: true,
    muscleBreakdown: false,
    workoutList: true,
    exerciseList: true
  })
  const [expandedCards, setExpandedCards] = useState({})

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // Calculate current week range
  const currentWeekStart = useMemo(() => {
    const baseDate = new Date()
    return startOfWeek(addWeeks(baseDate, selectedWeekOffset), { weekStartsOn: 1 })
  }, [selectedWeekOffset])

  const currentWeekEnd = useMemo(() => {
    return endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  }, [currentWeekStart])

  // Get workouts for current week
  const weekWorkouts = useMemo(() => {
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date)
      return isWithinInterval(workoutDate, {
        start: currentWeekStart,
        end: currentWeekEnd
      })
    })
  }, [workouts, currentWeekStart, currentWeekEnd])

  // Calculate lifetime statistics
  const lifetimeStats = useMemo(() => {
    let totalMinutes = 0
    let totalLifted = 0
    
    workouts.forEach(workout => {
      // Calculate duration in minutes
      if (workout.duration) {
        totalMinutes += workout.duration
      } else {
        // Estimate: 3 minutes per set on average
        const sets = workout.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)
        totalMinutes += sets * 3
      }

      // Calculate total weight lifted
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength') {
          exercise.sets?.forEach(set => {
            totalLifted += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })

    // Calculate week streak
    let weekStreak = 0
    if (workouts.length > 0) {
      const sortedWorkouts = [...workouts].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )
      
      // Check if there's a workout in the current week or last week
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
      const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 })
      
      const hasCurrentWeek = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.date)
        return isWithinInterval(workoutDate, { start: currentWeekStart, end: currentWeekEnd })
      })
      
      const hasLastWeek = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.date)
        return isWithinInterval(workoutDate, { start: lastWeekStart, end: lastWeekEnd })
      })
      
      // Only count streak if user has worked out in current or last week
      if (hasCurrentWeek || hasLastWeek) {
        // Start from the most recent week with a workout
        let startWeekOffset = hasCurrentWeek ? 0 : 1
        
        // Check each week going backwards from the start point
        for (let weekOffset = startWeekOffset; weekOffset < 52; weekOffset++) {
          const weekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 })
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
          
          const hasWorkoutInWeek = sortedWorkouts.some(workout => {
            const workoutDate = new Date(workout.date)
            return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd })
          })
          
          if (hasWorkoutInWeek) {
            weekStreak++
          } else {
            // Break streak when we find a week without workouts
            break
          }
        }
      }
    }

    return {
      workouts: workouts.length,
      minutes: totalMinutes,
      lifted: Math.round(totalLifted),
      weekStreak
    }
  }, [workouts])

  // Calculate weekly statistics
  const weeklyStats = useMemo(() => {
    let totalMinutes = 0
    let totalLifted = 0
    
    weekWorkouts.forEach(workout => {
      // Calculate duration in minutes
      if (workout.duration) {
        totalMinutes += workout.duration
      } else {
        const sets = workout.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)
        totalMinutes += sets * 3
      }

      // Calculate total weight lifted
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength') {
          exercise.sets?.forEach(set => {
            totalLifted += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })

    return {
      workouts: weekWorkouts.length,
      minutes: totalMinutes,
      lifted: Math.round(totalLifted),
      weekStreak: lifetimeStats.weekStreak
    }
  }, [weekWorkouts, lifetimeStats.weekStreak])

  // Calculate muscle engagement for visualization
  const muscleEngagement = useMemo(() => {
    const engagement = {}
    const maxSets = { value: 0 }

    // First pass: count sets per muscle group
    weekWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength' && exercise.muscleGroup) {
          const muscle = exercise.muscleGroup.toLowerCase()
          engagement[muscle] = (engagement[muscle] || 0) + (exercise.sets?.length || 0)
          if (engagement[muscle] > maxSets.value) {
            maxSets.value = engagement[muscle]
          }
        }
      })
    })

    // Second pass: normalize to 0-100 scale
    Object.keys(engagement).forEach(muscle => {
      engagement[muscle] = maxSets.value > 0 
        ? Math.round((engagement[muscle] / maxSets.value) * 100)
        : 0
    })

    return engagement
  }, [weekWorkouts])

  // Calculate muscle group breakdown
  const muscleBreakdown = useMemo(() => {
    const breakdown = {}

    weekWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.type === 'strength' && exercise.muscleGroup) {
          const muscle = exercise.muscleGroup
          if (!breakdown[muscle]) {
            breakdown[muscle] = {
              sets: 0,
              volume: 0,
              exercises: new Set()
            }
          }

          breakdown[muscle].sets += exercise.sets?.length || 0
          breakdown[muscle].exercises.add(exercise.name)
          
          exercise.sets?.forEach(set => {
            breakdown[muscle].volume += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })

    // Convert sets to arrays
    Object.keys(breakdown).forEach(muscle => {
      breakdown[muscle].exercises = Array.from(breakdown[muscle].exercises)
    })

    return breakdown
  }, [weekWorkouts])

  // Calculate exercise breakdown
  const exerciseBreakdown = useMemo(() => {
    const breakdown = {}

    weekWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!breakdown[exercise.name]) {
          breakdown[exercise.name] = {
            type: exercise.type,
            muscleGroup: exercise.muscleGroup,
            sets: 0,
            reps: 0,
            volume: 0,
            maxWeight: 0
          }
        }

        breakdown[exercise.name].sets += exercise.sets?.length || 0
        
        exercise.sets?.forEach(set => {
          breakdown[exercise.name].reps += set.reps || 0
          breakdown[exercise.name].volume += (set.weight || 0) * (set.reps || 0)
          if (set.weight && set.weight > breakdown[exercise.name].maxWeight) {
            breakdown[exercise.name].maxWeight = set.weight
          }
        })
      })
    })

    return breakdown
  }, [weekWorkouts])

  const handlePreviousWeek = () => {
    setSelectedWeekOffset(prev => prev - 1)
  }

  const handleNextWeek = () => {
    if (selectedWeekOffset < 0) {
      setSelectedWeekOffset(prev => prev + 1)
    }
  }

  // Load AI insights when tab changes or data updates
  useEffect(() => {
    const loadAIInsights = async () => {
      if (weekWorkouts.length === 0) return
      
      setLoadingInsights(true)
      try {
        if (selectedTab === 'muscle' && Object.keys(muscleBreakdown).length > 0) {
          const weeklyVolumes = {}
          Object.entries(muscleBreakdown).forEach(([muscle, data]) => {
            weeklyVolumes[muscle] = data.sets
          })
          const insight = await analyzeMuscleBalance({ weeklyVolumes })
          setAiInsights(prev => ({ ...prev, muscle: insight }))
        } else if (selectedTab === 'workout' && weekWorkouts.length > 0) {
          const totalVolume = weekWorkouts.reduce((sum, w) => 
            sum + w.exercises.reduce((s, e) => 
              s + (e.sets?.reduce((ss, set) => 
                ss + (set.weight || 0) * (set.reps || 0), 0
              ) || 0), 0
            ), 0
          )
          const insight = await analyzeRecovery({
            workoutFrequency: weekWorkouts.length,
            muscleFrequency: Object.keys(muscleBreakdown).length,
            totalVolume: Math.round(totalVolume)
          })
          setAiInsights(prev => ({ ...prev, workout: insight }))
        } else if (selectedTab === 'exercise' && Object.keys(exerciseBreakdown).length > 0) {
          const volumes = Object.values(exerciseBreakdown).map(e => e.volume)
          const insight = await analyzeVolumeTrend({
            weeklyVolumes: volumes.slice(0, 4),
            trend: 'varying'
          })
          setAiInsights(prev => ({ ...prev, exercise: insight }))
        }
      } catch (error) {
        console.error('AI insights error:', error)
      } finally {
        setLoadingInsights(false)
      }
    }

    loadAIInsights()
  }, [selectedTab, weekWorkouts.length, selectedWeekOffset])

  return (
    <div className="pb-32 bg-black min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 border-b border-gray-800 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Track your progress with AI insights</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg">
              <Brain size={16} className="text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">AI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-6">
        {/* Lifetime Workouts Section */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Clock size={20} className="text-orange-400 mr-2" />
            <h2 className="text-white text-lg font-semibold">Lifetime Workouts</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {lifetimeStats.workouts}
              </div>
              <div className="text-gray-400 text-sm mt-1">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {lifetimeStats.minutes}
              </div>
              <div className="text-gray-400 text-sm mt-1">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {lifetimeStats.lifted}
                <span className="text-lg ml-1">kg</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">Lifted</div>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-gray-800">
            <div className="text-2xl font-bold text-orange-400">
              {lifetimeStats.weekStreak}
            </div>
            <div className="text-gray-400 text-sm">Week Streak</div>
          </div>
        </div>

        {/* Weekly Report Section */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar size={20} className="text-purple-400 mr-2" />
              <div>
                <div className="text-sm text-gray-400">
                  {format(currentWeekStart, 'MMM dd')} - {format(currentWeekEnd, 'MMM dd')}
                </div>
              </div>
            </div>
            <button className="text-purple-400 text-sm font-medium flex items-center hover:text-purple-300">
              Weekly Report
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6 bg-gray-800/30 rounded-xl p-3">
            <button
              onClick={handlePreviousWeek}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-white text-sm font-semibold px-4">
              {selectedWeekOffset === 0 ? '📍 This Week' : 
               selectedWeekOffset === -1 ? '📅 Last Week' :
               `📅 ${Math.abs(selectedWeekOffset)} Weeks Ago`}
            </span>
            <button
              onClick={handleNextWeek}
              disabled={selectedWeekOffset >= 0}
              className={`p-2 rounded-lg transition-all ${
                selectedWeekOffset >= 0 
                  ? 'text-gray-600 cursor-not-allowed opacity-50' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {weeklyStats.workouts}
              </div>
              <div className="text-gray-400 text-sm mt-1">Workouts</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {weeklyStats.minutes}
              </div>
              <div className="text-gray-400 text-sm mt-1">Minutes</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {weeklyStats.lifted}
                <span className="text-lg ml-1">kg</span>
              </div>
              <div className="text-gray-400 text-sm mt-1">Lifted</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {weeklyStats.weekStreak}
              </div>
              <div className="text-gray-400 text-sm mt-1">Week Streak</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-800 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('muscle')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-lg transition-all ${
              selectedTab === 'muscle'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Target size={16} className="inline mr-2" />
            Muscle Tracker
          </button>
          <button
            onClick={() => setSelectedTab('workout')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-lg transition-all ${
              selectedTab === 'workout'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Dumbbell size={16} className="inline mr-2" />
            Workout Summary
          </button>
          <button
            onClick={() => setSelectedTab('exercise')}
            className={`flex-1 px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-lg transition-all ${
              selectedTab === 'exercise'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <BarChart2 size={16} className="inline mr-2" />
            Exercise Analytics
          </button>
        </div>

        {/* Muscle Tracker Tab */}
        {selectedTab === 'muscle' && (
          <div className="space-y-4">
            {/* Muscle Engagement Tracker */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
              <button
                onClick={() => toggleSection('muscleEngagement')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Target size={20} className="text-purple-400" />
                  </div>
                  <h3 className="text-white text-lg font-semibold">
                    Muscle Balance Distribution
                  </h3>
                </div>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform duration-300 ${
                    expandedSections.muscleEngagement ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {expandedSections.muscleEngagement && (
                <div className="px-6 pb-6 border-t border-gray-800/50">
                  {weekWorkouts.length > 0 ? (
                    <>
                      <MuscleBalancePieChart muscleData={
                        Object.entries(muscleBreakdown).reduce((acc, [muscle, data]) => {
                          acc[muscle] = data.sets
                          return acc
                        }, {})
                      } />
                      
                      {/* AI Insight for Muscle Tab */}
                      {aiInsights.muscle && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl flex items-start gap-3">
                          <Sparkles size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm mb-1">AI Insight</h4>
                            <p className="text-gray-300 text-sm">{aiInsights.muscle}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target size={24} className="text-gray-600" />
                      </div>
                      <p className="text-gray-500 font-medium">No data during this time period</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Muscle Group Details */}
            {Object.keys(muscleBreakdown).length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('muscleBreakdown')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <BarChart2 size={20} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white text-lg font-semibold">Muscle Group Breakdown</h3>
                      <p className="text-xs text-gray-400">{Object.keys(muscleBreakdown).length} muscle groups trained</p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-300 ${
                      expandedSections.muscleBreakdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {expandedSections.muscleBreakdown && (
                  <div className="px-6 pb-6 border-t border-gray-800/50">
                    <div className="relative mt-4">
                      <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                        {Object.entries(muscleBreakdown)
                          .sort(([, a], [, b]) => b.sets - a.sets)
                          .map(([muscle, data], index) => {
                            const muscleId = `muscle-${muscle}`
                            const isExpanded = expandedCards[muscleId]
                            return (
                              <div key={muscle} className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all overflow-hidden">
                                <button
                                  onClick={() => toggleCard(muscleId)}
                                  className="w-full p-4 text-left hover:bg-gray-700/30 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <span className="text-purple-400 font-bold text-sm">#{index + 1}</span>
                                      </div>
                                      <div>
                                        <h4 className="text-white font-semibold capitalize">{muscle}</h4>
                                        <p className="text-xs text-gray-400">{data.exercises.length} exercise{data.exercises.length !== 1 ? 's' : ''}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-purple-400">{data.sets}</div>
                                        <div className="text-xs text-gray-400">sets</div>
                                      </div>
                                      <ChevronDown 
                                        size={16} 
                                        className={`text-gray-400 transition-transform duration-300 ${
                                          isExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <div className="text-xs text-gray-400 mb-1">Total Volume</div>
                                    <div className="text-white font-semibold">{Math.round(data.volume).toLocaleString()} kg</div>
                                  </div>
                                </button>

                                {/* Expanded Exercise List */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 border-t border-gray-700/50 pt-3 space-y-2">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Exercises</div>
                                    {data.exercises.map((exerciseName, exIndex) => {
                                      // Find all instances of this exercise in the week's workouts
                                      const exerciseData = weekWorkouts.flatMap(w => 
                                        w.exercises.filter(e => e.name === exerciseName)
                                      )
                                      const totalSets = exerciseData.reduce((sum, e) => sum + (e.sets?.length || 0), 0)
                                      const totalVolume = exerciseData.reduce((sum, e) => 
                                        sum + (e.sets?.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0) || 0), 0
                                      )
                                      const allWeights = exerciseData.flatMap(e => 
                                        e.sets?.map(s => s.weight || 0) || []
                                      ).filter(w => w > 0)
                                      const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0
                                      
                                      return (
                                        <div key={exIndex} className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                              <h5 className="text-white font-medium text-sm">{exerciseName}</h5>
                                              <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full">
                                                  {totalSets} sets
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full">
                                                  {Math.round(totalVolume)} kg
                                                </span>
                                                {maxWeight > 0 && (
                                                  <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-300 rounded-full">
                                                    Max: {maxWeight} kg
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                      {/* Scroll Indicator */}
                      {Object.keys(muscleBreakdown).length > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-1">
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <ChevronRight size={12} className="transform rotate-90 animate-bounce" />
                            Scroll for more
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Workout Summary Tab */}
        {selectedTab === 'workout' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
              <button
                onClick={() => toggleSection('workoutList')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Dumbbell size={20} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white text-lg font-semibold">Workout Summary</h3>
                    <p className="text-xs text-gray-400">{weekWorkouts.length} workout{weekWorkouts.length !== 1 ? 's' : ''} this week</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingInsights && <div className="text-xs text-blue-400 flex items-center gap-2"><Brain size={14} className="animate-pulse" /></div>}
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-300 ${
                      expandedSections.workoutList ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              {expandedSections.workoutList && (
                <div className="px-6 pb-6 border-t border-gray-800/50">
                  {/* AI Insight for Workout Tab */}
                  {aiInsights.workout && (
                    <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl flex items-start gap-3">
                      <Sparkles size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm mb-1">AI Recovery Analysis</h4>
                        <p className="text-gray-300 text-sm">{aiInsights.workout}</p>
                      </div>
                    </div>
                  )}
                  
                  {weekWorkouts.length > 0 ? (
                <>
                  {/* Scrollable Container */}
                  <div className="relative">
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                      {weekWorkouts.map((workout, index) => {
                        const workoutId = `workout-${workout.id || index}`
                        const isExpanded = expandedCards[workoutId]
                        const totalVolume = workout.exercises.reduce((sum, ex) => 
                          sum + (ex.sets?.reduce((s, set) => 
                            s + (set.weight || 0) * (set.reps || 0), 0
                          ) || 0), 0
                        )
                        return (
                          <div key={workoutId} className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all overflow-hidden">
                            <button
                              onClick={() => toggleCard(workoutId)}
                              className="w-full p-4 text-left hover:bg-gray-700/30 transition-all"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Dumbbell size={14} className="text-blue-400" />
                                  </div>
                                  <div>
                                    <span className="text-white font-semibold text-sm block">
                                      {format(new Date(workout.date), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                <ChevronDown 
                                  size={16} 
                                  className={`text-gray-400 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-900/50 rounded-lg p-2.5">
                                  <div className="text-xs text-gray-400 mb-1">Sets</div>
                                  <div className="text-white font-semibold">
                                    {workout.exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0)}
                                  </div>
                                </div>
                                <div className="bg-gray-900/50 rounded-lg p-2.5">
                                  <div className="text-xs text-gray-400 mb-1">Volume</div>
                                  <div className="text-white font-semibold">
                                    {Math.round(totalVolume)} kg
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-700/50 pt-4 space-y-3">
                                {workout.exercises.map((exercise, exIndex) => {
                                  const exerciseSets = exercise.sets || []
                                  const maxWeight = Math.max(...exerciseSets.map(s => s.weight || 0))
                                  const minWeight = Math.min(...exerciseSets.filter(s => s.weight > 0).map(s => s.weight || 0)) || 0
                                  const totalReps = exerciseSets.reduce((sum, s) => sum + (s.reps || 0), 0)
                                  const exerciseVolume = exerciseSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)
                                  
                                  return (
                                    <div key={exIndex} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h4 className="text-white font-semibold text-sm mb-1">{exercise.name}</h4>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full">
                                              {exerciseSets.length} sets
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-300 rounded-full">
                                              {totalReps} total reps
                                            </span>
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full">
                                              {Math.round(exerciseVolume)} kg volume
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Weight Stats */}
                                      {maxWeight > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                          <div className="bg-gray-800/50 rounded p-2">
                                            <div className="text-xs text-gray-400">Max Weight</div>
                                            <div className="text-sm font-semibold text-green-400">{maxWeight} kg</div>
                                          </div>
                                          <div className="bg-gray-800/50 rounded p-2">
                                            <div className="text-xs text-gray-400">Min Weight</div>
                                            <div className="text-sm font-semibold text-orange-400">{minWeight} kg</div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Set Details */}
                                      <div className="space-y-1.5">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Set Details</div>
                                        {exerciseSets.map((set, setIndex) => (
                                          <div key={setIndex} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                                            <span className="text-xs font-bold text-gray-400">Set {setIndex + 1}</span>
                                            <div className="flex items-center gap-4">
                                              <span className="text-sm text-white">
                                                <span className="text-gray-400 text-xs">Weight:</span> <span className="font-semibold">{set.weight || 0}</span> kg
                                              </span>
                                              <span className="text-sm text-white">
                                                <span className="text-gray-400 text-xs">Reps:</span> <span className="font-semibold">{set.reps || 0}</span>
                                              </span>
                                              <span className="text-xs text-blue-300">
                                                {(set.weight || 0) * (set.reps || 0)} kg
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {/* Scroll Indicator */}
                    {weekWorkouts.length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ChevronRight size={12} className="transform rotate-90 animate-bounce" />
                          Scroll for more
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dumbbell size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">No workouts during this time period</p>
                  <p className="text-gray-600 text-sm mt-1">Start logging workouts to see your summary</p>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exercise Analytics Tab */}
        {selectedTab === 'exercise' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
              <button
                onClick={() => toggleSection('exerciseList')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Activity size={20} className="text-green-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white text-lg font-semibold">Exercise Analytics</h3>
                    <p className="text-xs text-gray-400">{Object.keys(exerciseBreakdown).length} exercise{Object.keys(exerciseBreakdown).length !== 1 ? 's' : ''} tracked</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {loadingInsights && <div className="text-xs text-green-400 flex items-center gap-2"><Brain size={14} className="animate-pulse" /></div>}
                  <ChevronDown 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-300 ${
                      expandedSections.exerciseList ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              
              {expandedSections.exerciseList && (
                <div className="px-6 pb-6 border-t border-gray-800/50">
                  {/* AI Insight for Exercise Tab */}
                  {aiInsights.exercise && (
                    <div className="mt-4 mb-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl flex items-start gap-3">
                      <Sparkles size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm mb-1">AI Volume Analysis</h4>
                        <p className="text-gray-300 text-sm">{aiInsights.exercise}</p>
                      </div>
                    </div>
                  )}
                  
                  {Object.keys(exerciseBreakdown).length > 0 ? (
                <>
                  {/* Scrollable Container */}
                  <div className="relative">
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                      {Object.entries(exerciseBreakdown)
                        .sort(([, a], [, b]) => b.volume - a.volume)
                        .map(([exercise, data], index) => {
                          const exerciseId = `exercise-${exercise.replace(/\s+/g, '-')}`
                          const isExpanded = expandedCards[exerciseId]
                          
                          // Get all instances of this exercise with their sets
                          const exerciseInstances = weekWorkouts.flatMap(w => 
                            w.exercises.filter(e => e.name === exercise).map(e => ({
                              date: w.date,
                              sets: e.sets || []
                            }))
                          )
                          
                          const allWeights = exerciseInstances.flatMap(inst => 
                            inst.sets.map(s => s.weight || 0)
                          ).filter(w => w > 0)
                          const minWeight = allWeights.length > 0 ? Math.min(...allWeights) : 0
                          const avgWeight = allWeights.length > 0 ? (allWeights.reduce((a, b) => a + b, 0) / allWeights.length) : 0
                          
                          return (
                            <div key={exercise} className="bg-gradient-to-br from-gray-800 to-gray-800/80 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-all overflow-hidden">
                              <button
                                onClick={() => toggleCard(exerciseId)}
                                className="w-full p-4 text-left hover:bg-gray-700/30 transition-all"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-green-400">#{index + 1}</span>
                                      <h4 className="text-white font-semibold text-sm">{exercise}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-300 capitalize">
                                        {data.muscleGroup}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                      <Activity size={18} className="text-green-400" />
                                    </div>
                                    <ChevronDown 
                                      size={16} 
                                      className={`text-gray-400 transition-transform duration-300 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <div className="text-xs text-gray-400 mb-1">Sets</div>
                                    <div className="text-white font-semibold">{data.sets}</div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <div className="text-xs text-gray-400 mb-1">Reps</div>
                                    <div className="text-white font-semibold">{data.reps}</div>
                                  </div>
                                  <div className="bg-gray-900/50 rounded-lg p-2.5">
                                    <div className="text-xs text-gray-400 mb-1">Volume</div>
                                    <div className="text-white font-semibold">{Math.round(data.volume)} kg</div>
                                  </div>
                                  {data.maxWeight > 0 && (
                                    <div className="bg-gray-900/50 rounded-lg p-2.5">
                                      <div className="text-xs text-gray-400 mb-1">Max Weight</div>
                                      <div className="text-white font-semibold">{data.maxWeight} kg</div>
                                    </div>
                                  )}
                                </div>
                              </button>

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-700/50 pt-4 space-y-3">
                                  {/* Weight Statistics */}
                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-gray-400 mb-1">Max</div>
                                      <div className="text-sm font-semibold text-green-400">{data.maxWeight} kg</div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-gray-400 mb-1">Avg</div>
                                      <div className="text-sm font-semibold text-blue-400">{Math.round(avgWeight)} kg</div>
                                    </div>
                                    <div className="bg-gray-900/50 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-gray-400 mb-1">Min</div>
                                      <div className="text-sm font-semibold text-orange-400">{minWeight} kg</div>
                                    </div>
                                  </div>

                                  {/* Session History */}
                                  <div>
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Session History</div>
                                    <div className="space-y-2">
                                      {exerciseInstances.map((instance, instIndex) => (
                                        <div key={instIndex} className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
                                          <div className="text-xs text-gray-400 mb-2">
                                            {format(new Date(instance.date), 'MMM dd, yyyy')}
                                          </div>
                                          <div className="space-y-1">
                                            {instance.sets.map((set, setIndex) => (
                                              <div key={setIndex} className="flex items-center justify-between text-sm">
                                                <span className="text-xs font-bold text-gray-500">Set {setIndex + 1}</span>
                                                <div className="flex items-center gap-3">
                                                  <span className="text-white">
                                                    <span className="text-gray-400 text-xs">Weight:</span> <span className="font-semibold">{set.weight || 0}</span> kg
                                                  </span>
                                                  <span className="text-white">
                                                    <span className="text-gray-400 text-xs">Reps:</span> <span className="font-semibold">{set.reps || 0}</span>
                                                  </span>
                                                  <span className="text-xs text-green-300 font-semibold">
                                                    {(set.weight || 0) * (set.reps || 0)} kg
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                    {/* Scroll Indicator */}
                    {Object.keys(exerciseBreakdown).length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-2">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ChevronRight size={12} className="transform rotate-90 animate-bounce" />
                          Scroll for more
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">No exercises during this time period</p>
                  <p className="text-gray-600 text-sm mt-1">Complete workouts to see exercise analytics</p>
                </div>
              )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedAnalytics
