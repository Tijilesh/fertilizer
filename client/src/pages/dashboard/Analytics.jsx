import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

import { DEMO_ANALYTICS } from '../../data/demoData'

const Analytics = ({ products, sales }) => {
  const { t } = useLanguage()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [analyticsData, setAnalyticsData] = useState({
    monthlySales: [],
    categoryData: []
  })
  const [loading, setLoading] = useState(true)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/analytics/summary')
      setAnalyticsData(response.data)
    } catch (error) {
      console.error('Error fetching analytics summary:', error)
      setAnalyticsData(DEMO_ANALYTICS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const salesList = Array.isArray(sales) ? sales : []
  const productList = Array.isArray(products) ? products : []

  // Calculate dynamic KPIs
  const totalRevenue = salesList.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
  const totalOrders = salesList.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const totalProfit = totalRevenue * 0.25 // Estimate 25% profit margin

  const kpiData = {
    totalRevenue,
    totalProfit,
    totalOrders,
    averageOrderValue,
    customerGrowth: 12.5, // Mocked for now
    profitMargin: 25.0
  }

  // Derive charts data from sales
  const monthlyData = {}
  salesList.forEach(sale => {
    const date = new Date(sale.sale_date)
    const month = date.toLocaleString('default', { month: 'short' })
    if (!monthlyData[month]) {
      monthlyData[month] = { month, sales: 0, profit: 0, orders: 0 }
    }
    const amount = parseFloat(sale.total_amount) || 0
    monthlyData[month].sales += amount
    monthlyData[month].profit += amount * 0.25
    monthlyData[month].orders += 1
  })

  // Fallback to sample if no sales
  const salesData = analyticsData.monthlySales.length > 0
    ? analyticsData.monthlySales
    : [
      { month: 'Jan', sales: 0, profit: 0, orders: 0 },
      { month: 'Feb', sales: 0, profit: 0, orders: 0 }
    ]

  const productPerformance = productList.slice(0, 4).map((p, i) => ({
    name: p.name,
    sales: Math.floor(Math.random() * 50), // Mock sales count
    revenue: (parseFloat(p.price) || 0) * 10, // Mock revenue
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][i % 4]
  }))

  const customerSegments = [
    { segment: 'Regular', customers: 45, revenue: totalRevenue * 0.4, color: '#3B82F6' },
    { segment: 'Premium', customers: 25, revenue: totalRevenue * 0.3, color: '#10B981' },
    { segment: 'Wholesale', customers: 15, revenue: totalRevenue * 0.2, color: '#F59E0B' },
    { segment: 'New', customers: 15, revenue: totalRevenue * 0.1, color: '#EF4444' }
  ]

  const topCustomers = salesList.slice(0, 4).map(sale => ({
    name: sale.customer_name || 'Anonymous',
    totalSpent: parseFloat(sale.total_amount) || 0,
    orders: 1,
    lastOrder: sale.sale_date ? new Date(sale.sale_date).toISOString().split('T')[0] : 'N/A'
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('advancedAnalytics')}</h1>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="glass-card px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-gray-700"
          >
            <option value="week">{t('thisWeek')}</option>
            <option value="month">{t('thisMonth')}</option>
            <option value="quarter">{t('thisQuarter')}</option>
            <option value="year">{t('thisYear')}</option>
          </select>
          <button className="glass-card flex items-center px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all premium-hover text-gray-700 font-medium">
            <Filter className="h-4 w-4 mr-2" />
            {t('filter')}
          </button>
          <button className="btn-primary flex items-center px-4 py-2 rounded-xl shadow-md premium-hover">
            <Download className="h-4 w-4 mr-2" />
            {t('exportReport')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalRevenueLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{kpiData.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{kpiData.customerGrowth}%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalProfit')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{kpiData.totalProfit.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{kpiData.profitMargin}%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalOrders') || 'Total Orders'}</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.totalOrders}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.2%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('avgOrderValue')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{kpiData.averageOrderValue.toFixed(2)}</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 ml-1">-2.1%</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('salesTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fill="url(#colorSales)" />
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Trend */}
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('profitTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product & Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('productPerformance')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('customerSegments')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {analyticsData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => `${value} products`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border overflow-hidden">
        <h3 className="text-lg font-bold text-gray-900 mb-6">{t('topCustomers')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('totalSpent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('lastOrder')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={customer.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('activeStatus')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card premium-shadow p-8 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('businessInsights')}</h3>
          <div className="space-y-4">
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl premium-hover transition-all">
              <h4 className="font-bold text-blue-900 mb-2">{t('revenueGrowth')}</h4>
              <p className="text-sm text-blue-700 leading-relaxed">{t('revenueGrowthInsight') || 'Your revenue has grown by 12.5% compared to last month. NPK 20-20-20 is your best-selling product.'}</p>
            </div>
            <div className="p-5 bg-green-50/50 border border-green-100 rounded-2xl premium-hover transition-all">
              <h4 className="font-bold text-green-900 mb-2">{t('customerRetention')}</h4>
              <p className="text-sm text-green-700 leading-relaxed">{t('customerRetentionInsight') || '85% of your customers are returning customers, indicating strong loyalty.'}</p>
            </div>
            <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl premium-hover transition-all">
              <h4 className="font-bold text-orange-900 mb-2">{t('inventoryAlert')}</h4>
              <p className="text-sm text-orange-700 leading-relaxed">{t('inventoryAlertInsight') || "Consider restocking Urea as it's running low and has high demand."}</p>
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-8 rounded-2xl border">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('recommendations')}</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4 group">
              <div className="w-10 h-10 bg-blue-100/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t('increaseMarketing')}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{t('increaseMarketingDesc') || 'Focus on promoting Organic Compost as it has high profit margins.'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 group">
              <div className="w-10 h-10 bg-green-100/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t('customerEngagement')}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{t('customerEngagementDesc') || 'Send personalized offers to your top customers to increase loyalty.'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 group">
              <div className="w-10 h-10 bg-purple-100/80 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t('inventoryOptimization')}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{t('inventoryOptimizationDesc') || 'Maintain optimal stock levels to avoid stockouts and overstocking.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
