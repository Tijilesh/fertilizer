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
  Mail
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const Dashboard = ({ products, sales }) => {
  const { user, logout } = useAuth()
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

  useEffect(() => {
    // Simulate data for demonstration
    setLowStockItems(products.filter(p => p.quantity < 10))
    setExpiringItems(products.filter(p => p.quantity > 0).slice(0, 5))
    setCreditReminders([
      { id: 1, customer: 'Ravi Kumar', amount: 5000, dueDate: '2024-01-15', status: 'overdue' },
      { id: 2, customer: 'Sita Devi', amount: 3000, dueDate: '2024-01-20', status: 'due' },
      { id: 3, customer: 'Amit Patel', amount: 1500, dueDate: '2024-01-25', status: 'due' }
    ])
    setRecentTransactions(sales.slice(0, 5))

    // User dashboard data
    setUserOrders(sales.slice(0, 3)) // Simulate user's recent orders
    setFarmerTips([
      {
        id: 1,
        title: 'Soil Testing Importance',
        content: 'Regular soil testing helps determine nutrient deficiencies and pH levels for optimal crop growth.',
        category: 'Soil Management',
        icon: '🧪'
      },
      {
        id: 2,
        title: 'Water Conservation',
        content: 'Use drip irrigation to reduce water usage by up to 50% and improve crop yields.',
        category: 'Irrigation',
        icon: '💧'
      },
      {
        id: 3,
        title: 'Pest Management',
        content: 'Integrated Pest Management combines biological, cultural, and chemical methods for sustainable pest control.',
        category: 'Pest Control',
        icon: '🐛'
      }
    ])
    setSeasonalOffers([
      {
        id: 1,
        title: 'Monsoon Special',
        description: '20% off on all pesticides and fungicides',
        discount: '20%',
        validUntil: '2024-10-31',
        icon: '🌧️'
      },
      {
        id: 2,
        title: 'Winter Preparation',
        description: 'Buy organic compost now, get 15% off on next purchase',
        discount: '15%',
        validUntil: '2024-11-30',
        icon: '❄️'
      }
    ])
  }, [products, sales])

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

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalProducts = products.length
  const totalCustomers = new Set(sales.map(sale => sale.customer_name)).size
  const averageOrderValue = totalRevenue / sales.length || 0

  // Show different dashboard based on user role
  if (user?.role === 'user') {
    const filteredProducts = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.type.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.type === selectedCategory
      return matchesSearch && matchesCategory && product.quantity > 0
    })

    const productCategories = [...new Set(products.map(p => p.type))]

    return (
      <div className="space-y-6">
        {/* Header with User Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.username}!</h1>
              <p className="text-gray-600">Ready to optimize your farming with quality fertilizers</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Member since {format(new Date(), 'MMM yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/shop"
            className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white hover:from-green-600 hover:to-green-700 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <div>
                <div className="font-semibold">Shop Now</div>
                <div className="text-sm opacity-90">Browse Products</div>
              </div>
            </div>
          </Link>

          <Link
            to="/cart"
            className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6" />
              <div>
                <div className="font-semibold">My Cart</div>
                <div className="text-sm opacity-90">View Items</div>
              </div>
            </div>
          </Link>

          <Link
            to="/orders"
            className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <div>
                <div className="font-semibold">Orders</div>
                <div className="text-sm opacity-90">Track History</div>
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6" />
              <div>
                <div className="font-semibold">Support</div>
                <div className="text-sm opacity-90">Get Help</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fertilizers, pesticides, compost..."
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
                <option value="all">All Categories</option>
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
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedCategory === category
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 bg-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{icons[index % icons.length]}</div>
                  <div className="font-semibold text-gray-900">{category}</div>
                  <div className="text-sm text-gray-500">{categoryProducts.length} products</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Recent Orders & Quick Reorder */}
        {userOrders.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/orders" className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
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
                      <div className="font-medium text-gray-900">Order #{order.id}</div>
                      <div className="text-sm text-gray-500">{format(new Date(order.sale_date), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">₹{order.total_amount}</span>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                      <RefreshCw className="h-3 w-3" />
                      <span>Reorder</span>
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
              <h3 className="text-xl font-bold mb-2">🎉 Seasonal Offers</h3>
              <p className="opacity-90">Don't miss out on these limited-time deals!</p>
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
                      <span className="text-xs opacity-75">Valid until {offer.validUntil}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farmer Tips */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-2 mb-4">
            <Leaf className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Farmer Tips & Advice</h3>
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

        {/* Weather & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <Sun className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Weather Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Current Conditions</span>
                <div className="flex items-center space-x-2">
                  <Cloud className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">Partly Cloudy, 28°C</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Soil Moisture</span>
                <div className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">Optimal for planting</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recommendation:</strong> Good time for applying nitrogen-rich fertilizers
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Track Order</div>
                    <div className="text-sm text-gray-500">Check delivery status</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Update Profile</div>
                    <div className="text-sm text-gray-500">Manage your information</div>
                  </div>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors border">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Low Stock Alerts</div>
                    <div className="text-sm text-gray-500">Get notified for favorites</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'All Products' : `${selectedCategory} Products`}
            {searchTerm && ` - "${searchTerm}"`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    {product.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    product.quantity > 10 ? 'text-green-600 bg-green-100' :
                    product.quantity > 5 ? 'text-yellow-600 bg-yellow-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    {product.quantity > 10 ? 'In Stock' :
                     product.quantity > 5 ? 'Limited' : 'Low Stock'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                  <span className="text-sm text-gray-500">Stock: {product.quantity}</span>
                </div>
                <Link
                  to="/shop"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-center block"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No products found</h4>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Owner/Admin Dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+12.5%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+5.2%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600 ml-1">+8.1%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{averageOrderValue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600 ml-1">-2.3%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="sales" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productCategoryData.map((entry, index) => (
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
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-orange-600">Low Stock</span>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-gray-500 text-center py-4">No low stock items</p>
            )}
          </div>
        </div>

        {/* Credit Reminders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Reminders</h3>
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {creditReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{reminder.customer}</p>
                  <p className="text-sm text-gray-600">Due: {reminder.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{reminder.amount}</p>
                  <span className={`text-sm font-medium ${
                    reminder.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {reminder.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <BarChart3 className="h-5 w-5 text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                      Completed
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