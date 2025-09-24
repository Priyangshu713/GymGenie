import { format, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

// Achievement categories and definitions
export const ACHIEVEMENT_CATEGORIES = {
  CONSISTENCY: 'Consistency',
  STRENGTH: 'Strength',
  VOLUME: 'Volume',
  VARIETY: 'Variety',
  MILESTONES: 'Milestones',
  DEDICATION: 'Dedication',
  PROGRESSION: 'Progression'
}

export const ACHIEVEMENTS = {
  // Consistency Achievements
  FIRST_WORKOUT: {
    id: 'first_workout',
    title: 'First Steps',
    description: 'Complete your first workout',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'common',
    points: 10,
    condition: (workouts) => workouts.length >= 1
  },
  
  CONSISTENCY_STREAK_3: {
    id: 'consistency_streak_3',
    title: 'Getting Started',
    description: 'Complete 3 workouts',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'common',
    points: 25,
    condition: (workouts) => workouts.length >= 3
  },
  
  CONSISTENCY_CHAMPION: {
    id: 'consistency_champion',
    title: 'Consistency Champion',
    description: 'Complete 5 workouts in 30 days',
    icon: '🏆',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 50,
    condition: (workouts) => {
      const last30Days = workouts.filter(w => 
        differenceInDays(new Date(), new Date(w.date)) <= 30
      )
      return last30Days.length >= 5
    }
  },
  
  WEEKLY_WARRIOR: {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Complete 4+ workouts in a single week',
    icon: '⚔️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 75,
    condition: (workouts) => {
      const weeklyWorkouts = {}
      workouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        weeklyWorkouts[weekKey] = (weeklyWorkouts[weekKey] || 0) + 1
      })
      return Math.max(...Object.values(weeklyWorkouts), 0) >= 4
    }
  },
  
  DEDICATION_MASTER: {
    id: 'dedication_master',
    title: 'Dedication Master',
    description: 'Complete 50 total workouts',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => workouts.length >= 50
  },
  
  // Strength Achievements
  HEAVY_LIFTER: {
    id: 'heavy_lifter',
    title: 'Heavy Lifter',
    description: 'Lift 100kg+ in a single set',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise =>
          exercise.sets.some(set => (set.weight || 0) >= 100)
        )
      )
    }
  },
  
  STRENGTH_BEAST: {
    id: 'strength_beast',
    title: 'Strength Beast',
    description: 'Lift 150kg+ in a single set',
    icon: '🦍',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise =>
          exercise.sets.some(set => (set.weight || 0) >= 150)
        )
      )
    }
  },
  
  POWERHOUSE: {
    id: 'powerhouse',
    title: 'Powerhouse',
    description: 'Lift 200kg+ in a single set',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 500,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise =>
          exercise.sets.some(set => (set.weight || 0) >= 200)
        )
      )
    }
  },
  
  // Volume Achievements
  VOLUME_CRUSHER: {
    id: 'volume_crusher',
    title: 'Volume Crusher',
    description: 'Complete 1000kg total volume in a single workout',
    icon: '📈',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'uncommon',
    points: 75,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalVolume = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        )
        return totalVolume >= 1000
      })
    }
  },
  
  VOLUME_KING: {
    id: 'volume_king',
    title: 'Volume King',
    description: 'Complete 5000kg total volume in a single workout',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 150,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalVolume = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        )
        return totalVolume >= 5000
      })
    }
  },
  
  // Variety Achievements
  WELL_ROUNDED: {
    id: 'well_rounded',
    title: 'Well-Rounded Trainer',
    description: 'Train 5 different muscle groups',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'common',
    points: 50,
    condition: (workouts) => {
      const muscleGroups = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return muscleGroups.size >= 5
    }
  },
  
  MUSCLE_EXPLORER: {
    id: 'muscle_explorer',
    title: 'Muscle Explorer',
    description: 'Train 10 different muscle groups',
    icon: '🗺️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      const muscleGroups = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return muscleGroups.size >= 10
    }
  },
  
  EXERCISE_COLLECTOR: {
    id: 'exercise_collector',
    title: 'Exercise Collector',
    description: 'Perform 25 different exercises',
    icon: '📚',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 150,
    condition: (workouts) => {
      const exercises = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.name) {
            exercises.add(exercise.name.toLowerCase())
          }
        })
      )
      return exercises.size >= 25
    }
  },
  
  // Milestone Achievements
  CENTURY_CLUB: {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 total sets',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      const totalSets = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.length, 0
        ), 0
      )
      return totalSets >= 100
    }
  },
  
  REP_MASTER: {
    id: 'rep_master',
    title: 'Rep Master',
    description: 'Complete 1000 total reps',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const totalReps = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        ), 0
      )
      return totalReps >= 1000
    }
  },
  
  // Progression Achievements
  PROGRESSIVE_OVERLOAD: {
    id: 'progressive_overload',
    title: 'Progressive Overload',
    description: 'Increase weight on the same exercise 3 times',
    icon: '📊',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      const exerciseProgress = {}
      
      // Sort workouts by date
      const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
      
      sortedWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase()
          if (!exerciseName) return
          
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0))
          if (maxWeight === 0) return
          
          if (!exerciseProgress[exerciseName]) {
            exerciseProgress[exerciseName] = []
          }
          exerciseProgress[exerciseName].push(maxWeight)
        })
      })
      
      // Check for progression in any exercise
      return Object.values(exerciseProgress).some(weights => {
        let increases = 0
        for (let i = 1; i < weights.length; i++) {
          if (weights[i] > weights[i - 1]) {
            increases++
            if (increases >= 3) return true
          }
        }
        return false
      })
    }
  },
  
  INTENSITY_WARRIOR: {
    id: 'intensity_warrior',
    title: 'Intensity Warrior',
    description: 'Complete a workout with average RPE 8+',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 75,
    condition: (workouts) => {
      return workouts.some(workout => {
        const allDifficulties = []
        workout.exercises.forEach(exercise =>
          exercise.sets.forEach(set => {
            if (set.difficulty) allDifficulties.push(set.difficulty)
          })
        )
        if (allDifficulties.length === 0) return false
        const avgDifficulty = allDifficulties.reduce((sum, d) => sum + d, 0) / allDifficulties.length
        return avgDifficulty >= 8
      })
    }
  },

  // Advanced Hypertrophy Achievements
  HYPERTROPHY_MASTER: {
    id: 'hypertrophy_master',
    title: 'Hypertrophy Master',
    description: 'Complete 20 sets in the 8-12 rep range in a single workout',
    icon: '💎',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      return workouts.some(workout => {
        const hypertrophySets = workout.exercises.reduce((count, exercise) =>
          count + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 12
          ).length, 0
        )
        return hypertrophySets >= 20
      })
    }
  },

  TIME_UNDER_TENSION: {
    id: 'time_under_tension',
    title: 'Time Under Tension',
    description: 'Complete 100 total sets in the 8-15 rep range',
    icon: '⏱️',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 250,
    condition: (workouts) => {
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return hypertrophySets >= 100
    }
  },

  MUSCLE_SCULPTOR: {
    id: 'muscle_sculptor',
    title: 'Muscle Sculptor',
    description: 'Complete 50 sets with 12-15 reps (perfect hypertrophy range)',
    icon: '🎨',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const sculptingSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 12 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return sculptingSets >= 50
    }
  },

  // Advanced Strength Achievements
  IRON_THRONE: {
    id: 'iron_throne',
    title: 'Iron Throne',
    description: 'Lift 250kg+ in a single set',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 1000,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise =>
          exercise.sets.some(set => (set.weight || 0) >= 250)
        )
      )
    }
  },

  STRENGTH_LEGEND: {
    id: 'strength_legend',
    title: 'Strength Legend',
    description: 'Lift 300kg+ in a single set',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 2000,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise =>
          exercise.sets.some(set => (set.weight || 0) >= 300)
        )
      )
    }
  },

  COMPOUND_KING: {
    id: 'compound_king',
    title: 'Compound King',
    description: 'Perform 500+ total reps on compound movements',
    icon: '🏋️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const compoundExercises = ['squat', 'deadlift', 'bench press', 'overhead press', 'row', 'pull up', 'chin up']
      const compoundReps = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isCompound = compoundExercises.some(compound => 
            exercise.name?.toLowerCase().includes(compound)
          )
          return isCompound ? exerciseCount + exercise.sets.reduce((setCount, set) => 
            setCount + (set.reps || 0), 0
          ) : exerciseCount
        }, 0), 0
      )
      return compoundReps >= 500
    }
  },

  // Advanced Volume Achievements
  VOLUME_DESTROYER: {
    id: 'volume_destroyer',
    title: 'Volume Destroyer',
    description: 'Complete 10,000kg total volume in a single workout',
    icon: '💥',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 500,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalVolume = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        )
        return totalVolume >= 10000
      })
    }
  },

  WEEKLY_VOLUME_BEAST: {
    id: 'weekly_volume_beast',
    title: 'Weekly Volume Beast',
    description: 'Complete 50,000kg total volume in a single week',
    icon: '🦾',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'legendary',
    points: 750,
    condition: (workouts) => {
      const weeklyVolumes = {}
      workouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        const workoutVolume = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        )
        weeklyVolumes[weekKey] = (weeklyVolumes[weekKey] || 0) + workoutVolume
      })
      return Math.max(...Object.values(weeklyVolumes), 0) >= 50000
    }
  },

  // Advanced Consistency Achievements
  IRON_DISCIPLINE: {
    id: 'iron_discipline',
    title: 'Iron Discipline',
    description: 'Complete workouts for 30 consecutive days',
    icon: '🛡️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'epic',
    points: 500,
    condition: (workouts) => {
      if (workouts.length < 30) return false
      
      const sortedDates = workouts
        .map(w => new Date(w.date).toDateString())
        .sort((a, b) => new Date(a) - new Date(b))
      
      let consecutiveDays = 1
      let maxConsecutive = 1
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currentDate = new Date(sortedDates[i])
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1) {
          consecutiveDays++
          maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
        } else {
          consecutiveDays = 1
        }
      }
      
      return maxConsecutive >= 30
    }
  },

  MARATHON_TRAINER: {
    id: 'marathon_trainer',
    title: 'Marathon Trainer',
    description: 'Complete 100 total workouts',
    icon: '🏃',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'epic',
    points: 400,
    condition: (workouts) => workouts.length >= 100
  },

  YEAR_WARRIOR: {
    id: 'year_warrior',
    title: 'Year Warrior',
    description: 'Complete 365 total workouts',
    icon: '🗓️',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'legendary',
    points: 1500,
    condition: (workouts) => workouts.length >= 365
  },

  // Advanced Variety Achievements
  EXERCISE_ENCYCLOPEDIA: {
    id: 'exercise_encyclopedia',
    title: 'Exercise Encyclopedia',
    description: 'Perform 50 different exercises',
    icon: '📖',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'epic',
    points: 300,
    condition: (workouts) => {
      const exercises = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.name) {
            exercises.add(exercise.name.toLowerCase())
          }
        })
      )
      return exercises.size >= 50
    }
  },

  MUSCLE_MASTER: {
    id: 'muscle_master',
    title: 'Muscle Master',
    description: 'Train 15 different muscle groups',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      const muscleGroups = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return muscleGroups.size >= 15
    }
  },

  // Advanced Progression Achievements
  PROGRESSIVE_BEAST: {
    id: 'progressive_beast',
    title: 'Progressive Beast',
    description: 'Increase weight on the same exercise 10 times',
    icon: '📈',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'epic',
    points: 400,
    condition: (workouts) => {
      const exerciseProgress = {}
      
      const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
      
      sortedWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase()
          if (!exerciseName) return
          
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0))
          if (maxWeight === 0) return
          
          if (!exerciseProgress[exerciseName]) {
            exerciseProgress[exerciseName] = []
          }
          exerciseProgress[exerciseName].push(maxWeight)
        })
      })
      
      return Object.values(exerciseProgress).some(weights => {
        let increases = 0
        for (let i = 1; i < weights.length; i++) {
          if (weights[i] > weights[i - 1]) {
            increases++
            if (increases >= 10) return true
          }
        }
        return false
      })
    }
  },

  STRENGTH_EVOLUTION: {
    id: 'strength_evolution',
    title: 'Strength Evolution',
    description: 'Double your max weight on any exercise',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'legendary',
    points: 800,
    condition: (workouts) => {
      const exerciseProgress = {}
      
      const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
      
      sortedWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase()
          if (!exerciseName) return
          
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0))
          if (maxWeight === 0) return
          
          if (!exerciseProgress[exerciseName]) {
            exerciseProgress[exerciseName] = { first: maxWeight, max: maxWeight }
          } else {
            exerciseProgress[exerciseName].max = Math.max(exerciseProgress[exerciseName].max, maxWeight)
          }
        })
      })
      
      return Object.values(exerciseProgress).some(progress => 
        progress.max >= progress.first * 2 && progress.first > 0
      )
    }
  },

  // Elite Milestones
  SET_COLLECTOR: {
    id: 'set_collector',
    title: 'Set Collector',
    description: 'Complete 1000 total sets',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const totalSets = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.length, 0
        ), 0
      )
      return totalSets >= 1000
    }
  },

  REP_LEGEND: {
    id: 'rep_legend',
    title: 'Rep Legend',
    description: 'Complete 10,000 total reps',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'epic',
    points: 500,
    condition: (workouts) => {
      const totalReps = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        ), 0
      )
      return totalReps >= 10000
    }
  },

  IRON_IMMORTAL: {
    id: 'iron_immortal',
    title: 'Iron Immortal',
    description: 'Complete 500 total workouts',
    icon: '♾️',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'legendary',
    points: 2500,
    condition: (workouts) => workouts.length >= 500
  },

  // Speed and Endurance Achievements
  SPEED_DEMON: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a workout in under 30 minutes',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      return workouts.some(workout => {
        if (!workout.duration) return false
        return workout.duration <= 30
      })
    }
  },

  ENDURANCE_BEAST: {
    id: 'endurance_beast',
    title: 'Endurance Beast',
    description: 'Complete a workout lasting 2+ hours',
    icon: '🦾',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      return workouts.some(workout => {
        if (!workout.duration) return false
        return workout.duration >= 120
      })
    }
  },

  MARATHON_SESSION: {
    id: 'marathon_session',
    title: 'Marathon Session',
    description: 'Complete 50+ sets in a single workout',
    icon: '🏃‍♂️',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 400,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalSets = workout.exercises.reduce((sum, exercise) => 
          sum + exercise.sets.length, 0
        )
        return totalSets >= 50
      })
    }
  },

  // Specific Rep Range Achievements
  POWER_LIFTER: {
    id: 'power_lifter',
    title: 'Power Lifter',
    description: 'Complete 100 sets in the 1-5 rep range (strength focus)',
    icon: '🏋️‍♂️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 250,
    condition: (workouts) => {
      const powerSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 1 && set.reps <= 5
          ).length, 0
        ), 0
      )
      return powerSets >= 100
    }
  },

  ENDURANCE_MASTER: {
    id: 'endurance_master',
    title: 'Endurance Master',
    description: 'Complete 200 sets with 15+ reps (endurance focus)',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      const enduranceSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 15
          ).length, 0
        ), 0
      )
      return enduranceSets >= 200
    }
  },

  // Frequency Achievements
  DAILY_GRINDER: {
    id: 'daily_grinder',
    title: 'Daily Grinder',
    description: 'Work out 7 days in a row',
    icon: '📅',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      if (workouts.length < 7) return false
      
      const sortedDates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))]
        .sort((a, b) => new Date(a) - new Date(b))
      
      let consecutiveDays = 1
      let maxConsecutive = 1
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1])
        const currentDate = new Date(sortedDates[i])
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1) {
          consecutiveDays++
          maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
        } else {
          consecutiveDays = 1
        }
      }
      
      return maxConsecutive >= 7
    }
  },

  TWICE_A_DAY: {
    id: 'twice_a_day',
    title: 'Twice a Day',
    description: 'Complete 2 workouts on the same day',
    icon: '⏰',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      const workoutsByDate = {}
      workouts.forEach(workout => {
        const dateKey = new Date(workout.date).toDateString()
        workoutsByDate[dateKey] = (workoutsByDate[dateKey] || 0) + 1
      })
      return Math.max(...Object.values(workoutsByDate), 0) >= 2
    }
  },

  // Muscle Group Specific Achievements
  CHEST_CHAMPION: {
    id: 'chest_champion',
    title: 'Chest Champion',
    description: 'Complete 100 sets targeting chest muscles',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const chestSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isChest = exercise.muscleGroup?.toLowerCase().includes('chest') ||
                         exercise.name?.toLowerCase().includes('bench') ||
                         exercise.name?.toLowerCase().includes('chest')
          return isChest ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return chestSets >= 100
    }
  },

  LEG_DESTROYER: {
    id: 'leg_destroyer',
    title: 'Leg Destroyer',
    description: 'Complete 150 sets targeting leg muscles',
    icon: '🦵',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const legSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isLeg = exercise.muscleGroup?.toLowerCase().includes('leg') ||
                       exercise.muscleGroup?.toLowerCase().includes('quad') ||
                       exercise.muscleGroup?.toLowerCase().includes('hamstring') ||
                       exercise.name?.toLowerCase().includes('squat') ||
                       exercise.name?.toLowerCase().includes('lunge')
          return isLeg ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return legSets >= 150
    }
  },

  BACK_BUILDER: {
    id: 'back_builder',
    title: 'Back Builder',
    description: 'Complete 120 sets targeting back muscles',
    icon: '🔙',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 130,
    condition: (workouts) => {
      const backSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isBack = exercise.muscleGroup?.toLowerCase().includes('back') ||
                        exercise.name?.toLowerCase().includes('row') ||
                        exercise.name?.toLowerCase().includes('pull') ||
                        exercise.name?.toLowerCase().includes('deadlift')
          return isBack ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return backSets >= 120
    }
  },

  // Weight Progression Achievements
  PLATE_COLLECTOR: {
    id: 'plate_collector',
    title: 'Plate Collector',
    description: 'Use 5 different weight increments (20kg, 25kg, 30kg, etc.)',
    icon: '🏋️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      const weights = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise =>
          exercise.sets.forEach(set => {
            if (set.weight && set.weight > 0) {
              weights.add(Math.floor(set.weight / 5) * 5) // Round to nearest 5kg
            }
          })
        )
      )
      return weights.size >= 5
    }
  },

  WEIGHT_WARRIOR: {
    id: 'weight_warrior',
    title: 'Weight Warrior',
    description: 'Use 15 different weight increments',
    icon: '⚖️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      const weights = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise =>
          exercise.sets.forEach(set => {
            if (set.weight && set.weight > 0) {
              weights.add(Math.floor(set.weight / 2.5) * 2.5) // Round to nearest 2.5kg
            }
          })
        )
      )
      return weights.size >= 15
    }
  },

  // Special Challenge Achievements
  PERFECT_FORM: {
    id: 'perfect_form',
    title: 'Perfect Form',
    description: 'Complete 50 sets with RPE 9-10 (maximum intensity)',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 250,
    condition: (workouts) => {
      const perfectSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.difficulty >= 9
          ).length, 0
        ), 0
      )
      return perfectSets >= 50
    }
  },

  VOLUME_KING_WEEKLY: {
    id: 'volume_king_weekly',
    title: 'Volume King',
    description: 'Complete 25,000kg total volume in a single week',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const weeklyVolumes = {}
      workouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        const workoutVolume = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        )
        weeklyVolumes[weekKey] = (weeklyVolumes[weekKey] || 0) + workoutVolume
      })
      return Math.max(...Object.values(weeklyVolumes), 0) >= 25000
    }
  },

  // Social and Motivation Achievements
  EARLY_BIRD: {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete 10 workouts before 8 AM',
    icon: '🌅',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const earlyWorkouts = workouts.filter(workout => {
        const workoutTime = new Date(workout.date)
        return workoutTime.getHours() < 8
      })
      return earlyWorkouts.length >= 10
    }
  },

  NIGHT_OWL: {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete 10 workouts after 8 PM',
    icon: '🦉',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const lateWorkouts = workouts.filter(workout => {
        const workoutTime = new Date(workout.date)
        return workoutTime.getHours() >= 20
      })
      return lateWorkouts.length >= 10
    }
  },

  // Advanced Milestone Achievements
  THOUSAND_CLUB: {
    id: 'thousand_club',
    title: 'Thousand Club',
    description: 'Complete 1000 total workouts',
    icon: '🏛️',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'legendary',
    points: 5000,
    condition: (workouts) => workouts.length >= 1000
  },

  MEGA_VOLUME: {
    id: 'mega_volume',
    title: 'Mega Volume',
    description: 'Accumulate 1,000,000kg total lifetime volume',
    icon: '🌟',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'legendary',
    points: 3000,
    condition: (workouts) => {
      const totalVolume = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.reduce((setSum, set) =>
            setSum + ((set.weight || 0) * (set.reps || 0)), 0
          ), 0
        ), 0
      )
      return totalVolume >= 1000000
    }
  },

  // Seasonal Achievements
  SUMMER_SHRED: {
    id: 'summer_shred',
    title: 'Summer Shred',
    description: 'Complete 20 workouts in June, July, or August',
    icon: '☀️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const summerWorkouts = workouts.filter(workout => {
        const month = new Date(workout.date).getMonth()
        return month >= 5 && month <= 7 // June (5), July (6), August (7)
      })
      return summerWorkouts.length >= 20
    }
  },

  WINTER_WARRIOR: {
    id: 'winter_warrior',
    title: 'Winter Warrior',
    description: 'Complete 20 workouts in December, January, or February',
    icon: '❄️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const winterWorkouts = workouts.filter(workout => {
        const month = new Date(workout.date).getMonth()
        return month === 11 || month === 0 || month === 1 // Dec (11), Jan (0), Feb (1)
      })
      return winterWorkouts.length >= 20
    }
  }
}

// Calculate user's achievements
export const calculateAchievements = (workouts) => {
  const unlockedAchievements = []
  const lockedAchievements = []
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (achievement.condition(workouts)) {
      unlockedAchievements.push({
        ...achievement,
        unlockedAt: new Date().toISOString()
      })
    } else {
      lockedAchievements.push(achievement)
    }
  })
  
  return { unlockedAchievements, lockedAchievements }
}

// Get achievement progress for locked achievements
export const getAchievementProgress = (achievement, workouts) => {
  switch (achievement.id) {
    case 'consistency_champion':
      const last30Days = workouts.filter(w => 
        differenceInDays(new Date(), new Date(w.date)) <= 30
      )
      return { current: last30Days.length, target: 5 }
    
    case 'dedication_master':
      return { current: workouts.length, target: 50 }
    
    case 'marathon_trainer':
      return { current: workouts.length, target: 100 }
    
    case 'year_warrior':
      return { current: workouts.length, target: 365 }
    
    case 'iron_immortal':
      return { current: workouts.length, target: 500 }
    
    case 'heavy_lifter':
      const maxWeight = Math.max(...workouts.flatMap(w => 
        w.exercises.flatMap(e => e.sets.map(s => s.weight || 0))
      ), 0)
      return { current: Math.round(maxWeight), target: 100 }
    
    case 'strength_beast':
      const maxWeight150 = Math.max(...workouts.flatMap(w => 
        w.exercises.flatMap(e => e.sets.map(s => s.weight || 0))
      ), 0)
      return { current: Math.round(maxWeight150), target: 150 }
    
    case 'iron_throne':
      const maxWeight250 = Math.max(...workouts.flatMap(w => 
        w.exercises.flatMap(e => e.sets.map(s => s.weight || 0))
      ), 0)
      return { current: Math.round(maxWeight250), target: 250 }
    
    case 'strength_legend':
      const maxWeight300 = Math.max(...workouts.flatMap(w => 
        w.exercises.flatMap(e => e.sets.map(s => s.weight || 0))
      ), 0)
      return { current: Math.round(maxWeight300), target: 300 }
    
    case 'well_rounded':
      const muscleGroups = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return { current: muscleGroups.size, target: 5 }
    
    case 'muscle_explorer':
      const muscleGroups10 = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups10.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return { current: muscleGroups10.size, target: 10 }
    
    case 'muscle_master':
      const muscleGroups15 = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups15.add(exercise.muscleGroup.toLowerCase())
          }
        })
      )
      return { current: muscleGroups15.size, target: 15 }
    
    case 'century_club':
      const totalSets = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.length, 0
        ), 0
      )
      return { current: totalSets, target: 100 }
    
    case 'set_collector':
      const totalSets1000 = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.length, 0
        ), 0
      )
      return { current: totalSets1000, target: 1000 }
    
    case 'rep_master':
      const totalReps = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        ), 0
      )
      return { current: totalReps, target: 1000 }
    
    case 'rep_legend':
      const totalReps10k = workouts.reduce((sum, workout) =>
        sum + workout.exercises.reduce((exerciseSum, exercise) =>
          exerciseSum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        ), 0
      )
      return { current: totalReps10k, target: 10000 }
    
    case 'exercise_collector':
      const exercises = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.name) {
            exercises.add(exercise.name.toLowerCase())
          }
        })
      )
      return { current: exercises.size, target: 25 }
    
    case 'exercise_encyclopedia':
      const exercises50 = new Set()
      workouts.forEach(workout =>
        workout.exercises.forEach(exercise => {
          if (exercise.name) {
            exercises50.add(exercise.name.toLowerCase())
          }
        })
      )
      return { current: exercises50.size, target: 50 }
    
    case 'muscle_sculptor':
      const sculptingSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 12 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return { current: sculptingSets, target: 50 }
    
    case 'time_under_tension':
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return { current: hypertrophySets, target: 100 }
    
    case 'compound_king':
      const compoundExercises = ['squat', 'deadlift', 'bench press', 'overhead press', 'row', 'pull up', 'chin up']
      const compoundReps = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isCompound = compoundExercises.some(compound => 
            exercise.name?.toLowerCase().includes(compound)
          )
          return isCompound ? exerciseCount + exercise.sets.reduce((setCount, set) => 
            setCount + (set.reps || 0), 0
          ) : exerciseCount
        }, 0), 0
      )
      return { current: compoundReps, target: 500 }
    
    default:
      return null
  }
}

// Get rarity color
export const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'common': return 'text-gray-400 border-gray-500'
    case 'uncommon': return 'text-green-400 border-green-500'
    case 'rare': return 'text-blue-400 border-blue-500'
    case 'epic': return 'text-purple-400 border-purple-500'
    case 'legendary': return 'text-yellow-400 border-yellow-500'
    default: return 'text-gray-400 border-gray-500'
  }
}

// Calculate total achievement points
export const calculateTotalPoints = (unlockedAchievements) => {
  return unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0)
}
