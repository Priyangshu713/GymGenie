import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ErrorBoundary from './components/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import LogWorkout from './pages/LogWorkout'
import Analytics from './pages/Analytics'
import AdvancedAnalytics from './pages/AdvancedAnalytics'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import History from './pages/History'
import { WorkoutProvider } from './context/WorkoutContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WorkoutProvider>
          <Router>
            <div className="min-h-screen bg-black">
              <div className="max-w-md mx-auto bg-black min-h-screen">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/log" element={<LogWorkout />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/history" element={<History />} />
                  </Routes>
                </ErrorBoundary>
                <Navigation />
              </div>
            </div>
          </Router>
        </WorkoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
