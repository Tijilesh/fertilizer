import { useState, useEffect } from 'react'
import { Plus, Search, Building, Phone, Mail, Calendar, Package, DollarSign } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import PromptModal from '../../components/common/PromptModal'

import { DEMO_SUPPLIERS, DEMO_PURCHASE_ORDERS } from '../../data/demoData'

const Purchases = () => {
  const { t } = useLanguage()
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', credit_limit: 0 })
  const [newOrder, setNewOrder] = useState({ supplier_id: '', order_date: new Date().toISOString().split('T')[0], delivery_date: '', total_amount: 0, items: [] })
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptDefault, setPromptDefault] = useState('')
  const [promptHandler, setPromptHandler] = useState(() => {})

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSupplier = async (e) => {
    e.preventDefault()
    try {
      await api.post('/suppliers', newSupplier)
      toast.success(t('supplierAddedSuccess') || 'Supplier added successfully')
      setShowAddSupplier(false)
      fetchData()
    } catch (error) {
      toast.error(t('failedToAddSupplier') || 'Failed to add supplier')
    }
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    try {
      await api.post('/purchase-orders', newOrder)
      toast.success(t('orderCreatedSuccess') || 'Order created successfully')
      setShowNewOrder(false)
      fetchData()
    } catch (error) {
      toast.error(t('failedToCreateOrder') || 'Failed to create order')
    }
  }

  const handleEditSupplier = async (supplier) => {
    setPromptDefault(supplier.name)
    setPromptHandler(() => async (val) => {
      if (!val) return
      try {
        await api.put(`/suppliers/${supplier.id}`, { ...supplier, name: val })
        toast.success('Supplier updated successfully')
        fetchData()
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update supplier')
      } finally {
        setPromptOpen(false)
      }
    })
    setPromptOpen(true)
  }

  const handleDeleteSupplier = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return
    try {
      await api.delete(`/suppliers/${supplier.id}`)
      toast.success('Supplier deleted successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete supplier')
    }
  }

  const handleUpdateOrderStatus = async (order) => {
    setPromptDefault(order.status || 'pending')
    setPromptHandler(() => async (val) => {
      if (!val) return
      try {
        await api.put(`/purchase-orders/${order.id}`, { status: val })
        toast.success('Order updated successfully')
        fetchData()
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update order')
      } finally {
        setPromptOpen(false)
      }
    })
    setPromptOpen(true)
  }

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Delete purchase order #${order.id}?`)) return
    try {
      await api.delete(`/purchase-orders/${order.id}`)
      toast.success('Order deleted successfully')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete order')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [suppliersRes, ordersRes] = await Promise.allSettled([
        api.get('/suppliers'),
        api.get('/purchase-orders')
      ])

      setSuppliers(
        suppliersRes.status === 'fulfilled' && Array.isArray(suppliersRes.value.data)
          ? suppliersRes.value.data
          : (DEMO_SUPPLIERS || [])
      )

      setPurchaseOrders(
        ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : (DEMO_PURCHASE_ORDERS || [])
      )
    } catch (error) {
      console.error('Error fetching purchase data:', error)
      setSuppliers(DEMO_SUPPLIERS)
      setPurchaseOrders(DEMO_PURCHASE_ORDERS)
      toast.error(t('failedToFetchData') || 'Failed to fetch data. Using demo data.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrders = purchaseOrders.filter(order =>
    (order.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pending</span>
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Delivered</span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('purchaseManagement')}</h1>
        <button
          onClick={() => activeTab === 'suppliers' ? setShowAddSupplier(true) : setShowNewOrder(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'suppliers' ? t('addSupplier') : t('newPurchaseOrder')}
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'suppliers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {t('suppliers')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {t('purchaseOrders')}
          </button>
        </nav>
      </div>

      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder={activeTab === 'suppliers' ? t('searchSuppliersPlaceholder') : t('searchOrdersPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm"
          />
        </div>
      </div>

      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="glass-card premium-shadow premium-hover p-6 rounded-2xl border transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                </div>
                <Building className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {supplier.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {supplier.email}
                </div>
                <div className="text-sm text-gray-600">
                  {supplier.address}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('creditLimitLabel')}</span>
                  <span className="font-medium">₹{parseFloat(supplier.credit_limit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('currentBalanceLabel')}:</span>
                  <span className={`font-medium ${parseFloat(supplier.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{parseFloat(supplier.current_balance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('statusLabel') || 'Status'}:</span>
                  <span className="font-medium capitalize">{supplier.status}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditSupplier(supplier)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredSuppliers.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              {t('noSuppliersFound') || 'No suppliers found'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass-card premium-shadow p-6 rounded-2xl border transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('orderNumberLabel') || 'Order #'} {order.id}</h3>
                  <p className="text-sm text-gray-600">{order.supplier_name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">₹{parseFloat(order.total_amount || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{(order.items || []).length} {t('items')}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{t('orderDateLabel')} {new Date(order.order_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>{t('deliveryDateLabel')} {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{t('totalLabel')} ₹{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('orderItems')}</h4>
                <div className="space-y-2">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product_name} (x{item.quantity})</span>
                      <span>₹{parseFloat(item.total_price || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(order)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              {t('noOrdersFound') || 'No purchase orders found'}
            </div>
          )}
        </div>
      )}

      {showAddSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('addSupplier') || 'Add New Supplier'}</h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <input
                type="text"
                placeholder={t('supplierName') || 'Supplier Name'}
                className="w-full p-2 border rounded"
                value={newSupplier.name}
                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder={t('contactPerson') || 'Contact Person'}
                className="w-full p-2 border rounded"
                value={newSupplier.contact_person}
                onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
              />
              <input
                type="text"
                placeholder={t('phone') || 'Phone'}
                className="w-full p-2 border rounded"
                value={newSupplier.phone}
                onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
              />
              <input
                type="email"
                placeholder={t('email') || 'Email'}
                className="w-full p-2 border rounded"
                value={newSupplier.email}
                onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
              />
              <textarea
                placeholder={t('address') || 'Address'}
                className="w-full p-2 border rounded"
                value={newSupplier.address}
                onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
              ></textarea>
              <input
                type="number"
                placeholder={t('creditLimit') || 'Credit Limit'}
                className="w-full p-2 border rounded"
                value={newSupplier.credit_limit}
                onChange={e => setNewSupplier({ ...newSupplier, credit_limit: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowAddSupplier(false)} className="px-4 py-2 text-gray-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{t('newPurchaseOrder')}</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <select
                className="w-full p-2 border rounded"
                value={newOrder.supplier_id}
                onChange={e => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                required
              >
                <option value="">{t('selectSupplier') || 'Select Supplier'}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={newOrder.order_date}
                  onChange={e => setNewOrder({ ...newOrder, order_date: e.target.value })}
                  required
                />
                <input
                  type="date"
                  placeholder={t('deliveryDate') || 'Delivery Date'}
                  className="w-full p-2 border rounded"
                  value={newOrder.delivery_date}
                  onChange={e => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
                />
              </div>

              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-bold mb-2">{t('addItems') || 'Add Items'}</h3>
                <div className="flex space-x-2 mb-2">
                  <input type="text" id="itemName" placeholder={t('itemName') || 'Item Name'} className="flex-1 p-2 border rounded" />
                  <input type="number" id="itemQty" placeholder={t('quantity') || 'Qty'} className="w-20 p-2 border rounded" />
                  <input type="number" id="itemPrice" placeholder={t('price') || 'Price'} className="w-24 p-2 border rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      const name = document.getElementById('itemName').value
                      const qty = parseInt(document.getElementById('itemQty').value)
                      const price = parseFloat(document.getElementById('itemPrice').value)
                      if (name && qty && price) {
                        const newItem = { product_name: name, quantity: qty, price_per_unit: price, total_price: qty * price }
                        setNewOrder({
                          ...newOrder,
                          items: [...newOrder.items, newItem],
                          total_amount: newOrder.total_amount + (qty * price)
                        })
                        document.getElementById('itemName').value = ''
                        document.getElementById('itemQty').value = ''
                        document.getElementById('itemPrice').value = ''
                      }
                    }}
                    className="p-2 bg-green-600 text-white rounded"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-32 overflow-auto">
                  {newOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b">
                      <span>{item.product_name} (x{item.quantity})</span>
                      <span>₹{item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right font-bold">
                  {t('total')}: ₹{newOrder.total_amount.toLocaleString()}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowNewOrder(false)} className="px-4 py-2 text-gray-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">{t('createOrder') || 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PromptModal
        open={promptOpen}
        title={'Enter value'}
        defaultValue={promptDefault}
        placeholder={''}
        onCancel={() => setPromptOpen(false)}
        onConfirm={(val) => { if (typeof promptHandler === 'function') promptHandler(val) }}
      />
    </div>
  )
}

export default Purchases
