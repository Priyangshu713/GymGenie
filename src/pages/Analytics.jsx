import React, { useState, useMemo } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import AppleCalendar from '../components/AppleCalendar'
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
  format
} from 'date-fns'

const Analytics = () => {
  const { workouts, stats } = useWorkout()
  const [timeRange, setTimeRange] = useState('30') // days
  const [selectedMetric, setSelectedMetric] = useState('workouts')
  const [customDate, setCustomDate] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

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
    const useDaily = timeRangeNum <= 30 // Use daily data for 30 days or less
    
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
      const maxStartDate = subDays(today, timeRangeNum - 1)
      const actualStartDate = earliestWorkout > maxStartDate ? earliestWorkout : maxStartDate
      
      // Generate daily data only for the period with actual activity
      const daysArray = []
      let currentDate = new Date(actualStartDate)
      
      while (currentDate <= today) {
        const dayKey = format(currentDate, 'MMM d')
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
          format(day.date, 'MMM d') === format(workoutDate, 'MMM d')
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
      console.log('Daily data order:', result.map(d => d.week))
      return result
    } else {
      // Use weekly data for longer time ranges
      const weeks = {}
      filteredWorkouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'MMM d')
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = { workouts: 0, exercises: 0, sets: 0, weight: 0, exerciseDetails: [] }
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
        .sort(([weekA], [weekB]) => {
          // Sort by week start date to ensure chronological order
          const dateA = new Date(`${weekA} ${new Date().getFullYear()}`)
          const dateB = new Date(`${weekB} ${new Date().getFullYear()}`)
          return dateA - dateB
        })
        .map(([week, data]) => ({
          week,
          ...data
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
              options={[
                { value: '0', label: 'Today' },
                { value: '3', label: 'Last 3 days' },
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '365', label: 'Last year' },
                { value: 'custom', label: 'Select specific date' }
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
            const { unlockedAchievements } = calculateAchievements(workouts)
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
