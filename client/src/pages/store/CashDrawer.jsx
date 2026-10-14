import { useState, useEffect, useMemo } from 'react'
import {
  Calculator,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Printer,
  RefreshCw,
  Clock,
  History,
  UserCheck,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Coffee,
  Truck,
  Users,
  Coins,
  Receipt,
  X
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const DENOMINATION_VALUES = [
  { key: 'n500', value: 500, label: '₹500 Note', color: 'from-amber-600 to-yellow-600', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'n200', value: 200, label: '₹200 Note', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
  { key: 'n100', value: 100, label: '₹100 Note', color: 'from-purple-600 to-indigo-600', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  { key: 'n50', value: 50, label: '₹50 Note', color: 'from-cyan-600 to-teal-600', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { key: 'n20', value: 20, label: '₹20 Note', color: 'from-emerald-600 to-green-600', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { key: 'n10', value: 10, label: '₹10 Note', color: 'from-stone-600 to-stone-700', bg: 'bg-stone-50 text-stone-800 border-stone-200' },
  { key: 'coins', value: 1, label: 'Coins (₹1/2/5)', isCoins: true, color: 'from-blue-600 to-cyan-600', bg: 'bg-blue-50 text-blue-800 border-blue-200' }
]

const CashDrawer = () => {
  // Main drawer data
  const [currentData, setCurrentData] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('drawer') // 'drawer' | 'history'

  // Shop info for receipt
  const [shopSettings, setShopSettings] = useState({
    shop_name: 'Kisan Agro & Fertilizer Center',
    shop_phone: '+91 98765 43210',
    shop_address: 'Main Market Road, Mandi Yard',
    gstin: '36ABCDE1234F1Z5'
  })

  // Modal controls
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openFloatInput, setOpenFloatInput] = useState('2000')
  const [openNotesInput, setOpenNotesInput] = useState('')

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'labor', description: '' })

  const [showCashInModal, setShowCashInModal] = useState(false)
  const [cashInForm, setCashInForm] = useState({ amount: '', category: 'change_float', description: '' })

  const [showCloseModal, setShowCloseModal] = useState(false)
  const [denominations, setDenominations] = useState({
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    coins: 0
  })
  const [handoverTo, setHandoverTo] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  // Settlement Slip Modal
  const [settlementSlip, setSettlementSlip] = useState(null)
  const [slipFormat, setSlipFormat] = useState('thermal') // 'thermal' | 'a4'

  useEffect(() => {
    fetchCurrentDrawer()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      if (res.data && res.data.shop_name) {
        setShopSettings(prev => ({ ...prev, ...res.data }))
      }
    } catch {
      // Keep defaults
    }
  }

  const fetchCurrentDrawer = async () => {
    try {
      setLoading(true)
      const res = await api.get('/cash-drawer/current')
      setCurrentData(res.data)
    } catch (err) {
      console.error('Error fetching cash drawer:', err)
      toast.error('Failed to load cash drawer status')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get('/cash-drawer/history')
      setHistoryList(res.data)
    } catch (err) {
      console.error('Error fetching drawer history:', err)
      toast.error('Failed to load closing history')
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'history') {
      fetchHistory()
    } else {
      fetchCurrentDrawer()
    }
  }

  // Open Drawer handler
  const handleOpenDrawer = async (e) => {
    e.preventDefault()
    const floatVal = parseFloat(openFloatInput)
    if (isNaN(floatVal) || floatVal < 0) {
      toast.error('Please enter a valid starting float amount')
      return
    }

    try {
      await api.post('/cash-drawer/open', {
        opening_cash: floatVal,
        notes: openNotesInput
      })
      toast.success('Cash drawer morning session opened!')
      setShowOpenModal(false)
      fetchCurrentDrawer()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open cash drawer')
    }
  }

  // Log Expense
  const handleRecordExpense = async (e) => {
    e.preventDefault()
    const amt = parseFloat(expenseForm.amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid expense amount')
      return
    }

    try {
      await api.post('/cash-drawer/expense', {
        amount: amt,
        category: expenseForm.category,
        description: expenseForm.description
      })
      toast.success('Petty cash outlay logged successfully')
      setShowExpenseModal(false)
      setExpenseForm({ amount: '', category: 'labor', description: '' })
      fetchCurrentDrawer()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log expense')
    }
  }

  // Add Cash In
  const handleRecordCashIn = async (e) => {
    e.preventDefault()
    const amt = parseFloat(cashInForm.amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid cash amount')
      return
    }

    try {
      await api.post('/cash-drawer/cash-in', {
        amount: amt,
        category: cashInForm.category,
        description: cashInForm.description
      })
      toast.success('Cash addition logged successfully')
      setShowCashInModal(false)
      setCashInForm({ amount: '', category: 'change_float', description: '' })
      fetchCurrentDrawer()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record cash-in')
    }
  }

  // Calculate counted total from denominations
  const countedCash = useMemo(() => {
    let sum = 0
    DENOMINATION_VALUES.forEach(d => {
      const count = parseInt(denominations[d.key], 10) || 0
      sum += count * d.value
    })
    return sum
  }, [denominations])

  const expectedCashAmount = currentData?.expectedCash || 0
  const discrepancy = countedCash - expectedCashAmount

  // Handle Day-End Close
  const handleCloseSession = async (e) => {
    e.preventDefault()
    if (!handoverTo.trim()) {
      toast.error('Please specify who this drawer balance is handed over to')
      return
    }

    try {
      const res = await api.post('/cash-drawer/close', {
        actual_cash: countedCash,
        denominations,
        handover_to: handoverTo.trim(),
        closing_notes: closingNotes.trim()
      })

      toast.success('Cash drawer closed & settlement slip ready!')
      setShowCloseModal(false)

      // Fetch the full closed session for instant slip display
      if (res.data?.settlement?.session_id) {
        const fullSessionRes = await api.get(`/cash-drawer/session/${res.data.settlement.session_id}`)
        setSettlementSlip(fullSessionRes.data)
      }

      fetchCurrentDrawer()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close cash drawer')
    }
  }

  // Load a historical session into slip modal
  const handleViewHistoricalSlip = async (sessionId) => {
    try {
      const res = await api.get(`/cash-drawer/session/${sessionId}`)
      setSettlementSlip(res.data)
    } catch (err) {
      toast.error('Failed to load session details')
    }
  }

  const activeSession = currentData?.activeSession
  const liveSales = currentData?.liveSales || { cashSales: 0, onlineSales: 0, creditSales: 0, totalSales: 0, cashSalesCount: 0 }
  const transactions = currentData?.transactions || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Header & Register Status Banner */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl text-white shadow-md shadow-amber-500/20">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Daily Cash Drawer &amp; Day-End Closing
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Morning float management, real-time POS cash tracking, petty expenses &amp; cashier sign-off audit
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {activeSession ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  REGISTER ACTIVE: {activeSession.session_code}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  REGISTER CLOSED (Ready to Open Morning Session)
                </div>
              )}

              {activeSession && (
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Opened at {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by <span className="font-semibold text-gray-800">{activeSession.opened_by}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchCurrentDrawer}
              disabled={loading}
              className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              title="Refresh register stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {activeSession ? (
              <>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm rounded-xl border border-rose-200 transition flex items-center gap-2 shadow-sm"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Petty Cash Out
                </button>

                <button
                  onClick={() => setShowCashInModal(true)}
                  className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm rounded-xl border border-sky-200 transition flex items-center gap-2 shadow-sm"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Add Change / Cash In
                </button>

                <button
                  onClick={() => {
                    setDenominations({ n500: 0, n200: 0, n100: 0, n50: 0, n20: 0, n10: 0, coins: 0 })
                    setHandoverTo('')
                    setClosingNotes('')
                    setShowCloseModal(true)
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                >
                  <ShieldCheck className="w-4 h-4" />
                  End Day &amp; Close Register
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setOpenFloatInput('2000')
                  setOpenNotesInput('')
                  setShowOpenModal(true)
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-primary-600/25"
              >
                <Wallet className="w-4 h-4" />
                Open Morning Drawer
              </button>
            )}

            {currentData?.lastClosedSession && !activeSession && (
              <button
                onClick={() => handleViewHistoricalSlip(currentData.lastClosedSession.id)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Last Settlement Slip
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle: Live Register vs Closing History */}
        <div className="flex border-b border-gray-100 mt-6 pt-2">
          <button
            onClick={() => handleTabChange('drawer')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'drawer'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Live Register Session
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Settlement Audit History
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TAB: Live Register Session */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'drawer' && (
        <>
          {/* Real-time KPI Float Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Opening Float */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Morning Starting Float</span>
                <Wallet className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-gray-900">
                ₹{parseFloat(activeSession?.opening_cash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-400 mt-1">Cash in register at opening</p>
            </div>

            {/* Live Cash Sales */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>POS Cash Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                ₹{parseFloat(liveSales.cashSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                {liveSales.cashSalesCount || 0} Cash Bills Collected
              </p>
            </div>

            {/* Cash Added (In) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Change / Cash In</span>
                <ArrowUpRight className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-sky-700">
                +₹{parseFloat(currentData?.liveCashIn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-400 mt-1">Manual coin/float infusion</p>
            </div>

            {/* Petty Expenses (Out) */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Petty Cash Expenses</span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                -₹{parseFloat(currentData?.liveCashOut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-rose-700 font-medium mt-1">Labor, porter, tea &amp; misc</p>
            </div>

            {/* Current Expected Cash In Drawer */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20">
              <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Expected In Drawer</span>
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                ₹{parseFloat(currentData?.expectedCash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-100 mt-1 font-medium">Float + Sales + In - Out</p>
            </div>
          </div>

          {/* Secondary Stats Row: UPI, Khata, Total Store Turnover */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 block">Digital (UPI/Card) Today</span>
                <span className="text-base font-bold text-gray-900">
                  ₹{parseFloat(liveSales.onlineSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 block">({liveSales.onlineSalesCount || 0} digital payments)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 block">Farmer Khata / Credit</span>
                <span className="text-base font-bold text-gray-900">
                  ₹{parseFloat(liveSales.creditSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 block">({liveSales.creditSalesCount || 0} credit bills)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-500 block">Total Store Sales Today</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{parseFloat(liveSales.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 block">All payment methods combined</span>
              </div>
            </div>
          </div>

          {/* Live Register Timeline & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Cash Drawer Activity Stream */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Register Cash Movement Ledger
                  </h3>
                  <p className="text-xs text-gray-500">Chronological stream of drawer additions and outlays</p>
                </div>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {transactions.length} entries
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-gray-600">No cash transactions logged yet</p>
                  <p className="text-xs mt-1">Petty cash expenses and float adjustments will show here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const isOut = tx.type === 'CASH_OUT'
                    return (
                      <div
                        key={tx.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                          isOut
                            ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50'
                            : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl font-bold text-xs ${
                              isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isOut ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 capitalize">
                                {tx.category.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 border text-gray-500">
                                {tx.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {tx.description || 'No description provided'}
                            </p>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {tx.created_by_name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-base font-black ${
                              isOut ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {isOut ? '-' : '+'}₹{parseFloat(tx.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Quick Mid-day Outlay Shortcuts */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl">
                <h3 className="font-extrabold text-base flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Quick Cash Expense Presets
                </h3>
                <p className="text-xs text-gray-300 mb-4">
                  Log routine fertilizer shop cash outlays in 1 click
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setExpenseForm({ amount: '200', category: 'labor', description: 'Hamali / Unloading labor charges' })
                      setShowExpenseModal(true)
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition group"
                  >
                    <Truck className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="block text-xs font-bold">Unloading Labor</span>
                    <span className="text-[11px] text-gray-400">₹200 Preset</span>
                  </button>

                  <button
                    onClick={() => {
                      setExpenseForm({ amount: '150', category: 'freight', description: 'Auto porter / Local cartage freight' })
                      setShowExpenseModal(true)
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition group"
                  >
                    <Truck className="w-4 h-4 text-sky-400 mb-1" />
                    <span className="block text-xs font-bold">Local Freight</span>
                    <span className="text-[11px] text-gray-400">₹150 Preset</span>
                  </button>

                  <button
                    onClick={() => {
                      setExpenseForm({ amount: '60', category: 'tea_snacks', description: 'Staff tea & refreshments' })
                      setShowExpenseModal(true)
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition group"
                  >
                    <Coffee className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="block text-xs font-bold">Tea &amp; Snacks</span>
                    <span className="text-[11px] text-gray-400">₹60 Preset</span>
                  </button>

                  <button
                    onClick={() => {
                      setExpenseForm({ amount: '100', category: 'packaging', description: 'Stitching thread / packing sacks' })
                      setShowExpenseModal(true)
                    }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition group"
                  >
                    <Coins className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="block text-xs font-bold">Bags / Packing</span>
                    <span className="text-[11px] text-gray-400">₹100 Preset</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <button
                    onClick={() => {
                      setExpenseForm({ amount: '', category: 'labor', description: '' })
                      setShowExpenseModal(true)
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 font-bold underline"
                  >
                    Custom Expense Entry &rarr;
                  </button>
                </div>
              </div>

              {/* Day-End Settlement Readiness Card */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">Closing Protocol</h4>
                    <p className="text-xs text-gray-500">Physical Cash Verification</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  At store closing, count physical notes (₹500, ₹200, ₹100, etc.) in the denomination grid. The system calculates any discrepancy against live cash sales and prints an official sign-off slip.
                </p>

                {activeSession ? (
                  <button
                    onClick={() => {
                      setDenominations({ n500: 0, n200: 0, n100: 0, n50: 0, n20: 0, n10: 0, coins: 0 })
                      setHandoverTo('')
                      setClosingNotes('')
                      setShowCloseModal(true)
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Open Denomination Counter
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setOpenFloatInput('2000')
                      setOpenNotesInput('')
                      setShowOpenModal(true)
                    }}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Open Morning Register First
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. TAB: Settlement Audit History */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Previous Register Closings &amp; Handover Audit Log
              </h3>
              <p className="text-xs text-gray-500">Complete archive of day-end cash settlements with cashier sign-offs</p>
            </div>
            <button
              onClick={fetchHistory}
              className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl transition"
              title="Refresh history"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {historyList.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-600">No past closing settlements found</p>
              <p className="text-xs mt-1">Sessions closed at the end of each business day will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-extrabold tracking-wider border-y border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Session Code</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Cashier / Closed By</th>
                    <th className="py-3 px-4">Opening Float</th>
                    <th className="py-3 px-4">Expected Cash</th>
                    <th className="py-3 px-4">Counted Cash</th>
                    <th className="py-3 px-4">Discrepancy</th>
                    <th className="py-3 px-4">Handover To</th>
                    <th className="py-3 px-4 text-right">Settlement Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyList.map((item) => {
                    const diff = parseFloat(item.difference || 0)
                    const isMatch = Math.abs(diff) < 0.01
                    const isSurplus = diff > 0.01
                    const isShortage = diff < -0.01

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {item.session_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-gray-800 block">
                            {new Date(item.closed_at || item.session_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.closed_at || item.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">
                          {item.closed_by || item.opened_by}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          ₹{parseFloat(item.opening_cash || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          ₹{parseFloat(item.expected_cash || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          ₹{parseFloat(item.actual_cash || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isMatch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Exact ₹0.00
                            </span>
                          )}
                          {isSurplus && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                              +₹{diff.toFixed(2)} Surplus
                            </span>
                          )}
                          {isShortage && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              -₹{Math.abs(diff).toFixed(2)} Shortage
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {item.handover_to || 'Store Owner'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleViewHistoricalSlip(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            View Slip
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MODAL: Open Morning Register Session */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowOpenModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-100 text-primary-700 rounded-2xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Open Morning Cash Drawer</h3>
                <p className="text-xs text-gray-500">Record register opening float for the day</p>
              </div>
            </div>

            <form onSubmit={handleOpenDrawer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Starting Float Cash (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={openFloatInput}
                    onChange={(e) => setOpenFloatInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="2000"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2 mt-2">
                  {['1000', '2000', '5000', '10000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpenFloatInput(preset)}
                      className={`text-xs py-1 px-2.5 rounded-lg font-semibold border transition ${
                        openFloatInput === preset
                          ? 'bg-primary-50 text-primary-700 border-primary-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Opening Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  placeholder="e.g. 4 x ₹500 notes starting change..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-primary-600/25"
                >
                  Start Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MODAL: Log Petty Cash Outlay */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowExpenseModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Record Petty Cash Out</h3>
                <p className="text-xs text-gray-500">Paid out from register drawer cash</p>
              </div>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Amount Paid (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Expense Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                >
                  <option value="labor">Unloading / Hamali Labor</option>
                  <option value="freight">Auto Porter / Freight Cartage</option>
                  <option value="tea_snacks">Tea &amp; Snacks / Refreshments</option>
                  <option value="packaging">Bags, Twine &amp; Packaging</option>
                  <option value="maintenance">Shop Maintenance / Repairs</option>
                  <option value="other">Other Petty Cash Outlay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Paid hamali for 20 DAP bags unloading"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-600/25"
                >
                  Deduct from Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. MODAL: Add Change / Cash In */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showCashInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowCashInModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Add Cash / Change Float</h3>
                <p className="text-xs text-gray-500">Inject additional cash or coins into active register</p>
              </div>
            </div>

            <form onSubmit={handleRecordCashIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Amount Added (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={cashInForm.amount}
                    onChange={(e) => setCashInForm({ ...cashInForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl font-bold text-lg text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={cashInForm.category}
                  onChange={(e) => setCashInForm({ ...cashInForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                >
                  <option value="change_float">Change / Coins Brought From Bank</option>
                  <option value="owner_infusion">Owner Capital Infusion</option>
                  <option value="collection">Manual Farmer Khata Cash Collection</option>
                  <option value="other">Other Cash Addition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  required
                  value={cashInForm.description}
                  onChange={(e) => setCashInForm({ ...cashInForm, description: e.target.value })}
                  placeholder="e.g. ₹500 in ₹10 and ₹20 change notes"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCashInModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-sky-600/25"
                >
                  Add to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. MODAL: Day-End Closing & Denomination Calculator */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8">
            <button
              onClick={() => setShowCloseModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-2xl text-gray-900">
                  Day-End Cash Drawer Closing
                </h3>
                <p className="text-xs text-gray-500">
                  Session: <span className="font-mono font-bold text-gray-800">{activeSession?.session_code}</span> &bull; Enter currency denomination counts
                </p>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-6">
              {/* Expected vs Actual Live Meter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase">Expected Drawer Cash</span>
                  <span className="text-xl font-black text-gray-800">
                    ₹{expectedCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase">Physical Counted Cash</span>
                  <span className="text-xl font-black text-emerald-700">
                    ₹{countedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block uppercase">Variance / Diff</span>
                  {Math.abs(discrepancy) < 0.01 ? (
                    <span className="text-sm font-black text-emerald-600 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-4 h-4" /> Exact ₹0.00 Match
                    </span>
                  ) : discrepancy > 0 ? (
                    <span className="text-sm font-black text-sky-600 flex items-center gap-1 mt-1">
                      +₹{discrepancy.toFixed(2)} Surplus
                    </span>
                  ) : (
                    <span className="text-sm font-black text-rose-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-4 h-4" /> -₹{Math.abs(discrepancy).toFixed(2)} Shortage
                    </span>
                  )}
                </div>
              </div>

              {/* Denomination Counter Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                    Indian Currency Denomination Counter
                  </label>
                  <button
                    type="button"
                    onClick={() => setDenominations({ n500: 0, n200: 0, n100: 0, n50: 0, n20: 0, n10: 0, coins: 0 })}
                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline"
                  >
                    Reset to 0
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {DENOMINATION_VALUES.map((d) => {
                    const count = denominations[d.key] || 0
                    const subtotal = count * d.value

                    return (
                      <div
                        key={d.key}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition ${d.bg}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-sm tracking-tight">{d.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={denominations[d.key] === 0 ? '' : denominations[d.key]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0
                              setDenominations({ ...denominations, [d.key]: Math.max(0, val) })
                            }}
                            placeholder="0"
                            className="w-16 px-2 py-1 text-center font-bold text-gray-900 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          />
                          <span className="text-xs font-mono font-bold text-gray-700 w-20 text-right">
                            = ₹{subtotal}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Handover & Sign-Off Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Cash Handover Recipient *
                  </label>
                  <input
                    type="text"
                    required
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    placeholder="e.g. Store Owner / Ramesh Patel"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Person receiving the counted cash physical drawer
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Closing Notes / Variance Reason
                  </label>
                  <input
                    type="text"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="e.g. ₹10 shortage rounded in customer change"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Any comment printed on the settlement slip
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Confirm Closing &amp; Generate Settlement Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. MODAL: Commercial Day-End Settlement Slip (Printable Dual Format) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {settlementSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          {/* Printable Scope Styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-settlement-slip, .printable-settlement-slip * {
                visibility: visible !important;
              }
              .printable-settlement-slip {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: ${slipFormat === 'a4' ? '15px' : '4px'} !important;
                background: white !important;
                box-shadow: none !important;
              }
              @page {
                margin: ${slipFormat === 'a4' ? '8mm' : '2mm'};
                size: ${slipFormat === 'a4' ? 'A4 portrait' : '80mm auto'};
              }
            }
          `}</style>

          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8">
            {/* Header Toolbar (Hidden when printing) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-lg text-gray-900">
                  Day-End Settlement Handover Slip
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Format Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setSlipFormat('thermal')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      slipFormat === 'thermal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    80mm Thermal Slip
                  </button>
                  <button
                    onClick={() => setSlipFormat('a4')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      slipFormat === 'a4' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    A4 Audit Report
                  </button>
                </div>

                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" />
                  Print Slip
                </button>

                {/* Close Modal */}
                <button
                  onClick={() => setSettlementSlip(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ──────── Printable Slip Content ──────── */}
            <div className="printable-settlement-slip">
              {/* FORMAT 1: 80mm THERMAL RECEIPT STYLE */}
              {slipFormat === 'thermal' && (
                <div className="w-[80mm] mx-auto bg-white p-3 font-mono text-[10px] text-gray-900 leading-tight">
                  <div className="text-center pb-2 border-b border-dashed border-gray-800">
                    <p className="font-black text-sm uppercase">{shopSettings.shop_name}</p>
                    <p className="text-[9px]">{shopSettings.shop_address}</p>
                    <p className="text-[9px]">Phone: {shopSettings.shop_phone}</p>
                    {shopSettings.gstin && <p className="text-[9px]">GSTIN: {shopSettings.gstin}</p>}
                    <p className="font-extrabold text-[11px] mt-1 uppercase tracking-wider">
                      *** DAY-END CLOSING SLIP ***
                    </p>
                  </div>

                  <div className="py-2 border-b border-dashed border-gray-800 text-[9px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>SESSION:</span>
                      <span className="font-bold">{settlementSlip.session?.session_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span>{new Date(settlementSlip.session?.closed_at || settlementSlip.session?.session_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TIME:</span>
                      <span>{new Date(settlementSlip.session?.closed_at || settlementSlip.session?.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CASHIER:</span>
                      <span className="font-bold">{settlementSlip.session?.closed_by || settlementSlip.session?.opened_by}</span>
                    </div>
                  </div>

                  {/* Cash Flow Summary */}
                  <div className="py-2 border-b border-dashed border-gray-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Opening Float:</span>
                      <span className="font-bold">₹{parseFloat(settlementSlip.session?.opening_cash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POS Cash Sales:</span>
                      <span className="font-bold">+₹{parseFloat(settlementSlip.session?.cash_sales_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash In / Additions:</span>
                      <span>+₹{parseFloat(settlementSlip.session?.cash_in_manual || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Petty Expenses Out:</span>
                      <span className="text-red-700">-₹{parseFloat(settlementSlip.session?.cash_out_expenses || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black border-t border-dotted border-gray-600 pt-1">
                      <span>EXPECTED CASH:</span>
                      <span>₹{parseFloat(settlementSlip.session?.expected_cash || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Physical Counted Cash & Discrepancy */}
                  <div className="py-2 border-b border-dashed border-gray-800 space-y-1">
                    <div className="flex justify-between font-black text-[11px]">
                      <span>ACTUAL COUNTED:</span>
                      <span>₹{parseFloat(settlementSlip.session?.actual_cash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>DISCREPANCY:</span>
                      <span>
                        {Math.abs(parseFloat(settlementSlip.session?.difference || 0)) < 0.01
                          ? 'EXACT MATCH (₹0.00)'
                          : parseFloat(settlementSlip.session?.difference || 0) > 0
                          ? `+₹${parseFloat(settlementSlip.session?.difference).toFixed(2)} SURPLUS`
                          : `-₹${Math.abs(parseFloat(settlementSlip.session?.difference)).toFixed(2)} SHORTAGE`}
                      </span>
                    </div>
                  </div>

                  {/* Non-Cash Sales Summary */}
                  <div className="py-2 border-b border-dashed border-gray-800 space-y-0.5 text-[8.5px]">
                    <p className="font-bold uppercase">Non-Drawer Business Summary:</p>
                    <div className="flex justify-between">
                      <span>Digital (UPI/Card):</span>
                      <span>₹{parseFloat(settlementSlip.session?.online_sales_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Khata Credit Sales:</span>
                      <span>₹{parseFloat(settlementSlip.session?.credit_sales_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-dotted border-gray-400 pt-0.5">
                      <span>Total Day Sales:</span>
                      <span>₹{parseFloat(settlementSlip.session?.total_sales_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Denominations breakdown */}
                  {settlementSlip.session?.denominations && (
                    <div className="py-2 border-b border-dashed border-gray-800 text-[8px]">
                      <p className="font-bold mb-1 uppercase">Note Counts:</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        {Object.entries(
                          typeof settlementSlip.session.denominations === 'string'
                            ? JSON.parse(settlementSlip.session.denominations)
                            : settlementSlip.session.denominations
                        ).map(([k, count]) => {
                          if (!count) return null
                          const noteLabel = k === 'coins' ? 'Coins' : `₹${k.replace('n', '')}`
                          return (
                            <div key={k} className="flex justify-between">
                              <span>{noteLabel}:</span>
                              <span>x{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Handover & Sign-Off lines */}
                  <div className="pt-3 text-[9px] space-y-4">
                    <div>
                      <span>Handed Over To: </span>
                      <span className="font-bold">{settlementSlip.session?.handover_to || 'Store Owner'}</span>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-dotted border-gray-400">
                      <div className="text-center">
                        <div className="w-24 border-t border-gray-800 pt-1">Cashier Sign</div>
                      </div>
                      <div className="text-center">
                        <div className="w-24 border-t border-gray-800 pt-1">Manager Sign</div>
                      </div>
                    </div>

                    <p className="text-center text-[7.5px] text-gray-500 pt-1">
                      System Generated Settlement Audit Slip &bull; Kisan Agro
                    </p>
                  </div>
                </div>
              )}

              {/* FORMAT 2: A4 COMMERCIAL AUDIT REPORT */}
              {slipFormat === 'a4' && (
                <div className="bg-white p-6 sm:p-8 font-sans text-gray-900 border border-gray-300 rounded-2xl max-w-2xl mx-auto text-sm">
                  {/* Formal Header */}
                  <div className="border-b-2 border-gray-900 pb-4 mb-4 flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded mb-1">
                        Commercial Daily Cash Handover Audit
                      </span>
                      <h2 className="text-2xl font-black text-gray-900">{shopSettings.shop_name}</h2>
                      <p className="text-xs text-gray-600">{shopSettings.shop_address}</p>
                      <p className="text-xs text-gray-600">Phone: {shopSettings.shop_phone} &bull; GSTIN: {shopSettings.gstin}</p>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <p className="font-bold text-emerald-800 text-sm">{settlementSlip.session?.session_code}</p>
                      <p className="text-gray-500">
                        Date: {new Date(settlementSlip.session?.closed_at || settlementSlip.session?.session_date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500">
                        Closed At: {new Date(settlementSlip.session?.closed_at || settlementSlip.session?.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                      <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2 border-b pb-1">
                        1. Register Cash Reconciliation
                      </p>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Morning Float In:</span>
                        <span className="font-bold">₹{parseFloat(settlementSlip.session?.opening_cash || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">POS Cash Sales:</span>
                        <span className="font-bold">+₹{parseFloat(settlementSlip.session?.cash_sales_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cash In (Float/Change):</span>
                        <span>+₹{parseFloat(settlementSlip.session?.cash_in_manual || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Petty Expenses Paid Out:</span>
                        <span className="text-red-700">-₹{parseFloat(settlementSlip.session?.cash_out_expenses || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 text-gray-900">
                        <span>Expected Drawer Cash:</span>
                        <span>₹{parseFloat(settlementSlip.session?.expected_cash || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                      <p className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] mb-2 border-b border-emerald-200 pb-1">
                        2. Physical Settlement &amp; Variance
                      </p>
                      <div className="flex justify-between text-sm font-black text-emerald-800">
                        <span>Physical Cash Counted:</span>
                        <span>₹{parseFloat(settlementSlip.session?.actual_cash || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1">
                        <span>Audit Discrepancy:</span>
                        <span
                          className={
                            Math.abs(parseFloat(settlementSlip.session?.difference || 0)) < 0.01
                              ? 'text-emerald-700'
                              : parseFloat(settlementSlip.session?.difference || 0) > 0
                              ? 'text-sky-700'
                              : 'text-rose-700'
                          }
                        >
                          {Math.abs(parseFloat(settlementSlip.session?.difference || 0)) < 0.01
                            ? 'Exact Match (₹0.00)'
                            : parseFloat(settlementSlip.session?.difference || 0) > 0
                            ? `+₹${parseFloat(settlementSlip.session?.difference).toFixed(2)} Surplus`
                            : `-₹${Math.abs(parseFloat(settlementSlip.session?.difference)).toFixed(2)} Shortage`}
                        </span>
                      </div>
                      <div className="pt-2 text-[11px] text-gray-600">
                        <span className="font-bold">Handover Recipient: </span>
                        <span>{settlementSlip.session?.handover_to || 'Store Owner'}</span>
                      </div>
                      {settlementSlip.session?.closing_notes && (
                        <div className="text-[11px] text-gray-600 italic">
                          <span className="font-bold not-italic">Notes: </span>
                          "{settlementSlip.session?.closing_notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sign-off Authorizations */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                      <div className="h-10"></div>
                      <div className="border-t border-gray-700 pt-1 font-bold">
                        Cashier / Register Custodian Signature
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">({settlementSlip.session?.closed_by || settlementSlip.session?.opened_by})</p>
                    </div>

                    <div>
                      <div className="h-10"></div>
                      <div className="border-t border-gray-700 pt-1 font-bold">
                        Store Manager / Receiver Signature
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">({settlementSlip.session?.handover_to || 'Store Owner'})</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CashDrawer
