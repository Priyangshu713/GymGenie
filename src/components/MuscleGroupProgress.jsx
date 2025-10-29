import React, { useState, useMemo, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  Activity,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import AISmartTip from './AISmartTip'
import { exerciseDatabase } from '../data/exercises'
import { subDays, isAfter, format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const MuscleGroupProgress = ({ workouts, timeRange = '30' }) => {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [muscleInsights, setMuscleInsights] = useState([])

  // Filter workouts by time range
  const filteredWorkouts = useMemo(() => {
    if (!workouts || workouts.length === 0) return []
    const cutoffDate = subDays(new Date(), parseInt(timeRange))
    return workouts.filter(workout =>
      isAfter(new Date(workout.date), cutoffDate)
    )
  }, [workouts, timeRange])

  // Function to determine muscle group from exercise name
  const getMuscleGroupFromExercise = (exerciseName) => {
    const lowerExerciseName = exerciseName.toLowerCase()

    for (const [muscleGroup, exercises] of Object.entries(exerciseDatabase)) {
      if (exercises.some(exercise =>
        exercise.toLowerCase() === lowerExerciseName ||
        lowerExerciseName.includes(exercise.toLowerCase()) ||
        exercise.toLowerCase().includes(lowerExerciseName)
      )) {
        return muscleGroup
      }
    }

    // Fallback: try to match by keywords
    const keywordMap = {
      chest: ['chest', 'bench', 'press', 'fly', 'dip'],
      back: ['back', 'row', 'pull', 'lat', 'deadlift'],
      shoulders: ['shoulder', 'press', 'raise', 'shrug'],
      biceps: ['bicep', 'curl'],
      triceps: ['tricep', 'extension', 'pushdown'],
      legs: ['squat', 'leg', 'lunge', 'calf', 'quad', 'hamstring'],
      core: ['abs', 'core', 'plank', 'crunch'],
      cardio: ['cardio', 'run', 'bike', 'treadmill']
    }

    for (const [muscleGroup, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => lowerExerciseName.includes(keyword))) {
        return muscleGroup
      }
    }

    return 'other'
  }

  // Calculate muscle group data over time
  const muscleGroupData = useMemo(() => {
    const muscleGroupStats = {}

    filteredWorkouts.forEach(workout => {
      const workoutDate = format(new Date(workout.date), 'MMM d')

      workout.exercises.forEach(exercise => {
        const muscleGroup = getMuscleGroupFromExercise(exercise.name)

        if (!muscleGroupStats[muscleGroup]) {
          muscleGroupStats[muscleGroup] = {
            sessions: [],
            totalVolume: 0,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0,
            avgWeight: 0
          }
        }

        let exerciseVolume = 0
        let exerciseSets = 0
        let exerciseReps = 0
        let exerciseMaxWeight = 0
        let totalWeight = 0
        let weightCount = 0

        exercise.sets.forEach(set => {
          const weight = set.weight || 0
          const reps = set.reps || 0

          exerciseVolume += weight * reps
          exerciseSets += 1
          exerciseReps += reps
          exerciseMaxWeight = Math.max(exerciseMaxWeight, weight)

          if (weight > 0) {
            totalWeight += weight
            weightCount += 1
          }
        })

        // Find existing session for this date or create new one
        let existingSession = muscleGroupStats[muscleGroup].sessions.find(
          session => session.date === workoutDate
        )

        if (!existingSession) {
          existingSession = {
            date: workoutDate,
            fullDate: workout.date,
            volume: 0,
            sets: 0,
            reps: 0,
            maxWeight: 0,
            avgWeight: 0,
            totalWeight: 0,
            weightCount: 0,
            exercises: [],
            maxWeightExercise: null,
            maxWeightSet: null
          }
          muscleGroupStats[muscleGroup].sessions.push(existingSession)
        }

        existingSession.volume += exerciseVolume
        existingSession.sets += exerciseSets
        existingSession.reps += exerciseReps

        // Track max weight exercise and set details
        if (exerciseMaxWeight > existingSession.maxWeight) {
          existingSession.maxWeight = exerciseMaxWeight
          existingSession.maxWeightExercise = exercise.name

          // Find the specific set that achieved max weight
          const maxWeightSet = exercise.sets.find(set => set.weight === exerciseMaxWeight)
          existingSession.maxWeightSet = maxWeightSet
        }

        existingSession.totalWeight += totalWeight
        existingSession.weightCount += weightCount

        // Add exercise to the session
        existingSession.exercises.push({
          name: exercise.name,
          sets: exercise.sets.length,
          volume: exerciseVolume,
          maxWeight: exerciseMaxWeight
        })

        muscleGroupStats[muscleGroup].totalVolume += exerciseVolume
        muscleGroupStats[muscleGroup].totalSets += exerciseSets
        muscleGroupStats[muscleGroup].totalReps += exerciseReps
        muscleGroupStats[muscleGroup].maxWeight = Math.max(
          muscleGroupStats[muscleGroup].maxWeight,
          exerciseMaxWeight
        )
      })
    })

    // Calculate average weights and sort sessions by date
    Object.keys(muscleGroupStats).forEach(muscleGroup => {
      muscleGroupStats[muscleGroup].sessions = muscleGroupStats[muscleGroup].sessions
        .map(session => ({
          ...session,
          avgWeight: session.weightCount > 0 ? session.totalWeight / session.weightCount : 0
        }))
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))

      const totalWeight = muscleGroupStats[muscleGroup].sessions.reduce(
        (sum, session) => sum + session.totalWeight, 0
      )
      const totalWeightCount = muscleGroupStats[muscleGroup].sessions.reduce(
        (sum, session) => sum + session.weightCount, 0
      )

      muscleGroupStats[muscleGroup].avgWeight = totalWeightCount > 0
        ? totalWeight / totalWeightCount
        : 0
    })

    return muscleGroupStats
  }, [filteredWorkouts])

  // Get muscle groups sorted by total volume
  const sortedMuscleGroups = useMemo(() => {
    return Object.entries(muscleGroupData)
      .filter(([_, data]) => data.totalVolume > 0)
      .sort(([, a], [, b]) => b.totalVolume - a.totalVolume)
      .map(([muscleGroup, data]) => ({
        name: muscleGroup,
        ...data
      }))
  }, [muscleGroupData])

  // Invisible AI: Muscle balance insights (no API key required)
  useEffect(() => {
    if (sortedMuscleGroups.length === 0) {
      setMuscleInsights([])
      return
    }

    const insights = []

    // 1) Muscle imbalance detection
    if (sortedMuscleGroups.length >= 3) {
      const volumes = sortedMuscleGroups.map(m => m.totalVolume)
      const maxVolume = Math.max(...volumes)
      const minVolume = Math.min(...volumes)

      // Find the dominant muscle group
      const dominant = sortedMuscleGroups[0]
      const weakest = sortedMuscleGroups[sortedMuscleGroups.length - 1]

      if (maxVolume > 0) {
        const imbalanceRatio = maxVolume / minVolume

        if (imbalanceRatio > 3 && !insights.find(i => i.id === 'strong-imbalance')) {
          insights.push({
            id: 'strong-imbalance',
            type: 'form',
            text: `${dominant.name} is ${Math.round(imbalanceRatio)}x more trained than ${weakest.name}. Focus on lagging muscles.`
          })
        } else if (imbalanceRatio > 2 && imbalanceRatio <= 3 && !insights.find(i => i.id === 'moderate-imbalance')) {
          insights.push({
            id: 'moderate-imbalance',
            type: 'form',
            text: `${dominant.name} gets more attention than ${weakest.name}. Aim for balanced development.`
          })
        }
      }
    }

    // 2) Push/Pull/Legs balance check
    if (sortedMuscleGroups.length >= 4) {
      const pushMuscles = ['chest', 'shoulders', 'triceps']
      const pullMuscles = ['back', 'biceps', 'forearms']
      const legMuscles = ['legs']

      const pushVolume = sortedMuscleGroups
        .filter(m => pushMuscles.includes(m.name))
        .reduce((sum, m) => sum + m.totalVolume, 0)
      const pullVolume = sortedMuscleGroups
        .filter(m => pullMuscles.includes(m.name))
        .reduce((sum, m) => sum + m.totalVolume, 0)
      const legVolume = sortedMuscleGroups
        .filter(m => legMuscles.includes(m.name))
        .reduce((sum, m) => sum + m.totalVolume, 0)
      const totalVolume = pushVolume + pullVolume + legVolume

      if (totalVolume > 0) {
        const pushPercent = (pushVolume / totalVolume) * 100
        const pullPercent = (pullVolume / totalVolume) * 100
        const legPercent = (legVolume / totalVolume) * 100

        if (pushPercent > 40 && pullPercent < 30 && !insights.find(i => i.id === 'push-pull-imbalance')) {
          insights.push({
            id: 'push-pull-imbalance',
            type: 'form',
            text: `Push ${Math.round(pushPercent)}% vs Pull ${Math.round(pullPercent)}%. Add more pulling exercises for posture.`
          })
        } else if (pullPercent > 40 && pushPercent < 30 && !insights.find(i => i.id === 'pull-push-imbalance')) {
          insights.push({
            id: 'pull-push-imbalance',
            type: 'form',
            text: `Pull ${Math.round(pullPercent)}% vs Push ${Math.round(pushPercent)}%. Add more pushing exercises.`
          })
        }

        if (legPercent < 20 && totalVolume > 5000 && !insights.find(i => i.id === 'legs-underdeveloped')) {
          insights.push({
            id: 'legs-underdeveloped',
            type: 'form',
            text: `Legs only ${Math.round(legPercent)}% of volume. Don't skip leg day—lower body strength is crucial!`
          })
        }
      }
    }

    // 3) Progress trend analysis for selected muscle group
    if (selectedMuscleGroup && muscleGroupData[selectedMuscleGroup]) {
      const sessions = muscleGroupData[selectedMuscleGroup].sessions
      if (sessions.length >= 4) {
        const recent4 = sessions.slice(-4)
        const volumes = recent4.map(s => s.volume)
        const weights = recent4.map(s => s.maxWeight)

        // Check if volume is increasing
        const volumeTrend = volumes[volumes.length - 1] > volumes[0]
        const weightTrend = weights[weights.length - 1] > weights[0]

        if (volumeTrend && !insights.find(i => i.id === `volume-trend-${selectedMuscleGroup}`)) {
          const increase = ((volumes[volumes.length - 1] - volumes[0]) / volumes[0]) * 100
          insights.push({
            id: `volume-trend-${selectedMuscleGroup}`,
            type: 'motivation',
            text: `${selectedMuscleGroup}: Volume up ${Math.round(increase)}%! Keep the momentum going.`
          })
        } else if (weightTrend && !insights.find(i => i.id === `weight-trend-${selectedMuscleGroup}`)) {
          const increase = weights[weights.length - 1] - weights[0]
          insights.push({
            id: `weight-trend-${selectedMuscleGroup}`,
            type: 'motivation',
            text: `${selectedMuscleGroup}: Max weight up ${Math.round(increase)}kg! Excellent progression!`
          })
        }

        // Declining performance warning
        if (!volumeTrend && !weightTrend && volumes[volumes.length - 1] < volumes[0] * 0.8) {
          const drop = ((volumes[0] - volumes[volumes.length - 1]) / volumes[0]) * 100
          if (!insights.find(i => i.id === `decline-${selectedMuscleGroup}`)) {
            insights.push({
              id: `decline-${selectedMuscleGroup}`,
              type: 'form',
              text: `${selectedMuscleGroup}: Volume down ${Math.round(drop)}%. Check recovery and form.`
            })
          }
        }
      }
    }

    // 4) Frequency check (how often each muscle is hit)
    const muscleFrequencies = {}
    sortedMuscleGroups.forEach(muscle => {
      muscleFrequencies[muscle.name] = muscle.sessions.length
    })

    const frequencies = Object.values(muscleFrequencies)
    if (frequencies.length > 0) {
      const maxFreq = Math.max(...frequencies)
      const minFreq = Math.min(...frequencies)

      if (maxFreq - minFreq > 5 && !insights.find(i => i.id === 'frequency-imbalance')) {
        const leastTrained = sortedMuscleGroups.find(m => muscleFrequencies[m.name] === minFreq)
        const mostTrained = sortedMuscleGroups.find(m => muscleFrequencies[m.name] === maxFreq)

        insights.push({
          id: 'frequency-imbalance',
          type: 'form',
          text: `${mostTrained.name} trained ${maxFreq}x, but ${leastTrained.name} only ${minFreq}x. Balance your frequency.`
        })
      }
    }

    // Keep only most relevant (max 2 at a time)
    setMuscleInsights(insights.slice(0, 2))
  }, [sortedMuscleGroups, muscleGroupData, selectedMuscleGroup])

  // Color mapping for muscle groups
  const muscleGroupColors = {
    chest: '#8B5CF6',     // Purple
    back: '#3B82F6',      // Blue
    shoulders: '#0EA5E9', // Sky Blue
    biceps: '#FBD38D',    // Yellow
    triceps: '#F56565',   // Red
    legs: '#22C55E',      // Green
    core: '#10B981',      // Emerald
    forearms: '#F97316',  // Orange
    cardio: '#A855F7',    // Violet
    fullbody: '#EC4899',  // Pink
    other: '#6B7280'      // Gray
  }

  const getChartData = (muscleGroup) => {
    const data = muscleGroupData[muscleGroup]
    if (!data || data.sessions.length === 0) return null

    return {
      labels: data.sessions.map(session => session.date),
      datasets: [
        {
          label: 'Volume (kg)',
          data: data.sessions.map(session => session.volume),
          borderColor: muscleGroupColors[muscleGroup] || muscleGroupColors.other,
          backgroundColor: (muscleGroupColors[muscleGroup] || muscleGroupColors.other) + '20',
          borderWidth: 3,
          pointBackgroundColor: muscleGroupColors[muscleGroup] || muscleGroupColors.other,
          pointBorderColor: '#1F2937',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Max Weight (kg)',
          data: data.sessions.map(session => session.maxWeight),
          borderColor: '#FF6B35',
          backgroundColor: '#FF6B3520',
          borderWidth: 2,
          pointBackgroundColor: '#FF6B35',
          pointBorderColor: '#1F2937',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index
        const sessionData = muscleGroupData[selectedMuscleGroup]?.sessions[dataIndex]
        setSelectedSession(sessionData)
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function (context) {
            const dataIndex = context[0].dataIndex
            const sessionData = muscleGroupData[selectedMuscleGroup]?.sessions[dataIndex]
            return sessionData ? `${sessionData.date} - Workout Details` : context[0].label
          },
          label: function (context) {
            const dataIndex = context.dataIndex
            const sessionData = muscleGroupData[selectedMuscleGroup]?.sessions[dataIndex]

            if (context.datasetIndex === 0) {
              // Volume dataset
              return `Total Volume: ${Math.round(context.parsed.y)} kg`
            } else {
              // Max Weight dataset
              if (sessionData?.maxWeightExercise && sessionData?.maxWeightSet) {
                return [
                  `Max Weight: ${Math.round(context.parsed.y)} kg`,
                  `Exercise: ${sessionData.maxWeightExercise}`,
                  `Set: ${sessionData.maxWeightSet.reps} reps × ${sessionData.maxWeightSet.weight} kg`
                ]
              }
              return `Max Weight: ${Math.round(context.parsed.y)} kg`
            }
          },
          afterLabel: function (context) {
            const dataIndex = context.dataIndex
            const sessionData = muscleGroupData[selectedMuscleGroup]?.sessions[dataIndex]

            if (context.datasetIndex === 0 && sessionData?.exercises) {
              // Show exercises for volume dataset
              const exerciseList = sessionData.exercises.slice(0, 3).map(ex =>
                `• ${ex.name} (${ex.sets} sets)`
              )
              if (sessionData.exercises.length > 3) {
                exerciseList.push(`• +${sessionData.exercises.length - 3} more exercises`)
              }
              return exerciseList
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 }
        },
        grid: {
          color: '#374151',
          lineWidth: 1
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 }
        },
        grid: {
          color: '#374151',
          lineWidth: 1
        },
        title: {
          display: true,
          text: 'Volume (kg)',
          color: '#9CA3AF'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          font: { size: 11 }
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Max Weight (kg)',
          color: '#9CA3AF'
        }
      }
    }
  }

  if (sortedMuscleGroups.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 mb-6">
        <div className="text-center py-8">
          <Activity size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">No Muscle Group Data</h3>
          <p className="text-gray-400 mb-4">Complete some workouts to see muscle group progress</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 mb-6">
      {/* Invisible AI Muscle Balance Insights */}
      {muscleInsights.map((insight) => (
        <AISmartTip
          key={insight.id}
          tip={insight.text}
          type={insight.type}
          onDismiss={() => setMuscleInsights(prev => prev.filter(i => i.id !== insight.id))}
        />
      ))}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold flex items-center mb-2">
            <Target size={20} className="mr-2 text-purple-400" />
            Muscle Group Progress
          </h2>
          <p className="text-gray-400 text-sm">
            Click on a muscle group to see detailed progress over time
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          {isExpanded ? (
            <ChevronUp size={16} className="ml-1" />
          ) : (
            <ChevronDown size={16} className="ml-1" />
          )}
        </button>
      </div>

      {/* Muscle Group Grid */}
      <div className={`grid gap-3 mb-6 ${isExpanded
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6'
        }`}>
        {sortedMuscleGroups.map((muscleGroup) => {
          const isSelected = selectedMuscleGroup === muscleGroup.name
          const color = muscleGroupColors[muscleGroup.name] || muscleGroupColors.other

          return (
            <button
              key={muscleGroup.name}
              onClick={() => setSelectedMuscleGroup(
                isSelected ? null : muscleGroup.name
              )}
              className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${isSelected
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg transform scale-105'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-700'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {isSelected && <Zap size={16} className="text-purple-400" />}
              </div>

              <div className="text-white font-medium text-sm mb-1 capitalize">
                {muscleGroup.name}
              </div>

              {isExpanded ? (
                <div className="space-y-1">
                  <div className="text-xs text-gray-400">
                    Volume: {Math.round(muscleGroup.totalVolume)} kg
                  </div>
                  <div className="text-xs text-gray-400">
                    Sets: {muscleGroup.totalSets}
                  </div>
                  <div className="text-xs text-gray-400">
                    Max: {Math.round(muscleGroup.maxWeight)} kg
                  </div>
                  <div className="text-xs text-gray-400">
                    Sessions: {muscleGroup.sessions.length}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  {Math.round(muscleGroup.totalVolume)} kg
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Muscle Group Chart */}
      {selectedMuscleGroup && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: muscleGroupColors[selectedMuscleGroup] }}
              />
              <h3 className="text-white font-semibold text-lg capitalize">
                {selectedMuscleGroup} Progress
              </h3>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <TrendingUp size={16} className="text-green-400 mr-1" />
                <span className="text-gray-400">
                  {muscleGroupData[selectedMuscleGroup]?.sessions.length || 0} sessions
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              💡 <strong>Tip:</strong> Click on any point in the chart to see detailed workout information, including which exercise achieved the max weight!
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-400">
                {Math.round(muscleGroupData[selectedMuscleGroup]?.totalVolume || 0)}
              </div>
              <div className="text-xs text-gray-400">Total Volume (kg)</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-400">
                {muscleGroupData[selectedMuscleGroup]?.totalSets || 0}
              </div>
              <div className="text-xs text-gray-400">Total Sets</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">
                {Math.round(muscleGroupData[selectedMuscleGroup]?.maxWeight || 0)}
              </div>
              <div className="text-xs text-gray-400">Max Weight (kg)</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-400">
                {Math.round(muscleGroupData[selectedMuscleGroup]?.avgWeight || 0)}
              </div>
              <div className="text-xs text-gray-400">Avg Weight (kg)</div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="h-80">
            <Line
              data={getChartData(selectedMuscleGroup)}
              options={chartOptions}
            />
          </div>

          {/* Workout Details */}
          {selectedSession && (
            <div className="mt-6 bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">
                  Workout Details - {selectedSession.date}
                </h4>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round(selectedSession.volume)}
                  </div>
                  <div className="text-xs text-gray-400">Volume (kg)</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {selectedSession.sets}
                  </div>
                  <div className="text-xs text-gray-400">Sets</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-400">
                    {Math.round(selectedSession.maxWeight)}
                  </div>
                  <div className="text-xs text-gray-400">Max Weight (kg)</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {selectedSession.exercises.length}
                  </div>
                  <div className="text-xs text-gray-400">Exercises</div>
                </div>
              </div>

              {/* Max Weight Achievement */}
              {selectedSession.maxWeightExercise && selectedSession.maxWeightSet && (
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 mb-4 border border-orange-500/30">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                    <span className="text-orange-400 font-semibold text-sm">Max Weight Achievement</span>
                  </div>
                  <div className="text-white font-medium mb-1">
                    {selectedSession.maxWeightExercise}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {selectedSession.maxWeightSet.reps} reps × {selectedSession.maxWeightSet.weight} kg
                    {selectedSession.maxWeightSet.difficulty && (
                      <span className="ml-2 text-yellow-400">
                        (Difficulty: {selectedSession.maxWeightSet.difficulty}/10)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Exercises List */}
              <div>
                <h5 className="text-white font-medium mb-3">Exercises Performed</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSession.exercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                      <div className="text-white font-medium text-sm mb-1">
                        {exercise.name}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{exercise.sets} sets</span>
                        <span>{Math.round(exercise.volume)} kg volume</span>
                        <span>{Math.round(exercise.maxWeight)} kg max</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedMuscleGroup && (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Target size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-white font-semibold mb-2">Select a Muscle Group</h3>
          <p className="text-gray-400 text-sm">
            Click on any muscle group above to see its detailed progress over time
          </p>
        </div>
      )}
    </div>
  )
}

export default MuscleGroupProgress
