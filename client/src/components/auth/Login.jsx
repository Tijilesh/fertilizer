/**
 * Login Component
 * Provides a form for users to authenticate with email and password
 * Redirects to dashboard on successful login
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Leaf, Sprout, Tractor, Cloud, Sun } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    console.log('Attempting login with:', formData)

    try {
      const response = await api.post('/auth/login', formData)
      console.log('API response:', response.data)
      const { token, user } = response.data

      login(user, token)

      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message)
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen auth-bg-mesh flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 auth-grid-pattern pointer-events-none"></div>

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-float-delayed"></div>
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-400/15 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-2xl pointer-events-none"></div>

      {/* Floating Themed Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-12 text-emerald-600/15 animate-float">
          <Leaf className="w-16 h-16" />
        </div>
        <div className="absolute bottom-16 right-16 text-teal-600/15 animate-float-delayed">
          <Sprout className="w-14 h-14" />
        </div>
        <div className="absolute top-1/3 right-12 text-emerald-500/15 animate-float">
          <Cloud className="w-12 h-12" />
        </div>
        <div className="absolute bottom-1/3 left-10 text-teal-500/15 animate-float-delayed">
          <Sun className="w-12 h-12" />
        </div>
      </div>

      <div className="relative max-w-md w-full my-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-xl shadow-emerald-700/20 border border-emerald-400/30">
                <Tractor className="w-12 h-12 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 bg-clip-text text-transparent">
              Fertilizer Shop
            </span>
          </h1>
          <p className="text-gray-600 font-normal text-sm max-w-sm mx-auto">
            Your trusted partner for quality agricultural solutions & crop nutrients
          </p>
          <div className="inline-flex items-center mt-3.5 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/90 text-emerald-800 shadow-sm space-x-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold tracking-wide">Growing Together, Harvesting Success</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-[0_20px_45px_-15px_rgba(5,150,105,0.12),0_10px_25px_-5px_rgba(0,0,0,0.06)] relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
            <p className="text-gray-500 text-sm mt-1">Access your farming dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 bg-gray-50/70 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3.5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 bg-gray-50/70 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Leaf className="w-5 h-5 text-emerald-200" />
                  <span>Sign In to Your Account</span>
                </div>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <p className="text-gray-600 text-sm">
              New to Fertilizer Shop?{' '}
              <Link
                to="/signup"
                className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200 hover:underline"
              >
                Create your account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 tracking-wide font-medium">
            🌾 Empowering farmers with quality fertilizers and expert guidance 🌾
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login