import React from 'react'

const RealisticBodyVisualization = ({ muscleData = {} }) => {
  const getEngagementColor = (muscleGroup) => {
    const engagement = muscleData[muscleGroup] || 0
    if (engagement === 0) return '#1f2937'
    if (engagement < 25) return '#fcd34d'
    if (engagement < 50) return '#fb923c'
    if (engagement < 75) return '#f87171'
    return '#dc2626'
  }

  const getEngagementOpacity = (muscleGroup) => {
    const engagement = muscleData[muscleGroup] || 0
    return Math.max(0.35, Math.min(0.95, engagement / 100))
  }

  return (
    <div className="flex justify-center items-center gap-8 py-6 bg-gradient-to-br from-gray-900/40 via-gray-900/20 to-gray-900/40 rounded-2xl backdrop-blur-sm">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 220 480"
          className="w-40 h-80 drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for more realistic shading */}
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#1f2937" stopOpacity="0.9"/>
            </linearGradient>
            <radialGradient id="muscleHighlight">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2"/>
            </radialGradient>
          </defs>

          {/* Head */}
          <ellipse cx="110" cy="40" rx="25" ry="30" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          
          {/* Neck */}
          <path 
            d="M 100 65 L 97 85 L 123 85 L 120 65 Z" 
            fill="#2d3748" 
            stroke="#4a5568" 
            strokeWidth="1"
          />
          
          {/* Trapezius (visible from front) */}
          <path
            d="M 85 85 Q 90 75 110 75 Q 130 75 135 85 L 135 95 Q 130 90 110 90 Q 90 90 85 95 Z"
            fill={getEngagementColor('traps')}
            opacity={getEngagementOpacity('traps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Shoulders (Deltoids) - More anatomical shape */}
          <ellipse
            cx="68"
            cy="100"
            rx="20"
            ry="28"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <ellipse
            cx="152"
            cy="100"
            rx="20"
            ry="28"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Chest (Pectoralis Major) - More defined */}
          <path
            d="M 85 90 Q 92 95 110 98 Q 128 95 135 90 L 138 125 Q 128 132 110 135 Q 92 132 82 125 Z"
            fill={getEngagementColor('chest')}
            opacity={getEngagementOpacity('chest')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Biceps - More rounded */}
          <ellipse
            cx="55"
            cy="135"
            rx="15"
            ry="30"
            fill={getEngagementColor('biceps')}
            opacity={getEngagementOpacity('biceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <ellipse
            cx="165"
            cy="135"
            rx="15"
            ry="30"
            fill={getEngagementColor('biceps')}
            opacity={getEngagementOpacity('biceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Forearms - Tapered */}
          <path
            d="M 48 160 Q 45 180 46 200 L 52 200 Q 53 180 56 160 Z"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 172 160 Q 175 180 174 200 L 168 200 Q 167 180 164 160 Z"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Abs (Rectus Abdominis) - Six pack definition */}
          <rect
            x="95"
            y="135"
            width="30"
            height="22"
            rx="3"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <rect
            x="95"
            y="160"
            width="30"
            height="22"
            rx="3"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <rect
            x="95"
            y="185"
            width="30"
            height="22"
            rx="3"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Obliques */}
          <path
            d="M 82 140 L 95 140 L 95 200 L 88 205 Z"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs') * 0.7}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 138 140 L 125 140 L 125 200 L 132 205 Z"
            fill={getEngagementColor('abs')}
            opacity={getEngagementOpacity('abs') * 0.7}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Hip area */}
          <path
            d="M 85 205 Q 88 215 92 220 L 128 220 Q 132 215 135 205 Z"
            fill="#2d3748"
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Quadriceps - Four heads */}
          <path
            d="M 92 220 L 90 265 L 96 310 L 100 310 L 102 265 L 100 220 Z"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 100 220 L 102 265 L 105 310 L 109 310 L 110 265 L 107 220 Z"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps') * 0.9}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 120 220 L 118 265 L 124 310 L 128 310 L 130 265 L 128 220 Z"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 113 220 L 110 265 L 111 310 L 115 310 L 118 265 L 113 220 Z"
            fill={getEngagementColor('quadriceps')}
            opacity={getEngagementOpacity('quadriceps') * 0.9}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Knees */}
          <ellipse cx="98" cy="320" rx="8" ry="10" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          <ellipse cx="122" cy="320" rx="8" ry="10" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          
          {/* Calves - Diamond shaped */}
          <path
            d="M 96 330 L 92 360 L 96 390 L 100 390 L 104 360 L 100 330 Z"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 120 330 L 116 360 L 120 390 L 124 390 L 128 360 L 124 330 Z"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4a5568"
            strokeWidth="1"
          />
        </svg>
        <p className="text-xs text-gray-400 mt-3 font-medium">Front</p>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 220 480"
          className="w-40 h-80 drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head */}
          <ellipse cx="110" cy="40" rx="25" ry="30" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          
          {/* Neck */}
          <path 
            d="M 100 65 L 97 85 L 123 85 L 120 65 Z" 
            fill="#2d3748" 
            stroke="#4a5568" 
            strokeWidth="1"
          />
          
          {/* Trapezius - Upper back */}
          <path
            d="M 80 85 Q 85 75 110 72 Q 135 75 140 85 L 145 110 Q 140 105 110 105 Q 80 105 75 110 Z"
            fill={getEngagementColor('traps')}
            opacity={getEngagementOpacity('traps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Shoulders (Rear Delts) */}
          <ellipse
            cx="68"
            cy="100"
            rx="20"
            ry="28"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <ellipse
            cx="152"
            cy="100"
            rx="20"
            ry="28"
            fill={getEngagementColor('shoulders')}
            opacity={getEngagementOpacity('shoulders')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Latissimus Dorsi - V-taper */}
          <path
            d="M 80 110 Q 70 130 68 160 L 75 185 L 90 170 L 95 120 Z"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 140 110 Q 150 130 152 160 L 145 185 L 130 170 L 125 120 Z"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Rhomboids & Middle back */}
          <path
            d="M 95 110 L 95 150 Q 98 155 110 155 Q 122 155 125 150 L 125 110 Q 120 115 110 115 Q 100 115 95 110 Z"
            fill={getEngagementColor('back')}
            opacity={getEngagementOpacity('back') * 0.85}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Triceps */}
          <path
            d="M 55 125 Q 50 140 52 165 L 58 165 Q 60 140 57 125 Z"
            fill={getEngagementColor('triceps')}
            opacity={getEngagementOpacity('triceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 165 125 Q 170 140 168 165 L 162 165 Q 160 140 163 125 Z"
            fill={getEngagementColor('triceps')}
            opacity={getEngagementOpacity('triceps')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Forearms */}
          <path
            d="M 48 160 Q 45 180 46 200 L 52 200 Q 53 180 56 160 Z"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 172 160 Q 175 180 174 200 L 168 200 Q 167 180 164 160 Z"
            fill={getEngagementColor('forearms')}
            opacity={getEngagementOpacity('forearms')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Erector Spinae (Lower back) */}
          <rect
            x="95"
            y="155"
            width="30"
            height="50"
            rx="5"
            fill={getEngagementColor('lower back')}
            opacity={getEngagementOpacity('lower back')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Glutes */}
          <ellipse
            cx="97"
            cy="220"
            rx="18"
            ry="22"
            fill={getEngagementColor('glutes')}
            opacity={getEngagementOpacity('glutes')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <ellipse
            cx="123"
            cy="220"
            rx="18"
            ry="22"
            fill={getEngagementColor('glutes')}
            opacity={getEngagementOpacity('glutes')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Hamstrings */}
          <path
            d="M 92 240 L 88 280 L 94 320 L 100 320 L 102 280 L 100 240 Z"
            fill={getEngagementColor('hamstrings')}
            opacity={getEngagementOpacity('hamstrings')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 128 240 L 132 280 L 126 320 L 120 320 L 118 280 L 120 240 Z"
            fill={getEngagementColor('hamstrings')}
            opacity={getEngagementOpacity('hamstrings')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Knees */}
          <ellipse cx="98" cy="320" rx="8" ry="10" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          <ellipse cx="122" cy="320" rx="8" ry="10" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
          
          {/* Calves */}
          <path
            d="M 96 330 L 92 360 L 96 390 L 100 390 L 104 360 L 100 330 Z"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4a5568"
            strokeWidth="1"
          />
          <path
            d="M 120 330 L 116 360 L 120 390 L 124 390 L 128 360 L 124 330 Z"
            fill={getEngagementColor('calves')}
            opacity={getEngagementOpacity('calves')}
            stroke="#4a5568"
            strokeWidth="1"
          />
        </svg>
        <p className="text-xs text-gray-400 mt-3 font-medium">Back</p>
      </div>
    </div>
  )
}

export default RealisticBodyVisualization
