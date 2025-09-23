/**
 * LoadingSpinner Component
 * Displays a centered loading spinner with agricultural theme
 */
import { Leaf, Sprout, Tractor } from 'lucide-react'

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="text-center">
        {/* Animated farming icons */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Tractor className="w-8 h-8 text-green-600 animate-pulse" />
          </div>
        </div>

        {/* Floating elements */}
        <div className="relative">
          <Leaf className="w-6 h-6 text-green-400 absolute -top-2 -left-8 animate-bounce" style={{ animationDelay: '0s' }} />
          <Sprout className="w-5 h-5 text-emerald-500 absolute -top-1 -right-6 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <Leaf className="w-4 h-4 text-teal-400 absolute -bottom-2 -left-4 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>

        <p className="mt-6 text-lg font-medium text-gray-700">{text}</p>
        <p className="mt-2 text-sm text-green-600">Growing your experience...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner