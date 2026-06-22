import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Search,
  Filter,
  Info,
  LayoutGrid,
  Star,
  Eye,
  Zap,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../../components/Navbar'
import ProductDetailModal from '../../components/shop/ProductDetailModal'
import toast from 'react-hot-toast'
import { DEMO_FEATURED_DEALS, DEMO_PROMO_BANNERS } from '../../data/demoData'

const Shop = ({ products }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeBanner, setActiveBanner] = useState(0)

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % DEMO_PROMO_BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const productList = Array.isArray(products) ? products : []
  const productTypes = ['all', ...new Set(productList.map(p => p.type).filter(Boolean))]

  const filteredProducts = productList.filter(product => {
    // Only show in-stock products
    if (!product.quantity || product.quantity <= 0) return false;
    
    const name = product.name || ''
    const type = product.type || ''
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || type === filterType
    return matchesSearch && matchesFilter
  })

  const handleAddToCart = (product, e) => {
    e?.stopPropagation()
    if (isAdmin) {
      toast.error(t('adminCannotBuy') || 'Administrators cannot place retail orders. Use Purchases to restock.')
      return
    }
    const currentQuantity = getItemQuantity(product.id)
    if (currentQuantity < product.quantity) {
      addToCart(product, 1)
      toast.success(`${product.name} ${t('addToCart')}!`)
    } else {
      toast.error(t('maxQuantityReached'))
    }
  }

  const handleOpenModal = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`p-4 md:p-8 overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>

        {/* Admin Warning Banner */}
        {isAdmin && (
          <div className="glass-card border-blue-200 bg-blue-50/80 p-4 rounded-2xl flex items-start space-x-3 mb-8 animate-in slide-in-from-top duration-500">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-900 font-black flex items-center gap-2">
                {t('adminViewNotice') || 'ADMINISTRATOR RETAIL VIEW'}
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Read Only</span>
              </p>
              <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                {t('adminViewNoticeDesc') || 'Procure bulk stock via the "Stock In" module. This interface simulates the farmer\'s mobile experience for testing and monitoring.'}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-10">

          {/* Headline Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <span className="bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent">
                  {t('premiumShop') || 'Modern Fertilizer Hub'}
                </span>
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </h1>
              <p className="text-gray-500 mt-2 font-medium text-lg">{t('qualityInputs') || 'Fueling your harvest with premium inputs'}</p>
            </div>

            <div className="relative group w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input
                type="text"
                placeholder={t('searchByNameOrType')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-primary-500/30 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-lg shadow-gray-200/50 outline-none text-gray-700 font-medium"
              />
            </div>
          </div>

          {/* Promo Carousel */}
          <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary-900/10 group">
            {DEMO_PROMO_BANNERS.map((banner, idx) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-1000 transform ${idx === activeBanner ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'} bg-gradient-to-r ${banner.color} p-8 md:p-12 flex items-center`}
              >
                <div className="relative z-10 max-w-lg space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest">
                    <Zap className="w-3 h-3 fill-current" />
                    {t('specialOffer') || 'Limited Time Offer'}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{banner.title}</h2>
                  <p className="text-white/80 text-lg font-medium">{banner.description}</p>
                  <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-black hover:bg-opacity-90 transition-all flex items-center gap-2 group/btn">
                    {t('shopNow') || 'Explore Now'}
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="absolute right-0 md:right-12 top-1/2 -translate-y-1/2 text-9xl md:text-[15rem] opacity-20 pointer-events-none transform rotate-12 transition-transform duration-1000 group-hover:rotate-0">
                  {banner.icon}
                </div>
              </div>
            ))}

            {/* Banner Pagination */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {DEMO_PROMO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBanner(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === activeBanner ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {productTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all border-2 ${filterType === type
                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30 -translate-y-1'
                  : 'bg-white border-white text-gray-500 hover:border-primary-100 hover:text-primary-600'
                  }`}
              >
                {type === 'all' ? t('allTypes') : type}
              </button>
            ))}
          </div>

          {/* Featured Deals Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary-600" />
                {t('featuredDeals') || 'Hot Deals for Farmers'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {DEMO_FEATURED_DEALS.map(deal => (
                <div key={deal.id} className="group relative overflow-hidden glass-card p-6 rounded-[2rem] border-2 border-transparent hover:border-primary-100 hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 bg-white">
                  <div className="absolute top-4 right-4 bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
                    {deal.discount}% {t('off') || 'OFF'}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                      {deal.image}
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{deal.tag}</span>
                      <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase leading-tight">{deal.name}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-gray-900">₹{deal.price}</span>
                        <span className="text-sm text-gray-400 line-through">₹{deal.originalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Product Grid */}
          <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-600" />
                {t('allProducts')}
              </h3>
              <p className="text-sm text-gray-400 font-bold">{filteredProducts.length} {t('itemsFound') || 'Items Available'}</p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative bg-white rounded-[2.5rem] border-2 border-gray-100 hover:border-primary-200 transition-all duration-500 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary-100/50 overflow-hidden flex flex-col"
                  >
                    {/* Card Header with Logic Labels */}
                    <div className={`h-48 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                      <div className="w-28 h-28 bg-white rounded-3xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                        <Package className="w-14 h-14 text-primary-600/30 group-hover:text-primary-600/50 transition-colors" />
                      </div>

                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-white/80 backdrop-blur-md text-primary-600 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm border border-primary-50">
                          {product.type}
                        </span>
                        {product.quantity < 20 && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-3 py-1.5 rounded-xl border border-amber-200 uppercase tracking-tighter">
                            {t('lowStock') || 'Selling Fast'}
                          </span>
                        )}
                      </div>

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out z-10 p-6">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="flex-1 bg-white text-primary-900 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary-50 active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          {t('quickView') || 'Quick View'}
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col space-y-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                        <span className="text-[10px] text-gray-400 font-bold ml-1">(4.8)</span>
                      </div>

                      <h4 className="text-xl font-black text-gray-900 line-clamp-1 leading-tight group-hover:text-primary-600 transition-colors">{product.name}</h4>

                      <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed h-[2.5rem]">
                        {product.description || t('noDescription') || 'Premium formulated fertilizer for high crop yield and improved soil health.'}
                      </p>

                      <div className="pt-4 mt-auto flex items-end justify-between">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('price')}</p>
                          <p className="text-2xl font-black text-primary-600">₹{parseFloat(product.price).toFixed(0)}</p>
                        </div>

                        {isAdmin ? (
                          <button
                            onClick={() => navigate('/products')}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all shadow-sm border border-blue-100 relative group/icon"
                            title={t('manageInventory')}
                          >
                            <LayoutGrid className="w-6 h-6" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">Admin Only</span>
                          </button>
                        ) : isInCart(product.id) ? (
                          <div className="flex items-center bg-gray-50 rounded-2xl p-1 border-2 border-primary-50">
                            <button
                              onClick={() => updateQuantity(product.id, getItemQuantity(product.id) - 1)}
                              className="w-8 h-8 rounded-xl bg-white text-gray-600 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-black text-gray-900">{getItemQuantity(product.id)}</span>
                            <button
                              onClick={() => updateQuantity(product.id, getItemQuantity(product.id) + 1)}
                              className="w-8 h-8 rounded-xl bg-white text-gray-600 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-bold"
                              disabled={getItemQuantity(product.id) >= product.quantity}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="p-4 bg-primary-600 text-white rounded-[1.5rem] hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary-600/20 group/add"
                            disabled={product.quantity === 0}
                          >
                            <ShoppingCart className="w-6 h-6 group-hover/add:rotate-12 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full py-20 glass-card rounded-[3rem] text-center border-dashed border-4">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{t('noMatchFound') || 'No Perfect Match Found'}</h3>
                <p className="text-gray-500 font-medium">{t('tryDifferentCategories') || 'Try adjusting your filters or search keywords'}</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterType('all') }}
                  className="mt-6 px-8 py-3 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all"
                >
                  {t('resetFilters') || 'Clear All Filters'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hero Sparkles Decoration */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary-500/5 blur-[120px] -z-10 animate-pulse pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] -z-10 animate-pulse pointer-events-none" />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default Shop
