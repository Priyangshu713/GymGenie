import React, { useState, useMemo, useEffect } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import { 
  Trophy, 
  Award, 
  Target, 
  Lock, 
  Star,
  Filter,
  TrendingUp,
  CheckCircle,
  Circle
} from 'lucide-react'
import { 
  ACHIEVEMENTS, 
  ACHIEVEMENT_CATEGORIES, 
  calculateAchievements, 
  getAchievementProgress,
  getRarityColor,
  calculateTotalPoints,
  getUserRank,
  getRankProgress,
  getRankMotivation
} from '../utils/achievements'

const Achievements = () => {
  const { workouts, achievements, updateAchievements } = useWorkout()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)

  const { unlockedAchievements, lockedAchievements } = useMemo(() => 
    calculateAchievements(workouts, achievements), [workouts, achievements]
  )

  // Update achievements in context whenever they change
  useEffect(() => {
    if (JSON.stringify(unlockedAchievements) !== JSON.stringify(achievements)) {
      updateAchievements(unlockedAchievements)
    }
  }, [unlockedAchievements, achievements, updateAchievements])

  const totalPoints = calculateTotalPoints(unlockedAchievements)
  const completionPercentage = Math.round((unlockedAchievements.length / Object.keys(ACHIEVEMENTS).length) * 100)
  const currentRank = getUserRank(totalPoints)
  const rankProgress = getRankProgress(totalPoints)
  const motivation = getRankMotivation(currentRank, rankProgress.nextRank)

  const filteredAchievements = useMemo(() => {
    let achievements = showUnlockedOnly ? unlockedAchievements : [...unlockedAchievements, ...lockedAchievements]
    
    if (selectedCategory !== 'all') {
      achievements = achievements.filter(achievement => achievement.category === selectedCategory)
    }
    
    return achievements.sort((a, b) => {
      // Sort unlocked first, then by rarity, then by points
      if (a.unlockedAt && !b.unlockedAt) return -1
      if (!a.unlockedAt && b.unlockedAt) return 1
      
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }
      const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
      if (rarityDiff !== 0) return rarityDiff
      
      return b.points - a.points
    })
  }, [unlockedAchievements, lockedAchievements, selectedCategory, showUnlockedOnly])

  const categoryStats = useMemo(() => {
    const stats = {}
    Object.values(ACHIEVEMENT_CATEGORIES).forEach(category => {
      const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category)
      const unlockedInCategory = unlockedAchievements.filter(a => a.category === category)
      stats[category] = {
        total: categoryAchievements.length,
        unlocked: unlockedInCategory.length,
        percentage: Math.round((unlockedInCategory.length / categoryAchievements.length) * 100)
      }
    })
    return stats
  }, [unlockedAchievements])

  const AchievementCard = ({ achievement, isUnlocked }) => {
    const progress = !isUnlocked ? getAchievementProgress(achievement, workouts) : null
    
    return (
      <div className={`relative p-4 rounded-2xl transition-all duration-200 ${
        isUnlocked 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 shadow-lg' 
          : 'bg-gray-900 border border-gray-700'
      }`}>
        {/* Achievement icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
            isUnlocked 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg' 
              : 'bg-gray-800 border border-gray-600'
          }`}>
            {isUnlocked ? achievement.icon : <Lock size={24} className="text-gray-500" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`font-semibold text-lg ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                {achievement.title}
              </h3>
              {isUnlocked && <CheckCircle size={18} className="text-green-400" />}
            </div>
            <p className={`text-sm leading-relaxed ${isUnlocked ? 'text-gray-300' : 'text-gray-500'}`}>
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Progress bar for locked achievements */}
        {!isUnlocked && progress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span className="font-medium">
                {progress.current}/{progress.target}{progress.unit ? ` ${progress.unit}` : ''}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {Math.round((progress.current / progress.target) * 100)}% complete
              </span>
              {progress.note && (
                <span className="text-xs text-blue-400 font-medium">
                  {progress.note}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isUnlocked ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'
            }`}>
              {achievement.category}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
              achievement.rarity === 'rare' ? 'bg-purple-500/20 text-purple-400' :
              achievement.rarity === 'uncommon' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-700 text-gray-400'
            }`}>
              {achievement.rarity}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Star size={14} className={isUnlocked ? 'text-yellow-400' : 'text-gray-500'} />
            <span className={`text-sm font-semibold ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
              {achievement.points}
            </span>
          </div>
        </div>

        {/* Unlocked timestamp */}
        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
          <p className="text-gray-400">Track your fitness journey and unlock rewards</p>
        </div>

        {/* Gym Rank Display */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          {/* Current Rank */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${currentRank.bgColor} ${currentRank.borderColor} border-2`}>
                {currentRank.icon}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${currentRank.color}`}>
                  {currentRank.title}
                </h2>
                <p className="text-gray-400 text-sm">{currentRank.description}</p>
                <p className="text-gray-500 text-xs mt-1">{totalPoints.toLocaleString()} points</p>
              </div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {rankProgress.nextRank && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Progress to {rankProgress.nextRank.title}</span>
                <span className="text-gray-400 text-sm">
                  {rankProgress.pointsToNext.toLocaleString()} points to go
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${
                    currentRank.id === 'newbie' ? 'from-gray-500 to-green-500' :
                    currentRank.id === 'beginner' ? 'from-green-500 to-blue-500' :
                    currentRank.id === 'enthusiast' ? 'from-blue-500 to-purple-500' :
                    currentRank.id === 'dedicated' ? 'from-purple-500 to-orange-500' :
                    currentRank.id === 'warrior' ? 'from-orange-500 to-red-500' :
                    currentRank.id === 'beast' ? 'from-red-500 to-cyan-500' :
                    currentRank.id === 'titan' ? 'from-cyan-500 to-yellow-500' :
                    'from-yellow-500 to-pink-500'
                  }`}
                  style={{ width: `${rankProgress.progress}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-gray-300">{rankProgress.progress}% complete</span>
              </div>
            </div>
          )}

          {/* Motivation Message */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <p className="text-center text-gray-300 font-medium">{motivation}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{unlockedAchievements.length}</div>
              <div className="text-gray-400 text-sm">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{completionPercentage}%</div>
              <div className="text-gray-400 text-sm">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{Object.keys(ACHIEVEMENTS).length}</div>
              <div className="text-gray-400 text-sm">Total</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${currentRank.color}`}>
                {rankProgress.nextRank ? `${rankProgress.progress}%` : 'MAX'}
              </div>
              <div className="text-gray-400 text-sm">Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-6">
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex flex-col space-y-4">
            {/* Category filters */}
            <div>
              <h3 className="text-white font-medium mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {Object.values(ACHIEVEMENT_CATEGORIES).map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Show unlocked toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-white font-medium">Show unlocked only</span>
              <button
                onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showUnlockedOnly
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {showUnlockedOnly ? <CheckCircle size={16} /> : <Circle size={16} />}
                <span>{showUnlockedOnly ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="px-4">
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={!!achievement.unlockedAt}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={24} className="text-gray-600" />
            </div>
            <h3 className="text-white font-semibold mb-2">No achievements found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters or start working out to unlock achievements!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Achievements
