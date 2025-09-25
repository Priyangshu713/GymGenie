import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const ProgressChart = ({ workouts }) => {
  const progressData = useMemo(() => {
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return sortedWorkouts.map(workout => {
      const totalVolume = workout.exercises.reduce((sum, exercise) => {
        if (exercise.type === 'strength') {
          return sum + exercise.sets.reduce((setSum, set) => 
            setSum + (set.weight || 0) * (set.reps || 0), 0
          )
        }
        return sum
      }, 0)
      
      const totalSets = workout.exercises.reduce((sum, exercise) => 
        sum + exercise.sets.length, 0
      )
      
      return {
        date: format(new Date(workout.date), 'MMM d'),
        volume: totalVolume,
        sets: totalSets,
        exercises: workout.exercises.length,
        exerciseDetails: workout.exercises.map(exercise => ({
          name: exercise.name,
          type: exercise.type,
          sets: exercise.sets.length,
          volume: exercise.type === 'strength' 
            ? exercise.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0)
            : 0,
          muscleGroup: exercise.muscleGroup || 'Unknown'
        }))
      }
    })
  }, [workouts])

  const chartData = {
    labels: progressData.map(item => item.date),
    datasets: [
      {
        label: 'Total Volume (kg)',
        data: progressData.map(item => item.volume),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
      },
      {
        label: 'Total Sets',
        data: progressData.map(item => item.sets),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: 'rgba(107, 114, 128, 1)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          title: function(context) {
            return context[0].label
          },
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex
            const dataPoint = progressData[dataIndex]
            
            if (dataPoint.exerciseDetails && dataPoint.exerciseDetails.length > 0) {
              let lines = ['', 'Exercises:']
              
              // Group exercises by type
              const strengthExercises = dataPoint.exerciseDetails.filter(ex => ex.type === 'strength')
              const cardioExercises = dataPoint.exerciseDetails.filter(ex => ex.type === 'cardio')
              
              if (strengthExercises.length > 0) {
                strengthExercises.forEach(exercise => {
                  lines.push(`💪 ${exercise.name} (${exercise.sets} sets, ${Math.round(exercise.volume)} kg)`)
                })
              }
              
              if (cardioExercises.length > 0) {
                cardioExercises.forEach(exercise => {
                  lines.push(`🏃 ${exercise.name} (${exercise.sets} sets)`)
                })
              }
              
              return lines
            }
            
            return []
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: 'rgba(59, 130, 246, 1)',
          font: {
            size: 11,
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgba(16, 185, 129, 1)',
          font: {
            size: 11,
          },
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default ProgressChart
