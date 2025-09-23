/**
 * Protected Route Component
 * Wraps components that require authentication and role-based access
 * Redirects to login page if user is not authenticated
 * Redirects to home if user doesn't have required role
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to login if user doesn't have required role
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute