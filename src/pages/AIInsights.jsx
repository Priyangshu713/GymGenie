import React, { useState, useEffect } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  RefreshCw,
  Sparkles,
  BarChart3,
  Activity
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { generateWorkoutInsights } from '../services/aiService'
import { formatAIText, formatWorkoutPlan } from '../utils/textFormatter'

const AIInsights = () => {
  const { workouts, stats } = useWorkout()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateInsights = async () => {
    if (workouts.length === 0) {
      setError('No workout data available for analysis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const recentWorkouts = workouts.filter(workout => 
        new Date(workout.date) > subDays(new Date(), 30)
      )
      
      const analysisData = {
        totalWorkouts: recentWorkouts.length,
        workouts: recentWorkouts,
        stats,
        timeframe: '30 days'
      }

      const aiInsights = await generateWorkoutInsights(analysisData)
      setInsights(aiInsights)
    } catch (err) {
      setError('Failed to generate insights. Please check your API key and try again.')
      console.error('AI Insights Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workouts.length > 0) {
      generateInsights()
    }
  }, [workouts.length])

  if (workouts.length === 0) {
    return (
      <div className="pb-20 bg-black min-h-screen">
        <div className="px-4 pt-12 pb-6">
          <h1 className="fitness-title mb-2">Insights</h1>
          <p className="fitness-subtitle mb-8">AI-powered analysis</p>
          
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain size={40} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No Data to Analyze
            </h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              Log some workouts first to get personalized AI insights and recommendations
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-36 bg-black min-h-screen ai-insights">
      {/* Apple Fitness Header */}
      <div className="px-4 pt-12 pb-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="fitness-title">Insights</h1>
            <p className="fitness-subtitle">Powered by Gemini AI</p>
          </div>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-900 rounded-xl">
            <div className="fitness-metric text-purple-400">{workouts.length}</div>
            <div className="fitness-label">Total Workouts</div>
          </div>
          <div className="text-center p-4 bg-gray-900 rounded-xl">
            <div className="fitness-metric text-blue-400">
              {workouts.filter(w => new Date(w.date) > subDays(new Date(), 30)).length}
            </div>
            <div className="fitness-label">Last 30 Days</div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {loading && (
          <div className="fitness-card text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">
              Analyzing your workout data...
            </p>
          </div>
        )}

        {error && (
          <div className="fitness-card" style={{background: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.3)'}}>
            <div className="flex items-center space-x-3">
              <AlertTriangle size={20} className="text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">
                  Analysis Error
                </h3>
                <p className="text-sm text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {insights && (
          <>
            {/* Overall Assessment - Apple Style */}
            <div className="fitness-card" style={{background: 'rgba(52, 199, 89, 0.1)', borderColor: 'rgba(52, 199, 89, 0.3)'}}>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-400 mb-2">
                    Overall Assessment
                  </h3>
                  <div 
                    className="text-green-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatAIText(insights.overall) }}
                  />
                </div>
              </div>
            </div>

            {/* Strengths - Apple Style */}
            {insights.strengths && insights.strengths.length > 0 && (
              <div className="fitness-card">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-green-400" />
                  Your Strengths
                </h3>
                <div className="space-y-3">
                  {insights.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-xl">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div 
                        className="text-green-400 text-sm"
                        dangerouslySetInnerHTML={{ __html: formatAIText(strength) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {insights.improvements && insights.improvements.length > 0 && (
              <div className="fitness-card">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <AlertTriangle size={20} className="mr-2 text-yellow-400" />
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {insights.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-xl">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div 
                        className="text-yellow-400 text-sm"
                        dangerouslySetInnerHTML={{ __html: formatAIText(improvement) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="fitness-card">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <Lightbulb size={20} className="mr-2 text-blue-400" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-xl">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb size={12} className="text-white" />
                      </div>
                      <div 
                        className="text-blue-400 text-sm"
                        dangerouslySetInnerHTML={{ __html: formatAIText(recommendation) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {insights.goals && insights.goals.length > 0 && (
              <div className="fitness-card">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <Target size={20} className="mr-2 text-purple-400" />
                  Suggested Goals
                </h3>
                <div className="space-y-3">
                  {insights.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-xl">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Target size={12} className="text-white" />
                      </div>
                      <div 
                        className="text-purple-400 text-sm"
                        dangerouslySetInnerHTML={{ __html: formatAIText(goal) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Plan */}
            {insights.weeklyPlan && (
              <div className="fitness-card">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <Activity size={20} className="mr-2 text-indigo-400" />
                  This Week's Focus
                </h3>
                <div className="p-4 bg-gray-800 rounded-xl">
                  <div 
                    className="text-indigo-400 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatWorkoutPlan(insights.weeklyPlan) }}
                  />
                </div>
              </div>
            )}

            {/* Analysis Timestamp */}
            <div className="text-center text-xs text-gray-400">
              Analysis generated on {format(new Date(), 'MMM d, yyyy \'at\' h:mm a')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AIInsights
