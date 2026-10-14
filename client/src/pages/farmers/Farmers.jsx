import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Eye, Users, TrendingUp, Phone, MapPin, Edit, MessageSquare, AlertCircle, Calendar } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { WhatsAppReminderModal, MonthlyRemindersModal } from '../../components/common'
import { useLanguage } from '../../contexts/LanguageContext'

const Farmers = () => {
  const { t } = useLanguage()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [creditFilter, setCreditFilter] = useState('all')
  const hasFetchedRef = useRef(false)
  const [editingFarmer, setEditingFarmer] = useState(null)
  const [reminderFarmer, setReminderFarmer] = useState(null)
  const [showMonthlyRemindersModal, setShowMonthlyRemindersModal] = useState(false)
  const [monthlyPendingCount, setMonthlyPendingCount] = useState(0)

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/farmers')
      setFarmers(response.data)

      // Fetch pending reminders count for badge
      api.get('/credit-reminders').then(res => {
        if (res.data?.summary?.pendingCount !== undefined) {
          setMonthlyPendingCount(res.data.summary.pendingCount)
        }
      }).catch(() => {})
    } catch (error) {
      console.error('Error fetching farmers:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch farmers')
      setFarmers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFarmer = async (id, name) => {
    if (window.confirm(`Delete farmer "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/farmers/${id}`)
        toast.success('Farmer deleted successfully')
        fetchFarmers()
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete farmer')
      }
    }
  }

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone.includes(searchTerm) ||
      (farmer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || farmer.status === filterStatus

    const totalDue = parseFloat(farmer.current_credit || 0) + parseFloat(farmer.accrued_interest || 0)
    let matchesCredit = true
    if (creditFilter === 'with_credit') matchesCredit = totalDue > 0
    else if (creditFilter === 'no_credit') matchesCredit = totalDue <= 0

    return matchesSearch && matchesStatus && matchesCredit
  })

  const totalOutstandingCredit = farmers.reduce((sum, f) => sum + (parseFloat(f.current_credit || 0) + parseFloat(f.accrued_interest || 0)), 0)
  const farmersWithDueCount = farmers.filter(f => (parseFloat(f.current_credit || 0) + parseFloat(f.accrued_interest || 0)) > 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t('farmerManagement') || 'Farmer Management'}</h1>
            <p className="text-green-100 mt-1">{farmers.length} {t('farmersInDatabase') || 'farmers in database'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowMonthlyRemindersModal(true)}
            className="bg-emerald-700/90 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-white/20"
          >
            <Calendar className="w-5 h-5 text-emerald-200" />
            <span>Monthly Reminders</span>
            {monthlyPendingCount > 0 && (
              <span className="bg-amber-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                {monthlyPendingCount} Due
              </span>
            )}
          </button>
          <Link to="/farmers/add" className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <Plus className="w-5 h-5" />
            <span>{t('addFarmer') || 'Add Farmer'}</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalFarmers') || 'Total Farmers'}</p>
              <p className="text-3xl font-bold text-green-600">{farmers.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('activeFarmers') || 'Active Farmers'}</p>
              <p className="text-3xl font-bold text-blue-600">{farmers.filter(f => f.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalSpent') || 'Total Spent'}</p>
              <p className="text-3xl font-bold text-emerald-600">₹{farmers.reduce((sum, f) => sum + (parseFloat(f.total_spent) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="glass-card premium-shadow p-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 font-semibold">{t('outstandingCredit') || 'Outstanding Credit'}</p>
              <p className="text-3xl font-bold text-amber-600">
                ₹{totalOutstandingCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-amber-600/90 mt-1 font-medium">
                {farmersWithDueCount} {farmersWithDueCount === 1 ? 'farmer has' : 'farmers have'} balance
              </p>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <button
            onClick={() => setShowMonthlyRemindersModal(true)}
            className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline self-start"
          >
            <span>Open Reminders Queue</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
          <input
            type="text"
            placeholder={t('searchFarmersPlaceholder') || 'Search by name, phone, or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">{t('allStatus') || 'All Status'}</option>
            <option value="active">{t('active') || 'Active'}</option>
            <option value="inactive">{t('inactive') || 'Inactive'}</option>
          </select>

          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white font-medium"
          >
            <option value="all">All Farmers (Ledger)</option>
            <option value="with_credit">⚠️ Outstanding Credit Due Only</option>
            <option value="no_credit">✅ Zero Balance / Clear Dues</option>
          </select>
        </div>
      </div>

      {/* Farmers Grid */}
      {filteredFarmers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => (
            <div key={farmer.id} className="glass-card premium-shadow p-6 rounded-2xl border hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{farmer.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Phone className="w-4 h-4 mr-1" />
                    {farmer.phone}
                  </div>
                  {farmer.location && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {farmer.location}
                    </div>
                  )}
                </div>
                <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${farmer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {farmer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('landArea') || 'Farm Size'}:</span>
                  <span className="font-medium">{farmer.farm_size || 'N/A'} {t('acres') || 'acres'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cropType') || 'Crop Type'}:</span>
                  <span className="font-medium">{farmer.crop_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('purchases') || 'Purchases'}:</span>
                  <span className="font-medium">{farmer.total_purchases || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('totalSpent') || 'Total Spent'}:</span>
                  <span className="font-bold text-green-600">₹{(parseFloat(farmer.total_spent) || 0).toLocaleString()}</span>
                </div>
                {(parseFloat(farmer.current_credit || 0) + parseFloat(farmer.accrued_interest || 0)) > 0 && (
                  <div className="flex justify-between text-sm pt-1 border-t border-dashed">
                    <span className="text-red-600 font-semibold">{t('creditBalance') || 'Credit Balance'}:</span>
                    <span className="font-bold text-red-600">₹{(parseFloat(farmer.current_credit || 0) + parseFloat(farmer.accrued_interest || 0)).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/farmers/${farmer.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t('view') || 'View'}</span>
                </Link>
                <Link
                  to={`/farmers/edit/${farmer.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>{t('edit') || 'Edit'}</span>
                </Link>
                {(parseFloat(farmer.current_credit || 0) + parseFloat(farmer.accrued_interest || 0)) > 0 && (
                  <button
                    onClick={() => setReminderFarmer(farmer)}
                    className="p-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center justify-center transition"
                    title={t('sendWhatsAppReminder') || 'Send WhatsApp Payment Reminder'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                  className="p-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center"
                  title={t('delete') || 'Delete Farmer'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noFarmersFound') || 'No farmers found'}</h3>
          <p className="mt-2 text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? (t('adjustSearchFilter') || 'Try adjusting your search or filters')
              : (t('startAddingFarmer') || 'Get started by adding your first farmer')}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link to="/farmers/add" className="btn-primary">
              {t('addFarmer') || 'Add First Farmer'}
            </Link>
          )}
        </div>
      )}

      {/* Edit Farmer Modal */}
      {editingFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Farmer</h2>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" value={editingFarmer.name || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, name: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingFarmer.phone || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, phone: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingFarmer.email || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, email: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingFarmer.location || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, location: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full p-2 border rounded" value={editingFarmer.farm_size || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, farm_size: e.target.value }))} />
                <input className="w-full p-2 border rounded" value={editingFarmer.crop_type || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, crop_type: e.target.value }))} />
              </div>
              <input className="w-full p-2 border rounded" value={editingFarmer.credit_limit || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, credit_limit: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingFarmer.status || ''} onChange={e => setEditingFarmer(prev => ({ ...prev, status: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingFarmer(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={async () => {
                try {
                  await api.put(`/farmers/${editingFarmer.id}`, editingFarmer)
                  toast.success('Farmer updated')
                  setEditingFarmer(null)
                  fetchFarmers()
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Failed to update farmer')
                }
              }} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={Boolean(reminderFarmer)}
        onClose={() => setReminderFarmer(null)}
        farmer={reminderFarmer}
      />

      {/* Automated Monthly WhatsApp Reminders Modal */}
      <MonthlyRemindersModal
        isOpen={showMonthlyRemindersModal}
        onClose={() => setShowMonthlyRemindersModal(false)}
        onQueueUpdated={fetchFarmers}
      />
    </div>
  )
}

export default Farmers
