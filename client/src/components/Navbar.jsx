import { Link, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, BarChart3, Users, Building, CreditCard, Calculator, Smartphone, AlertTriangle, TrendingUp, LogOut, ChevronLeft, ChevronRight, History, Tractor, Leaf, Sprout, Wheat, Truck, Receipt, PiggyBank, Calendar, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { getCartItemCount } = useCart()

  const allNavItems = [
    { path: '/', label: 'Dashboard', icon: Home, roles: ['user', 'owner'], color: 'text-blue-600' },
    { path: '/shop', label: 'Shop', icon: Leaf, roles: ['user', 'owner'], color: 'text-green-600' },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, roles: ['user', 'owner'], badge: getCartItemCount(), color: 'text-orange-600' },
    { path: '/orders', label: 'Orders', icon: Receipt, roles: ['user', 'owner'], color: 'text-purple-600' },
    { path: '/products', label: 'Products', icon: Sprout, roles: ['owner'], color: 'text-emerald-600' },
    { path: '/sales', label: 'Sales', icon: TrendingUp, roles: ['owner'], color: 'text-indigo-600' },
    { path: '/customers', label: 'Farmers', icon: Users, roles: ['owner'], color: 'text-teal-600' },
    { path: '/purchases', label: 'Suppliers', icon: Truck, roles: ['owner'], color: 'text-cyan-600' },
    { path: '/payments', label: 'Payments', icon: PiggyBank, roles: ['owner'], color: 'text-green-600' },
    { path: '/accounting', label: 'Accounting', icon: Calculator, roles: ['owner'], color: 'text-gray-600' },
    { path: '/stock-expiry', label: 'Stock Alerts', icon: AlertTriangle, roles: ['owner'], color: 'text-red-600' },
    { path: '/mobile-app', label: 'Mobile App', icon: Smartphone, roles: ['owner'], color: 'text-blue-600' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['owner'], color: 'text-violet-600' },
    { path: '/reports', label: 'Reports', icon: Wheat, roles: ['owner'], color: 'text-amber-600' },
  ]

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className={`bg-white shadow-lg fixed left-0 top-0 h-screen transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Tractor className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-800 block leading-tight">Fertilizer</span>
                <span className="text-sm font-semibold text-green-600">Shop</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Tractor className="w-6 h-6 text-white" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-green-100 transition-colors duration-200 border border-green-200"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5 text-green-600" /> : <ChevronLeft className="w-5 h-5 text-green-600" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-md border border-green-200'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:shadow-sm'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? item.color : 'text-gray-500 group-hover:text-green-600'}`} />
                  {!isCollapsed && <span className={`font-medium ${isActive ? 'text-green-700' : 'text-gray-700 group-hover:text-green-700'}`}>{item.label}</span>}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info and Logout */}
        <div className="border-t border-green-200 p-4 bg-gradient-to-r from-green-50 to-emerald-50">
          {!isCollapsed && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user?.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{user?.username}</div>
                  <div className="text-xs text-green-600 capitalize">{user?.role}</div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-200`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar