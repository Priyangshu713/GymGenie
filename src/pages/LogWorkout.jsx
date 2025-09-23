import React, { useState } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import { Plus, Trash2, Play, Square, Save, X, Dumbbell, Timer, Target } from 'lucide-react'
import { exerciseDatabase, getMuscleGroups, getExercisesForMuscleGroup } from '../data/exercises'

const LogWorkout = () => {
  const { 
    currentWorkout, 
    startWorkout, 
    addExercise, 
    addSet, 
    updateSet, 
    deleteSet, 
    saveWorkout, 
    cancelWorkout 
  } = useWorkout()

  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseType, setExerciseType] = useState('strength')
  const [customExercise, setCustomExercise] = useState('')

  // Exercise database
  const muscleGroups = getMuscleGroups()
  const exercises = selectedMuscleGroup ? getExercisesForMuscleGroup(selectedMuscleGroup) : []

  const handleStartWorkout = () => {
    startWorkout()
  }

  const handleAddExercise = (exercise) => {
    const exerciseData = {
      name: exercise.name || customExercise,
      type: exerciseType,
      muscleGroup: selectedMuscleGroup,
      equipment: exercise.equipment || 'custom'
    }
    addExercise(exerciseData)
    setShowExerciseModal(false)
    setCustomExercise('')
    setSelectedMuscleGroup('')
    setSelectedExercise('')
  }

  const handleAddSet = (exerciseId) => {
    const set = exerciseType === 'strength' 
      ? { reps: 0, weight: 0, difficulty: 0 }
      : { duration: 0, distance: 0, difficulty: 0 }
    addSet(exerciseId, set)
  }

  const handleSaveWorkout = () => {
    if (currentWorkout && currentWorkout.exercises.length > 0) {
      saveWorkout()
    }
  }

  if (!currentWorkout) {
    return (
      <div className="pb-20 bg-black min-h-screen">
        <div className="px-4 pt-12 pb-6">
          <h1 className="fitness-title mb-2">Workout</h1>
          <p className="fitness-subtitle mb-8">Start your training session</p>
          
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Dumbbell size={40} className="text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Ready to Train?
            </h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              Start a new workout session to begin tracking your exercises and sets
            </p>
            <button
              onClick={handleStartWorkout}
              className="fitness-button inline-flex items-center text-lg px-8 py-4"
            >
              <Plus size={24} className="mr-3" />
              Start Workout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-36 bg-black min-h-screen">
      {/* Apple Fitness Header */}
      <div className="px-4 pt-12 pb-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="fitness-title">Current Workout</h1>
            <p className="fitness-subtitle">
              {currentWorkout.exercises.length} exercises logged
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={cancelWorkout}
              className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <button
              onClick={handleSaveWorkout}
              disabled={currentWorkout.exercises.length === 0}
              className="fitness-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Add Exercise Button - Apple Style */}
        <button
          onClick={() => setShowExerciseModal(true)}
          className="w-full fitness-card border-2 border-dashed border-blue-600 bg-blue-900/20 hover:bg-blue-800/30 transition-all active:scale-95"
        >
          <div className="flex items-center justify-center py-6">
            <Plus size={24} className="mr-3 text-blue-400" />
            <span className="font-semibold text-blue-400">
              Add Exercise
            </span>
          </div>
        </button>

        {/* Exercises List */}
        {currentWorkout.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            onAddSet={() => handleAddSet(exercise.id)}
            onUpdateSet={(setId, updates) => updateSet(exercise.id, setId, updates)}
            onDeleteSet={(setId) => deleteSet(exercise.id, setId)}
          />
        ))}
      </div>

      {/* Exercise Selection Modal */}
      {showExerciseModal && (
        <ExerciseModal
          exerciseType={exerciseType}
          setExerciseType={setExerciseType}
          selectedMuscleGroup={selectedMuscleGroup}
          setSelectedMuscleGroup={setSelectedMuscleGroup}
          selectedExercise={selectedExercise}
          setSelectedExercise={setSelectedExercise}
          customExercise={customExercise}
          setCustomExercise={setCustomExercise}
          onAddExercise={handleAddExercise}
          onClose={() => {
            setShowExerciseModal(false)
            setSelectedExercise('')
            setSelectedMuscleGroup('')
          }}
        />
      )}
    </div>
  )
}

const ExerciseCard = ({ exercise, index, onAddSet, onUpdateSet, onDeleteSet }) => {
  return (
    <div className="fitness-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">
            {exercise.name}
          </h3>
          <p className="text-gray-400 text-sm capitalize">
            {exercise.muscleGroup} • {exercise.type}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
            {exercise.sets.length} sets
          </span>
        </div>
      </div>

      {/* Sets */}
      <div className="space-y-2 mb-3">
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.id}
            set={set}
            setIndex={setIndex}
            exerciseType={exercise.type}
            onUpdate={(updates) => onUpdateSet(set.id, updates)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      {/* Add Set Button - Apple Style */}
      <button
        onClick={onAddSet}
        className="w-full py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors bg-gray-800/50"
      >
        <Plus size={18} className="inline mr-2" />
        Add Set
      </button>
    </div>
  )
}

const SetRow = ({ set, setIndex, exerciseType, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-xl">
      <span className="text-sm font-semibold text-gray-400 w-8">
        {setIndex + 1}
      </span>
      
      {exerciseType === 'strength' ? (
        <>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Reps"
              value={set.reps || ''}
              onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Weight (kg)"
              value={set.weight || ''}
              onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Difficulty"
              min="1"
              max="10"
              value={set.difficulty || ''}
              onChange={(e) => onUpdate({ difficulty: parseInt(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Minutes"
              value={set.duration || ''}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Distance"
              value={set.distance || ''}
              onChange={(e) => onUpdate({ distance: parseFloat(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Difficulty"
              min="1"
              max="10"
              value={set.difficulty || ''}
              onChange={(e) => onUpdate({ difficulty: parseInt(e.target.value) || 0 })}
              className="fitness-input text-sm"
            />
          </div>
        </>
      )}
      
      <button
        onClick={onDelete}
        className="p-2 text-red-400 hover:text-red-300 transition-colors bg-red-900/20 rounded-lg hover:bg-red-900/40"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

const ExerciseModal = ({
  exerciseType,
  setExerciseType,
  selectedMuscleGroup,
  setSelectedMuscleGroup,
  selectedExercise,
  setSelectedExercise,
  customExercise,
  setCustomExercise,
  onAddExercise,
  onClose
}) => {
  const muscleGroups = getMuscleGroups()
  const exercises = selectedMuscleGroup ? getExercisesForMuscleGroup(selectedMuscleGroup) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
      <div className="fitness-card w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="fitness-title text-xl">
            Add Exercise
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Exercise Type */}
        <div className="mb-6">
          <label className="fitness-label block mb-3">
            Exercise Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setExerciseType('strength')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                exerciseType === 'strength'
                  ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                  : 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              <Dumbbell size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">Strength</div>
            </button>
            <button
              onClick={() => setExerciseType('cardio')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                exerciseType === 'cardio'
                  ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                  : 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
              }`}
            >
              <Timer size={20} className="mx-auto mb-2" />
              <div className="text-sm font-medium">Cardio</div>
            </button>
          </div>
        </div>

        {exerciseType === 'strength' ? (
          <>
            {/* Muscle Group Selection */}
            <div className="mb-4">
              <AppleDropdown
                label="Muscle Group"
                value={selectedMuscleGroup}
                onChange={(value) => setSelectedMuscleGroup(value)}
                options={muscleGroups.map(group => ({
                  value: group,
                  label: group.charAt(0).toUpperCase() + group.slice(1)
                }))}
                placeholder="Select muscle group"
                className="mb-4"
              />
            </div>

            {/* Exercise Selection */}
            {selectedMuscleGroup && (
              <div className="mb-4">
                <AppleDropdown
                  label="Exercise"
                  value={selectedExercise}
                  onChange={(value) => setSelectedExercise(value)}
                  options={exercises.map(exercise => ({
                    value: exercise,
                    label: exercise
                  }))}
                  placeholder="Select exercise"
                  className="mb-4"
                />
                
                {selectedExercise && (
                  <button
                    onClick={() => onAddExercise({ name: selectedExercise })}
                    className="fitness-button w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Add {selectedExercise}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-4">
            <AppleDropdown
              label="Cardio Exercise"
              value={selectedExercise}
              onChange={(value) => setSelectedExercise(value)}
              options={getExercisesForMuscleGroup('cardio').map(exercise => ({
                value: exercise,
                label: exercise
              }))}
              placeholder="Select cardio exercise"
              className="mb-4"
            />
            
            {selectedExercise && (
              <button
                onClick={() => onAddExercise({ name: selectedExercise })}
                className="fitness-button w-full"
              >
                <Plus size={16} className="mr-2" />
                Add {selectedExercise}
              </button>
            )}
          </div>
        )}

        {/* Custom Exercise */}
        <div className="mb-6">
          <label className="fitness-label block mb-2">
            Or add custom exercise
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
              placeholder="Enter custom exercise name"
              className="fitness-input flex-1"
            />
            <button
              onClick={() => onAddExercise({ name: customExercise })}
              disabled={!customExercise.trim()}
              className="fitness-button px-4 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogWorkout
