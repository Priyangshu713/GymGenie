import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import AISmartTip from '../components/AISmartTip'
import { isBodyweightExercise } from '../data/exercises'
import {
  ArrowLeft,
  Calendar,
  Activity,
  Clock,
  Target,
  TrendingUp,
  Dumbbell,
  Timer,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfWeek, startOfMonth, subDays } from 'date-fns'

const History = () => {
  const { workouts } = useWorkout()
  const [expandedWorkout, setExpandedWorkout] = useState(null)
  const [sortBy, setSortBy] = useState('date') // date, duration, volume
  const [filterBy, setFilterBy] = useState('all') // all, strength, cardio
  const [historyInsights, setHistoryInsights] = useState([])

  // Sort and filter workouts
  const processedWorkouts = useMemo(() => {
    let filtered = workouts

    // Filter by type
    if (filterBy === 'strength') {
      filtered = workouts.filter(workout =>
        workout.exercises.some(ex => ex.type === 'strength')
      )
    } else if (filterBy === 'cardio') {
      filtered = workouts.filter(workout =>
        workout.exercises.some(ex => ex.type === 'cardio')
      )
    }

    // Sort workouts
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date)
        case 'duration':
          const aDuration = a.exercises.reduce((total, ex) =>
            total + ex.sets.reduce((setTotal, set) => setTotal + (set.duration || 0), 0), 0
          )
          const bDuration = b.exercises.reduce((total, ex) =>
            total + ex.sets.reduce((setTotal, set) => setTotal + (set.duration || 0), 0), 0
          )
          return bDuration - aDuration
        case 'volume':
          const aVolume = a.exercises.reduce((total, ex) =>
            total + ex.sets.reduce((setTotal, set) => setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0
          )
          const bVolume = b.exercises.reduce((total, ex) =>
            total + ex.sets.reduce((setTotal, set) => setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0
          )
          return bVolume - aVolume
        default:
          return new Date(b.date) - new Date(a.date)
      }
    })

    return sorted
  }, [workouts, sortBy, filterBy])

  // Group workouts by time periods
  const groupedWorkouts = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    }

    processedWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date)

      if (isToday(workoutDate)) {
        groups.today.push(workout)
      } else if (isYesterday(workoutDate)) {
        groups.yesterday.push(workout)
      } else if (isThisWeek(workoutDate)) {
        groups.thisWeek.push(workout)
      } else if (isThisMonth(workoutDate)) {
        groups.thisMonth.push(workout)
      } else {
        groups.older.push(workout)
      }
    })

    return groups
  }, [processedWorkouts])

  const getWorkoutStats = (workout) => {
    const totalSets = workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)
    const totalVolume = workout.exercises.reduce((total, ex) =>
      total + ex.sets.reduce((setTotal, set) => setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0
    )
    const totalDuration = workout.exercises.reduce((total, ex) =>
      total + ex.sets.reduce((setTotal, set) => setTotal + (set.duration || 0), 0), 0
    )
    const strengthExercises = workout.exercises.filter(ex => ex.type === 'strength')
    const cardioExercises = workout.exercises.filter(ex => ex.type === 'cardio')

    return {
      totalSets,
      totalVolume,
      totalDuration,
      strengthCount: strengthExercises.length,
      cardioCount: cardioExercises.length,
      exercises: workout.exercises
    }
  }

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d, yyyy')
  }

  // Invisible AI: History insights (no API key required)
  useEffect(() => {
    if (processedWorkouts.length === 0) {
      setHistoryInsights([])
      return
    }

    const insights = []

    // 1) Workout gap detection
    if (processedWorkouts.length >= 2) {
      const sortedWorkouts = [...processedWorkouts].sort((a, b) => new Date(b.date) - new Date(a.date))
      const mostRecent = new Date(sortedWorkouts[0].date)
      const secondRecent = new Date(sortedWorkouts[1].date)
      const daysGap = Math.floor((mostRecent - secondRecent) / (1000 * 60 * 60 * 24))

      if (daysGap >= 4 && daysGap < 7 && !insights.find(i => i.id === 'gap-detected')) {
        insights.push({
          id: 'gap-detected',
          type: 'motivation',
          text: `${daysGap} days since last workout. Consistency is key—plan your next session!`
        })
      } else if (daysGap >= 7 && !insights.find(i => i.id === 'long-gap')) {
        insights.push({
          id: 'long-gap',
          type: 'motivation',
          text: `${daysGap} days since last workout. Time to get back on track—start with a lighter session.`
        })
      }
    }

    // 2) Progression detection across workouts
    if (processedWorkouts.length >= 5) {
      const recent5 = [...processedWorkouts]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-5)

      // Track common exercises across workouts
      const exerciseProgress = {}
      recent5.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercise.type === 'strength' && exercise.sets.length > 0) {
            const exerciseName = exercise.name.toLowerCase()
            if (!exerciseProgress[exerciseName]) {
              exerciseProgress[exerciseName] = []
            }

            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0))
            const totalVolume = exercise.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)

            exerciseProgress[exerciseName].push({
              date: new Date(workout.date),
              maxWeight,
              volume: totalVolume
            })
          }
        })
      })

      // Find exercises with clear progression
      Object.entries(exerciseProgress).forEach(([name, sessions]) => {
        if (sessions.length >= 3) {
          const sorted = sessions.sort((a, b) => a.date - b.date)
          const firstWeight = sorted[0].maxWeight
          const lastWeight = sorted[sorted.length - 1].maxWeight

          if (firstWeight > 0 && lastWeight > firstWeight * 1.15 && !insights.find(i => i.id === `progress-${name}`)) {
            const increase = lastWeight - firstWeight
            insights.push({
              id: `progress-${name}`,
              type: 'motivation',
              text: `Great progress on ${sessions[0].volume > 0 ? name.split(' ')[0] : name}! +${Math.round(increase)}kg over ${sessions.length} sessions. 💪`
            })
            return // Only show one progression insight at a time
          }
        }
      })
    }

    // 3) Volume consistency
    if (processedWorkouts.length >= 7) {
      const recent7 = processedWorkouts.slice(0, 7)
      const volumes = recent7.map(w =>
        w.exercises.reduce((sum, e) =>
          sum + e.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0)
      )

      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
      const minVolume = Math.min(...volumes)
      const maxVolume = Math.max(...volumes)
      const variance = ((maxVolume - minVolume) / avgVolume) * 100

      if (variance > 60 && !insights.find(i => i.id === 'volume-inconsistent')) {
        insights.push({
          id: 'volume-inconsistent',
          type: 'form',
          text: `Volume varies ${Math.round(variance)}% across sessions. More consistent volume = better progress.`
        })
      }
    }

    // 4) Exercise variety analysis
    const uniqueExercises = new Set()
    const recent10 = processedWorkouts.slice(0, 10)
    recent10.forEach(workout => {
      workout.exercises.forEach(ex => {
        uniqueExercises.add(ex.name.toLowerCase())
      })
    })

    if (recent10.length >= 5 && uniqueExercises.size < 8 && !insights.find(i => i.id === 'low-variety')) {
      insights.push({
        id: 'low-variety',
        type: 'form',
        text: `Only ${uniqueExercises.size} unique exercises in last 5 workouts. Add variety to prevent plateaus.`
      })
    } else if (uniqueExercises.size >= 15 && !insights.find(i => i.id === 'high-variety')) {
      insights.push({
        id: 'high-variety',
        type: 'motivation',
        text: `Excellent variety! ${uniqueExercises.size} different exercises. Great for overall development!`
      })
    }

    // 5) Frequency pattern
    const last14Days = []
    const now = new Date()
    for (let i = 0; i < 14; i++) {
      const date = subDays(now, i)
      const dayWorkouts = workouts.filter(w => {
        const wDate = new Date(w.date)
        return wDate.toDateString() === date.toDateString()
      })
      last14Days.push(dayWorkouts.length)
    }
    const activeDays = last14Days.filter(count => count > 0).length
    const workoutsPerWeek = (activeDays / 14) * 7

    if (workoutsPerWeek >= 4 && workoutsPerWeek < 5 && !insights.find(i => i.id === 'frequency-good')) {
      insights.push({
        id: 'frequency-good',
        type: 'motivation',
        text: `Averaging ${workoutsPerWeek.toFixed(1)} workouts/week. Excellent frequency for growth!`
      })
    } else if (workoutsPerWeek < 3 && processedWorkouts.length >= 10 && !insights.find(i => i.id === 'frequency-low')) {
      insights.push({
        id: 'frequency-low',
        type: 'motivation',
        text: `Averaging ${workoutsPerWeek.toFixed(1)} workouts/week. Aim for 3-4x/week for optimal results.`
      })
    }

    // Keep only most relevant (max 2 at a time)
    setHistoryInsights(insights.slice(0, 2))
  }, [processedWorkouts, workouts])

  const WorkoutCard = ({ workout }) => {
    const stats = getWorkoutStats(workout)
    const isExpanded = expandedWorkout === workout.id
    const workoutDate = new Date(workout.date)
    const cardRef = useRef(null)

    // Handle smooth scrolling when expanding
    const handleToggleExpand = () => {
      const wasExpanded = isExpanded
      setExpandedWorkout(isExpanded ? null : workout.id)

      // If we're expanding (not collapsing), scroll the card into view after a short delay
      if (!wasExpanded) {
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            })
          }
        }, 100) // Small delay to allow the expansion animation to start
      }
    }

    return (
      <div ref={cardRef} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <button
          onClick={handleToggleExpand}
          className="w-full p-4 text-left hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {getDateLabel(workoutDate)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {format(workoutDate, 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-white font-semibold">{stats.totalSets}</p>
                <p className="text-gray-400 text-xs">sets</p>
              </div>
              {isExpanded ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">{workout.exercises.length}</div>
              <div className="text-gray-400 text-xs">exercises</div>
            </div>
            {stats.totalVolume > 0 && (
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{Math.round(stats.totalVolume).toLocaleString()}</div>
                <div className="text-gray-400 text-xs">kg volume</div>
              </div>
            )}
            {stats.totalDuration > 0 && (
              <div className="text-center">
                <div className="text-orange-400 font-bold text-lg">{stats.totalDuration}</div>
                <div className="text-gray-400 text-xs">min cardio</div>
              </div>
            )}
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-700 p-4 bg-gray-850">
            <div className="space-y-4">
              {/* Exercise Breakdown */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Target size={16} className="mr-2 text-blue-400" />
                  Exercises ({workout.exercises.length})
                </h4>
                <div className="space-y-2">
                  {workout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {exercise.type === 'strength' ? (
                            <Dumbbell size={14} className="text-blue-400" />
                          ) : (
                            <Timer size={14} className="text-orange-400" />
                          )}
                          <span className="text-white font-medium">{exercise.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm capitalize">{exercise.muscleGroup}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{exercise.sets.length} sets</span>
                        <div className="flex items-center space-x-4 text-gray-400">
                          {exercise.type === 'strength' && (
                            <>
                              {(() => {
                                const canBeBodyweight = isBodyweightExercise(exercise.name)
                                const bodyweightSets = exercise.sets.filter(set => set.isBodyweight || (canBeBodyweight && (set.weight === 0 || set.weight === undefined)))
                                const weightedSets = exercise.sets.filter(set => !set.isBodyweight && set.weight > 0)

                                if (bodyweightSets.length === exercise.sets.length) {
                                  // All sets are bodyweight
                                  const hasAdditionalWeight = exercise.sets.some(set => set.weight > 0);
                                  const bodyweight = JSON.parse(localStorage.getItem('gymgenie-measurements'))?.weight || 0;
                                  if (hasAdditionalWeight) {
                                    const avgAdditionalWeight = (exercise.sets.reduce((total, set) => total + (set.weight || 0), 0) / exercise.sets.length).toFixed(1);
                                    const totalWeight = (parseFloat(bodyweight) + parseFloat(avgAdditionalWeight)).toFixed(1);
                                    return <span>💪 {parseFloat(totalWeight).toFixed(1)}kg <span className="text-xs text-gray-400">(BW +{avgAdditionalWeight}kg)</span></span>;
                                  }
                                  return <span>💪 {parseFloat(bodyweight).toFixed(1)}kg</span>;
                                } else if (weightedSets.length === exercise.sets.length) {
                                  // All sets are weighted
                                  const avgWeight = (exercise.sets.reduce((total, set) => {
                                    // If it's a bodyweight exercise with additional weight, add bodyweight
                                    if (isBodyweightExercise(exercise.name) && set.isBodyweight) {
                                      const bodyweight = JSON.parse(localStorage.getItem('gymgenie-measurements'))?.weight || 0;
                                      return total + bodyweight + (set.weight || 0);
                                    }
                                    return total + (set.weight || 0);
                                  }, 0) / exercise.sets.length).toFixed(1);
                                  return <span>{avgWeight} kg/set (avg)</span>;
                                } else {
                                  // Mixed bodyweight and weighted
                                  const avgBodyweightAdditional = bodyweightSets.length > 0
                                    ? (bodyweightSets.reduce((total, set) => total + (set.weight || 0), 0) / bodyweightSets.length).toFixed(1)
                                    : 0;
                                  const avgWeighted = weightedSets.length > 0
                                    ? (weightedSets.reduce((total, set) => total + (set.weight || 0), 0) / weightedSets.length).toFixed(1)
                                    : 0;

                                  let displayText = [];
                                  if (bodyweightSets.length > 0) {
                                    if (avgBodyweightAdditional > 0) {
                                      displayText.push(`${bodyweightSets.length}x💪+${avgBodyweightAdditional}kg`);
                                    } else {
                                      displayText.push(`${bodyweightSets.length}x💪`);
                                    }
                                  }
                                  if (weightedSets.length > 0) {
                                    displayText.push(`${weightedSets.length}x${avgWeighted}kg`);
                                  }

                                  return <span>{displayText.join(' + ')}</span>;
                                }
                              })()}
                              <span>RPE {(exercise.sets.reduce((total, set) => total + (set.difficulty || 0), 0) / exercise.sets.length).toFixed(1)}</span>
                            </>
                          )}
                          {exercise.type === 'cardio' && (
                            <>
                              <span>{exercise.sets.reduce((total, set) => total + (set.duration || 0), 0)} min</span>
                              <span>{exercise.sets.reduce((total, set) => total + (set.distance || 0), 0).toFixed(1)} km</span>
                              {exercise.sets[0]?.timing && (
                                <span className="flex items-center space-x-1">
                                  {exercise.sets[0].timing === 'before' ? '🔥' : '💪'}
                                  <span>{exercise.sets[0].timing}</span>
                                </span>
                              )}
                              {exercise.sets[0]?.intensity && (
                                <span className="flex items-center space-x-1">
                                  {exercise.sets[0].intensity === 'fast' ? '⚡' : '🐌'}
                                  <span>{exercise.sets[0].intensity}</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout Summary */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-600">
                {stats.strengthCount > 0 && (
                  <div className="bg-blue-900/30 rounded-lg p-3 text-center">
                    <div className="text-blue-400 font-bold text-lg">{stats.strengthCount}</div>
                    <div className="text-blue-300 text-xs">Strength Exercises</div>
                  </div>
                )}
                {stats.cardioCount > 0 && (
                  <div className="bg-orange-900/30 rounded-lg p-3 text-center">
                    <div className="text-orange-400 font-bold text-lg">{stats.cardioCount}</div>
                    <div className="text-orange-300 text-xs">Cardio Exercises</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const WorkoutGroup = ({ title, workouts, icon: Icon }) => {
    if (workouts.length === 0) return null

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3 px-1">
          <Icon size={16} className="text-gray-400" />
          <h3 className="text-white font-semibold">{title}</h3>
          <span className="text-gray-500 text-sm">({workouts.length})</span>
        </div>
        <div className="space-y-3">
          {workouts.map(workout => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={18} className="text-white" />
            </Link>
            <div>
              <h1 className="fitness-title">Workout History</h1>
              <p className="fitness-subtitle">{processedWorkouts.length} total workouts</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <AppleDropdown
            label="Filter by type"
            value={filterBy}
            onChange={setFilterBy}
            options={[
              { value: 'all', label: 'All Workouts' },
              { value: 'strength', label: 'Strength Only' },
              { value: 'cardio', label: 'Cardio Only' }
            ]}
            placeholder="Select filter"
          />
          <AppleDropdown
            label="Sort by"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'date', label: 'Date (Newest)' },
              { value: 'volume', label: 'Volume (Highest)' },
              { value: 'duration', label: 'Duration (Longest)' }
            ]}
            placeholder="Select sort"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <div className="text-blue-400 font-bold text-lg">{processedWorkouts.length}</div>
            <div className="text-gray-400 text-xs">Total Workouts</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <div className="text-green-400 font-bold text-lg">
              {Math.round(processedWorkouts.reduce((total, w) => total + getWorkoutStats(w).totalVolume, 0)).toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs">Total Volume (kg)</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <div className="text-orange-400 font-bold text-lg">
              {Math.round(processedWorkouts.reduce((total, w) => total + getWorkoutStats(w).totalDuration, 0))}
            </div>
            <div className="text-gray-400 text-xs">Cardio Time (min)</div>
          </div>
        </div>
      </div>

      {/* Invisible AI History Insights */}
      <div className="px-4 mb-4 space-y-3">
        {historyInsights.map((insight) => (
          <AISmartTip
            key={insight.id}
            tip={insight.text}
            type={insight.type}
            onDismiss={() => setHistoryInsights(prev => prev.filter(i => i.id !== insight.id))}
          />
        ))}
      </div>

      {/* Workout Groups */}
      <div className="px-4">
        {processedWorkouts.length > 0 ? (
          <>
            <WorkoutGroup title="Today" workouts={groupedWorkouts.today} icon={Clock} />
            <WorkoutGroup title="Yesterday" workouts={groupedWorkouts.yesterday} icon={Calendar} />
            <WorkoutGroup title="This Week" workouts={groupedWorkouts.thisWeek} icon={TrendingUp} />
            <WorkoutGroup title="This Month" workouts={groupedWorkouts.thisMonth} icon={Calendar} />
            <WorkoutGroup title="Older" workouts={groupedWorkouts.older} icon={Calendar} />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={24} className="text-gray-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">No workouts found</h3>
            <p className="text-gray-400 mb-6">
              {filterBy !== 'all'
                ? `No ${filterBy} workouts to display. Try changing the filter.`
                : 'Start logging workouts to see your history here.'
              }
            </p>
            <Link
              to="/log"
              className="fitness-button inline-flex items-center"
            >
              <Activity size={16} className="mr-2" />
              Start Workout
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default History
