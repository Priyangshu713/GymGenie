import React, { useState } from 'react'
import { useWorkout } from '../context/WorkoutContext'
import AppleDropdown from '../components/AppleDropdown'
import { Plus, Trash2, Play, Square, Save, X, Dumbbell, Timer, Target, Search } from 'lucide-react'
import { exerciseDatabase, getMuscleGroups, getExercisesForMuscleGroup, isBodyweightExercise, searchExercises } from '../data/exercises'

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
  const [searchQuery, setSearchQuery] = useState('')

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
      muscleGroup: exercise.muscleGroup || selectedMuscleGroup || 'custom',
      equipment: exercise.equipment || 'custom'
    }
    addExercise(exerciseData)
    setShowExerciseModal(false)
    setCustomExercise('')
    setSelectedMuscleGroup('')
    setSelectedExercise('')
    setSearchQuery('')
  }

  const handleAddSet = (exerciseId) => {
    const exercise = currentWorkout.exercises.find(ex => ex.id === exerciseId)
    const set = exercise?.type === 'strength' 
      ? { 
          reps: 0, 
          weight: 0, 
          difficulty: 0, 
          isBodyweight: isBodyweightExercise(exercise.name) 
        }
      : { duration: 0, distance: 0, timing: 'after', intensity: 'slow' }
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddExercise={handleAddExercise}
          onClose={() => {
            setShowExerciseModal(false)
            setSelectedExercise('')
            setSelectedMuscleGroup('')
            setSearchQuery('')
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
            exerciseName={exercise.name}
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

const SetRow = ({ set, setIndex, exerciseType, exerciseName, onUpdate, onDelete }) => {
  const canBeBodyweight = isBodyweightExercise(exerciseName)
  const isBodyweight = set.isBodyweight || (canBeBodyweight && (set.weight === 0 || set.weight === undefined))
  const [additionalWeight, setAdditionalWeight] = useState(0)
  const [bodyweight, setBodyweight] = useState(() => {
    const saved = localStorage.getItem('gymgenie-measurements')
    return saved ? JSON.parse(saved).weight || 0 : 0
  })

  const handleBodyweightToggle = () => {
    if (canBeBodyweight) {
      const newIsBodyweight = !isBodyweight
      onUpdate({ 
        isBodyweight: newIsBodyweight,
        weight: newIsBodyweight ? (additionalWeight || 0) : (set.weight || 0)
      })
    }
  }

  const handleWeightChange = (e) => {
    // Get the raw input value first
    const rawValue = e.target.value;
    // Only parse to float if there's an actual value
    const value = rawValue === '' ? 0 : parseFloat(rawValue) || 0;
    
    if (isBodyweight) {
      // Store the raw value in state to allow clearing
      setAdditionalWeight(rawValue === '' ? '' : value);
      onUpdate({ 
        weight: value,
        isBodyweight: true
      });
    } else {
      onUpdate({ 
        weight: value,
        isBodyweight: false
      });
    }
  }

  return (
    <div className="space-y-3 p-3 bg-gray-800 rounded-xl">
      {/* Set number and bodyweight toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-400">
          Set {setIndex + 1}
        </span>
        {canBeBodyweight && exerciseType === 'strength' && (
          <button
            onClick={handleBodyweightToggle}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isBodyweight
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isBodyweight ? '💪 Bodyweight' : '🏋️ Weighted'}
          </button>
        )}
      </div>
      
      {exerciseType === 'strength' ? (
        <div className="flex items-center space-x-3">
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
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0.0"
                value={isBodyweight ? (additionalWeight === 0 ? '' : additionalWeight) : (set.weight || '')}
                onChange={handleWeightChange}
                className="fitness-input text-sm pr-10 w-full"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {isBodyweight ? '+kg' : 'kg'}
              </div>
              {isBodyweight && additionalWeight > 0 && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {additionalWeight}
                </div>
              )}
            </div>
            {isBodyweight && additionalWeight > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Total: {(parseFloat(bodyweight) + parseFloat(additionalWeight || 0)).toFixed(1)}kg
              </div>
            )}
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
        </div>
      ) : (
        <div className="space-y-4">
          {/* Duration and Distance Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Duration</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  value={set.duration || ''}
                  onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
                  className="fitness-input text-sm pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">min</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Distance</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={set.distance || ''}
                  onChange={(e) => onUpdate({ distance: parseFloat(e.target.value) || 0 })}
                  className="fitness-input text-sm pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">km</span>
              </div>
            </div>
          </div>

          {/* Timing Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">When did you do this cardio?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ timing: 'before' })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  (set.timing || 'after') === 'before'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25 border border-orange-400/50'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🔥</span>
                  <span>Before Workout</span>
                </div>
                <div className="text-xs opacity-75 mt-1">Warm-up</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ timing: 'after' })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  (set.timing || 'after') === 'after'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/25 border border-green-400/50'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>💪</span>
                  <span>After Workout</span>
                </div>
                <div className="text-xs opacity-75 mt-1">Cool-down</div>
              </button>
            </div>
          </div>

          {/* Intensity Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Cardio intensity</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ intensity: 'slow' })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  (set.intensity || 'slow') === 'slow'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🐌</span>
                  <span>Slow Cardio</span>
                </div>
                <div className="text-xs opacity-75 mt-1">LISS / Fat Burn</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ intensity: 'fast' })}
                className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  (set.intensity || 'slow') === 'fast'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25 border border-red-400/50'
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>⚡</span>
                  <span>Fast Cardio</span>
                </div>
                <div className="text-xs opacity-75 mt-1">HIIT / Intense</div>
              </button>
            </div>
          </div>
        </div>
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
  searchQuery,
  setSearchQuery,
  onAddExercise,
  onClose
}) => {
  const muscleGroups = getMuscleGroups()
  
  // Get exercises based on search query and muscle group selection
  const getFilteredExercises = () => {
    if (exerciseType === 'cardio') {
      const cardioExercises = getExercisesForMuscleGroup('cardio')
      return searchQuery 
        ? cardioExercises.filter(exercise => 
            exercise.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : cardioExercises
    }
    
    // For strength exercises
    if (searchQuery) {
      // If searching, search across all exercises regardless of muscle group
      const searchResults = searchExercises(searchQuery)
      return searchResults
        .filter(result => result.muscleGroup !== 'cardio') // Exclude cardio from strength search
        .map(result => ({
          name: result.exercise,
          muscleGroup: result.muscleGroup
        }))
    }
    
    // If no search query, use selected muscle group
    const allExercises = selectedMuscleGroup ? getExercisesForMuscleGroup(selectedMuscleGroup) : []
    return allExercises.map(exercise => ({ name: exercise, muscleGroup: selectedMuscleGroup }))
  }
  
  const exercises = getFilteredExercises()

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

        {/* Search Input */}
        <div className="mb-6">
          <label className="fitness-label block mb-3">
            Search Exercises
          </label>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search exercises..."
              className="fitness-input pl-10 w-full"
            />
          </div>
          
          {/* Live Search Results */}
          {searchQuery && exercises.length > 0 && (
            <div className="mt-3 bg-gray-800 rounded-xl border border-gray-700 max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400">
                  {exercises.length} result{exercises.length !== 1 ? 's' : ''} found
                </h4>
              </div>
              <div className="p-2 space-y-1">
                {exercises.slice(0, 10).map((exercise, index) => {
                  const exerciseName = typeof exercise === 'string' ? exercise : exercise.name
                  const muscleGroup = typeof exercise === 'string' ? 'unknown' : exercise.muscleGroup
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        onAddExercise({ name: exerciseName, muscleGroup: muscleGroup })
                        setSearchQuery('')
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium text-sm group-hover:text-blue-400">
                            {exerciseName}
                          </div>
                          {muscleGroup !== 'unknown' && (
                            <div className="text-xs text-gray-400 capitalize mt-1">
                              {muscleGroup}
                            </div>
                          )}
                        </div>
                        <Plus size={16} className="text-gray-400 group-hover:text-blue-400" />
                      </div>
                    </button>
                  )
                })}
                {exercises.length > 10 && (
                  <div className="text-center p-2 text-xs text-gray-500">
                    Showing first 10 results. Keep typing to refine search.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* No Results Message */}
          {searchQuery && exercises.length === 0 && (
            <div className="mt-3 p-4 bg-gray-800 rounded-xl border border-gray-700 text-center">
              <div className="text-gray-400 text-sm">
                No exercises found for "{searchQuery}"
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Try a different search term or add it as a custom exercise below
              </div>
            </div>
          )}
        </div>

        {/* Traditional Selection (only show when not searching) */}
        {!searchQuery && (
          exerciseType === 'strength' ? (
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
              {selectedMuscleGroup && exercises.length > 0 && (
                <div className="mb-4">
                  <AppleDropdown
                    label="Exercise"
                    value={selectedExercise}
                    onChange={(value) => setSelectedExercise(value)}
                    options={exercises.map(exercise => ({
                      value: typeof exercise === 'string' ? exercise : exercise.name,
                      label: typeof exercise === 'string' 
                        ? exercise 
                        : exercise.name
                    }))}
                    placeholder="Select exercise"
                    className="mb-4"
                  />
                  
                  {selectedExercise && (
                    <button
                      onClick={() => onAddExercise({ name: selectedExercise, muscleGroup: selectedMuscleGroup })}
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
            exercises.length > 0 && (
              <div className="mb-4">
                <AppleDropdown
                  label="Cardio Exercise"
                  value={selectedExercise}
                  onChange={(value) => setSelectedExercise(value)}
                  options={exercises.map(exercise => ({
                    value: exercise,
                    label: exercise
                  }))}
                  placeholder="Select cardio exercise"
                  className="mb-4"
                />
                
                {selectedExercise && (
                  <button
                    onClick={() => onAddExercise({ name: selectedExercise, muscleGroup: 'cardio' })}
                    className="fitness-button w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Add {selectedExercise}
                  </button>
                )}
              </div>
            )
          )
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
              onClick={() => onAddExercise({ name: customExercise, muscleGroup: selectedMuscleGroup || 'custom' })}
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
