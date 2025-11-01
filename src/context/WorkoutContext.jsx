import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const WorkoutContext = createContext()

// Exercise database with muscle groups and types
export const EXERCISE_DATABASE = {
  strength: {
    chest: [
      { name: 'Bench Press', equipment: 'barbell' },
      { name: 'Incline Bench Press', equipment: 'barbell' },
      { name: 'Dumbbell Press', equipment: 'dumbbell' },
      { name: 'Push-ups', equipment: 'bodyweight' },
      { name: 'Chest Flyes', equipment: 'dumbbell' },
      { name: 'Dips', equipment: 'bodyweight' }
    ],
    back: [
      { name: 'Deadlift', equipment: 'barbell' },
      { name: 'Pull-ups', equipment: 'bodyweight' },
      { name: 'Bent-over Row', equipment: 'barbell' },
      { name: 'Lat Pulldown', equipment: 'machine' },
      { name: 'T-Bar Row', equipment: 'barbell' },
      { name: 'Cable Row', equipment: 'cable' }
    ],
    legs: [
      { name: 'Squats', equipment: 'barbell' },
      { name: 'Leg Press', equipment: 'machine' },
      { name: 'Lunges', equipment: 'dumbbell' },
      { name: 'Leg Curls', equipment: 'machine' },
      { name: 'Calf Raises', equipment: 'machine' },
      { name: 'Romanian Deadlift', equipment: 'barbell' }
    ],
    shoulders: [
      { name: 'Overhead Press', equipment: 'barbell' },
      { name: 'Lateral Raises', equipment: 'dumbbell' },
      { name: 'Rear Delt Flyes', equipment: 'dumbbell' },
      { name: 'Upright Row', equipment: 'barbell' },
      { name: 'Arnold Press', equipment: 'dumbbell' },
      { name: 'Face Pulls', equipment: 'cable' }
    ],
    biceps: [
      { name: 'Bicep Curls', equipment: 'dumbbell' },
      { name: 'Hammer Curls', equipment: 'dumbbell' },
      { name: 'Preacher Curls', equipment: 'barbell' },
      { name: 'Cable Curls', equipment: 'cable' },
      { name: 'Concentration Curls', equipment: 'dumbbell' },
      { name: 'EZ-Bar Curls', equipment: 'barbell' }
    ],
    triceps: [
      { name: 'Tricep Dips', equipment: 'bodyweight' },
      { name: 'Tricep Extensions', equipment: 'dumbbell' },
      { name: 'Close-grip Bench Press', equipment: 'barbell' },
      { name: 'Tricep Pushdowns', equipment: 'cable' },
      { name: 'Skull Crushers', equipment: 'barbell' },
      { name: 'Diamond Push-ups', equipment: 'bodyweight' }
    ],
    forearms: [
      { name: 'Wrist Curls', equipment: 'dumbbell' },
      { name: 'Reverse Curls', equipment: 'barbell' },
      { name: 'Farmer\'s Walk', equipment: 'dumbbell' },
      { name: 'Plate Pinches', equipment: 'plate' },
      { name: 'Dead Hangs', equipment: 'bodyweight' },
      { name: 'Grip Crushers', equipment: 'grip' }
    ],
    core: [
      { name: 'Plank', equipment: 'bodyweight' },
      { name: 'Crunches', equipment: 'bodyweight' },
      { name: 'Russian Twists', equipment: 'bodyweight' },
      { name: 'Leg Raises', equipment: 'bodyweight' },
      { name: 'Dead Bug', equipment: 'bodyweight' },
      { name: 'Mountain Climbers', equipment: 'bodyweight' }
    ]
  },
  cardio: [
    { name: 'Running', unit: 'minutes' },
    { name: 'Cycling', unit: 'minutes' },
    { name: 'Rowing', unit: 'minutes' },
    { name: 'Stair Climbing', unit: 'minutes' },
    { name: 'Elliptical', unit: 'minutes' },
    { name: 'Swimming', unit: 'minutes' },
    { name: 'Walking', unit: 'minutes' },
    { name: 'HIIT', unit: 'minutes' }
  ]
}

// Data migration function to handle old "arms" muscle group
const migrateWorkoutData = (workouts) => {
  return workouts.map(workout => ({
    ...workout,
    exercises: workout.exercises.map(exercise => {
      if (exercise.muscleGroup === 'arms') {
        // Migrate based on exercise name to determine specific muscle group
        const exerciseName = exercise.name.toLowerCase()
        if (exerciseName.includes('bicep') || exerciseName.includes('curl') || exerciseName.includes('chin')) {
          return { ...exercise, muscleGroup: 'biceps' }
        } else if (exerciseName.includes('tricep') || exerciseName.includes('dip') || exerciseName.includes('extension') || exerciseName.includes('pushdown')) {
          return { ...exercise, muscleGroup: 'triceps' }
        } else if (exerciseName.includes('wrist') || exerciseName.includes('forearm') || exerciseName.includes('grip') || exerciseName.includes('farmer')) {
          return { ...exercise, muscleGroup: 'forearms' }
        } else {
          // Default to biceps if we can't determine
          return { ...exercise, muscleGroup: 'biceps' }
        }
      }
      return exercise
    })
  }))
}

const initialState = {
  workouts: [],
  currentWorkout: null,
  exercises: EXERCISE_DATABASE,
  goals: [],
  achievements: [],
  stats: {
    totalWorkouts: 0,
    totalExercises: 0,
    totalWeight: 0,
    totalCardioTime: 0
  }
}

function workoutReducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload }
    
    case 'START_WORKOUT':
      return {
        ...state,
        currentWorkout: {
          id: uuidv4(),
          date: new Date().toISOString(),
          exercises: [],
          notes: ''
        }
      }
    
    case 'ADD_EXERCISE':
      if (!state.currentWorkout) return state
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: [...state.currentWorkout.exercises, {
            id: uuidv4(),
            ...action.payload,
            sets: []
          }]
        }
      }
    
    case 'ADD_SET':
      if (!state.currentWorkout) return state
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: [...exercise.sets, {
                    id: uuidv4(),
                    difficulty: 0, // Default difficulty
                    ...action.payload.set
                  }]
                }
              : exercise
          )
        }
      }
    
    case 'UPDATE_SET':
      if (!state.currentWorkout) return state
      const sanitizedUpdates = (() => {
        const u = { ...action.payload.updates }
        if (Object.prototype.hasOwnProperty.call(u, 'difficulty')) {
          let d = u.difficulty
          if (typeof d === 'number') {
            if (d !== 0) {
              d = Math.floor(d)
              d = Math.max(1, Math.min(10, d))
              u.difficulty = d
            }
          }
        }
        return u
      })()
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.map(set =>
                    set.id === action.payload.setId
                      ? { ...set, ...sanitizedUpdates }
                      : set
                  )
                }
              : exercise
          )
        }
      }
    
    case 'DELETE_SET':
      if (!state.currentWorkout) return state
      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises: state.currentWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.filter(set => set.id !== action.payload.setId)
                }
              : exercise
          )
        }
      }
    
    case 'SAVE_WORKOUT':
      if (!state.currentWorkout) return state
      const newWorkout = { ...state.currentWorkout }
      const updatedStats = calculateStats([...state.workouts, newWorkout])
      return {
        ...state,
        workouts: [...state.workouts, newWorkout],
        currentWorkout: null,
        stats: updatedStats
      }
    
    case 'DELETE_WORKOUT':
      const filteredWorkouts = state.workouts.filter(w => w.id !== action.payload)
      return {
        ...state,
        workouts: filteredWorkouts,
        stats: calculateStats(filteredWorkouts)
      }
    
    case 'CANCEL_WORKOUT':
      return {
        ...state,
        currentWorkout: null
      }
    
    case 'UPDATE_ACHIEVEMENTS':
      return {
        ...state,
        achievements: action.payload
      }
    
    default:
      return state
  }
}

function calculateStats(workouts) {
  return workouts.reduce((stats, workout) => {
    const workoutStats = workout.exercises.reduce((acc, exercise) => {
      if (exercise.type === 'strength') {
        const totalWeight = exercise.sets.reduce((sum, set) => 
          sum + (set.weight || 0) * (set.reps || 0), 0)
        return {
          exercises: acc.exercises + 1,
          weight: acc.weight + totalWeight,
          cardioTime: acc.cardioTime
        }
      } else {
        return {
          exercises: acc.exercises + 1,
          weight: acc.weight,
          cardioTime: acc.cardioTime + (exercise.duration || 0)
        }
      }
    }, { exercises: 0, weight: 0, cardioTime: 0 })
    
    return {
      totalWorkouts: stats.totalWorkouts + 1,
      totalExercises: stats.totalExercises + workoutStats.exercises,
      totalWeight: stats.totalWeight + workoutStats.weight,
      totalCardioTime: stats.totalCardioTime + workoutStats.cardioTime
    }
  }, { totalWorkouts: 0, totalExercises: 0, totalWeight: 0, totalCardioTime: 0 })
}

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(workoutReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('gymgenie-data')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        // Ensure we have valid data structure
        if (parsedData && typeof parsedData === 'object') {
          // Migrate old "arms" muscle group data
          const migratedWorkouts = parsedData.workouts ? migrateWorkoutData(parsedData.workouts) : []
          
          dispatch({ type: 'LOAD_DATA', payload: {
            workouts: migratedWorkouts,
            currentWorkout: parsedData.currentWorkout || null,
            goals: parsedData.goals || [],
            achievements: parsedData.achievements || [],
            stats: parsedData.stats || initialState.stats
          }})
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error)
      // Clear corrupted data
      localStorage.removeItem('gymgenie-data')
    }
  }, [])

  // Save data to localStorage whenever state changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          workouts: state.workouts,
          currentWorkout: state.currentWorkout,
          goals: state.goals,
          achievements: state.achievements,
          stats: state.stats,
          lastSaved: new Date().toISOString()
        }
        localStorage.setItem('gymgenie-data', JSON.stringify(dataToSave))
      } catch (error) {
        console.error('Error saving data:', error)
      }
    }, 500) // Debounce saves by 500ms

    return () => clearTimeout(timeoutId)
  }, [state.workouts, state.currentWorkout, state.goals, state.achievements, state.stats])

  const value = {
    ...state,
    dispatch,
    startWorkout: () => dispatch({ type: 'START_WORKOUT' }),
    addExercise: (exercise) => dispatch({ type: 'ADD_EXERCISE', payload: exercise }),
    addSet: (exerciseId, set) => dispatch({ type: 'ADD_SET', payload: { exerciseId, set } }),
    updateSet: (exerciseId, setId, updates) => 
      dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setId, updates } }),
    deleteSet: (exerciseId, setId) => 
      dispatch({ type: 'DELETE_SET', payload: { exerciseId, setId } }),
    saveWorkout: () => dispatch({ type: 'SAVE_WORKOUT' }),
    deleteWorkout: (workoutId) => dispatch({ type: 'DELETE_WORKOUT', payload: workoutId }),
    cancelWorkout: () => dispatch({ type: 'CANCEL_WORKOUT' }),
    updateAchievements: (achievements) => dispatch({ type: 'UPDATE_ACHIEVEMENTS', payload: achievements })
  }

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout() {
  const context = useContext(WorkoutContext)
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
