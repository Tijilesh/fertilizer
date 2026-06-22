import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Calendar, DollarSign, ShoppingCart, Phone, Mail, MapPin, Sprout, Zap } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const FarmerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [farmer, setFarmer] = useState(null)
  const [sales, setSales] = useState([])
  const [onlineOrders, setOnlineOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFarmerDetails()
  }, [id])

  const fetchFarmerDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/farmers/${id}`)
      setFarmer(response.data)
      setSales(response.data.sales || [])
      setOnlineOrders(response.data.onlineOrders || [])
    } catch (error) {
      toast.error('Failed to load farmer details')
      navigate('/farmers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!farmer) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/farmers')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Farmers</span>
        </button>
      </div>

      {/* Farmer Profile Card */}
      <div className="glass-card premium-shadow p-8 rounded-3xl border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{farmer.name}</h1>
            <p className={`mt-2 inline-flex px-4 py-2 text-sm font-bold rounded-full ${
              farmer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {farmer.status.charAt(0).toUpperCase() + farmer.status.slice(1)}
            </p>
          </div>
          <button
            onClick={() => navigate(`/farmers/edit/${farmer.id}`)}
            className="btn-primary flex items-center space-x-2 px-6 py-3 rounded-xl"
          >
            <Edit2 className="w-5 h-5" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{farmer.phone}</p>
              </div>
            </div>
            {farmer.email && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{farmer.email}</p>
                </div>
              </div>
            )}
            {farmer.location && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{farmer.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Farm Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Farm Information</h2>
            {farmer.farm_size && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sprout className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Farm Size</p>
                  <p className="font-medium text-gray-900">{farmer.farm_size} acres</p>
                </div>
              </div>
            )}
            {farmer.crop_type && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Crop Type</p>
                  <p className="font-medium text-gray-900">{farmer.crop_type}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Credit Limit</p>
                <p className="font-medium text-gray-900">₹{farmer.credit_limit?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{farmer.total_purchases || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount Spent</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ₹{((farmer.total_spent || 0) + onlineOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Purchase</p>
              <p className="text-lg font-bold text-orange-600 mt-2">
                {farmer.last_purchase_date 
                  ? new Date(farmer.last_purchase_date).toLocaleDateString() 
                  : 'Never'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="glass-card premium-shadow p-8 rounded-3xl border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase History</h2>
        
        {sales && sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Payment Method</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">{sale.items || '-'}</td>
                    <td className="py-4 px-4 text-sm font-bold text-green-600">₹{sale.total_amount?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{sale.payment_method}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        sale.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No in-store purchase history for this farmer</p>
          </div>
        )}
      </div>

      {/* Online Orders History */}
      <div className="glass-card premium-shadow p-8 rounded-3xl border">
        <h2 className="text-2xl font-bold text-teal-900 mb-6">Online Orders History</h2>
        
        {onlineOrders && onlineOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-teal-200">
                  <th className="text-left py-3 px-4 font-bold text-teal-700">Date</th>
                  <th className="text-left py-3 px-4 font-bold text-teal-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-bold text-teal-700">Items</th>
                  <th className="text-left py-3 px-4 font-bold text-teal-700">Amount</th>
                  <th className="text-left py-3 px-4 font-bold text-teal-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {onlineOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-teal-50/50">
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-teal-700">{order.order_number}</td>
                    <td className="py-4 px-4 text-sm text-gray-700">{order.items || '-'}</td>
                    <td className="py-4 px-4 text-sm font-bold text-teal-600">₹{order.total_amount?.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No online orders for this farmer</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FarmerDetail
