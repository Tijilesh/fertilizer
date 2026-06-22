import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle, Clock } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status, date) => {
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
    
    switch (status) {
      case 'delivered':
        return { icon: <CheckCircle className="w-8 h-8 text-green-500" />, text: 'Delivered', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
      case 'shipped':
        return { icon: <Truck className="w-8 h-8 text-blue-500" />, text: 'Shipped', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
      case 'processing':
        return { icon: <Clock className="w-8 h-8 text-orange-500" />, text: 'Processing', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
      case 'cancelled':
        return { icon: <Clock className="w-8 h-8 text-red-500" />, text: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
      default:
        return { icon: <Package className="w-8 h-8 text-gray-500" />, text: status || 'Pending', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900">Order not found</h2>
        <button onClick={() => navigate('/orders')} className="mt-6 text-primary-600 font-bold hover:underline">
          Return to Order History
        </button>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status, order.created_at)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors font-bold text-sm mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      {/* Header section */}
      <div className="glass-card bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Details</h1>
          <p className="text-gray-500 mt-1 font-medium">Order #{order.order_number}</p>
          <p className="text-sm text-gray-400 font-bold mt-2">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${statusInfo.bg} ${statusInfo.border}`}>
          {statusInfo.icon}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
            <p className={`font-black text-lg ${statusInfo.color}`}>{statusInfo.text}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-600" /> Items in this Order
            </h2>
            
            <div className="space-y-6">
              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary-100 transition-colors">
                  <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-black text-gray-900 text-lg truncate">{item.product_name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">₹{parseFloat(item.price_per_unit || 0).toFixed(2)} each</p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="font-black text-primary-600 text-lg">₹{parseFloat(item.total_price || 0).toFixed(2)}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-bold">Subtotal</span>
                <span className="font-black text-gray-900">₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-bold">Shipping</span>
                <span className="font-black text-green-600">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-lg font-black text-gray-900">Total Amount</span>
                <span className="text-3xl font-black text-primary-600">₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="space-y-6">
          <div className="glass-card bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" /> Shipping Address
            </h3>
            {order.shipping_address ? (
              <p className="text-gray-600 font-medium leading-relaxed">{order.shipping_address}</p>
            ) : (
              <p className="text-gray-400 italic">No shipping address provided</p>
            )}
          </div>

          <div className="glass-card bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" /> Payment Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Method</p>
                <p className="font-bold text-gray-800 uppercase">{order.payment_method || 'COD'}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
