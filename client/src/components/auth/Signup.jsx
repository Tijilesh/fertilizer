import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Leaf, Sprout, Tractor, Cloud, Sun, ShieldCheck, RefreshCw } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const Signup = () => {
  // step: 'form' | 'otp' | 'done'
  const [step, setStep] = useState('form')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  })

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])
  const navigate = useNavigate()
  const { login } = useAuth()

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ── Step 1: Submit form → send OTP ──────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/send-otp', { email: formData.email })
      toast.success(`OTP sent to ${formData.email}`)
      setStep('otp')
      setResendTimer(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input box handling ───────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)

    setOtp(prevOtp => {
      const newOtp = [...prevOtp]
      newOtp[index] = digit
      return newOtp
    })

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    // Extract first 6 digits found in the pasted string
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)

    if (digits.length > 0) {
      setOtp(prevOtp => {
        const newOtp = [...prevOtp]
        digits.split('').forEach((char, i) => {
          if (i < 6) newOtp[i] = char
        })
        return newOtp
      })

      // Focus the last filled box or the next empty one
      const nextFocusIndex = Math.min(digits.length, 5)
      otpRefs.current[nextFocusIndex]?.focus()
    }
  }

  // ── Step 2: Verify OTP → register account ───────────────────────────────
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      toast.error('Please enter the full 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      // Verify OTP
      await api.post('/auth/verify-otp', { email: formData.email, otp: otpValue })

      // Create account
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        otp: otpValue
      })

      const { token, user } = response.data
      login(user, token)
      toast.success('Account created successfully!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { email: formData.email })
      toast.success('New OTP sent!')
      setResendTimer(60)
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20"></div>
        <div className="absolute top-20 left-20 text-green-300 opacity-10"><Leaf className="w-16 h-16" /></div>
        <div className="absolute bottom-20 right-20 text-emerald-300 opacity-10"><Sprout className="w-12 h-12" /></div>
        <div className="absolute top-1/2 left-10 text-teal-300 opacity-10"><Cloud className="w-8 h-8" /></div>
      </div>

      <div className="relative max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg">
              {step === 'otp' ? <ShieldCheck className="w-12 h-12 text-white" /> : <Sprout className="w-12 h-12 text-white" />}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'otp' ? 'Verify Your Email' : 'Join Fertilizer Shop'}
          </h1>
          <p className="text-gray-600">
            {step === 'otp'
              ? `We sent a 6-digit OTP to ${formData.email}`
              : 'Start your journey towards better farming practices'}
          </p>
          {step === 'form' && (
            <div className="flex justify-center items-center mt-4 space-x-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-500">Growing Communities, Harvesting Futures</span>
              <Sun className="w-5 h-5 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'form' ? 'text-green-600' : 'text-green-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-green-600 text-white' : 'bg-green-200 text-green-700'}`}>1</div>
            Fill Details
          </div>
          <div className="h-px w-8 bg-gray-300"></div>
          <div className={`flex items-center gap-2 text-sm font-medium ${step === 'otp' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            Verify Email
          </div>
          <div className="h-px w-8 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 text-gray-500">3</div>
            Done
          </div>
        </div>

        <div className="glass-card premium-shadow p-10 rounded-3xl border border-white/40 backdrop-blur-xl">
          {/* ── STEP 1: Registration Form ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
                <p className="text-gray-600 mt-2">Join thousands of farmers using our platform</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="username" type="text" required
                      value={formData.username} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="email" type="email" required
                      value={formData.email} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="password" type="password" required minLength={6}
                        value={formData.password} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Min 6 characters"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="confirmPassword" type="password" required
                        value={formData.confirmPassword} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                </div>



                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Mail className="w-6 h-6" />
                      <span>Send Verification OTP</span>
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-green-600 hover:text-green-700 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Why Join Us?</h3>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>✓ Access to quality fertilizers and pesticides</li>
                  <li>✓ Expert farming tips and advice</li>
                  <li>✓ Seasonal offers and discounts</li>
                  <li>✓ Easy ordering and tracking</li>
                </ul>
              </div>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Enter OTP</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  A 6-digit code was sent to<br />
                  <span className="font-semibold text-gray-700">{formData.email}</span>
                </p>
                <button
                  onClick={() => setStep('form')}
                  className="text-xs text-green-600 hover:underline mt-1"
                >
                  Wrong email? Go back
                </button>
              </div>

              <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                {/* OTP boxes */}
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white"
                      style={{ borderColor: digit ? '#16a34a' : '#d1d5db' }}
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-gray-500">
                  OTP expires in <span className="font-semibold text-orange-500">10 minutes</span>
                </div>

                <button
                  type="submit" disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <ShieldCheck className="w-6 h-6" />
                      <span>Verify & Create Account</span>
                    </div>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">Didn't receive it?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || loading}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            🌱 Building sustainable farming communities worldwide 🌱
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
