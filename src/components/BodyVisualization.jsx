import React from 'react'

const BodyVisualization = ({ muscleData = {} }) => {
  // More realistic engagement colors with gradients
  const getEngagementColor = (muscleGroup) => {
    const engagement = muscleData[muscleGroup] || 0
    if (engagement === 0) return '#1f2937' // gray-800
    if (engagement < 25) return '#fcd34d' // yellow-300
    if (engagement < 50) return '#fb923c' // orange-400
    if (engagement < 75) return '#f87171' // red-400
    return '#dc2626' // red-600
  }

  const getEngagementOpacity = (muscleGroup) => {
    const engagement = muscleData[muscleGroup] || 0
    return Math.max(0.3, Math.min(1, engagement / 100))
  }

  return (
    <div className="flex justify-center items-center gap-12 py-8 bg-gradient-to-b from-gray-900/50 to-gray-900/20 rounded-xl">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 200 450"
          className="w-36 h-72"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head - More anatomical */}
          <ellipse cx="100" cy="35" rx="22" ry="28" fill="#2d3748" stroke="#4a5568" strokeWidth="0.5" />
          
          {/* Neck - More defined */}
          <path 
            d="M 90 58 L 88 75 L 112 75 L 110 58 Z" 
            fill="#2d3748" 
            stroke="#4a5568" 
            strokeWidth="0.5"
          />
          
          {/* Chest (Pectorals) */}
          <path
            d="M 70 65 Q 85 75 100 75 Q 115 75 130 65 L 130 100 Q 115 105 100 105 Q 85 105 70 100 Z"
            fill={getEngagementColor('chest')}
            opacity={getEngagementOpacity('chest')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Shoulders (Deltoids) */}
          <ellipse
            cx="60"
            cy="75"
            rx="15"
            ry="20"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="140"
            cy="75"
            rx="15"
            ry="20"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Arms - Biceps */}
          <ellipse
            cx="50"
            cy="110"
            rx="12"
            ry="25"
            fill={getEngagementColor('biceps')}
            opacity={getEngagementOpacity('biceps')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="150"
            cy="110"
            rx="12"
            ry="25"
            fill={getEngagementColor('biceps')}
            opacity={getEngagementOpacity('biceps')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Forearms */}
          <rect
            x="43"
            y="130"
            width="14"
            height="40"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          <rect
            x="143"
            y="130"
            width="14"
            height="40"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          
          {/* Abs */}
          <rect
            x="85"
            y="105"
            width="30"
            height="55"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="5"
          />
          
          {/* Obliques */}
          <path
            d="M 70 110 L 85 110 L 85 155 L 75 160 Z"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs') * 0.7}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <path
            d="M 130 110 L 115 110 L 115 155 L 125 160 Z"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs') * 0.7}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Quadriceps */}
          <rect
            x="80"
            y="165"
            width="15"
            height="80"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          <rect
            x="105"
            y="165"
            width="15"
            height="80"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          
          {/* Calves */}
          <ellipse
            cx="87"
            cy="280"
            rx="10"
            ry="35"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="113"
            cy="280"
            rx="10"
            ry="35"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4b5563"
            strokeWidth="1"
          />
        </svg>
        <p className="text-xs text-gray-400 mt-2">Front</p>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 200 400"
          className="w-32 h-64"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head */}
          <ellipse cx="100" cy="30" rx="20" ry="25" fill="#374151" stroke="#4b5563" strokeWidth="1" />
          
          {/* Neck */}
          <rect x="92" y="50" width="16" height="15" fill="#374151" stroke="#4b5563" strokeWidth="1" />
          
          {/* Traps */}
          <path
            d="M 75 65 Q 100 55 125 65 L 130 85 Q 100 75 70 85 Z"
            fill={getEngagementColor('traps')}
            opacity={getEngagementOpacity('traps')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Upper Back (Lats) */}
          <path
            d="M 70 85 Q 60 110 65 140 L 75 160 L 85 145 L 85 95 Z"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <path
            d="M 130 85 Q 140 110 135 140 L 125 160 L 115 145 L 115 95 Z"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Middle Back */}
          <rect
            x="85"
            y="85"
            width="30"
            height="40"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back') * 0.8}
            stroke="#4b5563"
            strokeWidth="1"
            rx="5"
          />
          
          {/* Shoulders (Rear Delts) */}
          <ellipse
            cx="60"
            cy="75"
            rx="15"
            ry="20"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="140"
            cy="75"
            rx="15"
            ry="20"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Triceps */}
          <ellipse
            cx="50"
            cy="110"
            rx="12"
            ry="25"
            fill={getEngagementColor('triceps')}
            opacity={getEngagementOpacity('triceps')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="150"
            cy="110"
            rx="12"
            ry="25"
            fill={getEngagementColor('triceps')}
            opacity={getEngagementOpacity('triceps')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Forearms */}
          <rect
            x="43"
            y="130"
            width="14"
            height="40"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          <rect
            x="143"
            y="130"
            width="14"
            height="40"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          
          {/* Lower Back */}
          <rect
            x="85"
            y="125"
            width="30"
            height="35"
            fill={getEngagementColor('lower back')}
            opacity={getEngagementOpacity('lower back')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="5"
          />
          
          {/* Glutes */}
          <ellipse
            cx="87"
            cy="170"
            rx="15"
            ry="18"
            fill={getEngagementColor('glutes')}
            opacity={getEngagementOpacity('glutes')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="113"
            cy="170"
            rx="15"
            ry="18"
            fill={getEngagementColor('glutes')}
            opacity={getEngagementOpacity('glutes')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          
          {/* Hamstrings */}
          <rect
            x="80"
            y="185"
            width="15"
            height="65"
            fill={getEngagementColor('hamstrings')}
            opacity={getEngagementOpacity('hamstrings')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          <rect
            x="105"
            y="185"
            width="15"
            height="65"
            fill={getEngagementColor('hamstrings')}
            opacity={getEngagementOpacity('hamstrings')}
            stroke="#4b5563"
            strokeWidth="1"
            rx="7"
          />
          
          {/* Calves */}
          <ellipse
            cx="87"
            cy="285"
            rx="10"
            ry="35"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4b5563"
            strokeWidth="1"
          />
          <ellipse
            cx="113"
            cy="285"
            rx="10"
            ry="35"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4b5563"
            strokeWidth="1"
          />
        </svg>
        <p className="text-xs text-gray-400 mt-2">Back</p>
      </div>
    </div>
  )
}

export default BodyVisualization
