import { useState, useEffect } from 'react'
import { AlertTriangle, Calendar, Package, Clock, CheckCircle, XCircle, Eye, RotateCcw, Trash2, X, AlertCircle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'

import { DEMO_EXPIRY } from '../../data/demoData'

const StockExpiry = () => {
  const { t } = useLanguage()
  const [expiryData, setExpiryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('daysUntilExpiry')

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const [returnModalItem, setReturnModalItem] = useState(null)
  const [returnQty, setReturnQty] = useState(1)
  const [returnReason, setReturnReason] = useState('Near Expiry / Expired')
  const [returnNotes, setReturnNotes] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)

  const [disposeModalItem, setDisposeModalItem] = useState(null)
  const [disposeQty, setDisposeQty] = useState(1)
  const [disposeReason, setDisposeReason] = useState('Expired Stock')
  const [disposeNotes, setDisposeNotes] = useState('')
  const [disposeSubmitting, setDisposeSubmitting] = useState(false)

  useEffect(() => {
    fetchExpiryData()
  }, [])

  const fetchExpiryData = async () => {
    try {
      const response = await api.get('/inventory/expiry')
      setExpiryData(response.data)
    } catch (error) {
      console.error('Error fetching expiry data:', error)
      toast.error('Failed to load expiry data. Using demo data.')
      setExpiryData(DEMO_EXPIRY)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = expiryData.filter(item => {
    if (filterStatus === 'all') return true
    return item.status === filterStatus
  }).sort((a, b) => {
    if (sortBy === 'daysUntilExpiry') {
      return a.daysUntilExpiry - b.daysUntilExpiry
    }
    if (sortBy === 'expiryDate') {
      return new Date(a.expiryDate) - new Date(b.expiryDate)
    }
    if (sortBy === 'totalValue') {
      return b.totalValue - a.totalValue
    }
    return 0
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          {t('expiredLabel')}
        </span>
      case 'critical':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('criticalLabel')}
        </span>
      case 'warning':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {t('warningLabel')}
        </span>
      case 'safe':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('safeLabel')}
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired':
        return 'border-red-200 bg-red-50'
      case 'critical':
        return 'border-orange-200 bg-orange-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'safe':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const summaryStats = {
    totalProducts: expiryData.length,
    expiredProducts: expiryData.filter(item => item.status === 'expired').length,
    criticalProducts: expiryData.filter(item => item.status === 'critical').length,
    warningProducts: expiryData.filter(item => item.status === 'warning').length,
    totalValue: expiryData.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0),
    atRiskValue: expiryData.filter(item => item.status === 'expired' || item.status === 'critical')
      .reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('stockExpiryMgmt')}</h1>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {t('generateReport')}
          </button>
          <button className="btn-primary flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('sendAlerts')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{t('totalProductsLabel')}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{summaryStats.totalProducts}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{t('expiredProductsLabel')}</p>
              <p className="text-3xl font-extrabold text-red-600 mt-1">{summaryStats.expiredProducts}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{t('criticalProductsLabel')}</p>
              <p className="text-3xl font-extrabold text-orange-600 mt-1">{summaryStats.criticalProducts}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{t('atRiskValueLabel')}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">₹{summaryStats.atRiskValue.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-2xl">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 glass-card premium-shadow p-6 rounded-2xl border">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm font-medium text-gray-700"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="expired">{t('expiredLabel')}</option>
          <option value="critical">{t('criticalLabel')}</option>
          <option value="warning">{t('warningLabel')}</option>
          <option value="safe">{t('safeLabel')}</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm font-medium text-gray-700"
        >
          <option value="daysUntilExpiry">{t('sortByDaysExpiry')}</option>
          <option value="expiryDate">{t('sortByExpiryDate')}</option>
          <option value="totalValue">{t('sortByTotalValue')}</option>
        </select>
      </div>

      {/* Expiry List */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <div key={item.id} className={`glass-card premium-shadow premium-hover p-6 rounded-2xl border transition-all duration-300 ${getStatusColor(item.status)}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                <p className="text-sm text-gray-600">{t('batchLabel')}: {item.batchNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600">{t('supplierLabel')}: {item.supplier || 'N/A'}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(item.status)}
                <p className="text-sm text-gray-600 mt-1">₹{(parseFloat(item.totalValue) || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                <span>{t('quantityLabel')}: {item.quantity}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span>{t('expiryLabel')}: {item.expiryDate || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className={item.daysUntilExpiry <= 0 ? 'text-red-600 font-medium' : item.daysUntilExpiry <= 7 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                  {item.daysUntilExpiry <= 0 ? t('expiredLabel') : `${item.daysUntilExpiry} ${t('daysLeft')}`}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span>{t('unitCost')}: ₹{(parseFloat(item.cost) || 0).toLocaleString()}/unit</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedProduct(item)}
                className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                {t('viewDetails')}
              </button>
              <button
                onClick={() => {
                  setReturnModalItem(item)
                  setReturnQty(Math.min(1, item.quantity))
                  setReturnReason('Near Expiry / Expired')
                  setReturnNotes('')
                }}
                className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors shadow-sm"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                {t('returnToSupplier')}
              </button>
              <button
                onClick={() => {
                  setDisposeModalItem(item)
                  setDisposeQty(Math.min(1, item.quantity))
                  setDisposeReason('Expired Stock')
                  setDisposeNotes('')
                }}
                className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t('dispose')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProductsFound')}</h3>
          <p className="text-gray-600">{t('adjustFilterCriteria')}</p>
        </div>
      )}

      {/* Expiry Guidelines */}
      <div className="glass-card premium-shadow p-8 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('expiryGuidelines')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Expired Products</h4>
                <p className="text-sm text-gray-600">Products past expiry date. Must be disposed of or returned to supplier immediately.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Critical (≤7 days)</h4>
                <p className="text-sm text-gray-600">Products expiring within 7 days. Prioritize sales or returns.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Warning (≤30 days)</h4>
                <p className="text-sm text-gray-600">Products expiring within 30 days. Monitor closely and plan sales.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900">Safe (&gt;30 days)</h4>
                <p className="text-sm text-gray-600">Products with more than 30 days until expiry. Normal operations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: View Details */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.productName}</h3>
                  {getStatusBadge(selectedProduct.status)}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{selectedProduct.type || 'Agricultural Input'}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('batchLabel')}</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedProduct.batchNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('supplierLabel')}</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedProduct.supplier || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('expiryLabel')}</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedProduct.expiryDate || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Remaining</span>
                  <p className={`font-semibold mt-0.5 ${selectedProduct.daysUntilExpiry <= 0 ? 'text-red-600' : selectedProduct.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-emerald-700'}`}>
                    {selectedProduct.daysUntilExpiry <= 0 ? 'Expired' : `${selectedProduct.daysUntilExpiry} days left`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border border-gray-100 p-3.5 rounded-xl text-center">
                <div className="bg-blue-50/50 p-2.5 rounded-lg">
                  <span className="text-xs text-blue-700 font-medium">In Stock</span>
                  <p className="text-lg font-bold text-blue-900 mt-0.5">{selectedProduct.quantity}</p>
                </div>
                <div className="bg-amber-50/50 p-2.5 rounded-lg">
                  <span className="text-xs text-amber-700 font-medium">Unit Cost</span>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">₹{(parseFloat(selectedProduct.cost) || 0).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-lg">
                  <span className="text-xs text-emerald-700 font-medium">Total Value</span>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">₹{(parseFloat(selectedProduct.totalValue) || 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</span>
                  <p className="text-gray-700 mt-1 text-xs leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {selectedProduct.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Return to Supplier */}
      {returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('returnToSupplier')}</h3>
                  <p className="text-xs text-gray-500">{returnModalItem.productName}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const qtyNum = parseInt(returnQty, 10)
                if (isNaN(qtyNum) || qtyNum <= 0) {
                  toast.error('Please enter a valid quantity greater than 0')
                  return
                }
                if (qtyNum > returnModalItem.quantity) {
                  toast.error(`Cannot return more than available stock (${returnModalItem.quantity})`)
                  return
                }
                setReturnSubmitting(true)
                try {
                  const res = await api.post('/inventory/return-to-supplier', {
                    productId: returnModalItem.id,
                    quantity: qtyNum,
                    reason: returnReason,
                    notes: returnNotes
                  })
                  toast.success(res.data.message || 'Stock returned to supplier successfully!')
                  setReturnModalItem(null)
                  fetchExpiryData()
                } catch (err) {
                  console.error('Error returning stock:', err)
                  toast.error(err.response?.data?.error || 'Failed to process return')
                } finally {
                  setReturnSubmitting(false)
                }
              }}
              className="py-4 space-y-4 text-sm"
            >
              <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-100 text-xs text-orange-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Target Supplier:</span>
                  <span className="font-bold">{returnModalItem.supplier || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Available in Stock:</span>
                  <span className="font-bold">{returnModalItem.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Unit Cost:</span>
                  <span className="font-bold">₹{(parseFloat(returnModalItem.cost) || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity to Return (Max: {returnModalItem.quantity}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={returnModalItem.quantity}
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Estimated credit value: <span className="font-semibold text-gray-800">₹{((parseFloat(returnModalItem.cost) || 0) * (parseInt(returnQty) || 0)).toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Return Reason *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  <option value="Near Expiry / Expired">Near Expiry / Expired</option>
                  <option value="Damaged Packaging">Damaged Packaging</option>
                  <option value="Quality Concern">Quality Concern</option>
                  <option value="Overstocked Batch">Overstocked Batch</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Remarks / Tracking Note (Optional)
                </label>
                <textarea
                  rows="2"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g., Return courier airway bill or supplier confirmation ref"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  disabled={returnSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
                >
                  {returnSubmitting ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispose Stock */}
      {disposeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('dispose')} Stock</h3>
                  <p className="text-xs text-gray-500">{disposeModalItem.productName}</p>
                </div>
              </div>
              <button
                onClick={() => setDisposeModalItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const qtyNum = parseInt(disposeQty, 10)
                if (isNaN(qtyNum) || qtyNum <= 0) {
                  toast.error('Please enter a valid quantity greater than 0')
                  return
                }
                if (qtyNum > disposeModalItem.quantity) {
                  toast.error(`Cannot dispose more than available stock (${disposeModalItem.quantity})`)
                  return
                }
                setDisposeSubmitting(true)
                try {
                  const res = await api.post('/inventory/dispose', {
                    productId: disposeModalItem.id,
                    quantity: qtyNum,
                    reason: disposeReason,
                    notes: disposeNotes
                  })
                  toast.success(res.data.message || 'Stock disposed successfully!')
                  setDisposeModalItem(null)
                  fetchExpiryData()
                } catch (err) {
                  console.error('Error disposing stock:', err)
                  toast.error(err.response?.data?.error || 'Failed to process disposal')
                } finally {
                  setDisposeSubmitting(false)
                }
              }}
              className="py-4 space-y-4 text-sm"
            >
              <div className="bg-red-50/60 p-3 rounded-xl border border-red-100 text-xs text-red-800 space-y-1">
                <div className="flex items-center text-red-700 font-semibold mb-1">
                  <AlertCircle className="h-4 w-4 mr-1 text-red-600 inline" />
                  Warning: Disposing stock writes off inventory.
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Stock:</span>
                  <span className="font-bold">{disposeModalItem.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Expiry Date:</span>
                  <span className="font-bold">{disposeModalItem.expiryDate || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity to Dispose (Max: {disposeModalItem.quantity}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={disposeModalItem.quantity}
                  value={disposeQty}
                  onChange={(e) => setDisposeQty(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-medium"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inventory write-off loss: <span className="font-semibold text-red-600">₹{((parseFloat(disposeModalItem.cost) || 0) * (parseInt(disposeQty) || 0)).toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Disposal Reason *
                </label>
                <select
                  value={disposeReason}
                  onChange={(e) => setDisposeReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                >
                  <option value="Expired Stock">Expired Stock (Safe Chemical Destruction)</option>
                  <option value="Contaminated / Compromised">Contaminated / Compromised</option>
                  <option value="Damaged / Leaking Packaging">Damaged / Leaking Packaging</option>
                  <option value="Regulatory Ban / Recall">Regulatory Ban / Recall</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Disposal Certificate / Waste Handling Note (Optional)
                </label>
                <textarea
                  rows="2"
                  value={disposeNotes}
                  onChange={(e) => setDisposeNotes(e.target.value)}
                  placeholder="e.g., Authorized hazardous waste disposal vendor receipt number"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDisposeModalItem(null)}
                  disabled={disposeSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disposeSubmitting}
                  className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-60"
                >
                  {disposeSubmitting ? 'Disposing...' : 'Confirm Disposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockExpiry
