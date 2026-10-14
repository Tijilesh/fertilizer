import { useState, useEffect } from 'react'
import { Settings, Save, Store, Copy, Check, Calendar, Bell } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { CompatibilityRulesManager, MonthlyRemindersModal } from '../../components/common'

const AdminSettings = () => {
  const { user } = useAuth()
  const [shopProfile, setShopProfile] = useState({
    shop_name: 'Kisan Agro & Fertilizer Center',
    shop_phone: '+91 98765 43210',
    shop_address: 'Main Market Mandi, Station Road',
    shop_gstin: '09AAACK1234M1Z5',
    shop_license: 'FERT/DL/2024/481',
    upi_id: '',
    auto_reminder_enabled: 'true',
    auto_reminder_day: '1',
    auto_reminder_min_amount: '100',
    auto_reminder_default_lang: 'te',
    auto_reminder_urgency: 'gentle'
  })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRemindersModal, setShowRemindersModal] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      if (res.data) {
        setShopProfile(prev => ({
          ...prev,
          ...res.data
        }))
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
      await api.post('/settings', { settings: shopProfile })
      toast.success('Shop and billing settings saved successfully')
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
          <Store className="w-6 h-6 text-teal-600" />
          Store Profile &amp; Billing Details
        </h2>
        
        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Shop / Business Name</label>
              <input
                type="text"
                value={shopProfile.shop_name}
                onChange={(e) => setShopProfile({ ...shopProfile, shop_name: e.target.value })}
                placeholder="e.g. Kisan Agro & Fertilizer Center"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={shopProfile.shop_phone}
                onChange={(e) => setShopProfile({ ...shopProfile, shop_phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Shop Address</label>
            <input
              type="text"
              value={shopProfile.shop_address}
              onChange={(e) => setShopProfile({ ...shopProfile, shop_address: e.target.value })}
              placeholder="e.g. Main Market Mandi, Station Road"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">GSTIN / Tax ID</label>
              <input
                type="text"
                value={shopProfile.shop_gstin}
                onChange={(e) => setShopProfile({ ...shopProfile, shop_gstin: e.target.value })}
                placeholder="e.g. 09AAACK1234M1Z5"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Fertilizer Dealer License No.</label>
              <input
                type="text"
                value={shopProfile.shop_license}
                onChange={(e) => setShopProfile({ ...shopProfile, shop_license: e.target.value })}
                placeholder="e.g. FERT/DL/2024/481"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Shop UPI ID (For QR Payments)</label>
            <input
              type="text"
              value={shopProfile.upi_id}
              onChange={(e) => setShopProfile({ ...shopProfile, upi_id: e.target.value })}
              placeholder="e.g. yourshop@okhdfcbank"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
            />
            <p className="text-xs text-gray-500 mt-1">
              Printed on bills and displayed as a QR code for farmers to scan and pay.
            </p>
          </div>

          {/* Automated Monthly Debt Reminders Schedule */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  Automated Monthly WhatsApp Debt Reminders
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically calculates dues and prepares WhatsApp notices on the scheduled date
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRemindersModal(true)}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-4 h-4" /> Open Reminders Queue
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Auto-Reminder Generation</label>
                <select
                  value={shopProfile.auto_reminder_enabled}
                  onChange={(e) => setShopProfile({ ...shopProfile, auto_reminder_enabled: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
                >
                  <option value="true">✅ Enabled (Runs Automatically Every Month)</option>
                  <option value="false">⛔ Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Scheduled Day of Month</label>
                <select
                  value={shopProfile.auto_reminder_day}
                  onChange={(e) => setShopProfile({ ...shopProfile, auto_reminder_day: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
                >
                  <option value="1">1st of Month (Recommended)</option>
                  <option value="5">5th of Month</option>
                  <option value="10">10th of Month</option>
                  <option value="15">15th of Month</option>
                  <option value="25">25th of Month</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Minimum Debt Threshold (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={shopProfile.auto_reminder_min_amount}
                  onChange={(e) => setShopProfile({ ...shopProfile, auto_reminder_min_amount: e.target.value })}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">Only farmers with dues at or above this amount will be queued.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Default Reminder Language</label>
                <select
                  value={shopProfile.auto_reminder_default_lang}
                  onChange={(e) => setShopProfile({ ...shopProfile, auto_reminder_default_lang: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-teal-500 outline-none font-medium"
                >
                  <option value="te">🌾 Telugu (తెలుగు)</option>
                  <option value="hi">🇮🇳 Hindi (हिंदी)</option>
                  <option value="en">🌐 English</option>
                  <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
                  <option value="kn">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                  <option value="mr">🇮🇳 Marathi (मराठी)</option>
                </select>
              </div>
            </div>
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

      {/* Fertilizer Compatibility Rules Management */}
      <CompatibilityRulesManager />

      {/* Monthly Reminders Queue Modal */}
      <MonthlyRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
      />
    </div>
  )
}

export default AdminSettings
