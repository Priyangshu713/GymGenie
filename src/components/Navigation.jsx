import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Plus, 
  BarChart3, 
  TrendingUp,
  Brain, 
  User 
} from 'lucide-react'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Summary' },
    { path: '/log', icon: Plus, label: 'Workout' },
    { path: '/analytics', icon: BarChart3, label: 'Fitness' },
    { path: '/advanced-analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-50">
      <nav className="apple-nav-bar">
        <div className="flex justify-between items-center py-3 px-3">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item flex-shrink-0 ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default Navigation
