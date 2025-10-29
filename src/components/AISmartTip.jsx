import React, { useState, useEffect } from 'react'
import { Sparkles, X, Lightbulb } from 'lucide-react'

const AISmartTip = ({ tip, type = 'default', onDismiss, autoShow = true }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (tip && autoShow) {
      // Delay to create natural appearance
      setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 300)
    }
  }, [tip, autoShow])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      if (onDismiss) onDismiss()
    }, 300)
  }

  if (!isVisible || !tip) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'motivation':
        return {
          bg: 'bg-gradient-to-r from-purple-900/40 to-pink-900/40',
          border: 'border-purple-500/50',
          icon: <Sparkles size={16} className="text-purple-400" />,
          iconBg: 'bg-purple-500/20'
        }
      case 'form':
        return {
          bg: 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40',
          border: 'border-blue-500/50',
          icon: <Lightbulb size={16} className="text-blue-400" />,
          iconBg: 'bg-blue-500/20'
        }
      case 'rest':
        return {
          bg: 'bg-gradient-to-r from-orange-900/40 to-red-900/40',
          border: 'border-orange-500/50',
          icon: <Sparkles size={16} className="text-orange-400" />,
          iconBg: 'bg-orange-500/20'
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-green-900/40 to-emerald-900/40',
          border: 'border-green-500/50',
          icon: <Sparkles size={16} className="text-green-400" />,
          iconBg: 'bg-green-500/20'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-2xl p-4 backdrop-blur-sm transition-all duration-300 ${
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${styles.iconBg} rounded-full p-2 flex-shrink-0 animate-pulse`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-relaxed">{tip}</p>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AISmartTip
