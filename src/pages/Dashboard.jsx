import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import ActivityRings from '../components/ActivityRings'
import DateRangeSelector from '../components/DateRangeSelector'
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

  const todaysWorkouts = workouts.filter(workout => 
    isToday(new Date(workout.date))
  )

  const thisWeeksWorkouts = workouts.filter(workout => 
    isThisWeek(new Date(workout.date))
  )

  const recentWorkouts = workouts
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
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor: '#FA114F'}}></div>
            <div className="fitness-metric-small apple-red">{Math.round(selectedVolume).toLocaleString()}</div>
            <div className="fitness-label">Volume (kg)</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor: '#92E82A'}}></div>
            <div className="fitness-metric-small apple-green">{selectedFrequency}</div>
            <div className="fitness-label">Frequency</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor: '#40CBE0'}}></div>
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

          <Link to="/insights" className="fitness-card hover:bg-gray-800 transition-all active:scale-95 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Insights</h3>
                  <p className="text-gray-400 text-sm">Get personalized tips</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </div>
          </Link>
        </div>

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
              .sort(([,a], [,b]) => b - a)
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
                
                const sortedGroups = Object.entries(muscleGroups).sort(([,a], [,b]) => b - a)
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
