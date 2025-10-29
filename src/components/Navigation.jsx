import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Plus, 
  BarChart3, 
  Brain, 
  User 
} from 'lucide-react'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Summary' },
    { path: '/log', icon: Plus, label: 'Workout' },
    { path: '/analytics', icon: BarChart3, label: 'Fitness' },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-6 z-50">
      <nav className="apple-nav-bar">
        <div className="flex justify-around items-center py-3 px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={22} className="mb-1" />
              <span className="text-xs font-medium mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default Navigation
