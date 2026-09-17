import { useState, useEffect } from 'react'
import { Settings, Save, Smartphone, Store, Copy, Check } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const AdminSettings = () => {
  const { user } = useAuth()
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      if (res.data && res.data.upi_id) {
        setUpiId(res.data.upi_id)
      }
    } catch (error) {
      console.error('Failed to fetch settings', error)
      toast.error('Failed to load settings')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/settings', { settings: { upi_id: upiId } })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySlug = () => {
    if (user?.shop_slug) {
      navigator.clipboard.writeText(user.shop_slug)
      setCopied(true)
      toast.success('Shop Identifier copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center transition-all duration-300 premium-hover">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Shop Settings</h1>
            <p className="text-teal-100 mt-1 opacity-90">Manage store preferences and payment details</p>
          </div>
        </div>
      </div>

      <div className="glass-card premium-shadow bg-white rounded-[2rem] p-8 border-2 border-white/50 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Store className="w-6 h-6 text-teal-600" />
          Shop Identifier
        </h2>
        
        <div className="max-w-xl">
          <label className="block text-sm font-bold text-gray-700 mb-2">Shop Slug (For Users to Join)</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-800 font-semibold select-all">
              {user?.shop_slug || 'N/A'}
            </div>
            <button
              onClick={handleCopySlug}
              className="p-3 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl transition-colors border border-teal-200"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this identifier with your employees so they can join your shop during registration.
          </p>
        </div>
      </div>

      <div className="glass-card premium-shadow bg-white rounded-[2rem] p-8 border-2 border-white/50">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-teal-600" />
          Payment Settings
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Shop UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okicici"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none font-medium"
            />
            <p className="text-xs text-gray-500 mt-2">
              Customers will see this UPI ID and a QR code to make payments.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-lg shadow-teal-600/30"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminSettings
