import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const AppleDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select option",
  className = "",
  label = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const optionsRef = useRef([])

  // Find selected option
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    const handleKeyDown = (event) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0) {
            onChange(options[selectedIndex].value)
            setIsOpen(false)
            setSelectedIndex(-1)
          }
          break
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, selectedIndex, options, onChange])

  // Scroll selected option into view
  useEffect(() => {
    if (selectedIndex >= 0 && optionsRef.current[selectedIndex]) {
      optionsRef.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Set initial selection to current value
      const currentIndex = options.findIndex(option => option.value === value)
      setSelectedIndex(currentIndex >= 0 ? currentIndex : -1)
    }
  }

  const handleOptionClick = (option, index) => {
    onChange(option.value)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="fitness-label block mb-2">
          {label}
        </label>
      )}
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`apple-dropdown-button ${isOpen ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="apple-dropdown-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`apple-dropdown-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="apple-dropdown-menu">
          <div className="apple-dropdown-content" style={{ zIndex: 999999 }}>
            {options.map((option, index) => (
              <button
                key={option.value}
                ref={el => optionsRef.current[index] = el}
                type="button"
                onClick={() => handleOptionClick(option, index)}
                className={`apple-dropdown-option ${
                  selectedIndex === index ? 'highlighted' : ''
                } ${
                  option.value === value ? 'selected' : ''
                }`}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
                {option.value === value && (
                  <svg 
                    className="apple-dropdown-checkmark" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AppleDropdown
