import { useState, useEffect } from 'react'
import {
  X, Send, RefreshCw, CheckCircle, Clock,
  Copy, Check, Settings, Play,
  Calendar, ShieldAlert, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'

const MonthlyRemindersModal = ({ isOpen, onClose, onQueueUpdated }) => {
  const [reminders, setReminders] = useState([])
  const [summary, setSummary] = useState({ totalDue: 0, pendingCount: 0, sentCount: 0, totalCount: 0 })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'due' | 'sent'
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [copiedId, setCopiedId] = useState(null)

  // Quick Dispatch Batch Runner state
  const [dispatchIndex, setDispatchIndex] = useState(null)
  const [isDispatching, setIsDispatching] = useState(false)

  // Shop Auto Settings State
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    auto_reminder_enabled: 'true',
    auto_reminder_day: '1',
    auto_reminder_min_amount: '100',
    auto_reminder_urgency: 'gentle',
    auto_reminder_default_lang: 'te'
  })
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchReminders()
      fetchSettings()
    }
  }, [isOpen, currentPeriod])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/credit-reminders', {
        params: { period: currentPeriod }
      })
      setReminders(res.data.reminders || [])
      setSummary(res.data.summary || {})
    } catch (err) {
      console.error('Error fetching credit reminders:', err)
      toast.error('Failed to load credit reminders')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      if (res.data) {
        setConfig(prev => ({
          ...prev,
          ...res.data
        }))
      }
    } catch (err) {
      console.error('Failed to load auto-reminder settings:', err)
    }
  }

  const handleGenerateMonthly = async () => {
    try {
      setRefreshing(true)
      const res = await api.post('/credit-reminders/generate-monthly', {
        month_period: currentPeriod,
        min_amount: config.auto_reminder_min_amount,
        language: config.auto_reminder_default_lang,
        urgency: config.auto_reminder_urgency
      })
      toast.success(res.data.message || 'Monthly queue refreshed')
      fetchReminders()
      if (onQueueUpdated) onQueueUpdated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to refresh queue')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      setSavingConfig(true)
      await api.post('/settings', { settings: config })
      toast.success('Auto reminder schedule updated successfully')
      setShowConfig(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleMarkSent = async (id) => {
    try {
      await api.post(`/credit-reminders/${id}/mark-sent`)
      toast.success('Marked as sent')
      setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'sent', sent_at: new Date().toISOString() } : r))
      setSummary(prev => ({ ...prev, pendingCount: Math.max(0, prev.pendingCount - 1), sentCount: prev.sentCount + 1 }))
      if (onQueueUpdated) onQueueUpdated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark as sent')
    }
  }

  const handleDismiss = async (id) => {
    if (!window.confirm('Dismiss this reminder for this month?')) return
    try {
      await api.post(`/credit-reminders/${id}/dismiss`)
      toast.success('Reminder dismissed')
      setReminders(prev => prev.filter(r => r.id !== id))
      if (onQueueUpdated) onQueueUpdated()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to dismiss reminder')
    }
  }

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('WhatsApp text copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSendWhatsApp = (reminder) => {
    let cleanPhone = (reminder.farmer_phone || reminder.phone || '').replace(/[^0-9]/g, '')
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone
    const text = encodeURIComponent(reminder.message_text || '')
    const url = `https://wa.me/${cleanPhone}?text=${text}`
    window.open(url, '_blank')
    handleMarkSent(reminder.id)
  }

  // 1-Click Batch Dispatch Runner
  const pendingReminders = reminders.filter(r => r.status === 'due' || r.status === 'overdue')

  const handleStartDispatch = () => {
    if (pendingReminders.length === 0) {
      toast.success('No pending reminders in queue for this month!')
      return
    }
    setIsDispatching(true)
    setDispatchIndex(0)
    dispatchNextFarmer(0)
  }

  const dispatchNextFarmer = (index) => {
    if (index >= pendingReminders.length) {
      setIsDispatching(false)
      setDispatchIndex(null)
      toast.success('All reminders in batch have been dispatched!')
      fetchReminders()
      return
    }

    const current = pendingReminders[index]
    handleSendWhatsApp(current)
  }

  const handleNextInDispatch = () => {
    const nextIdx = (dispatchIndex || 0) + 1
    if (nextIdx < pendingReminders.length) {
      setDispatchIndex(nextIdx)
      dispatchNextFarmer(nextIdx)
    } else {
      setIsDispatching(false)
      setDispatchIndex(null)
      toast.success('Batch dispatch complete!')
      fetchReminders()
    }
  }

  const filteredReminders = reminders.filter(r => {
    const nameMatch = (r.farmer_name || r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const phoneMatch = (r.farmer_phone || r.phone || '').includes(searchTerm)
    const statusMatch = filterStatus === 'all' || r.status === filterStatus
    return (nameMatch || phoneMatch) && statusMatch
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 p-6 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">Automated Monthly WhatsApp Debt Reminders</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/25 border border-white/30 text-white">
                  Khata Auto-Pilot
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-1">
                Automated monthly balance notices scheduled on day {config.auto_reminder_day} of each month
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Top Controls & KPI Bar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Queue Total Due</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                ₹{parseFloat(summary.totalDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">{summary.totalCount} farmers in batch</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending Dispatches
              </p>
              <p className="text-2xl font-black text-amber-700 mt-1">{summary.pendingCount}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Awaiting WhatsApp sending</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Sent Notices
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{summary.sentCount}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Delivered to farmers</p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center space-y-2">
              <button
                onClick={handleStartDispatch}
                disabled={summary.pendingCount === 0}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
              >
                <Play className="w-3.5 h-3.5" /> 1-Click WhatsApp Dispatch
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateMonthly}
                  disabled={refreshing}
                  className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                  title="Recalculate balances and update queue"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition ${showConfig ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'}`}
                  title="Configure schedule & thresholds"
                >
                  <Settings className="w-3 h-3" /> Schedule
                </button>
              </div>
            </div>

          </div>

          {/* Active Batch Dispatch Banner */}
          {isDispatching && dispatchIndex !== null && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-600 animate-ping" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Dispatching {dispatchIndex + 1} of {pendingReminders.length}: {pendingReminders[dispatchIndex]?.farmer_name}
                  </p>
                  <p className="text-xs text-emerald-700">
                    WhatsApp opened in new tab. Click "Advance to Next Farmer" when ready.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleNextInDispatch}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow transition flex items-center gap-1"
                >
                  Advance to Next Farmer <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsDispatching(false); setDispatchIndex(null) }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-300"
                >
                  Pause
                </button>
              </div>
            </div>
          )}

          {/* Configuration Drawer */}
          {showConfig && (
            <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-teal-600" /> Automated Schedule & Threshold Settings
                </h3>
                <span className="text-xs text-gray-400">Applies to automatic background runs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Auto-Reminders</label>
                  <select
                    value={config.auto_reminder_enabled}
                    onChange={e => setConfig({ ...config, auto_reminder_enabled: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="true">✅ Enabled (Auto Queue)</option>
                    <option value="false">⛔ Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Run Day</label>
                  <select
                    value={config.auto_reminder_day}
                    onChange={e => setConfig({ ...config, auto_reminder_day: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="1">1st of Month (Default)</option>
                    <option value="5">5th of Month</option>
                    <option value="10">10th of Month</option>
                    <option value="15">15th of Month</option>
                    <option value="25">25th of Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Debt Threshold (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={config.auto_reminder_min_amount}
                    onChange={e => setConfig({ ...config, auto_reminder_min_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Default Template Language</label>
                  <select
                    value={config.auto_reminder_default_lang}
                    onChange={e => setConfig({ ...config, auto_reminder_default_lang: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-medium focus:ring-teal-500 focus:border-teal-500"
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  {savingConfig ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {/* Search, Filter & Month selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="Search farmer name or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={currentPeriod}
                onChange={e => setCurrentPeriod(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                title="Select Month Period"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              >
                <option value="all">All Reminders ({reminders.length})</option>
                <option value="due">⚠️ Pending Only ({summary.pendingCount})</option>
                <option value="sent">✅ Sent Notices ({summary.sentCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reminders Queue Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
              <p className="mt-3 text-xs text-gray-500">Loading reminder queue...</p>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-base font-bold text-gray-800">No Reminders in Current Queue</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                All farmers have settled balances or have already been notified for {currentPeriod}.
              </p>
              <button
                onClick={handleGenerateMonthly}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Refresh Active Farmer Balances
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                    <th className="py-3 px-3">Farmer</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-right">Outstanding (₹)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Message Preview</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredReminders.map((reminder) => {
                    const isSent = reminder.status === 'sent'
                    const totalDue = parseFloat(reminder.live_total_due || reminder.amount || 0).toFixed(2)

                    return (
                      <tr key={reminder.id} className="hover:bg-gray-50/80 transition-colors group">
                        
                        {/* Farmer Name */}
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-gray-900">{reminder.farmer_name || reminder.customer_name}</p>
                          <span className="text-[10px] text-gray-400">ID #{reminder.farmer_id || reminder.id}</span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-gray-700">{reminder.farmer_phone || reminder.phone}</span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-3 text-right">
                          <p className="font-black text-amber-700 text-sm">₹{totalDue}</p>
                          <p className="text-[10px] text-gray-400">
                            P: ₹{parseFloat(reminder.principal_amount || 0).toFixed(0)} | Int: ₹{parseFloat(reminder.interest_amount || 0).toFixed(0)}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 text-green-600" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" /> Due
                            </span>
                          )}
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-3 max-w-[280px]">
                          <p className="truncate text-gray-500 text-[11px]" title={reminder.message_text}>
                            {reminder.message_text || 'Automated monthly balance reminder'}
                          </p>
                          <span className="text-[9px] uppercase font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                            {reminder.language || 'te'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleSendWhatsApp(reminder)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1"
                            title="Send via WhatsApp"
                          >
                            <Send className="w-3 h-3" /> WhatsApp
                          </button>

                          <button
                            onClick={() => handleCopyMessage(reminder.id, reminder.message_text)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Copy Message Text"
                          >
                            {copiedId === reminder.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          </button>

                          {!isSent && (
                            <button
                              onClick={() => handleMarkSent(reminder.id)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Mark as Already Sent"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDismiss(reminder.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Dismiss from this month"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>Reminders use direct WhatsApp links to protect sender phone trust and comply with messaging policies.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}

export default MonthlyRemindersModal
