import { useState, useEffect } from 'react'
import { Search, Package, Truck, CheckCircle, Clock, Eye, ShoppingBag } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'
import PromptModal from '../../components/common/PromptModal'

const AdminOrders = () => {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [promptOpen, setPromptOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders')
      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching admin orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    if (!selectedOrder || !status) return

    try {
      await api.put(`/admin/orders/${selectedOrder.id}/status`, { status })
      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update order status')
    } finally {
      setPromptOpen(false)
      setSelectedOrder(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Delivered</span>
      case 'shipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-100 text-blue-800"><Truck className="w-3 h-3 mr-1" /> Shipped</span>
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-orange-100 text-orange-800"><Clock className="w-3 h-3 mr-1" /> Processing</span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-red-100 text-red-800"><Clock className="w-3 h-3 mr-1" /> Cancelled</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-800"><Package className="w-3 h-3 mr-1" /> Pending</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center transition-all duration-300 premium-hover">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Online Orders</h1>
            <p className="text-teal-100 mt-1 opacity-90">Manage customer orders and fulfill shipments</p>
          </div>
        </div>
      </div>

      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search by customer name or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 outline-none shadow-sm font-medium text-sm"
            />
          </div>
          <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl w-full md:w-auto">
            {['all', 'pending', 'processing', 'shipped', 'delivered'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-teal-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="glass-card premium-shadow rounded-2xl border overflow-hidden">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-teal-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-widest">Order Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-teal-700 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-teal-700 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-gray-900">{order.order_number}</div>
                        <div className="text-xs text-gray-500 font-bold mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={order.shipping_address}>{order.shipping_address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-teal-600">₹{(parseFloat(order.total_amount) || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">{order.payment_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setPromptOpen(true)
                          }}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-black uppercase tracking-widest rounded-lg text-teal-700 bg-teal-100 hover:bg-teal-200 transition-colors"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-black text-gray-900">No orders found</h3>
              <p className="mt-2 text-gray-500 font-medium">There are no customer orders matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {promptOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-2">Update Order Status</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Order #{selectedOrder.order_number} for {selectedOrder.customer_name}</p>
            
            <div className="space-y-3">
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-bold uppercase tracking-widest text-sm ${
                    selectedOrder.status === s 
                      ? 'border-teal-500 bg-teal-50 text-teal-700' 
                      : 'border-gray-100 hover:border-teal-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setPromptOpen(false)
                setSelectedOrder(null)
              }}
              className="mt-6 w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
