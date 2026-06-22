import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Package, Truck, CheckCircle, Clock, Filter } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'
import { DEMO_ORDERS } from '../../data/demoData'

const OrderHistory = () => {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrderHistory()
  }, [])

  const fetchOrderHistory = async () => {
    try {
      const response = await api.get('/orders')
      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(t('failedToLoadOrderHistory') || 'Failed to load order history. Using demo data.')
      setOrders(DEMO_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  const toggleFilter = (status) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.items?.some(item => 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) || (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(order.status)
      
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const getStatusDisplay = (status, date) => {
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
    
    switch (status) {
      case 'delivered':
        return {
          icon: <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />,
          title: `Delivered on ${formattedDate}`,
          subtitle: 'Your item has been delivered'
        }
      case 'shipped':
        return {
          icon: <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />,
          title: `Expected by ${formattedDate}`,
          subtitle: 'Your item has been shipped'
        }
      case 'processing':
        return {
          icon: <div className="w-3 h-3 rounded-full bg-orange-500 mr-2" />,
          title: `Ordered on ${formattedDate}`,
          subtitle: 'Seller is processing your order'
        }
      default:
        return {
          icon: <div className="w-3 h-3 rounded-full bg-gray-500 mr-2" />,
          title: status.charAt(0).toUpperCase() + status.slice(1),
          subtitle: 'Order update available'
        }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="glass-card bg-white/80 backdrop-blur-md p-3 rounded-3xl shadow-xl shadow-gray-200/50 flex items-center border-2 border-white focus-within:border-primary-200 transition-all">
        <input 
          type="text" 
          placeholder="Search your orders here..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 outline-none text-sm font-medium bg-transparent"
        />
        <button className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-600/30">
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border-2 border-white">
            <h2 className="font-black text-lg mb-6 uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary-600" /> Filters
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Status</h3>
                <div className="space-y-3">
                  {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${statusFilter.includes(status) ? 'bg-primary-600 border-primary-600 shadow-md shadow-primary-600/30' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                        {statusFilter.includes(status) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleFilter(status)}
                        className="hidden"
                      />
                      <span className="text-sm font-bold text-gray-600 group-hover:text-primary-600 capitalize transition-colors">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="glass-card bg-white/80 backdrop-blur-md p-16 text-center rounded-[2.5rem] shadow-xl shadow-gray-200/50 border-2 border-white">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">No orders found</h3>
              <p className="text-gray-500 mt-2 font-medium">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const primaryItem = order.items && order.items.length > 0 ? order.items[0] : null
              const additionalItemsCount = order.items ? order.items.length - 1 : 0
              const statusInfo = getStatusDisplay(order.status, order.created_at)

              return (
                <div 
                  key={order.id} 
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="glass-card bg-white rounded-[2rem] p-5 shadow-xl shadow-gray-200/50 border-2 border-transparent hover:border-primary-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col md:flex-row gap-6 items-center group"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-28 h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 flex items-center justify-center rounded-3xl overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                     <Package className="w-12 h-12 text-gray-300 group-hover:text-primary-400 transition-colors" />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-2 mb-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-3 text-sm">
                             <div className="font-black text-gray-900 group-hover:text-primary-600 transition-colors truncate">{item.name}</div>
                             <div className="text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded text-[10px] flex-shrink-0">Qty: {item.quantity}</div>
                             <div className="text-gray-400 font-bold text-[10px] flex-shrink-0">₹{(item.price || 0).toFixed(0)} each</div>
                           </div>
                        ))
                      ) : (
                        <h3 className="text-lg text-gray-900 font-black truncate group-hover:text-primary-600 transition-colors leading-tight">
                          Order #{order.order_number}
                        </h3>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3 pt-3 border-t border-gray-100">Order ID: {order.order_number}</p>
                  </div>

                  {/* Price */}
                  <div className="w-28 flex-shrink-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <span className="text-2xl font-black text-primary-600">
                      ₹{(parseFloat(order.total_amount) || 0).toFixed(0)}
                    </span>
                  </div>

                  {/* Delivery Status */}
                  <div className="w-full md:w-64 flex-shrink-0 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center font-black text-sm text-gray-900 mb-1 tracking-tight">
                      {statusInfo.icon}
                      {statusInfo.title}
                    </div>
                    <p className="text-xs text-gray-500 ml-5 font-medium">{statusInfo.subtitle}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderHistory
