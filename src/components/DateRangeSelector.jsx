import React, { useState } from 'react'
import { Calendar, ChevronDown, Check, CalendarDays } from 'lucide-react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import AppleCalendar from './AppleCalendar'

const DateRangeSelector = ({ selectedRange, onRangeChange, showCustomDate = false, workouts = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const ranges = [
    { value: '0', label: 'Today', days: 0, isToday: true },
    { value: '3', label: 'Last 3 days', days: 3 },
    { value: '7', label: 'Last 7 days', days: 7 },
    { value: '30', label: 'Last 30 days', days: 30 },
    { value: '365', label: 'Last year', days: 365 },
    { value: 'custom', label: 'Select specific date', isCustom: true }
  ]

  const getDateRangeText = (rangeValue) => {
    try {
      if (rangeValue === 'custom') {
        return selectedDate ? format(new Date(selectedDate), 'MMM d, yyyy') : 'Select date'
      }
      
      const range = ranges.find(r => r.value === rangeValue)
      if (!range) return 'Today'
      
      if (range.isToday) {
        return format(new Date(), 'MMM d (Today)')
      }
      
      const endDate = new Date()
      const startDate = subDays(endDate, range.days)
      
      if (range.days <= 7) {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
      } else if (range.days <= 30) {
        return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
      } else {
        return range.label
      }
    } catch (error) {
      console.error('Error in getDateRangeText:', error)
      return 'Today'
    }
  }

  const handleRangeSelect = (rangeValue) => {
    if (rangeValue === 'custom') {
      setShowDatePicker(true)
      setIsOpen(false)
    } else {
      onRangeChange(rangeValue)
      setIsOpen(false)
    }
  }

  const handleDateSelect = (date) => {
    const dateToUse = date || selectedDate
    setSelectedDate(dateToUse)
    onRangeChange('custom', dateToUse)
    setShowDatePicker(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-700"
      >
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-white text-sm font-medium">
            {ranges.find(r => r.value === selectedRange || (selectedRange === 'custom' && r.isCustom))?.label || 'Today'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-full min-w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            {ranges.map((range) => (
              <button
                key={range.value}
                onClick={() => handleRangeSelect(range.value)}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors duration-150 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  {range.isCustom && <CalendarDays size={16} className="text-blue-400" />}
                  <div className="text-white text-sm font-medium group-hover:text-blue-400 transition-colors">
                    {range.label}
                  </div>
                </div>
                {(selectedRange === range.value || (selectedRange === 'custom' && range.isCustom)) && (
                  <Check size={16} className="text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Apple Calendar Modal */}
      {showDatePicker && (
        <AppleCalendar
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            handleDateSelect(date)
          }}
          onClose={() => setShowDatePicker(false)}
          workouts={workouts}
        />
      )}
    </div>
  )
}

export default DateRangeSelector
