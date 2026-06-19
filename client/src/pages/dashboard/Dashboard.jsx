import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  CreditCard,
  ShoppingCart,
  BarChart3,
  Clock,
  CheckCircle,
  LogOut,
  Search,
  Star,
  RefreshCw,
  Leaf,
  Sun,
  Cloud,
  Droplets,
  User,
  MapPin,
  Phone,
  Mail,
  Brain,
  Sprout,
  Zap,
  Building,
  Tractor
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import WeatherWidget from '../../components/common/WeatherWidget'
import DiseaseDetection from '../../components/common/DiseaseDetection'
import FertilizerCalculator from '../../components/common/FertilizerCalculator'
import EducationHub from '../../components/common/EducationHub'
import CommunityForum from '../../components/common/CommunityForum'

import {
  DEMO_DASHBOARD_STATS,
  DEMO_FARMER_TIPS,
  DEMO_SEASONAL_OFFERS,
  DEMO_ACCOUNTING,
  DEMO_ANALYTICS
} from '../../data/demoData'

const Dashboard = ({ products, sales }) => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [lowStockItems, setLowStockItems] = useState([])
  const [expiringItems, setExpiringItems] = useState([])
  const [creditReminders, setCreditReminders] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  // User dashboard state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userOrders, setUserOrders] = useState([])
  const [farmerTips, setFarmerTips] = useState([])
  const [seasonalOffers, setSeasonalOffers] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    productGrowth: 0,
    customerGrowth: 0,
    orderGrowth: 0
  })
  const [salesChartData, setSalesChartData] = useState([])
  const [categoryChartData, setCategoryChartData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Individual try-catch for each call to ensure partial successes work
      const fetchData = async (url, fallback) => {
        try {
          const res = await api.get(url)
          return res.data
        } catch (err) {
          console.error(`Error fetching ${url}:`, err)
          return fallback
        }
      }

      const results = await Promise.all([
        fetchData('/dashboard/stats', DEMO_DASHBOARD_STATS),
        fetchData('/dashboard/farmer-tips', DEMO_FARMER_TIPS),
        fetchData('/dashboard/seasonal-offers', DEMO_SEASONAL_OFFERS),
        fetchData('/dashboard/credit-reminders', []),
        fetchData('/analytics/summary', DEMO_ANALYTICS)
      ])

      setStats(results[0])
      setFarmerTips(results[1])
      setSeasonalOffers(results[2])
      setCreditReminders(results[3])
      setSalesChartData(results[4]?.monthlySales || [])
      setCategoryChartData(results[4]?.categoryData || [])
    } catch (error) {
      console.error('Error in fetchDashboardData:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const productList = Array.isArray(products) ? products : []
    const salesList = Array.isArray(sales) ? sales : []

    setLowStockItems(productList.filter(p => p.quantity < 10))
    setExpiringItems(productList.filter(p => p.quantity > 0).slice(0, 5))
    setRecentTransactions(salesList.slice(0, 5))
    setUserOrders(salesList.slice(0, 3))

    if (user) {
      fetchDashboardData()
    }
  }, [products, sales, user])

  const salesData = [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 48000 },
    { month: 'Apr', sales: 61000 },
    { month: 'May', sales: 55000 },
    { month: 'Jun', sales: 67000 }
  ]

  const productCategoryData = [
    { name: 'NPK', value: 40, color: '#3B82F6' },
    { name: 'Urea', value: 25, color: '#10B981' },
    { name: 'Organic', value: 20, color: '#F59E0B' },
    { name: 'Pesticides', value: 15, color: '#EF4444' }
  ]

  const salesList = Array.isArray(sales) ? sales : []
  const productList = Array.isArray(products) ? products : []

  const totalRevenue = salesList.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
  const totalProducts = productList.length
  const totalCustomers = new Set(salesList.map(sale => sale.customer_name).filter(Boolean)).size
  const averageOrderValue = totalRevenue / (salesList.length || 1)

  // Show different dashboard based on user role
  if (user?.role === 'user') {
    const filteredProducts = productList.filter(product => {
      const name = product.name || ''
      const type = product.type || ''
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || type === selectedCategory
      return matchesSearch && matchesCategory && (product.quantity || 0) > 0
    })

    const productCategories = [...new Set(productList.map(p => p.type).filter(Boolean))]

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with User Info */}
        <div className="glass-card premium-shadow p-6 rounded-xl border group">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome')}, {user?.username}!</h1>
              <p className="text-gray-600">{t('browseProducts')}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {t('memberSince')} {format(new Date(), 'MMM yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/shop"
            className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white hover:from-green-600 hover:to-green-700 premium-hover"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <div>
                <div className="font-semibold">{t('shop')}</div>
                <div className="text-sm opacity-90">{t('browseProducts')}</div>
              </div>
            </div>
          </Link>

          <Link
            to="/cart"
            className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 premium-hover"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <div>
                <div className="font-semibold">{t('myCart')}</div>
                <div className="text-sm opacity-90">{t('viewItems')}</div>
              </div>
            </div>
          </Link>

          <Link
            to="/orders"
            className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 premium-hover"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <div>
                <div className="font-semibold">{t('orders')}</div>
                <div className="text-sm opacity-90">{t('trackHistory')}</div>
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6" />
              <div>
                <div className="font-semibold">{t('support')}</div>
                <div className="text-sm opacity-90">{t('getHelp')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchFertilizersPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">{t('allCategories')}</option>
                {productCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productCategories.slice(0, 8).map((category, index) => {
            const categoryProducts = products.filter(p => p.type === category)
            const icons = ['🌱', '💧', '🐛', '🌾', '🧪', '🌿', '🌻', '🍎']
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedCategory === category
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 bg-white'
                  } premium-hover`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{icons[index % icons.length]}</div>
                  <div className="font-semibold text-gray-900">{category}</div>
                  <div className="text-sm text-gray-500">{categoryProducts.length} {t('productsCountLabel')}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Recent Orders & Quick Reorder */}
        {userOrders.length > 0 && (
          <div className="glass-card premium-shadow p-6 rounded-xl border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('recentOrders')}</h3>
              <Link to="/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
                {t('viewAll')}
              </Link>
            </div>
            <div className="space-y-3">
              {userOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Package className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{t('orderNumberLabel')}{order.id}</div>
                      <div className="text-sm text-gray-500">{format(new Date(order.sale_date), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">₹{order.total_amount}</span>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      <RefreshCw className="h-3 w-3" />
                      <span>{t('reorder')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Offers */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🎉 {t('seasonalOffersLabel')}</h3>
              <p className="opacity-90">{t('offersDescription')}</p>
            </div>
            <div className="hidden md:block">
              <div className="text-4xl">🌟</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {seasonalOffers.map((offer) => (
              <div key={offer.id} className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{offer.icon}</span>
                  <div>
                    <h4 className="font-semibold">{offer.title}</h4>
                    <p className="text-sm opacity-90">{offer.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {offer.discount} OFF
                      </span>
                      <span className="text-xs opacity-75">{t('validUntil')} {offer.validUntil}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farmer Tips */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <div className="flex items-center space-x-2 mb-4">
            <Leaf className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('farmerTipsLabel')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {farmerTips.map((tip) => (
              <div key={tip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-sm font-medium text-green-600">{tip.category}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{tip.title}</h4>
                <p className="text-sm text-gray-600">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Disease Detection */}
        <DiseaseDetection />

        {/* Fertilizer Calculator */}
        <FertilizerCalculator />

        {/* Education Hub */}
        <EducationHub />

        {/* Community Forum */}
        <CommunityForum />

        {/* Quick Actions */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('quickActionsTitle')}</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">{t('trackOrder')}</div>
                  <div className="text-sm text-gray-500">{t('checkDeliveryStatus')}</div>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{t('updateProfile')}</div>
                  <div className="text-sm text-gray-500">{t('manageYourInformation')}</div>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">{t('lowStockAlerts')}</div>
                  <div className="text-sm text-gray-500">{t('getNotifiedForFavorites')}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCategory === 'all' ? t('allProducts') : `${selectedCategory} ${t('productsCountLabel')}`}
            {searchTerm && ` - "${searchTerm}"`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    {product.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${product.quantity > 10 ? 'text-green-600 bg-green-100' :
                    product.quantity > 5 ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                    {product.quantity > 10 ? t('inStock') :
                      product.quantity > 5 ? t('limitedStock') : t('lowStock')}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                  <span className="text-sm text-gray-500">{t('stock')}: {product.quantity}</span>
                </div>
                <Link
                  to="/shop"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-center block"
                >
                  {t('viewDetails')}
                </Link>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noProductsFoundTitle')}</h4>
              <p className="text-gray-500">{t('adjustSearchCategory')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Owner/Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {t('lastUpdated')}: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            title={t('logout')}
          >
            <LogOut className="h-4 w-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-4 w-4 ${stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-4 w-4 ${stats.productGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${stats.productGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.productGrowth >= 0 ? '+' : ''}{stats.productGrowth}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-4 w-4 ${stats.customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${stats.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.customerGrowth >= 0 ? '+' : ''}{stats.customerGrowth}%
            </span>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover bg-gradient-to-br from-white to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('avgOrderValue')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-4 w-4 ${stats.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${stats.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.orderGrowth >= 0 ? '+' : ''}{stats.orderGrowth}%
            </span>
          </div>
        </div>

        {/* Premium Business Insights */}
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover bg-gradient-to-br from-white to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">{t('projectedProfit')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.totalRevenue * 0.22).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('basedOnMargin')}
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover bg-gradient-to-br from-white to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">{t('efficiencyScore')}</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-blue-600 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            +4% {t('fromLastMonth')}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-amber-500" />
          {t('smartQuickActions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/smart-assistant" className="group p-4 glass-card rounded-xl border border-purple-100 hover:border-purple-300 premium-shadow premium-hover">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{t('aiAssistant')}</p>
                <p className="text-xs text-gray-500">{t('askFarmingQuestions')}</p>
              </div>
            </div>
          </Link>
          <Link to="/schemes" className="group p-4 glass-card rounded-xl border border-blue-100 hover:border-blue-300 premium-shadow premium-hover">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{t('govtSchemes')}</p>
                <p className="text-xs text-gray-500">{t('checkEligiblePerks')}</p>
              </div>
            </div>
          </Link>
          <div className="group p-4 glass-card rounded-xl border border-green-100 hover:border-green-300 premium-shadow premium-hover cursor-pointer overflow-hidden relative">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                <Sprout className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{t('soilHealth')}</p>
                <p className="text-xs text-gray-500">{t('viewCalculator')}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-1">
              <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('monthlySales')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="sales" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Categories */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('productCategoriesLabel')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('lowStockAlerts')}</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{t('quantity')}: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-orange-600">{t('lowStock')}</span>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">{t('noLowStockItems')}</p>
            )}
          </div>
        </div>

        {/* Credit Reminders */}
        <div className="glass-card premium-shadow p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('creditReminders')}</h3>
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {creditReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{reminder.customer}</p>
                  <p className="text-sm text-gray-600">{t('due')}: {reminder.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{reminder.amount}</p>
                  <span className={`text-sm font-medium ${reminder.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                    {reminder.status === 'overdue' ? t('overdueLabel') : t('dueSoon')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card premium-shadow p-6 rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('recentTransactions')}</h3>
          <BarChart3 className="h-5 w-5 text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('items')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.customer_name}</div>
                      <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{sale.total_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(sale.sale_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('completed')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
