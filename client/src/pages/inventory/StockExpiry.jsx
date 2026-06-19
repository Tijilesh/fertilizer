import { useState, useEffect } from 'react'
import { AlertTriangle, Calendar, Package, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
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

            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                {t('viewDetails')}
              </button>
              <button className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100">
                {t('returnToSupplier')}
              </button>
              <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">
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
    </div>
  )
}

export default StockExpiry
