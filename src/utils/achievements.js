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
  
  // Hypertrophy-Focused Strength Achievements
  MUSCLE_BUILDER: {
    id: 'muscle_builder',
    title: 'Muscle Builder',
    description: 'Complete 50 sets in the 6-12 rep range (optimal hypertrophy)',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 100,
    condition: (workouts) => {
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 12
          ).length, 0
        ), 0
      )
      return hypertrophySets >= 50
    }
  },
  
  PROGRESSIVE_OVERLOADER: {
    id: 'progressive_overloader',
    title: 'Progressive Overloader',
    description: 'Increase weight on the same exercise 5 times',
    icon: '📈',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 200,
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
            if (increases >= 5) return true
          }
        }
        return false
      })
    }
  },
  
  HYPERTROPHY_SPECIALIST: {
    id: 'hypertrophy_specialist',
    title: 'Hypertrophy Specialist',
    description: 'Complete 500 sets in the 6-12 rep range (optimal hypertrophy)',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 500,
    condition: (workouts) => {
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 12
          ).length, 0
        ), 0
      )
      return hypertrophySets >= 500
    }
  },
  
  // Hypertrophy Volume Achievements
  VOLUME_TITAN: {
    id: 'volume_titan',
    title: 'Volume Titan',
    description: 'Complete 100+ total sets in a single workout',
    icon: '🏔️',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 1000,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalSets = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.length, 0
        )
        return totalSets >= 100
      })
    }
  },
  
  THOUSAND_REP_WORKOUT: {
    id: 'thousand_rep_workout',
    title: 'Thousand Rep Workout',
    description: 'Complete 1000+ total reps in a single workout',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 1000,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalReps = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        )
        return totalReps >= 1000
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
  HYPERTROPHY_SCIENTIST: {
    id: 'hypertrophy_scientist',
    title: 'Hypertrophy Scientist',
    description: 'Complete 1000 sets in the 8-15 rep range (total hypertrophy zone)',
    icon: '🔬',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return hypertrophySets >= 1000
    }
  },

  STRENGTH_ARCHAEOLOGIST: {
    id: 'strength_archaeologist',
    title: 'Strength Archaeologist',
    description: 'Track the same exercise for 100+ workouts',
    icon: '🏛️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const exerciseCounts = {}
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase()
          if (exerciseName) {
            exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1
          }
        })
      })
      return Math.max(...Object.values(exerciseCounts), 0) >= 100
    }
  },

  DOUBLE_BODYWEIGHT_SQUAT: {
    id: 'double_bodyweight_squat',
    title: 'Double Bodyweight Squat',
    description: 'Squat 2x your bodyweight for multiple reps',
    icon: '🏋️‍♂️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 1000,
    condition: (workouts) => {
      // Get user's bodyweight from localStorage
      const measurements = localStorage.getItem('gymgenie-measurements')
      const bodyweight = measurements ? JSON.parse(measurements).weight || 70 : 70
      const targetWeight = bodyweight * 2
      
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const isSquat = exercise.name?.toLowerCase().includes('squat')
          return isSquat && exercise.sets.some(set => 
            (set.weight || 0) >= targetWeight && (set.reps || 0) >= 3
          )
        })
      )
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
  },

  // Hypertrophy-Focused Achievements
  HYPERTROPHY_SPECIALIST: {
    id: 'hypertrophy_specialist',
    title: 'Hypertrophy Specialist',
    description: 'Complete 500 sets in the 6-12 rep range (optimal hypertrophy)',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const hypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 12
          ).length, 0
        ), 0
      )
      return hypertrophySets >= 500
    }
  },

  MUSCLE_BUILDER: {
    id: 'muscle_builder',
    title: 'Muscle Builder',
    description: 'Complete 100 sets with 8-10 reps (peak hypertrophy range)',
    icon: '🏗️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const peakHypertrophySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 10
          ).length, 0
        ), 0
      )
      return peakHypertrophySets >= 100
    }
  },

  VOLUME_ACCUMULATOR: {
    id: 'volume_accumulator',
    title: 'Volume Accumulator',
    description: 'Perform 20+ sets for a single muscle group in one workout',
    icon: '📊',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'rare',
    points: 250,
    condition: (workouts) => {
      return workouts.some(workout => {
        const muscleGroupSets = {}
        workout.exercises.forEach(exercise => {
          const muscle = exercise.muscleGroup || 'Unknown'
          muscleGroupSets[muscle] = (muscleGroupSets[muscle] || 0) + exercise.sets.length
        })
        return Math.max(...Object.values(muscleGroupSets), 0) >= 20
      })
    }
  },

  MECHANICAL_TENSION: {
    id: 'mechanical_tension',
    title: 'Mechanical Tension Master',
    description: 'Complete 200 sets with 6-8 reps (high tension range)',
    icon: '⚙️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const tensionSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 8
          ).length, 0
        ), 0
      )
      return tensionSets >= 200
    }
  },

  METABOLIC_STRESS: {
    id: 'metabolic_stress',
    title: 'Metabolic Stress Specialist',
    description: 'Complete 300 sets with 12-15 reps (metabolic stress range)',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const metabolicSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 12 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return metabolicSets >= 300
    }
  },

  PROGRESSIVE_OVERLOAD_MASTER: {
    id: 'progressive_overload_master',
    title: 'Progressive Overload Master',
    description: 'Increase weight on the same exercise 20 times',
    icon: '📈',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'epic',
    points: 500,
    condition: (workouts) => {
      const exerciseProgression = {}
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase() || 'unknown'
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0))
          if (maxWeight > 0) {
            if (!exerciseProgression[exerciseName]) {
              exerciseProgression[exerciseName] = { weights: [], increases: 0 }
            }
            const lastWeight = exerciseProgression[exerciseName].weights[exerciseProgression[exerciseName].weights.length - 1]
            if (!lastWeight || maxWeight > lastWeight) {
              exerciseProgression[exerciseName].weights.push(maxWeight)
              if (lastWeight) {
                exerciseProgression[exerciseName].increases++
              }
            }
          }
        })
      })
      return Math.max(...Object.values(exerciseProgression).map(prog => prog.increases), 0) >= 20
    }
  },

  MUSCLE_CONFUSION: {
    id: 'muscle_confusion',
    title: 'Muscle Confusion Expert',
    description: 'Perform 5 different exercises for the same muscle group in one workout',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      return workouts.some(workout => {
        const muscleGroupExercises = {}
        workout.exercises.forEach(exercise => {
          const muscle = exercise.muscleGroup || 'Unknown'
          if (!muscleGroupExercises[muscle]) {
            muscleGroupExercises[muscle] = new Set()
          }
          muscleGroupExercises[muscle].add(exercise.name?.toLowerCase() || 'unknown')
        })
        return Math.max(...Object.values(muscleGroupExercises).map(set => set.size), 0) >= 5
      })
    }
  },

  ISOLATION_SPECIALIST: {
    id: 'isolation_specialist',
    title: 'Isolation Specialist',
    description: 'Complete 100 sets of isolation exercises',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const isolationExercises = ['curl', 'extension', 'raise', 'fly', 'flye', 'lateral', 'calf', 'shrug', 'crunch']
      const isolationSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isIsolation = isolationExercises.some(iso => 
            exercise.name?.toLowerCase().includes(iso)
          )
          return isIsolation ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return isolationSets >= 100
    }
  },

  COMPOUND_MASTER: {
    id: 'compound_master',
    title: 'Compound Master',
    description: 'Complete 200 sets of compound exercises',
    icon: '🏋️‍♂️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const compoundExercises = ['squat', 'deadlift', 'bench', 'press', 'row', 'pull', 'chin', 'dip', 'lunge']
      const compoundSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isCompound = compoundExercises.some(compound => 
            exercise.name?.toLowerCase().includes(compound)
          )
          return isCompound ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return compoundSets >= 200
    }
  },

  REST_PAUSE_WARRIOR: {
    id: 'rest_pause_warrior',
    title: 'Rest-Pause Warrior',
    description: 'Complete 50 high-intensity sets (RPE 9-10)',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 275,
    condition: (workouts) => {
      const highIntensitySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.difficulty >= 9
          ).length, 0
        ), 0
      )
      return highIntensitySets >= 50
    }
  },

  PUMP_CHASER: {
    id: 'pump_chaser',
    title: 'Pump Chaser',
    description: 'Complete 15+ sets for a single muscle group in one workout',
    icon: '💥',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      return workouts.some(workout => {
        const muscleGroupSets = {}
        workout.exercises.forEach(exercise => {
          const muscle = exercise.muscleGroup || 'Unknown'
          muscleGroupSets[muscle] = (muscleGroupSets[muscle] || 0) + exercise.sets.length
        })
        return Math.max(...Object.values(muscleGroupSets), 0) >= 15
      })
    }
  },

  STRENGTH_ENDURANCE: {
    id: 'strength_endurance',
    title: 'Strength Endurance',
    description: 'Complete 100 sets with 15-20 reps',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const enduranceSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 15 && set.reps <= 20
          ).length, 0
        ), 0
      )
      return enduranceSets >= 100
    }
  },

  MUSCLE_FIBER_RECRUIT: {
    id: 'muscle_fiber_recruit',
    title: 'Muscle Fiber Recruiter',
    description: 'Complete sets with varying rep ranges (1-5, 6-12, 13+) in one workout',
    icon: '🧬',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      return workouts.some(workout => {
        let lowReps = 0, midReps = 0, highReps = 0
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.reps >= 1 && set.reps <= 5) lowReps++
            else if (set.reps >= 6 && set.reps <= 12) midReps++
            else if (set.reps >= 13) highReps++
          })
        })
        return lowReps > 0 && midReps > 0 && highReps > 0
      })
    }
  },

  HYPERTROPHY_SCIENTIST: {
    id: 'hypertrophy_scientist',
    title: 'Hypertrophy Scientist',
    description: 'Complete 1000 sets in the 8-15 rep range (total hypertrophy zone)',
    icon: '🔬',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const scienceSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return scienceSets >= 1000
    }
  },

  MUSCLE_SYMMETRY: {
    id: 'muscle_symmetry',
    title: 'Muscle Symmetry',
    description: 'Train all major muscle groups (8+) in a single week',
    icon: '⚖️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const weeklyMuscles = {}
      workouts.forEach(workout => {
        const weekStart = startOfWeek(new Date(workout.date))
        const weekKey = format(weekStart, 'yyyy-MM-dd')
        if (!weeklyMuscles[weekKey]) {
          weeklyMuscles[weekKey] = new Set()
        }
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            weeklyMuscles[weekKey].add(exercise.muscleGroup.toLowerCase())
          }
        })
      })
      return Math.max(...Object.values(weeklyMuscles).map(set => set.size), 0) >= 8
    }
  },

  INTENSITY_MASTER: {
    id: 'intensity_master',
    title: 'Intensity Master',
    description: 'Complete 100 sets with RPE 8+ (high intensity)',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const intenseSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.difficulty >= 8
          ).length, 0
        ), 0
      )
      return intenseSets >= 100
    }
  },

  VOLUME_TITAN: {
    id: 'volume_titan',
    title: 'Volume Titan',
    description: 'Complete 100+ total sets in a single workout',
    icon: '🏔️',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 1000,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalSets = workout.exercises.reduce((sum, exercise) => 
          sum + exercise.sets.length, 0
        )
        return totalSets >= 100
      })
    }
  },

  MUSCLE_ENDURANCE: {
    id: 'muscle_endurance',
    title: 'Muscle Endurance',
    description: 'Complete 200 sets with 20+ reps',
    icon: '🏃‍♂️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const enduranceSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 20
          ).length, 0
        ), 0
      )
      return enduranceSets >= 200
    }
  },

  MIND_MUSCLE_CONNECTION: {
    id: 'mind_muscle_connection',
    title: 'Mind-Muscle Connection',
    description: 'Complete 100 sets with perfect form (RPE 7-8, 8-12 reps)',
    icon: '🧘‍♂️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const perfectFormSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 12 && set.difficulty >= 7 && set.difficulty <= 8
          ).length, 0
        ), 0
      )
      return perfectFormSets >= 100
    }
  },

  MUSCLE_FIBER_MASTER: {
    id: 'muscle_fiber_master',
    title: 'Muscle Fiber Master',
    description: 'Train both fast-twitch (1-6 reps) and slow-twitch (15+ reps) in one workout',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      return workouts.some(workout => {
        let fastTwitch = false, slowTwitch = false
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.reps >= 1 && set.reps <= 6) fastTwitch = true
            if (set.reps >= 15) slowTwitch = true
          })
        })
        return fastTwitch && slowTwitch
      })
    }
  },

  HYPERTROPHY_PERFECTIONIST: {
    id: 'hypertrophy_perfectionist',
    title: 'Hypertrophy Perfectionist',
    description: 'Complete 50 perfect hypertrophy sets (8-12 reps, RPE 8-9)',
    icon: '💎',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 350,
    condition: (workouts) => {
      const perfectSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 12 && set.difficulty >= 8 && set.difficulty <= 9
          ).length, 0
        ), 0
      )
      return perfectSets >= 50
    }
  },

  HYPERTROPHY_LEGEND: {
    id: 'hypertrophy_legend',
    title: 'Hypertrophy Legend',
    description: 'Complete 2000 sets in the 6-15 rep range (ultimate muscle building)',
    icon: '👑',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'legendary',
    points: 1500,
    condition: (workouts) => {
      const legendSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return legendSets >= 2000
    }
  },

  DROP_SET_DESTROYER: {
    id: 'drop_set_destroyer',
    title: 'Drop Set Destroyer',
    description: 'Complete 25 sets with decreasing weight (drop sets)',
    icon: '📉',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 275,
    condition: (workouts) => {
      let dropSets = 0
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          for (let i = 1; i < exercise.sets.length; i++) {
            const currentWeight = exercise.sets[i].weight || 0
            const previousWeight = exercise.sets[i-1].weight || 0
            if (currentWeight < previousWeight && currentWeight > 0) {
              dropSets++
            }
          }
        })
      })
      return dropSets >= 25
    }
  },

  PYRAMID_MASTER: {
    id: 'pyramid_master',
    title: 'Pyramid Master',
    description: 'Complete pyramid training (increasing then decreasing weight) in one exercise',
    icon: '🔺',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      return workouts.some(workout => {
        return workout.exercises.some(exercise => {
          if (exercise.sets.length < 5) return false
          const weights = exercise.sets.map(set => set.weight || 0)
          
          // Find peak weight position
          let peakIndex = 0
          let maxWeight = 0
          weights.forEach((weight, index) => {
            if (weight > maxWeight) {
              maxWeight = weight
              peakIndex = index
            }
          })
          
          // Check if weights increase to peak then decrease
          if (peakIndex === 0 || peakIndex === weights.length - 1) return false
          
          let increasing = true
          for (let i = 1; i <= peakIndex; i++) {
            if (weights[i] <= weights[i-1]) increasing = false
          }
          
          let decreasing = true
          for (let i = peakIndex + 1; i < weights.length; i++) {
            if (weights[i] >= weights[i-1]) decreasing = false
          }
          
          return increasing && decreasing
        })
      })
    }
  },

  SUPERSET_SPECIALIST: {
    id: 'superset_specialist',
    title: 'Superset Specialist',
    description: 'Complete 50 supersets (back-to-back exercises)',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      let supersets = 0
      workouts.forEach(workout => {
        for (let i = 1; i < workout.exercises.length; i++) {
          const currentExercise = workout.exercises[i]
          const previousExercise = workout.exercises[i-1]
          
          // Check if exercises target different muscle groups (typical superset)
          if (currentExercise.muscleGroup !== previousExercise.muscleGroup) {
            supersets++
          }
        }
      })
      return supersets >= 50
    }
  },

  GIANT_SET_WARRIOR: {
    id: 'giant_set_warrior',
    title: 'Giant Set Warrior',
    description: 'Complete 10 giant sets (4+ exercises back-to-back)',
    icon: '🌪️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 400,
    condition: (workouts) => {
      let giantSets = 0
      workouts.forEach(workout => {
        let consecutiveExercises = 1
        for (let i = 1; i < workout.exercises.length; i++) {
          const currentMuscle = workout.exercises[i].muscleGroup
          const previousMuscle = workout.exercises[i-1].muscleGroup
          
          if (currentMuscle === previousMuscle) {
            consecutiveExercises++
          } else {
            if (consecutiveExercises >= 4) giantSets++
            consecutiveExercises = 1
          }
        }
        if (consecutiveExercises >= 4) giantSets++
      })
      return giantSets >= 10
    }
  },

  CIRCUIT_CRUSHER: {
    id: 'circuit_crusher',
    title: 'Circuit Crusher',
    description: 'Complete 20 circuit workouts (5+ different muscle groups)',
    icon: '🔄',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const circuitWorkouts = workouts.filter(workout => {
        const muscleGroups = new Set()
        workout.exercises.forEach(exercise => {
          if (exercise.muscleGroup) {
            muscleGroups.add(exercise.muscleGroup.toLowerCase())
          }
        })
        return muscleGroups.size >= 5
      })
      return circuitWorkouts.length >= 20
    }
  },

  TEMPO_MASTER: {
    id: 'tempo_master',
    title: 'Tempo Master',
    description: 'Complete 100 controlled tempo sets (RPE 7-8, 8-12 reps)',
    icon: '⏱️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const tempoSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 12 && set.difficulty >= 7 && set.difficulty <= 8
          ).length, 0
        ), 0
      )
      return tempoSets >= 100
    }
  },

  MUSCLE_PUMP_KING: {
    id: 'muscle_pump_king',
    title: 'Muscle Pump King',
    description: 'Complete 25+ sets for a single muscle group in one workout',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 500,
    condition: (workouts) => {
      return workouts.some(workout => {
        const muscleGroupSets = {}
        workout.exercises.forEach(exercise => {
          const muscle = exercise.muscleGroup || 'Unknown'
          muscleGroupSets[muscle] = (muscleGroupSets[muscle] || 0) + exercise.sets.length
        })
        return Math.max(...Object.values(muscleGroupSets), 0) >= 25
      })
    }
  },

  FAILURE_FIGHTER: {
    id: 'failure_fighter',
    title: 'Failure Fighter',
    description: 'Complete 100 sets to failure (RPE 10)',
    icon: '💥',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 350,
    condition: (workouts) => {
      const failureSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.difficulty === 10
          ).length, 0
        ), 0
      )
      return failureSets >= 100
    }
  },

  NEGATIVE_SPECIALIST: {
    id: 'negative_specialist',
    title: 'Negative Specialist',
    description: 'Complete 50 negative/eccentric focused sets (1-5 reps, high weight)',
    icon: '⬇️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const negativeSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 1 && set.reps <= 5 && (set.weight || 0) > 50
          ).length, 0
        ), 0
      )
      return negativeSets >= 50
    }
  },

  CLUSTER_SET_CHAMPION: {
    id: 'cluster_set_champion',
    title: 'Cluster Set Champion',
    description: 'Complete 30 cluster sets (low reps, high intensity)',
    icon: '🔗',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'rare',
    points: 275,
    condition: (workouts) => {
      const clusterSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 1 && set.reps <= 5 && set.difficulty >= 8
          ).length, 0
        ), 0
      )
      return clusterSets >= 30
    }
  },

  ISOMETRIC_MASTER: {
    id: 'isometric_master',
    title: 'Isometric Master',
    description: 'Complete 50 isometric holds (planks, wall sits, etc.)',
    icon: '⏸️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const isometricExercises = ['plank', 'wall sit', 'hold', 'static', 'isometric']
      const isometricSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isIsometric = isometricExercises.some(iso => 
            exercise.name?.toLowerCase().includes(iso)
          )
          return isIsometric ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return isometricSets >= 50
    }
  },

  PLYOMETRIC_POWER: {
    id: 'plyometric_power',
    title: 'Plyometric Power',
    description: 'Complete 100 explosive/plyometric exercises',
    icon: '💥',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const plyometricExercises = ['jump', 'explosive', 'plyometric', 'box', 'burpee', 'sprint']
      const plyometricSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isPlyometric = plyometricExercises.some(plyo => 
            exercise.name?.toLowerCase().includes(plyo)
          )
          return isPlyometric ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return plyometricSets >= 100
    }
  },

  UNILATERAL_SPECIALIST: {
    id: 'unilateral_specialist',
    title: 'Unilateral Specialist',
    description: 'Complete 100 single-limb exercises',
    icon: '🦵',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const unilateralExercises = ['single', 'one arm', 'one leg', 'unilateral', 'pistol', 'bulgarian']
      const unilateralSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isUnilateral = unilateralExercises.some(uni => 
            exercise.name?.toLowerCase().includes(uni)
          )
          return isUnilateral ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return unilateralSets >= 100
    }
  },

  FUNCTIONAL_FITNESS: {
    id: 'functional_fitness',
    title: 'Functional Fitness',
    description: 'Complete 200 functional movement exercises',
    icon: '🏃‍♂️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const functionalExercises = ['squat', 'deadlift', 'lunge', 'push up', 'pull up', 'row', 'carry', 'farmer']
      const functionalSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isFunctional = functionalExercises.some(func => 
            exercise.name?.toLowerCase().includes(func)
          )
          return isFunctional ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return functionalSets >= 200
    }
  },

  BODYWEIGHT_BEAST: {
    id: 'bodyweight_beast',
    title: 'Bodyweight Beast',
    description: 'Complete 300 bodyweight exercise sets',
    icon: '🤸‍♂️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const bodyweightExercises = ['push up', 'pull up', 'chin up', 'dip', 'squat', 'lunge', 'plank', 'burpee']
      const bodyweightSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isBodyweight = bodyweightExercises.some(bw => 
            exercise.name?.toLowerCase().includes(bw)
          ) && (exercise.sets.every(set => (set.weight || 0) === 0))
          return isBodyweight ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return bodyweightSets >= 300
    }
  },

  MOBILITY_MASTER: {
    id: 'mobility_master',
    title: 'Mobility Master',
    description: 'Complete 100 mobility/flexibility exercises',
    icon: '🧘‍♀️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const mobilityExercises = ['stretch', 'mobility', 'flexibility', 'yoga', 'foam roll', 'dynamic']
      const mobilitySets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isMobility = mobilityExercises.some(mob => 
            exercise.name?.toLowerCase().includes(mob)
          )
          return isMobility ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return mobilitySets >= 100
    }
  },

  CORE_CRUSHER: {
    id: 'core_crusher',
    title: 'Core Crusher',
    description: 'Complete 500 core/abs exercises',
    icon: '🎯',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const coreExercises = ['abs', 'core', 'plank', 'crunch', 'sit up', 'russian twist', 'leg raise', 'mountain climber']
      const coreSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isCore = coreExercises.some(core => 
            exercise.name?.toLowerCase().includes(core)
          ) || exercise.muscleGroup?.toLowerCase() === 'abs'
          return isCore ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return coreSets >= 500
    }
  },

  CARDIO_KING: {
    id: 'cardio_king',
    title: 'Cardio King',
    description: 'Complete 100 cardio sessions',
    icon: '❤️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      const cardioWorkouts = workouts.filter(workout => {
        return workout.exercises.some(exercise => 
          exercise.type === 'cardio' || 
          ['run', 'bike', 'swim', 'cardio', 'treadmill', 'elliptical'].some(cardio => 
            exercise.name?.toLowerCase().includes(cardio)
          )
        )
      })
      return cardioWorkouts.length >= 100
    }
  },

  HIIT_HERO: {
    id: 'hiit_hero',
    title: 'HIIT Hero',
    description: 'Complete 50 HIIT workouts',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const hiitWorkouts = workouts.filter(workout => {
        return workout.exercises.some(exercise => 
          ['hiit', 'interval', 'tabata', 'sprint'].some(hiit => 
            exercise.name?.toLowerCase().includes(hiit)
          )
        )
      })
      return hiitWorkouts.length >= 50
    }
  },

  STRENGTH_ARCHAEOLOGIST: {
    id: 'strength_archaeologist',
    title: 'Strength Archaeologist',
    description: 'Track the same exercise for 100+ workouts',
    icon: '🏛️',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const exerciseFrequency = {}
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase() || 'unknown'
          exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1
        })
      })
      return Math.max(...Object.values(exerciseFrequency), 0) >= 100
    }
  },

  ULTIMATE_HYPERTROPHY: {
    id: 'ultimate_hypertrophy',
    title: 'Ultimate Hypertrophy',
    description: 'Complete 5000 sets in the 6-15 rep range (hypertrophy god)',
    icon: '🏆',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'legendary',
    points: 2500,
    condition: (workouts) => {
      const ultimateSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return ultimateSets >= 5000
    }
  },

  // Advanced Training Methods
  BLOOD_FLOW_RESTRICTION: {
    id: 'blood_flow_restriction',
    title: 'Blood Flow Restriction',
    description: 'Complete 100 high-rep sets with light weight (20+ reps, <50% max)',
    icon: '🩸',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const bfrSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 20 && (set.weight || 0) > 0 && (set.weight || 0) <= 50
          ).length, 0
        ), 0
      )
      return bfrSets >= 100
    }
  },

  PAUSE_REP_MASTER: {
    id: 'pause_rep_master',
    title: 'Pause Rep Master',
    description: 'Complete 200 controlled sets (6-10 reps, RPE 7-8)',
    icon: '⏸️',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const pauseSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 10 && set.difficulty >= 7 && set.difficulty <= 8
          ).length, 0
        ), 0
      )
      return pauseSets >= 200
    }
  },

  DENSITY_DESTROYER: {
    id: 'density_destroyer',
    title: 'Density Destroyer',
    description: 'Complete a workout in under 45 minutes with 20+ sets',
    icon: '⚡',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 350,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
        const duration = workout.duration || 0 // Assuming duration is in minutes
        return totalSets >= 20 && duration <= 45 && duration > 0
      })
    }
  },

  // Strength Milestones
  DOUBLE_BODYWEIGHT_SQUAT: {
    id: 'double_bodyweight_squat',
    title: 'Double Bodyweight Squat',
    description: 'Squat 2x your bodyweight (assuming 70kg = 140kg squat)',
    icon: '🏋️‍♂️',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const squatExercises = ['squat', 'back squat', 'front squat']
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const isSquat = squatExercises.some(squat => 
            exercise.name?.toLowerCase().includes(squat)
          )
          return isSquat && exercise.sets.some(set => (set.weight || 0) >= 140)
        })
      )
    }
  },

  DOUBLE_BODYWEIGHT_DEADLIFT: {
    id: 'double_bodyweight_deadlift',
    title: 'Double Bodyweight Deadlift',
    description: 'Deadlift 2x your bodyweight (assuming 70kg = 140kg deadlift)',
    icon: '💀',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'epic',
    points: 750,
    condition: (workouts) => {
      const deadliftExercises = ['deadlift', 'conventional deadlift', 'sumo deadlift']
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const isDeadlift = deadliftExercises.some(dl => 
            exercise.name?.toLowerCase().includes(dl)
          )
          return isDeadlift && exercise.sets.some(set => (set.weight || 0) >= 140)
        })
      )
    }
  },

  BODYWEIGHT_BENCH: {
    id: 'bodyweight_bench',
    title: 'Bodyweight Bench Press',
    description: 'Bench press your bodyweight (assuming 70kg bench)',
    icon: '💪',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'uncommon',
    points: 200,
    condition: (workouts) => {
      const benchExercises = ['bench press', 'bench', 'flat bench']
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const isBench = benchExercises.some(bench => 
            exercise.name?.toLowerCase().includes(bench)
          )
          return isBench && exercise.sets.some(set => (set.weight || 0) >= 70)
        })
      )
    }
  },

  // Endurance Challenges
  CENTURY_CLUB_REPS: {
    id: 'century_club_reps',
    title: 'Century Club Reps',
    description: 'Complete 100 reps of the same exercise in one workout',
    icon: '💯',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0)
          return totalReps >= 100
        })
      )
    }
  },

  THOUSAND_REP_WORKOUT: {
    id: 'thousand_rep_workout',
    title: 'Thousand Rep Workout',
    description: 'Complete 1000+ total reps in a single workout',
    icon: '🔥',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    rarity: 'epic',
    points: 1000,
    condition: (workouts) => {
      return workouts.some(workout => {
        const totalReps = workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0), 0
        )
        return totalReps >= 1000
      })
    }
  },

  // Consistency Streaks
  PERFECT_WEEK: {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Train 7 days in a row',
    icon: '🗓️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      if (workouts.length < 7) return false
      
      const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
      
      for (let i = 0; i <= sortedWorkouts.length - 7; i++) {
        let consecutive = true
        for (let j = 1; j < 7; j++) {
          const currentDate = new Date(sortedWorkouts[i + j - 1].date)
          const nextDate = new Date(sortedWorkouts[i + j].date)
          const dayDiff = Math.abs(nextDate - currentDate) / (1000 * 60 * 60 * 24)
          if (dayDiff > 1) {
            consecutive = false
            break
          }
        }
        if (consecutive) return true
      }
      return false
    }
  },

  MONTHLY_WARRIOR: {
    id: 'monthly_warrior',
    title: 'Monthly Warrior',
    description: 'Complete 25+ workouts in a single month',
    icon: '📅',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'rare',
    points: 400,
    condition: (workouts) => {
      const monthlyWorkouts = {}
      workouts.forEach(workout => {
        const monthKey = format(new Date(workout.date), 'yyyy-MM')
        monthlyWorkouts[monthKey] = (monthlyWorkouts[monthKey] || 0) + 1
      })
      return Math.max(...Object.values(monthlyWorkouts), 0) >= 25
    }
  },

  // Specialized Training
  OLYMPIC_LIFTER: {
    id: 'olympic_lifter',
    title: 'Olympic Lifter',
    description: 'Perform 50 Olympic lift variations (clean, jerk, snatch)',
    icon: '🏅',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 350,
    condition: (workouts) => {
      const olympicLifts = ['clean', 'jerk', 'snatch', 'power clean', 'power snatch']
      const olympicSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isOlympic = olympicLifts.some(lift => 
            exercise.name?.toLowerCase().includes(lift)
          )
          return isOlympic ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return olympicSets >= 50
    }
  },

  POWERLIFTER: {
    id: 'powerlifter',
    title: 'Powerlifter',
    description: 'Complete the big 3: squat, bench, deadlift in one workout',
    icon: '🏋️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      return workouts.some(workout => {
        const exercises = workout.exercises.map(ex => ex.name?.toLowerCase() || '')
        const hasSquat = exercises.some(name => name.includes('squat'))
        const hasBench = exercises.some(name => name.includes('bench'))
        const hasDeadlift = exercises.some(name => name.includes('deadlift'))
        return hasSquat && hasBench && hasDeadlift
      })
    }
  },

  STRONGMAN: {
    id: 'strongman',
    title: 'Strongman',
    description: 'Complete 100 strongman exercises (carries, yoke, atlas stones)',
    icon: '🗿',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      const strongmanExercises = ['carry', 'yoke', 'atlas', 'tire flip', 'sled', 'prowler', 'log press']
      const strongmanSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isStrongman = strongmanExercises.some(sm => 
            exercise.name?.toLowerCase().includes(sm)
          )
          return isStrongman ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return strongmanSets >= 100
    }
  },

  // Recovery & Health
  RECOVERY_GURU: {
    id: 'recovery_guru',
    title: 'Recovery Guru',
    description: 'Take planned rest days between intense sessions (RPE 8+)',
    icon: '🧘',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 150,
    condition: (workouts) => {
      if (workouts.length < 10) return false
      
      const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date))
      let recoveryCount = 0
      
      for (let i = 1; i < sortedWorkouts.length; i++) {
        const prevWorkout = sortedWorkouts[i - 1]
        const currentWorkout = sortedWorkouts[i]
        
        const prevIntense = prevWorkout.exercises.some(ex => 
          ex.sets.some(set => set.difficulty >= 8)
        )
        const daysBetween = Math.abs(new Date(currentWorkout.date) - new Date(prevWorkout.date)) / (1000 * 60 * 60 * 24)
        
        if (prevIntense && daysBetween >= 1) {
          recoveryCount++
        }
      }
      
      return recoveryCount >= 20
    }
  },

  DELOAD_MASTER: {
    id: 'deload_master',
    title: 'Deload Master',
    description: 'Complete 5 deload weeks (reduced volume/intensity)',
    icon: '📉',
    category: ACHIEVEMENT_CATEGORIES.PROGRESSION,
    rarity: 'rare',
    points: 250,
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
      
      const sortedWeeks = Object.entries(weeklyVolumes).sort(([a], [b]) => a.localeCompare(b))
      let deloadWeeks = 0
      
      for (let i = 4; i < sortedWeeks.length; i++) {
        const currentVolume = sortedWeeks[i][1]
        const avgPrevious4 = sortedWeeks.slice(i-4, i).reduce((sum, [_, vol]) => sum + vol, 0) / 4
        
        if (currentVolume < avgPrevious4 * 0.7) { // 30% reduction
          deloadWeeks++
        }
      }
      
      return deloadWeeks >= 5
    }
  },

  // Social & Community
  WORKOUT_BUDDY: {
    id: 'workout_buddy',
    title: 'Workout Buddy',
    description: 'Train with a partner for 20 sessions',
    icon: '👥',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      // This would need additional data structure to track partners
      // For now, we'll use a placeholder condition
      return workouts.filter(workout => 
        workout.notes?.toLowerCase().includes('partner') || 
        workout.notes?.toLowerCase().includes('buddy') ||
        workout.notes?.toLowerCase().includes('with')
      ).length >= 20
    }
  },

  MENTOR: {
    id: 'mentor',
    title: 'Mentor',
    description: 'Help others by sharing workout knowledge',
    icon: '🎓',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'rare',
    points: 300,
    condition: (workouts) => {
      // Placeholder - would need social features
      return workouts.length >= 200 && workouts.filter(w => w.notes?.length > 50).length >= 50
    }
  },

  // Seasonal & Special
  NEW_YEAR_RESOLUTION: {
    id: 'new_year_resolution',
    title: 'New Year Resolution',
    description: 'Complete 10 workouts in January',
    icon: '🎊',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'common',
    points: 100,
    condition: (workouts) => {
      const januaryWorkouts = workouts.filter(workout => {
        const month = new Date(workout.date).getMonth()
        return month === 0 // January
      })
      return januaryWorkouts.length >= 10
    }
  },

  BEACH_BODY_PREP: {
    id: 'beach_body_prep',
    title: 'Beach Body Prep',
    description: 'Complete 15 workouts in May (beach season prep)',
    icon: '🏖️',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'uncommon',
    points: 125,
    condition: (workouts) => {
      const mayWorkouts = workouts.filter(workout => {
        const month = new Date(workout.date).getMonth()
        return month === 4 // May
      })
      return mayWorkouts.length >= 15
    }
  },

  HALLOWEEN_MONSTER: {
    id: 'halloween_monster',
    title: 'Halloween Monster',
    description: 'Complete a monster workout on Halloween (30+ sets)',
    icon: '👹',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      return workouts.some(workout => {
        const workoutDate = new Date(workout.date)
        const isHalloween = workoutDate.getMonth() === 9 && workoutDate.getDate() === 31
        const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
        return isHalloween && totalSets >= 30
      })
    }
  },

  // Equipment Mastery
  BARBELL_SPECIALIST: {
    id: 'barbell_specialist',
    title: 'Barbell Specialist',
    description: 'Complete 500 barbell exercises',
    icon: '🏋️‍♀️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const barbellExercises = ['barbell', 'squat', 'deadlift', 'bench', 'row', 'curl', 'press']
      const barbellSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isBarbell = barbellExercises.some(bb => 
            exercise.name?.toLowerCase().includes(bb)
          )
          return isBarbell ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return barbellSets >= 500
    }
  },

  DUMBBELL_MASTER: {
    id: 'dumbbell_master',
    title: 'Dumbbell Master',
    description: 'Complete 500 dumbbell exercises',
    icon: '🏋️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const dumbbellExercises = ['dumbbell', 'db ', 'dumbel']
      const dumbbellSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isDumbbell = dumbbellExercises.some(db => 
            exercise.name?.toLowerCase().includes(db)
          )
          return isDumbbell ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return dumbbellSets >= 500
    }
  },

  MACHINE_OPERATOR: {
    id: 'machine_operator',
    title: 'Machine Operator',
    description: 'Complete 300 machine exercises',
    icon: '⚙️',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    rarity: 'common',
    points: 100,
    condition: (workouts) => {
      const machineExercises = ['machine', 'cable', 'lat pulldown', 'leg press', 'smith']
      const machineSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) => {
          const isMachine = machineExercises.some(machine => 
            exercise.name?.toLowerCase().includes(machine)
          )
          return isMachine ? exerciseCount + exercise.sets.length : exerciseCount
        }, 0), 0
      )
      return machineSets >= 300
    }
  },

  // Final 4 Achievements to reach 125 total
  MIDNIGHT_WARRIOR: {
    id: 'midnight_warrior',
    title: 'Midnight Warrior',
    description: 'Complete 10 workouts after midnight (00:00-06:00)',
    icon: '🌙',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    rarity: 'rare',
    points: 250,
    condition: (workouts) => {
      const midnightWorkouts = workouts.filter(workout => {
        const workoutTime = new Date(workout.date)
        const hour = workoutTime.getHours()
        return hour >= 0 && hour < 6
      })
      return midnightWorkouts.length >= 10
    }
  },

  TRIPLE_BODYWEIGHT_DEADLIFT: {
    id: 'triple_bodyweight_deadlift',
    title: 'Triple Bodyweight Deadlift',
    description: 'Deadlift 3x your bodyweight (assuming 70kg = 210kg deadlift)',
    icon: '💀',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH,
    rarity: 'legendary',
    points: 1500,
    condition: (workouts) => {
      const deadliftExercises = ['deadlift', 'conventional deadlift', 'sumo deadlift']
      return workouts.some(workout =>
        workout.exercises.some(exercise => {
          const isDeadlift = deadliftExercises.some(dl => 
            exercise.name?.toLowerCase().includes(dl)
          )
          return isDeadlift && exercise.sets.some(set => (set.weight || 0) >= 210)
        })
      )
    }
  },

  BIRTHDAY_BEAST: {
    id: 'birthday_beast',
    title: 'Birthday Beast',
    description: 'Complete a workout on your birthday with your age in reps',
    icon: '🎂',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: 'rare',
    points: 200,
    condition: (workouts) => {
      // This would ideally check against user's birthday
      // For now, we'll check if any workout has high reps (assuming age 20-40)
      return workouts.some(workout => {
        const workoutDate = new Date(workout.date)
        const month = workoutDate.getMonth()
        const day = workoutDate.getDate()
        
        // Check if any exercise has reps between 20-40 (typical age range)
        const hasAgeReps = workout.exercises.some(exercise =>
          exercise.sets.some(set => set.reps >= 20 && set.reps <= 40)
        )
        
        // Placeholder: assume birthday if workout in December (celebration month)
        return month === 11 && hasAgeReps
      })
    }
  },

  IRON_PHILOSOPHER: {
    id: 'iron_philosopher',
    title: 'Iron Philosopher',
    description: 'Write detailed workout notes for 100 sessions (50+ characters each)',
    icon: '📝',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: 'uncommon',
    points: 175,
    condition: (workouts) => {
      const detailedWorkouts = workouts.filter(workout => 
        workout.notes && workout.notes.length >= 50
      )
      return detailedWorkouts.length >= 100
    }
  }
}

// Calculate user's achievements
export const calculateAchievements = (workouts, previouslyUnlocked = []) => {
  const unlockedAchievements = []
  const lockedAchievements = []
  
  // Create a map of previously unlocked achievements by ID
  const previouslyUnlockedMap = {}
  previouslyUnlocked.forEach(achievement => {
    if (achievement.id && achievement.unlockedAt) {
      previouslyUnlockedMap[achievement.id] = achievement.unlockedAt
    }
  })
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (achievement.condition(workouts)) {
      // Use the original unlock date if it exists, otherwise set it now
      const unlockedAt = previouslyUnlockedMap[achievement.id] || new Date().toISOString()
      unlockedAchievements.push({
        ...achievement,
        unlockedAt
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
    
    // New Hypertrophy-Focused Achievements Progress
    case 'muscle_builder':
      const muscleBuilderSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 12
          ).length, 0
        ), 0
      )
      return { current: muscleBuilderSets, target: 50 }
    
    case 'progressive_overloader':
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
      
      let maxIncreases = 0
      Object.values(exerciseProgress).forEach(weights => {
        let increases = 0
        for (let i = 1; i < weights.length; i++) {
          if (weights[i] > weights[i - 1]) {
            increases++
          }
        }
        maxIncreases = Math.max(maxIncreases, increases)
      })
      return { current: maxIncreases, target: 5 }
    
    case 'hypertrophy_specialist':
      const hypertrophySpecialistSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 6 && set.reps <= 12
          ).length, 0
        ), 0
      )
      return { current: hypertrophySpecialistSets, target: 500 }
    
    case 'volume_titan':
      const maxSetsInWorkout = Math.max(...workouts.map(workout => 
        workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
      ), 0)
      return { current: maxSetsInWorkout, target: 100 }
    
    case 'thousand_rep_workout':
      const maxRepsInWorkout = Math.max(...workouts.map(workout => 
        workout.exercises.reduce((sum, exercise) =>
          sum + exercise.sets.reduce((setSum, set) =>
            setSum + (set.reps || 0), 0
          ), 0
        )
      ), 0)
      return { current: maxRepsInWorkout, target: 1000 }
    
    case 'hypertrophy_scientist':
      const hypertrophyScientistSets = workouts.reduce((count, workout) =>
        count + workout.exercises.reduce((exerciseCount, exercise) =>
          exerciseCount + exercise.sets.filter(set => 
            set.reps >= 8 && set.reps <= 15
          ).length, 0
        ), 0
      )
      return { current: hypertrophyScientistSets, target: 1000 }
    
    case 'strength_archaeologist':
      const exerciseCounts = {}
      workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          const exerciseName = exercise.name?.toLowerCase()
          if (exerciseName) {
            exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1
          }
        })
      })
      const maxExerciseCount = Math.max(...Object.values(exerciseCounts), 0)
      return { current: maxExerciseCount, target: 100 }
    
    case 'double_bodyweight_squat':
      const measurements = localStorage.getItem('gymgenie-measurements')
      const bodyweight = measurements ? JSON.parse(measurements).weight || 70 : 70
      const targetWeight = bodyweight * 2
      
      const maxSquatWeight = Math.max(...workouts.flatMap(workout =>
        workout.exercises.flatMap(exercise => {
          const isSquat = exercise.name?.toLowerCase().includes('squat')
          return isSquat ? exercise.sets.map(set => set.weight || 0) : [0]
        })
      ), 0)
      
      return { 
        current: Math.round(maxSquatWeight), 
        target: Math.round(targetWeight),
        unit: 'kg',
        note: `Target: ${Math.round(targetWeight)}kg (2x bodyweight)`
      }
    
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

// Gym Ranking System - From Newbie to Legend
export const GYM_RANKS = {
  NEWBIE: {
    id: 'newbie',
    title: 'Gym Newbie',
    description: 'Just starting your fitness journey',
    icon: '🥺',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500',
    minPoints: 0,
    maxPoints: 499,
    benefits: ['Access to basic achievements', 'Workout tracking']
  },
  BEGINNER: {
    id: 'beginner',
    title: 'Gym Beginner',
    description: 'Learning the ropes and building habits',
    icon: '💪',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    minPoints: 500,
    maxPoints: 1499,
    benefits: ['Unlocked progression tracking', 'Basic workout analytics']
  },
  ENTHUSIAST: {
    id: 'enthusiast',
    title: 'Gym Enthusiast',
    description: 'Consistent and motivated trainer',
    icon: '🔥',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    minPoints: 1500,
    maxPoints: 3499,
    benefits: ['Advanced analytics', 'Split comparison tools', 'Progress insights']
  },
  DEDICATED: {
    id: 'dedicated',
    title: 'Gym Dedicated',
    description: 'Serious about gains and consistency',
    icon: '⚡',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    minPoints: 3500,
    maxPoints: 6999,
    benefits: ['Premium workout templates', 'Advanced progression tracking', 'Hypertrophy insights']
  },
  WARRIOR: {
    id: 'warrior',
    title: 'Gym Warrior',
    description: 'Battle-tested and iron-forged',
    icon: '⚔️',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    minPoints: 7000,
    maxPoints: 12499,
    benefits: ['Elite training protocols', 'Advanced periodization', 'Strength analytics']
  },
  BEAST: {
    id: 'beast',
    title: 'Gym Beast',
    description: 'Unleashed power and relentless drive',
    icon: '🦍',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    minPoints: 12500,
    maxPoints: 19999,
    benefits: ['Master-level insights', 'Competition prep tools', 'Advanced biomechanics']
  },
  TITAN: {
    id: 'titan',
    title: 'Gym Titan',
    description: 'Colossal strength and unwavering discipline',
    icon: '🏔️',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500',
    minPoints: 20000,
    maxPoints: 29999,
    benefits: ['Titan-tier analytics', 'Professional coaching insights', 'Elite performance metrics']
  },
  LEGEND: {
    id: 'legend',
    title: 'Gym Legend',
    description: 'Mythical status - the stuff of gym folklore',
    icon: '👑',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    minPoints: 30000,
    maxPoints: 49999,
    benefits: ['Legendary status', 'All premium features', 'Community recognition', 'Mentorship tools']
  },
  IMMORTAL: {
    id: 'immortal',
    title: 'Gym Immortal',
    description: 'Transcended mortal limits - eternal iron warrior',
    icon: '♾️',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500',
    minPoints: 50000,
    maxPoints: Infinity,
    benefits: ['Immortal recognition', 'Ultimate features unlocked', 'Hall of Fame status', 'Legacy builder']
  }
}

// Get user's current rank based on points
export const getUserRank = (totalPoints) => {
  const ranks = Object.values(GYM_RANKS)
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    const rank = ranks[i]
    if (totalPoints >= rank.minPoints) {
      return rank
    }
  }
  
  return GYM_RANKS.NEWBIE // Default fallback
}

// Get next rank and progress
export const getRankProgress = (totalPoints) => {
  const currentRank = getUserRank(totalPoints)
  const ranks = Object.values(GYM_RANKS)
  const currentIndex = ranks.findIndex(rank => rank.id === currentRank.id)
  
  // If already at max rank
  if (currentIndex === ranks.length - 1) {
    return {
      currentRank,
      nextRank: null,
      progress: 100,
      pointsToNext: 0,
      pointsInCurrentRank: totalPoints - currentRank.minPoints
    }
  }
  
  const nextRank = ranks[currentIndex + 1]
  const pointsInCurrentRank = totalPoints - currentRank.minPoints
  const pointsNeededForRank = nextRank.minPoints - currentRank.minPoints
  const progress = Math.min((pointsInCurrentRank / pointsNeededForRank) * 100, 100)
  const pointsToNext = nextRank.minPoints - totalPoints
  
  return {
    currentRank,
    nextRank,
    progress: Math.round(progress),
    pointsToNext: Math.max(pointsToNext, 0),
    pointsInCurrentRank
  }
}

// Get rank statistics
export const getRankStats = (totalPoints) => {
  const allRanks = Object.values(GYM_RANKS)
  const currentRank = getUserRank(totalPoints)
  const currentIndex = allRanks.findIndex(rank => rank.id === currentRank.id)
  
  return {
    currentRank,
    rankIndex: currentIndex,
    totalRanks: allRanks.length,
    percentageComplete: Math.round(((currentIndex + 1) / allRanks.length) * 100),
    isMaxRank: currentIndex === allRanks.length - 1
  }
}

// Get motivational messages based on rank
export const getRankMotivation = (currentRank, nextRank) => {
  const motivations = {
    newbie: [
      "Every legend started as a newbie! 💪",
      "Your journey to greatness begins now! 🚀",
      "First workout is the hardest - you've got this! 🔥"
    ],
    beginner: [
      "Building those foundation gains! 🏗️",
      "Consistency is your superpower! ⚡",
      "You're already stronger than yesterday! 💪"
    ],
    enthusiast: [
      "The fire is burning bright! 🔥",
      "Your dedication is showing results! 📈",
      "Enthusiasm + Action = Transformation! ⚡"
    ],
    dedicated: [
      "Your commitment is inspiring! 🌟",
      "Serious gains require serious dedication! 💎",
      "You're in the top tier of trainers! 🏆"
    ],
    warrior: [
      "Forged in iron, tempered by sweat! ⚔️",
      "You've earned your battle scars! 🛡️",
      "Warriors never surrender! 💪"
    ],
    beast: [
      "Unleash the beast within! 🦍",
      "Raw power meets refined technique! ⚡",
      "You're becoming unstoppable! 🔥"
    ],
    titan: [
      "Colossal strength, titanium will! 🏔️",
      "You move mountains in the gym! ⛰️",
      "Titan-level dedication achieved! 👑"
    ],
    legend: [
      "Legends are made, not born! 👑",
      "Your story inspires others! 🌟",
      "Hall of Fame material right here! 🏛️"
    ],
    immortal: [
      "You've transcended mortal limits! ♾️",
      "Eternal warrior of the iron temple! 👑",
      "Your legacy will inspire generations! 🌟"
    ]
  }
  
  const messages = motivations[currentRank.id] || motivations.newbie
  return messages[Math.floor(Math.random() * messages.length)]
}

// Get rank-based rewards/unlocks
export const getRankRewards = (rank) => {
  const rewards = {
    newbie: {
      features: ['Basic workout tracking', 'Simple analytics'],
      achievements: ['Access to common achievements'],
      social: ['Profile creation']
    },
    beginner: {
      features: ['Progress charts', 'Exercise library'],
      achievements: ['Uncommon achievements unlocked'],
      social: ['Workout sharing']
    },
    enthusiast: {
      features: ['Split comparison', 'Advanced analytics', 'Custom workouts'],
      achievements: ['Rare achievements unlocked'],
      social: ['Community features', 'Progress sharing']
    },
    dedicated: {
      features: ['Periodization tools', 'Volume tracking', 'Strength curves'],
      achievements: ['Epic achievements unlocked'],
      social: ['Mentorship opportunities']
    },
    warrior: {
      features: ['Competition prep', 'Advanced programming', 'Biomechanics'],
      achievements: ['Elite achievements unlocked'],
      social: ['Warrior community access']
    },
    beast: {
      features: ['Master protocols', 'AI coaching', 'Performance optimization'],
      achievements: ['Beast-tier achievements'],
      social: ['Beast mode community']
    },
    titan: {
      features: ['Titan analytics', 'Professional insights', 'Research access'],
      achievements: ['Legendary achievements'],
      social: ['Titan council membership']
    },
    legend: {
      features: ['All premium features', 'Legacy tools', 'Historical tracking'],
      achievements: ['Mythical achievements'],
      social: ['Hall of Fame', 'Legend status']
    },
    immortal: {
      features: ['Everything unlocked', 'Immortal analytics', 'Eternal tracking'],
      achievements: ['Immortal achievements'],
      social: ['Immortal pantheon', 'Ultimate recognition']
    }
  }
  
  return rewards[rank.id] || rewards.newbie
}
