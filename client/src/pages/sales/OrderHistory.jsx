import { useState, useEffect } from 'react'
import { Package, Calendar, DollarSign, Truck, CheckCircle, Clock } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

import { DEMO_ORDERS } from '../../data/demoData'

const OrderHistory = () => {
  const { t } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrderHistory()
  }, [])

  const fetchOrderHistory = async () => {
    try {
      const response = await api.get('/orders')
      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError(null) // Clear error since we have demo data
      toast.error(t('failedToLoadOrderHistory') || 'Failed to load order history. Using demo data.')
      setOrders(DEMO_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'processing':
        return <Clock className="w-5 h-5 text-orange-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('orderHistory')}</h1>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('orderHistory')}</h1>
        <div className="text-sm text-gray-500">
          {orders.length} {t('ordersFound') || 'orders found'}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noOrdersYet')}</h3>
          <p className="mt-2 text-gray-600">{t('noOrdersYetDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="glass-card premium-shadow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className="font-medium text-gray-900">{t('orderLabel') || 'Order'} {order.order_number}</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{(parseFloat(order.total_amount) || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('itemsOrderedLabel')}</h4>
                <div className="space-y-3">
                  {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name || t('unknownProduct')}</p>
                          <p className="text-sm text-gray-500">{t('quantityLabel')}: {item.quantity || 0}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{(parseFloat(item.totalPrice) || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">₹{(parseFloat(item.price) || 0).toFixed(2)} {t('each') || 'each'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {t('orderHelp')} <button className="text-primary-600 hover:text-primary-800 font-medium">{t('contactSupport')}</button>
                  </div>
                  <div className="flex space-x-3">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      {t('viewDetails')}
                    </button>
                    {order.status === 'delivered' && (
                      <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                        {t('reorder')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
