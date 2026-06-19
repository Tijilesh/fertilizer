import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, Eye, Users, TrendingUp, Phone, MapPin, Edit } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Farmers = () => {
  const { t } = useLanguage()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const hasFetchedRef = useRef(false)
  const [editingFarmer, setEditingFarmer] = useState(null)

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
    return matchesSearch && matchesStatus
  })

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
            <h1 className="text-3xl font-black tracking-tight">Farmer Management</h1>
            <p className="text-green-100 mt-1">{farmers.length} farmers in database</p>
          </div>
        </div>
        <Link to="/farmers/add" className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          <span>Add Farmer</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Farmers</p>
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
              <p className="text-sm font-medium text-gray-600">Active Farmers</p>
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
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-emerald-600">₹{farmers.reduce((sum, f) => sum + (parseFloat(f.total_spent) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all outline-none"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                  <span className="text-gray-600">Farm Size:</span>
                  <span className="font-medium">{farmer.farm_size || 'N/A'} acres</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Crop Type:</span>
                  <span className="font-medium">{farmer.crop_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Purchases:</span>
                  <span className="font-medium">{farmer.total_purchases || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-bold text-green-600">₹{(parseFloat(farmer.total_spent) || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/farmers/${farmer.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Link>
                <Link
                  to={`/farmers/edit/${farmer.id}`}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No farmers found</h3>
          <p className="mt-2 text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first farmer'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link to="/farmers/add" className="btn-primary">
              Add First Farmer
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
    </div>
  )
}

export default Farmers
