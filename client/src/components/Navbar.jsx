import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, BarChart3, Users, Building, CreditCard, Calculator, Smartphone, AlertTriangle, TrendingUp, LogOut, ChevronLeft, ChevronRight, History, Tractor, Leaf, Sprout, Wheat, Truck, Receipt, PiggyBank, Calendar, Zap, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './common/LanguageSelector'
import { NotificationCenter } from './common'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { getCartItemCount } = useCart()
  const { t } = useLanguage()
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  // Filter nav items based on user role - owners get all access
  const getNavItemsForRole = (role) => {
    const baseItems = [
      { path: '/dashboard', label: t('dashboard'), icon: Home, roles: ['user', 'owner', 'admin'], color: 'text-blue-600' },
      {
        path: '/shop',
        label: (role === 'owner' || role === 'admin') ? `${t('shop')} (${t('customerView')})` : t('shop'),
        icon: Leaf,
        roles: ['user', 'owner', 'admin'],
        color: 'text-green-600'
      },
      { path: '/cart', label: t('cart'), icon: ShoppingCart, roles: ['user', 'owner', 'admin'], badge: getCartItemCount(), color: 'text-orange-600' },
      { path: '/orders', label: t('orders'), icon: Receipt, roles: ['user', 'owner', 'admin'], color: 'text-purple-600' },
      { path: '/survey', label: t('survey') || 'Survey', icon: Zap, roles: ['user', 'owner', 'admin'], color: 'text-pink-600' },
      { path: '/smart-assistant', label: t('smartAssistantNav') || 'Smart Assistant', icon: Zap, roles: ['user', 'owner', 'admin'], color: 'text-purple-600' },
      { path: '/schemes', label: t('govtSchemesNav') || 'Government Schemes', icon: Building, roles: ['user', 'owner', 'admin'], color: 'text-indigo-600' },
    ]

    const adminItems = [
      { path: '/products', label: t('products'), icon: Sprout, roles: ['owner', 'admin'], color: 'text-emerald-600' },
      { path: '/sales', label: t('sales'), icon: TrendingUp, roles: ['owner', 'admin'], color: 'text-indigo-600' },
      { path: '/customers', label: t('customers'), icon: Users, roles: ['owner', 'admin'], color: 'text-teal-600' },
      { path: '/farmers', label: t('farmers') || 'Farmers', icon: Tractor, roles: ['owner', 'admin'], color: 'text-yellow-600' },
      {
        path: '/purchases',
        label: t('stockInProcurement'),
        icon: Truck,
        roles: ['owner', 'admin'],
        color: 'text-cyan-600'
      },
      { path: '/payments', label: t('payments'), icon: PiggyBank, roles: ['owner', 'admin'], color: 'text-green-600' },
      { path: '/accounting', label: t('accounting'), icon: Calculator, roles: ['owner', 'admin'], color: 'text-gray-600' },
      { path: '/stock-expiry', label: t('stock-alerts'), icon: AlertTriangle, roles: ['owner', 'admin'], color: 'text-red-600' },
      { path: '/mobile-app', label: t('mobile-app'), icon: Smartphone, roles: ['owner', 'admin'], color: 'text-blue-600' },
      { path: '/analytics', label: t('analytics'), icon: BarChart3, roles: ['owner', 'admin'], color: 'text-violet-600' },
      { path: '/reports', label: t('reports'), icon: Wheat, roles: ['owner', 'admin'], color: 'text-amber-600' },
    ]

    // Owners get all items, admins get admin items, users get base items
    if (role === 'owner') {
      return [...baseItems, ...adminItems]
    } else if (role === 'admin') {
      return [...baseItems, ...adminItems]
    } else {
      return baseItems
    }
  }

  const allNavItems = getNavItemsForRole(user?.role)

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role))

  return (
    <>
      <div className={`glass-card premium-shadow fixed left-0 top-0 h-screen transition-all duration-300 z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Header with Logo and Toggle */}
          <div className="p-4 border-b border-green-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
            <div className="flex items-center justify-between mb-3">
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

            {/* Language Selector and Notification Bell in one row */}
            <div className="flex items-center justify-between mt-2">
              {!isCollapsed && <LanguageSelector />}
              {isCollapsed && (
                <div className="flex justify-center w-full">
                  <LanguageSelector />
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className={`p-1.5 rounded-xl hover:bg-green-100 transition-all duration-300 border border-green-200 relative group premium-hover ${isNotifOpen ? 'bg-green-100' : ''}`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-300 relative group premium-hover mb-1 ${isActive
                      ? 'bg-gradient-to-r from-green-100/80 to-emerald-100/80 text-green-700 shadow-sm border border-green-200/50'
                      : 'text-gray-600 hover:text-green-600 hover:bg-white/50 hover:shadow-sm'
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
                <div className="flex items-center space-x-2">
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
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full px-3 py-2.5 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300 border border-transparent hover:border-red-100 premium-hover`}
              title={isCollapsed ? t('logout') : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-semibold">{t('logout')}</span>}
            </button>
          </div>
        </div>
      </div>
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  )
}

export default Sidebar