import { useState, useEffect } from 'react'
import { BarChart3, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

import { DEMO_PRODUCTS, DEMO_SALES } from '../../data/demoData'

const Reports = () => {
  const { t } = useLanguage()
  const [inventoryReport, setInventoryReport] = useState([])
  const [salesReport, setSalesReport] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const [inventoryRes, salesRes] = await Promise.allSettled([
        api.get('/reports/inventory'),
        api.get('/reports/sales')
      ])

      setInventoryReport(
        inventoryRes.status === 'fulfilled' && Array.isArray(inventoryRes.value.data)
          ? inventoryRes.value.data
          : (DEMO_PRODUCTS || [])
      )

      setSalesReport(
        salesRes.status === 'fulfilled' && Array.isArray(salesRes.value.data)
          ? salesRes.value.data
          : (DEMO_SALES || [])
      )
    } catch (error) {
      console.error('Error fetching reports:', error)
      setInventoryReport(DEMO_PRODUCTS)
      setSalesReport(DEMO_SALES)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesReport = async () => {
    if (!dateRange.start_date || !dateRange.end_date) {
      alert('Please select both start and end dates')
      return
    }

    try {
      const response = await api.get(`/reports/sales?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`)
      setSalesReport(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching sales report:', error)
    }
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'Low Stock': return 'text-red-600 bg-red-100'
      case 'Medium Stock': return 'text-yellow-600 bg-yellow-100'
      case 'Good Stock': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalRevenue = salesReport.reduce((sum, sale) => sum + (parseFloat(sale.total_revenue) || 0), 0)
  const totalSales = salesReport.reduce((sum, sale) => sum + (parseInt(sale.total_sales) || 0), 0)
  const lowStockItems = inventoryReport.filter(item => item.stock_status === 'Low Stock').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingReports') || 'Loading reports...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{t('reports')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalRevenueLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500 shadow-lg animate-vibrant">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalSalesLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 shadow-lg animate-vibrant">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('lowStockItems')}</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500 shadow-lg animate-vibrant">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Report */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold text-gray-900">{t('salesReport')}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              className="px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
            />
            <span className="text-gray-400 font-medium">to</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              className="px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
            />
            <button
              onClick={fetchSalesReport}
              className="btn-primary px-6 py-2 rounded-xl shadow-md premium-hover"
            >
              {t('filter')}
            </button>
          </div>
        </div>

        {salesReport.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('totalSales')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('revenue')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesReport.map((sale, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.total_sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{(parseFloat(sale.total_revenue) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{t('noSalesDataRange')}</p>
        )}
      </div>

      {/* Inventory Report */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('inventoryReport')}</h2>

        {inventoryReport.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('product')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('stock')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('supplier')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryReport.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(parseFloat(item.price) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(item.stock_status)}`}>
                        {item.stock_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.supplier || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">{t('noInventoryData')}</p>
        )}
      </div>
    </div>
  )
}

export default Reports 
