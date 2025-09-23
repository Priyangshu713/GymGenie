import React, { useEffect, useState } from 'react'

const ActivityRings = ({ 
  moveProgress = 0, 
  exerciseProgress = 0, 
  standProgress = 0,
  size = 120,
  strokeWidth = 8,
  animate = true 
}) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const center = size / 2
  const radius1 = (size - strokeWidth) / 2 - 20 // Outer ring (Move)
  const radius2 = (size - strokeWidth) / 2 - 35 // Middle ring (Exercise)  
  const radius3 = (size - strokeWidth) / 2 - 50 // Inner ring (Stand)
  
  const circumference1 = 2 * Math.PI * radius1
  const circumference2 = 2 * Math.PI * radius2
  const circumference3 = 2 * Math.PI * radius3
  
  const moveOffset = circumference1 - (moveProgress / 100) * circumference1
  const exerciseOffset = circumference2 - (exerciseProgress / 100) * circumference2
  const standOffset = circumference3 - (standProgress / 100) * circumference3

  return (
    <div className="activity-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background rings */}
        <circle
          cx={center}
          cy={center}
          r={radius1}
          stroke="rgba(250, 17, 79, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius2}
          stroke="rgba(146, 232, 42, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius3}
          stroke="rgba(64, 203, 224, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress rings */}
        <circle
          cx={center}
          cy={center}
          r={radius1}
          stroke="#FA114F"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference1}
          strokeDashoffset={mounted && animate ? moveOffset : circumference1}
          style={{
            transition: animate ? 'stroke-dashoffset 2s ease-out' : 'none'
          }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius2}
          stroke="#92E82A"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference2}
          strokeDashoffset={mounted && animate ? exerciseOffset : circumference2}
          style={{
            transition: animate ? 'stroke-dashoffset 2s ease-out 0.3s' : 'none'
          }}
        />
        <circle
          cx={center}
          cy={center}
          r={radius3}
          stroke="#40CBE0"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference3}
          strokeDashoffset={mounted && animate ? standOffset : circumference3}
          style={{
            transition: animate ? 'stroke-dashoffset 2s ease-out 0.6s' : 'none'
          }}
        />
      </svg>
    </div>
  )
}

export default ActivityRings
