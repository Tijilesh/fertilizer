import { useState, useEffect } from 'react'
import { Plus, Search, Building, Phone, Mail, Calendar, Package, DollarSign, RotateCcw, FileText, CheckCircle2, Clock, Trash2, Printer, Copy, Check } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import PromptModal from '../../components/common/PromptModal'

import { DEMO_SUPPLIERS, DEMO_PURCHASE_ORDERS } from '../../data/demoData'

const Purchases = () => {
  const { t } = useLanguage()
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [returnsSummary, setReturnsSummary] = useState({ total_claims: 0, total_deducted_amount: 0, approved_count: 0, pending_count: 0, settled_count: 0 })
  const [productsList, setProductsList] = useState([])
  const [shopSettings, setShopSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showNewReturn, setShowNewReturn] = useState(false)
  const [viewingDebitNote, setViewingDebitNote] = useState(null)
  const [filterReason, setFilterReason] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [copiedDn, setCopiedDn] = useState('')
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', credit_limit: 0 })
  const [newOrder, setNewOrder] = useState({ supplier_id: '', order_date: new Date().toISOString().split('T')[0], delivery_date: '', total_amount: 0, items: [] })
  const [newReturn, setNewReturn] = useState({
    supplier_id: '',
    supplier_name: '',
    product_id: '',
    quantity: 1,
    unit_price: 0,
    reason: 'Defective Batch',
    settlement_type: 'Debit Note / Balance Deduction',
    status: 'Approved',
    notes: '',
    return_date: new Date().toISOString().split('T')[0]
  })
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptDefault, setPromptDefault] = useState('')
  const [promptHandler, setPromptHandler] = useState(() => {})

  const [editingSupplier, setEditingSupplier] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddSupplier = async (e) => {
    e.preventDefault()
    try {
      await api.post('/suppliers', newSupplier)
      toast.success(t('supplierAddedSuccess') || 'Supplier added successfully')
      setShowAddSupplier(false)
      setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '', credit_limit: 0, current_balance: 0 })
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

  const handleEditSupplier = (supplier) => {
    setEditingSupplier({
      ...supplier,
      credit_limit: supplier.credit_limit ?? 0,
      current_balance: supplier.current_balance ?? 0
    })
  }

  const handleSaveSupplierEdit = async (e) => {
    e.preventDefault()
    if (!editingSupplier) return
    try {
      await api.put(`/suppliers/${editingSupplier.id}`, editingSupplier)
      toast.success('Supplier updated successfully')
      setEditingSupplier(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update supplier')
    }
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
      const [suppliersRes, ordersRes, returnsRes, productsRes, settingsRes] = await Promise.allSettled([
        api.get('/suppliers'),
        api.get('/purchase-orders'),
        api.get('/supplier-returns'),
        api.get('/products'),
        api.get('/settings')
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

      if (returnsRes.status === 'fulfilled' && returnsRes.value.data) {
        setReturns(returnsRes.value.data.returns || [])
        setReturnsSummary(returnsRes.value.data.summary || { total_claims: 0, total_deducted_amount: 0, approved_count: 0, pending_count: 0, settled_count: 0 })
      }

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)) {
        setProductsList(productsRes.value.data)
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        setShopSettings(settingsRes.value.data)
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error)
      setSuppliers(DEMO_SUPPLIERS)
      setPurchaseOrders(DEMO_PURCHASE_ORDERS)
      toast.error(t('failedToFetchData') || 'Failed to fetch data. Using demo data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReturn = async (e) => {
    e.preventDefault()
    if (!newReturn.product_id) {
      toast.error('Please select a product to return')
      return
    }
    const qty = parseInt(newReturn.quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0')
      return
    }

    const selectedProd = productsList.find(p => p.id === parseInt(newReturn.product_id, 10))
    if (selectedProd && qty > selectedProd.quantity) {
      toast.error(`Cannot return ${qty} units. Only ${selectedProd.quantity} available in stock.`)
      return
    }

    try {
      const res = await api.post('/supplier-returns', newReturn)
      toast.success(res.data.message || `Debit Note ${res.data.debitNoteNo} generated!`)
      setShowNewReturn(false)
      setNewReturn({
        supplier_id: '',
        supplier_name: '',
        product_id: '',
        quantity: 1,
        unit_price: 0,
        reason: 'Defective Batch',
        settlement_type: 'Debit Note / Balance Deduction',
        status: 'Approved',
        notes: '',
        return_date: new Date().toISOString().split('T')[0]
      })
      fetchData()
    } catch (error) {
      console.error('Error creating supplier return:', error)
      toast.error(error.response?.data?.error || 'Failed to create return claim')
    }
  }

  const handleProductSelect = (productId) => {
    const prod = productsList.find(p => p.id === parseInt(productId, 10))
    if (prod) {
      let suppId = ''
      if (prod.supplier) {
        const foundSupp = suppliers.find(s => s.name?.toLowerCase() === prod.supplier?.toLowerCase())
        if (foundSupp) suppId = foundSupp.id
      }
      setNewReturn(prev => ({
        ...prev,
        product_id: prod.id,
        unit_price: parseFloat(prod.price) || 0,
        supplier_name: prod.supplier || '',
        supplier_id: suppId || prev.supplier_id
      }))
    } else {
      setNewReturn(prev => ({ ...prev, product_id: '' }))
    }
  }

  const handleUpdateReturnStatus = async (item, newStatus) => {
    try {
      await api.put(`/supplier-returns/${item.id}/status`, { status: newStatus })
      toast.success(`Claim status updated to "${newStatus}"`)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status')
    }
  }

  const handleDeleteReturn = async (item) => {
    if (!window.confirm(`Delete return claim ${item.debit_note_no}? This will restore the deducted product quantity.`)) return
    try {
      await api.delete(`/supplier-returns/${item.id}?restore=true`)
      toast.success('Return claim deleted and stock restored')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete return claim')
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

  const filteredReturns = returns.filter(item => {
    const matchesSearch =
      (item.debit_note_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesReason = filterReason === 'all' || item.reason === filterReason
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus

    return matchesSearch && matchesReason && matchesStatus
  })

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
          onClick={() => {
            if (activeTab === 'suppliers') setShowAddSupplier(true)
            else if (activeTab === 'orders') setShowNewOrder(true)
            else setShowNewReturn(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'suppliers' ? t('addSupplier') : activeTab === 'orders' ? t('newPurchaseOrder') : 'New Return / Debit Note'}
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
          <button
            onClick={() => setActiveTab('returns')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${activeTab === 'returns'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns &amp; Debit Notes</span>
            {returns.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                {returns.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder={activeTab === 'suppliers' ? t('searchSuppliersPlaceholder') : activeTab === 'orders' ? t('searchOrdersPlaceholder') : 'Search returns by Debit Note #, Product, Supplier or Batch...'}
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
                    onClick={() => {
                      setNewReturn(prev => ({
                        ...prev,
                        supplier_id: supplier.id,
                        supplier_name: supplier.name,
                        product_id: '',
                        quantity: 1,
                        unit_price: 0,
                        reason: 'Defective Batch',
                        settlement_type: 'Debit Note / Balance Deduction',
                        status: 'Approved',
                        notes: '',
                        return_date: new Date().toISOString().split('T')[0]
                      }))
                      setShowNewReturn(true)
                    }}
                    className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 flex items-center justify-center gap-1"
                    title="Issue Debit Note for this supplier"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Debit Note</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. SUPPLIER RETURNS & DEBIT NOTES TAB */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card premium-shadow p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Claims</p>
                <h4 className="text-2xl font-black text-gray-900">{returnsSummary.total_claims || 0}</h4>
                <p className="text-[11px] text-gray-400">Recorded Returns</p>
              </div>
            </div>

            <div className="glass-card premium-shadow p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Debited Value</p>
                <h4 className="text-2xl font-black text-red-600">₹{parseFloat(returnsSummary.total_deducted_amount || 0).toLocaleString()}</h4>
                <p className="text-[11px] text-emerald-600 font-medium">Deducted from supplier payables</p>
              </div>
            </div>

            <div className="glass-card premium-shadow p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved &amp; Adjusted</p>
                <h4 className="text-2xl font-black text-emerald-700">{(returnsSummary.approved_count || 0) + (returnsSummary.settled_count || 0)}</h4>
                <p className="text-[11px] text-gray-400">Balance auto-credited</p>
              </div>
            </div>

            <div className="glass-card premium-shadow p-5 rounded-2xl bg-white border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approval</p>
                <h4 className="text-2xl font-black text-amber-600">{returnsSummary.pending_count || 0}</h4>
                <p className="text-[11px] text-gray-400">Awaiting manufacturer credit</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter:</span>
              <select
                value={filterReason}
                onChange={e => setFilterReason(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Reasons</option>
                <option value="Defective Batch">Defective Batch</option>
                <option value="Damaged Packaging">Damaged Packaging</option>
                <option value="Expired / Near Expiry">Expired / Near Expiry</option>
                <option value="Quality Mismatch">Quality Mismatch</option>
                <option value="Recalled by Manufacturer">Recalled by Manufacturer</option>
                <option value="Overstock Return">Overstock Return</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Settled / Adjusted">Settled / Adjusted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="text-xs text-gray-500">
              Showing <span className="font-bold text-gray-900">{filteredReturns.length}</span> claim{filteredReturns.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Debit Note #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Product &amp; Batch</th>
                    <th className="py-3.5 px-4 text-center">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Debit Value (₹)</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReturns.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{item.debit_note_no}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.debit_note_no)
                              setCopiedDn(item.debit_note_no)
                              toast.success('Debit Note No. copied')
                              setTimeout(() => setCopiedDn(''), 2000)
                            }}
                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                            title="Copy Debit Note No"
                          >
                            {copiedDn === item.debit_note_no ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {item.return_date ? new Date(item.return_date).toLocaleDateString() : new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900 text-sm">{item.supplier_name}</p>
                        {item.supplier_phone && <p className="text-xs text-gray-500">{item.supplier_phone}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900">{item.product_name}</p>
                        {item.batch_number && (
                          <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono rounded">
                            Batch: {item.batch_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                        {item.quantity} units
                        <p className="text-[11px] font-normal text-gray-500">@ ₹{parseFloat(item.unit_price).toFixed(2)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-black text-sm text-red-600 font-mono">
                          -₹{parseFloat(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[10px] text-emerald-600 font-medium">Balance Deducted</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          item.reason === 'Defective Batch'
                            ? 'bg-red-100 text-red-700'
                            : item.reason === 'Expired / Near Expiry'
                            ? 'bg-amber-100 text-amber-800'
                            : item.reason === 'Damaged Packaging'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={item.status}
                          onChange={e => handleUpdateReturnStatus(item, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                            item.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'Settled / Adjusted'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : item.status === 'Pending Approval'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="Approved">Approved</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Settled / Adjusted">Settled / Adjusted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingDebitNote(item)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title="View &amp; Print Debit Note Memorandum"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Debit Note</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReturn(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete claim &amp; restore stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-gray-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <RotateCcw className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="font-semibold text-gray-700">No Supplier Returns or Claims Found</p>
                          <p className="text-xs text-gray-500">Record a defective batch or expiry return to auto-issue a Debit Note and adjust supplier balance.</p>
                          <button
                            onClick={() => setShowNewReturn(true)}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                          >
                            + Issue Debit Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('addSupplier') || 'Add New Supplier'}</h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('supplierName') || 'Supplier Name'} *</label>
                <input
                  type="text"
                  placeholder="e.g. IFFCO, Coromandel"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('contactPerson') || 'Contact Person'}</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newSupplier.contact_person}
                    onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('phone') || 'Phone'}</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('email') || 'Email'}</label>
                <input
                  type="email"
                  placeholder="e.g. supplier@example.com"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={newSupplier.email}
                  onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('address') || 'Address'}</label>
                <textarea
                  placeholder="e.g. Industrial Area, Plot 42"
                  rows="2"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('creditLimit') || 'Credit Limit (₹)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newSupplier.credit_limit}
                    onChange={e => setNewSupplier({ ...newSupplier, credit_limit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('currentBalanceLabel') || 'Credit / Outstanding Balance (₹)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newSupplier.current_balance || ''}
                    onChange={e => setNewSupplier({ ...newSupplier, current_balance: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowAddSupplier(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">{t('cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Supplier Details</h2>
            <form onSubmit={handleSaveSupplierEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('supplierName') || 'Supplier Name'} *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={editingSupplier.name || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('contactPerson') || 'Contact Person'}</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={editingSupplier.contact_person || ''}
                    onChange={e => setEditingSupplier({ ...editingSupplier, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('phone') || 'Phone'}</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={editingSupplier.phone || ''}
                    onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('email') || 'Email'}</label>
                <input
                  type="email"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={editingSupplier.email || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('address') || 'Address'}</label>
                <textarea
                  rows="2"
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={editingSupplier.address || ''}
                  onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('creditLimit') || 'Credit Limit (₹)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={editingSupplier.credit_limit}
                    onChange={e => setEditingSupplier({ ...editingSupplier, credit_limit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{t('currentBalanceLabel') || 'Credit / Outstanding Balance (₹)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={editingSupplier.current_balance}
                    onChange={e => setEditingSupplier({ ...editingSupplier, current_balance: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('statusLabel') || 'Status'}</label>
                <select
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  value={editingSupplier.status || 'active'}
                  onChange={e => setEditingSupplier({ ...editingSupplier, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingSupplier(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">{t('cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow">{t('save')}</button>
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

      {showNewReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-200 my-8">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  New Return &amp; Debit Note Claim
                </h2>
                <p className="text-xs text-gray-500">Record defective or expired stock to issue an official Debit Note</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewReturn(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Product To Return *
                </label>
                <select
                  value={newReturn.product_id}
                  onChange={e => handleProductSelect(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Choose Product from Inventory --</option>
                  {productsList.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.type}) — Stock: {prod.quantity} | ₹{parseFloat(prod.price).toFixed(2)} {prod.supplier ? `[${prod.supplier}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Target Supplier / Manufacturer *
                </label>
                <select
                  value={newReturn.supplier_id}
                  onChange={e => {
                    const supp = suppliers.find(s => s.id === parseInt(e.target.value, 10))
                    setNewReturn({
                      ...newReturn,
                      supplier_id: e.target.value,
                      supplier_name: supp ? supp.name : ''
                    })
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Choose Supplier to Debit --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Current Payable: ₹{parseFloat(s.current_balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Return Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newReturn.quantity}
                    onChange={e => setNewReturn({ ...newReturn, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Rate / Unit (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newReturn.unit_price}
                    onChange={e => setNewReturn({ ...newReturn, unit_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex justify-between items-center text-sm">
                <span className="font-semibold text-red-800">Total Debit Note Amount:</span>
                <span className="text-xl font-black text-red-600 font-mono">
                  ₹{((parseInt(newReturn.quantity, 10) || 0) * (parseFloat(newReturn.unit_price) || 0)).toFixed(2)}
                </span>
              </div>

              {/* Reason & Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Return Reason *
                  </label>
                  <select
                    value={newReturn.reason}
                    onChange={e => setNewReturn({ ...newReturn, reason: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Defective Batch">Defective Batch</option>
                    <option value="Damaged Packaging">Damaged Packaging</option>
                    <option value="Expired / Near Expiry">Expired / Near Expiry</option>
                    <option value="Quality Mismatch">Quality Mismatch</option>
                    <option value="Recalled by Manufacturer">Recalled by Manufacturer</option>
                    <option value="Overstock Return">Overstock Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Settlement Method *
                  </label>
                  <select
                    value={newReturn.settlement_type}
                    onChange={e => setNewReturn({ ...newReturn, settlement_type: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Debit Note / Balance Deduction">Debit Note / Balance Deduction</option>
                    <option value="Replacement Stock">Replacement Stock</option>
                    <option value="Bank Refund">Bank Refund</option>
                  </select>
                </div>
              </div>

              {/* Date & Initial Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newReturn.return_date}
                    onChange={e => setNewReturn({ ...newReturn, return_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Claim Status
                  </label>
                  <select
                    value={newReturn.status}
                    onChange={e => setNewReturn({ ...newReturn, status: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Approved">Approved (Auto-Deduct Balance)</option>
                    <option value="Pending Approval">Pending Approval</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Defect Description &amp; Observations
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Broken seal, hardened granules, lot inspection report..."
                  value={newReturn.notes}
                  onChange={e => setNewReturn({ ...newReturn, notes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                ></textarea>
              </div>

              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-200 italic">
                * Note: Submitting this claim will automatically deduct {newReturn.quantity || 0} unit(s) from shop stock and reduce the supplier&apos;s payable balance via Debit Note.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewReturn(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Debit Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PRINTABLE DEBIT NOTE MEMORANDUM MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewingDebitNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 my-8">
            <div className="flex justify-between items-center no-print border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Commercial Debit Note Memo
                </h3>
                <p className="text-xs text-gray-500 font-mono">{viewingDebitNote.debit_note_no}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Memo</span>
                </button>
                <button
                  onClick={() => setViewingDebitNote(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="printable-debit-note border-2 border-gray-800 p-6 sm:p-8 rounded-2xl bg-white text-gray-900 text-sm space-y-6">
              {/* Shop Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-bold text-xs uppercase tracking-widest rounded">
                    Official Debit Note
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1">{shopSettings.shop_name || 'Kisan Agro & Fertilizer Center'}</h2>
                  <p className="text-xs text-gray-600">{shopSettings.shop_address || 'Main Mandi Road, Station Chowk'}</p>
                  <p className="text-xs text-gray-600">Phone: {shopSettings.shop_phone || '+91 98765 43210'}</p>
                </div>
                <div className="text-right text-xs font-mono space-y-1">
                  <p><span className="text-gray-500">GSTIN:</span> <span className="font-bold">{shopSettings.shop_gstin || '09AAACK1234M1Z5'}</span></p>
                  <p><span className="text-gray-500">FERT LIC:</span> <span className="font-bold">{shopSettings.shop_license || 'FERT/DL/2024/481'}</span></p>
                  <p className="text-emerald-700 font-bold font-sans pt-1">Authorized Fertilizer Dealer</p>
                </div>
              </div>

              {/* Debit Note Metadata Box */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <p className="text-gray-500 uppercase font-bold tracking-wider mb-1">Debited To (Supplier / Distributor):</p>
                  <p className="text-sm font-bold text-gray-900">{viewingDebitNote.supplier_name}</p>
                  <p className="text-gray-600">{viewingDebitNote.supplier_address || 'Direct Distributor / Wholesaler'}</p>
                  {viewingDebitNote.supplier_phone && <p className="text-gray-600">Ph: {viewingDebitNote.supplier_phone}</p>}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-gray-500 uppercase font-bold tracking-wider mb-1">Debit Memo Details:</p>
                  <p><span className="text-gray-500">Debit Note No:</span> <span className="font-mono font-bold text-emerald-700 text-sm">{viewingDebitNote.debit_note_no}</span></p>
                  <p><span className="text-gray-500">Date:</span> <span className="font-semibold">{new Date(viewingDebitNote.return_date || viewingDebitNote.created_at).toLocaleDateString()}</span></p>
                  <p><span className="text-gray-500">Settlement:</span> <span className="font-bold">{viewingDebitNote.settlement_type}</span></p>
                  <p><span className="text-gray-500">Claim Status:</span> <span className="font-bold text-emerald-700">{viewingDebitNote.status}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 uppercase tracking-wider text-gray-700">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Product Description</th>
                    <th className="py-2 px-3">Batch Number</th>
                    <th className="py-2 px-3 text-center">Returned Qty</th>
                    <th className="py-2 px-3 text-right">Rate (₹)</th>
                    <th className="py-2 px-3 text-right">Debited Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 px-3 text-gray-500">1</td>
                    <td className="py-3 px-3 font-bold text-gray-900">{viewingDebitNote.product_name}</td>
                    <td className="py-3 px-3 font-mono text-gray-600">{viewingDebitNote.batch_number || 'N/A'}</td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{viewingDebitNote.quantity}</td>
                    <td className="py-3 px-3 text-right">{(parseFloat(viewingDebitNote.unit_price) || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-black text-gray-900">{(parseFloat(viewingDebitNote.total_amount) || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800 bg-gray-50 font-bold">
                    <td colSpan="5" className="py-2.5 px-3 text-right text-gray-800 uppercase text-xs">Total Debit Amount Credited:</td>
                    <td className="py-2.5 px-3 text-right font-black text-sm text-red-600 font-mono">
                      ₹{parseFloat(viewingDebitNote.total_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Return Reason & Ledger Adjustment Clause */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1.5 text-gray-800">
                <div className="flex gap-2">
                  <span className="font-bold text-amber-900">Return Reason:</span>
                  <span className="font-semibold text-red-700">{viewingDebitNote.reason}</span>
                </div>
                {viewingDebitNote.notes && (
                  <div className="flex gap-2 text-gray-600">
                    <span className="font-bold">Observations / Remarks:</span>
                    <span>{viewingDebitNote.notes}</span>
                  </div>
                )}
                <p className="text-[11px] text-gray-600 pt-1 border-t border-amber-200/60 italic">
                  * Notice of Account Adjustment: Please take note that ₹{parseFloat(viewingDebitNote.total_amount || 0).toFixed(2)} has been debited against our outstanding accounts payable ledger balance for the damaged/defective agrochemical batch listed above.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 text-center text-xs">
                <div>
                  <div className="w-44 border-b border-gray-400 mx-auto mb-2"></div>
                  <p className="font-bold text-gray-800">Received By (Supplier / Transporter)</p>
                  <p className="text-[10px] text-gray-500">Representative Signature &amp; Date</p>
                </div>
                <div>
                  <div className="w-44 border-b border-gray-400 mx-auto mb-2"></div>
                  <p className="font-bold text-gray-900">For {shopSettings.shop_name || 'Kisan Agro'}</p>
                  <p className="text-[10px] text-gray-500">Authorized Signatory &amp; Shop Seal</p>
                </div>
              </div>
            </div>
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
