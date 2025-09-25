import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const MuscleGroupChart = ({ data }) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 101, 101, 0.8)',  // Red
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
  ]

  // Sort muscle groups by sets in descending order (most focused first)
  const sortedData = Object.entries(data)
    .sort(([,a], [,b]) => b - a)
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})

  const chartData = {
    labels: Object.keys(sortedData).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
    datasets: [
      {
        data: Object.values(sortedData),
        backgroundColor: colors.slice(0, Object.keys(sortedData).length),
        borderColor: colors.slice(0, Object.keys(sortedData).length).map(color => 
          color.replace('0.8', '1')
        ),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: 'rgba(107, 114, 128, 1)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((context.parsed / total) * 100)
            return `${context.label}: ${context.parsed} sets (${percentage}%)`
          }
        }
      },
    },
    cutout: '60%',
  }

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

export default MuscleGroupChart
