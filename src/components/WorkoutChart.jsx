import React from 'react'
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
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

const WorkoutChart = ({ data, metric }) => {
  const chartData = {
    labels: data.map(item => item.week),
    datasets: [
      {
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data: data.map(item => item[metric]),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            return context[0].label
          },
          label: function(context) {
            const dataPoint = data[context.dataIndex]
            const value = context.parsed.y
            const metricLabel = metric.charAt(0).toUpperCase() + metric.slice(1)
            
            let lines = [`${metricLabel}: ${value}${metric === 'weight' ? ' kg' : ''}`]
            
            // Add exercise breakdown if available
            if (dataPoint.exerciseDetails && dataPoint.exerciseDetails.length > 0) {
              lines.push('') // Empty line for spacing
              lines.push('Exercises:')
              
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
            }
            
            return lines
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
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: 'rgba(107, 114, 128, 1)',
          font: {
            size: 12,
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

export default WorkoutChart
