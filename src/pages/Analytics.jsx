import React, { useState, useMemo } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  Activity,
  PieChart
} from 'lucide-react'
import WorkoutChart from '../components/WorkoutChart'
import MuscleGroupChart from '../components/MuscleGroupChart'
import ProgressChart from '../components/ProgressChart'
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  subMonths,
  isWithinInterval,
  isAfter,
  format
} from 'date-fns'

const Analytics = () => {
  const { workouts, stats } = useWorkout()
  const [timeRange, setTimeRange] = useState('30') // days
  const [selectedMetric, setSelectedMetric] = useState('workouts')

  const filteredWorkouts = useMemo(() => {
    const cutoffDate = subDays(new Date(), parseInt(timeRange))
    return workouts.filter(workout => 
      isAfter(new Date(workout.date), cutoffDate)
    )
  }, [workouts, timeRange])

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
    const weeks = {}
    filteredWorkouts.forEach(workout => {
      const weekStart = startOfWeek(new Date(workout.date))
      const weekKey = format(weekStart, 'MMM d')
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { workouts: 0, exercises: 0, sets: 0, weight: 0 }
      }
      
      weeks[weekKey].workouts += 1
      weeks[weekKey].exercises += workout.exercises.length
      
      workout.exercises.forEach(exercise => {
        weeks[weekKey].sets += exercise.sets.length
        if (exercise.type === 'strength') {
          exercise.sets.forEach(set => {
            weeks[weekKey].weight += (set.weight || 0) * (set.reps || 0)
          })
        }
      })
    })
    
    return Object.entries(weeks).map(([week, data]) => ({
      week,
      ...data
    }))
  }, [filteredWorkouts])

  const exerciseTypeData = useMemo(() => {
    const types = { strength: 0, cardio: 0 }
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        types[exercise.type] = (types[exercise.type] || 0) + 1
      })
    })
    return types
  }, [filteredWorkouts])

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
              onChange={(value) => setTimeRange(value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 3 months' },
                { value: '365', label: 'Last year' }
              ]}
              placeholder="Select time range"
              className="min-w-[140px]"
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
        {/* Workout Frequency Chart */}
        <div className="fitness-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center">
              <TrendingUp size={20} className="mr-2 text-blue-400" />
              Workout Frequency
            </h2>
            <div className="flex bg-gray-900 rounded-xl p-1 min-w-0">
              {['workouts', 'exercises', 'sets', 'weight'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`flex-1 px-1.5 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 min-w-0 ${
                    selectedMetric === metric
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="truncate block">
                    {metric === 'weight' ? 'Weight' : metric.charAt(0).toUpperCase() + metric.slice(1)}
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

        {/* Exercise Type Distribution - Apple Style */}
        <div className="fitness-card">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <Activity size={20} className="mr-2 text-blue-400" />
            Training Split
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric apple-red mb-1">
                {exerciseTypeData.strength}
              </div>
              <div className="fitness-label">Strength</div>
              <div className="text-xs apple-gray mt-1">
                {exerciseTypeData.strength + exerciseTypeData.cardio > 0 
                  ? Math.round((exerciseTypeData.strength / (exerciseTypeData.strength + exerciseTypeData.cardio)) * 100)
                  : 0}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-800 rounded-xl">
              <div className="fitness-metric apple-green mb-1">
                {exerciseTypeData.cardio}
              </div>
              <div className="fitness-label">Cardio</div>
              <div className="text-xs apple-gray mt-1">
                {exerciseTypeData.strength + exerciseTypeData.cardio > 0 
                  ? Math.round((exerciseTypeData.cardio / (exerciseTypeData.strength + exerciseTypeData.cardio)) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>

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

        {/* Recent Achievements */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Achievements
          </h2>
          
          <div className="space-y-3">
            {filteredWorkouts.length >= 5 && (
              <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  🏆
                </div>
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Consistency Champion
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">
                    Completed {filteredWorkouts.length} workouts in the last {timeRange} days
                  </p>
                </div>
              </div>
            )}
            
            {Object.keys(muscleGroupData).length >= 3 && (
              <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  💪
                </div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Well-Rounded Trainer
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Trained {Object.keys(muscleGroupData).length} different muscle groups
                  </p>
                </div>
              </div>
            )}
            
            {exerciseTypeData.strength > 0 && exerciseTypeData.cardio > 0 && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  ⚡
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Balanced Approach
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Combined strength training with cardio exercises
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
