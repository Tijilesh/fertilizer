/**
 * Authentication Context for managing user authentication state
 * Provides login, logout, and user state management across the application
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

/**
 * Custom hook to use authentication context
 * Must be used within an AuthProvider component
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Authentication Provider component
 * Wraps the application to provide authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null) // Current authenticated user
  const [loading, setLoading] = useState(true) // Loading state during initialization
  const navigate = useNavigate()

  // Initialize authentication state with demo user for frontend-only mode
  useEffect(() => {
    // Set demo user automatically
    const demoUser = {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      role: 'user'
    }
    const demoToken = 'demo-token'
    setUser(demoUser)
    localStorage.setItem('token', demoToken)
    localStorage.setItem('user', JSON.stringify(demoUser))
    setLoading(false)
  }, [])

  /**
   * Login function - sets user state and stores auth data in localStorage
   * @param {Object} userData - User object from server
   * @param {string} token - JWT token from server
   */
  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  /**
   * Logout function - clears user state and removes auth data from localStorage
   */
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Context value object containing auth state and methods
  const value = {
    user,           // Current user object
    login,          // Login function
    logout,         // Logout function
    isAuthenticated: !!user  // Boolean indicating if user is logged in
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Only render children after loading is complete */}
    </AuthContext.Provider>
  )
}