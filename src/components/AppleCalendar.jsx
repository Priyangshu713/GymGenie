import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns'

const AppleCalendar = ({ selectedDate, onDateSelect, onClose, workouts = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date())

  // Get workout dates for highlighting
  const workoutDates = useMemo(() => {
    return workouts.map(workout => format(new Date(workout.date), 'yyyy-MM-dd'))
  }, [workouts])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = "d"
  const rows = []
  let days = []
  let day = startDate
  let formattedDate = ""

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat)
      const cloneDay = day
      const dayString = format(day, 'yyyy-MM-dd')
      const hasWorkout = workoutDates.includes(dayString)
      const isCurrentMonth = isSameMonth(day, monthStart)
      const isSelected = selectedDate && isSameDay(day, new Date(selectedDate))
      const isTodayDate = isToday(day)
      const isPastDate = isBefore(day, startOfDay(new Date()))
      const isCurrentDate = isSameDay(day, new Date())

      days.push(
        <div
          className={`
            relative h-10 w-10 flex items-center justify-center text-sm font-medium cursor-pointer rounded-full transition-all duration-200
            ${!isCurrentMonth 
              ? 'text-gray-600 hover:text-gray-400' 
              : isPastDate || isCurrentDate
                ? 'text-white hover:bg-gray-700' 
                : 'text-gray-500 cursor-not-allowed'
            }
            ${isSelected ? 'bg-blue-600 text-white shadow-lg' : ''}
            ${isTodayDate && !isSelected ? 'bg-red-600 text-white' : ''}
            ${hasWorkout && !isSelected && !isTodayDate ? 'bg-green-600 bg-opacity-20 text-green-400 border border-green-600 border-opacity-30' : ''}
          `}
          key={day}
          onClick={() => {
            if (isCurrentMonth && (isPastDate || isCurrentDate)) {
              onDateSelect(format(cloneDay, 'yyyy-MM-dd'))
            }
          }}
        >
          <span className="relative z-10">{formattedDate}</span>
          {hasWorkout && !isSelected && !isTodayDate && (
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
          )}
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1" key={day}>
        {days}
      </div>
    )
    days = []
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200"
            >
              <ChevronLeft size={20} className="text-gray-400" />
            </button>
            
            <h2 className="text-white font-semibold text-lg min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200"
            >
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="h-8 flex items-center justify-center">
              <span className="text-gray-500 text-xs font-medium">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {rows}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-gray-400">Today</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 bg-opacity-20 border border-green-600 border-opacity-30 rounded-full"></div>
              <span className="text-gray-400">Workout</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-400">Selected</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onDateSelect(format(new Date(), 'yyyy-MM-dd'))}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors duration-200 font-medium"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppleCalendar
