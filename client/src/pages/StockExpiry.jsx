import { useState } from 'react'
import { AlertTriangle, Calendar, Package, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'

const StockExpiry = () => {
  const [expiryData, setExpiryData] = useState([
    {
      id: 1,
      productName: 'NPK 20-20-20',
      batchNumber: 'NPK2024001',
      quantity: 25,
      expiryDate: '2024-02-15',
      daysUntilExpiry: 15,
      status: 'warning',
      supplier: 'AgroChem Industries',
      cost: 1200,
      totalValue: 30000
    },
    {
      id: 2,
      productName: 'Urea',
      batchNumber: 'UREA2024002',
      quantity: 15,
      expiryDate: '2024-01-25',
      daysUntilExpiry: 5,
      status: 'critical',
      supplier: 'GreenGrow Solutions',
      cost: 900,
      totalValue: 13500
    },
    {
      id: 3,
      productName: 'Organic Compost',
      batchNumber: 'ORG2024003',
      quantity: 30,
      expiryDate: '2024-03-10',
      daysUntilExpiry: 38,
      status: 'safe',
      supplier: 'EcoFarms Ltd',
      cost: 700,
      totalValue: 21000
    },
    {
      id: 4,
      productName: 'Pesticide A',
      batchNumber: 'PEST2024004',
      quantity: 10,
      expiryDate: '2024-01-20',
      daysUntilExpiry: 0,
      status: 'expired',
      supplier: 'AgroChem Industries',
      cost: 1500,
      totalValue: 15000
    }
  ])

  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('daysUntilExpiry')

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
          Expired
        </span>
      case 'critical':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </span>
      case 'warning':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Warning
        </span>
      case 'safe':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Safe
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
    totalValue: expiryData.reduce((sum, item) => sum + item.totalValue, 0),
    atRiskValue: expiryData.filter(item => item.status === 'expired' || item.status === 'critical')
      .reduce((sum, item) => sum + item.totalValue, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Stock Expiry Management</h1>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Generate Report
          </button>
          <button className="btn-primary flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Send Alerts
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired Products</p>
              <p className="text-2xl font-bold text-red-600">{summaryStats.expiredProducts}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Products</p>
              <p className="text-2xl font-bold text-orange-600">{summaryStats.criticalProducts}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{summaryStats.atRiskValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="safe">Safe</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="daysUntilExpiry">Sort by Days Until Expiry</option>
          <option value="expiryDate">Sort by Expiry Date</option>
          <option value="totalValue">Sort by Total Value</option>
        </select>
      </div>

      {/* Expiry List */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <div key={item.id} className={`bg-white p-6 rounded-lg shadow-sm border ${getStatusColor(item.status)}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                <p className="text-sm text-gray-600">Batch: {item.batchNumber}</p>
                <p className="text-sm text-gray-600">Supplier: {item.supplier}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(item.status)}
                <p className="text-sm text-gray-600 mt-1">₹{item.totalValue.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                <span>Quantity: {item.quantity}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span>Expiry: {item.expiryDate}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className={item.daysUntilExpiry <= 0 ? 'text-red-600 font-medium' : item.daysUntilExpiry <= 7 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                  {item.daysUntilExpiry <= 0 ? 'Expired' : `${item.daysUntilExpiry} days left`}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span>Cost: ₹{item.cost}/unit</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                View Details
              </button>
              <button className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100">
                Return to Supplier
              </button>
              <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">
                Dispose
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your filter criteria.</p>
        </div>
      )}

      {/* Expiry Guidelines */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expiry Management Guidelines</h3>
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
