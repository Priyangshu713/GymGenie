import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkout } from '../context/WorkoutContext'
import ActivityRings from '../components/ActivityRings'
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
  BarChart3
} from 'lucide-react'
import { format, isToday, isThisWeek } from 'date-fns'

const Dashboard = () => {
  const { workouts, stats, currentWorkout } = useWorkout()
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [showMuscleDetails, setShowMuscleDetails] = useState(false)

  const todaysWorkouts = workouts.filter(workout => 
    isToday(new Date(workout.date))
  )

  const thisWeeksWorkouts = workouts.filter(workout => 
    isThisWeek(new Date(workout.date))
  )

  const recentWorkouts = workouts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3)

  // Calculate bodybuilding metrics for rings
  const weeklyVolume = thisWeeksWorkouts.reduce((total, workout) => {
    return total + workout.exercises.reduce((exerciseTotal, exercise) => {
      return exerciseTotal + exercise.sets.reduce((setTotal, set) => {
        return setTotal + ((set.weight || 0) * (set.reps || 0))
      }, 0)
    }, 0)
  }, 0)
  
  const weeklyFrequency = thisWeeksWorkouts.reduce((total, workout) => total + workout.exercises.length, 0)
  
  const avgIntensity = thisWeeksWorkouts.length > 0 ? thisWeeksWorkouts.reduce((total, workout) => {
    if (workout.exercises.length === 0) return total
    const workoutRPE = workout.exercises.reduce((sum, ex) => {
      if (ex.sets.length === 0) return sum
      const avgRPE = ex.sets.reduce((rpeSum, set) => rpeSum + (set.difficulty || 0), 0) / ex.sets.length
      return sum + avgRPE
    }, 0) / workout.exercises.length
    return total + workoutRPE
  }, 0) / thisWeeksWorkouts.length : 0

  // Ring progress based on bodybuilding metrics (KG)
  const volumeProgress = Math.min((weeklyVolume / 4500) * 100, 100) // Target: 4.5k kg/week
  const frequencyProgress = Math.min((weeklyFrequency / 20) * 100, 100) // Target: 20 exercises/week  
  const intensityProgress = Math.min((avgIntensity / 10) * 100, 100) // Target: Difficulty 8-10

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Header - Apple Fitness Style */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="fitness-title">Summary</h1>
            <p className="fitness-subtitle">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <Link to="/profile" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
          </Link>
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
            <div className="fitness-metric-small apple-red">{Math.round(weeklyVolume).toLocaleString()}</div>
            <div className="fitness-label">Volume (kg)</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{backgroundColor: '#92E82A'}}></div>
            <div className="fitness-metric-small apple-green">{weeklyFrequency}</div>
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
                        {workout.exercises.length} exercises
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

        {/* Recent Activity - Apple Style */}
        {recentWorkouts.length > 0 && (
          <div className="fitness-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">History</h2>
              <Link
                to="/analytics"
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
                        {workout.exercises.length} exercises
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
