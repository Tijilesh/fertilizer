import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Leaf, Sprout, Tractor, Cloud, Sun, ShieldCheck, RefreshCw, Phone } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const Signup = () => {
  // step: 'form' | 'otp' | 'done'
  const [step, setStep] = useState('form')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    shopName: '',
    shopSlug: ''
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
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        otp: otpValue,
        shop_name: formData.shopName,
        shop_slug: formData.shopSlug
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
        <div className="absolute top-16 left-12 text-emerald-600/15 animate-float"><Leaf className="w-16 h-16" /></div>
        <div className="absolute bottom-16 right-16 text-teal-600/15 animate-float-delayed"><Sprout className="w-14 h-14" /></div>
        <div className="absolute top-1/3 right-12 text-emerald-500/15 animate-float"><Cloud className="w-12 h-12" /></div>
        <div className="absolute bottom-1/3 left-10 text-teal-500/15 animate-float-delayed"><Sun className="w-12 h-12" /></div>
      </div>

      <div className="relative max-w-lg w-full my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-xl shadow-emerald-700/20 border border-emerald-400/30">
                {step === 'otp' ? <ShieldCheck className="w-12 h-12 text-white drop-shadow-md" /> : <Sprout className="w-12 h-12 text-white drop-shadow-md" />}
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
            {step === 'otp' ? 'Verify Your Email' : (
              <>
                Join{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 bg-clip-text text-transparent">
                  Fertilizer Shop
                </span>
              </>
            )}
          </h1>
          <p className="text-gray-600 font-normal text-sm max-w-sm mx-auto">
            {step === 'otp'
              ? `We sent a 6-digit verification code to ${formData.email}`
              : 'Start your journey towards higher yields & sustainable farming'}
          </p>
          {step === 'form' && (
            <div className="inline-flex items-center mt-3.5 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200/90 text-emerald-800 shadow-sm space-x-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold tracking-wide">Growing Communities, Harvesting Futures</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6 bg-white/80 p-2.5 rounded-2xl border border-emerald-100 shadow-sm backdrop-blur-md max-w-sm mx-auto">
          <div className={`flex items-center gap-2 text-xs font-semibold ${step === 'form' ? 'text-emerald-700' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-emerald-100 text-emerald-800'}`}>1</div>
            Details
          </div>
          <div className="h-px w-6 bg-gray-200"></div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${step === 'otp' ? 'text-emerald-700' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-gray-100 text-gray-500'}`}>2</div>
            Verify
          </div>
          <div className="h-px w-6 bg-gray-200"></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-400">3</div>
            Done
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-[0_20px_45px_-15px_rgba(5,150,105,0.12),0_10px_25px_-5px_rgba(0,0,0,0.06)] relative">
          {/* ── STEP 1: Registration Form ── */}
          {step === 'form' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">Join thousands of farmers using our platform</p>
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

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="phone" type="tel" required
                      value={formData.phone} onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                      placeholder="Enter your phone number"
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

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'user' })}
                      className={`py-2 px-4 rounded-lg border flex justify-center items-center gap-2 transition-colors ${formData.role === 'user' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Buy Products
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'owner' })}
                      className={`py-2 px-4 rounded-lg border flex justify-center items-center gap-2 transition-colors ${formData.role === 'owner' ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      Open a Shop
                    </button>
                  </div>
                </div>

                {formData.role === 'owner' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Sprout className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="shopName" type="text" required={formData.role === 'owner'}
                        value={formData.shopName} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Enter your shop name"
                      />
                    </div>
                  </div>
                )}

                {formData.role === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shop Identifier (Slug)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="shopSlug" type="text" required={formData.role === 'user'}
                        value={formData.shopSlug} onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 focus:bg-white"
                        placeholder="e.g. default-shop"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Mail className="w-5 h-5" />
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-xl font-bold text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <ShieldCheck className="w-5 h-5" />
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
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
          <p className="text-xs text-gray-500 tracking-wide font-medium">
            🌱 Building sustainable farming communities worldwide 🌱
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
