import React from 'react'

const MuscleBalancePieChart = ({ muscleData = {} }) => {
  // Calculate total sets across all muscles
  const totalSets = Object.values(muscleData).reduce((sum, sets) => sum + sets, 0)
  
  if (totalSets === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">No muscle data available</p>
      </div>
    )
  }

  // Define colors for each muscle group
  const colorPalette = [
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ]

  // Prepare data with percentages
  const muscleDataArray = Object.entries(muscleData)
    .map(([muscle, sets], index) => ({
      muscle,
      sets,
      percentage: ((sets / totalSets) * 100).toFixed(1),
      color: colorPalette[index % colorPalette.length]
    }))
    .sort((a, b) => b.sets - a.sets)

  // Calculate pie segments
  let currentAngle = -90 // Start from top
  const segments = muscleDataArray.map((data) => {
    const angle = (data.sets / totalSets) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    return {
      ...data,
      startAngle,
      endAngle,
      angle
    }
  })

  // Function to calculate path for pie slice
  const createPieSlice = (startAngle, endAngle, radius = 100, innerRadius = 0) => {
    const start = polarToCartesian(120, 120, radius, endAngle)
    const end = polarToCartesian(120, 120, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    if (innerRadius > 0) {
      // Donut chart
      const innerStart = polarToCartesian(120, 120, innerRadius, endAngle)
      const innerEnd = polarToCartesian(120, 120, innerRadius, startAngle)
      
      return [
        `M ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
        'Z'
      ].join(' ')
    } else {
      // Pie chart
      return [
        `M 120 120`,
        `L ${start.x} ${start.y}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        'Z'
      ].join(' ')
    }
  }

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Pie Chart */}
      <div className="relative">
        <svg
          viewBox="0 0 240 240"
          className="w-64 h-64 transform -rotate-0"
        >
          {/* Shadow/Background */}
          <circle
            cx="120"
            cy="120"
            r="105"
            fill="rgba(31, 41, 55, 0.5)"
            filter="blur(8px)"
          />
          
          {/* Pie Segments */}
          {segments.map((segment, index) => (
            <g key={segment.muscle}>
              <path
                d={createPieSlice(segment.startAngle, segment.endAngle, 100, 30)}
                fill={segment.color}
                stroke="#000"
                strokeWidth="1"
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                <title>{`${segment.muscle}: ${segment.sets} sets (${segment.percentage}%)`}</title>
              </path>
            </g>
          ))}
          
          {/* Center Circle */}
          <circle
            cx="120"
            cy="120"
            r="28"
            fill="#111827"
            stroke="#374151"
            strokeWidth="2"
          />
          
          {/* Center Text */}
          <text
            x="120"
            y="115"
            textAnchor="middle"
            className="fill-gray-400 text-xs font-semibold"
          >
            Total
          </text>
          <text
            x="120"
            y="130"
            textAnchor="middle"
            className="fill-white text-lg font-bold"
          >
            {totalSets}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-3">
        {muscleDataArray.map((data, index) => (
          <div
            key={data.muscle}
            className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2 hover:bg-gray-800 transition-all"
          >
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold capitalize truncate">
                {data.muscle}
              </div>
              <div className="text-gray-400 text-xs">
                {data.sets} sets · {data.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MuscleBalancePieChart
