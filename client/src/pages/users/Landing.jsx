import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Leaf,
  ArrowRight,
  Smartphone,
  TrendingUp,
  Brain,
  Cloud,
  Sprout,
  ShieldCheck,
  Truck,
  CreditCard,
  Award,
  PhoneCall,
  MapPin,
  Clock,
  ChevronRight,
  ShoppingBag,
  Star,
  CheckCircle2,
  Users,
  Store
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageSelector from '../../components/common/LanguageSelector'

const Landing = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ farmers: 0, products: 0, orders: 0, satisfaction: 0 })
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Animated counter effect
  useEffect(() => {
    const targetStats = { farmers: 12500, products: 150, orders: 8750, satisfaction: 98 }
    const duration = 2000
    const steps = 60
    const increment = {}

    Object.keys(targetStats).forEach(key => {
      increment[key] = targetStats[key] / steps
    })

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setStats(() => {
        const newStats = {}
        Object.keys(targetStats).forEach(key => {
          newStats[key] = Math.min(Math.floor(increment[key] * currentStep), targetStats[key])
        })
        return newStats
      })

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  // Fetch live featured products
  useEffect(() => {
    fetch('http://localhost:5012/api/products/featured')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeaturedProducts(data)
        }
      })
      .catch(err => console.error('Error loading featured products:', err))
      .finally(() => setLoadingProducts(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 text-white text-xs py-2.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider animate-pulse">
              Govt Certified
            </span>
            <span>100% Genuine Certified Fertilizers, Seeds & Bio-Pesticides Direct to Farm</span>
          </div>
          <div className="flex items-center space-x-6 text-xs text-emerald-100 hidden sm:flex">
            <span className="flex items-center space-x-1">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
              <span>Toll Free Farmer Helpline: +91 98765 43210</span>
            </span>
            <span className="flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Free Delivery in 24-48 Hours</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-green-900 bg-clip-text text-transparent tracking-tight">
                  AgriFert
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-600 -mt-1">
                  Agro Inputs & Fertilizer Hub
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/shop" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors flex items-center space-x-1 text-sm">
                <span>{t('shopNow') || 'Shop Catalog'}</span>
              </Link>
              <a href="#featured" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors text-sm">
                Featured Products
              </a>
              <a href="#services" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors text-sm">
                Services
              </a>
              <a href="#store-details" className="text-gray-700 hover:text-emerald-600 font-semibold transition-colors text-sm">
                Store Location
              </a>
              <LanguageSelector />
            </div>

            {/* Auth CTAs */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-emerald-700 px-4 py-2 text-sm font-bold transition-colors"
              >
                {t('login') || 'Sign In'}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                {t('getStarted') || 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Modern Glassmorphism & High-Quality Visuals */}
      <section className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-slate-50">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content Column */}
            <div className="flex-1 space-y-8 text-left">
              <div className="inline-flex items-center space-x-2.5 px-4 py-2 bg-emerald-100/80 border border-emerald-200/90 rounded-full text-emerald-800 text-xs font-bold tracking-wide shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>TRUSTED BY OVER 12,500+ REGISTERED FARMERS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.15] tracking-tight">
                Premium Fertilizers & <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-800 bg-clip-text text-transparent">
                  Crop Care Solutions
                </span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-xl font-normal">
                Empowering modern farmers with lab-tested crop nutrients, certified pesticides, automated soil compatibility advisories, and instant credit purchase options.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/shop')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Explore Product Catalog</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>

                <button
                  onClick={() => navigate('/mobile-app')}
                  className="bg-white hover:bg-emerald-50/60 text-emerald-700 border-2 border-emerald-600/60 px-7 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center space-x-2.5 shadow-sm hover:shadow"
                >
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>Download Farmer App</span>
                </button>
              </div>

              {/* Value Props Row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/80 text-xs font-semibold text-gray-700">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Govt. Certified Quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Farmer Credit / Pay Later</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Express Doorstep Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Column */}
            <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1470&auto=format&fit=crop"
                  alt="High tech agriculture farming"
                  className="w-full h-[460px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/80 backdrop-blur-md rounded-lg text-xs font-bold mb-2">
                    <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
                    <span>Highest Farmer Recommendation</span>
                  </div>
                  <h3 className="text-xl font-bold">Lab-Tested Nutrients for Maximum Yield</h3>
                  <p className="text-xs text-gray-200 mt-1">Guaranteed authentic chemical & bio-fertilizers with batch expiry warranty.</p>
                </div>
              </div>

              {/* Floating Stat Badge 1 */}
              <div className="absolute -top-6 -left-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-gray-900">+28% Crop Yield</span>
                  <p className="text-xs text-gray-500">Documented seasonal boost</p>
                </div>
              </div>

              {/* Floating Stat Badge 2 */}
              <div className="absolute -bottom-6 -right-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center space-x-3.5">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-gray-900">100% Genuine</span>
                  <p className="text-xs text-gray-500">Direct from Syngenta, IFFCO & Aries</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Counters Section */}
      <section className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 py-12 text-white relative shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-emerald-700/50">
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-3xl sm:text-5xl font-black mb-1">{stats.farmers.toLocaleString()}+</p>
              <p className="text-emerald-200 font-semibold text-xs tracking-wider uppercase">Active Farmers</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-3xl sm:text-5xl font-black mb-1">{stats.products}+</p>
              <p className="text-emerald-200 font-semibold text-xs tracking-wider uppercase">Certified Inputs</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-3xl sm:text-5xl font-black mb-1">{stats.orders.toLocaleString()}+</p>
              <p className="text-emerald-200 font-semibold text-xs tracking-wider uppercase">Orders Completed</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-3xl sm:text-5xl font-black mb-1">{stats.satisfaction}%</p>
              <p className="text-emerald-200 font-semibold text-xs tracking-wider uppercase">Farmer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section (Live from Database) */}
      <section id="featured" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Top Rated by Farmers
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">
                Featured Fertilizer & Crop Protection
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-xl">
                Ready stock available at retail prices with instant home delivery or store counter pickup.
              </p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-all"
            >
              <span>View All Products</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                        {prod.type}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        Supplier: {prod.supplier || 'Syngenta'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {prod.description || 'High-grade agricultural input designed to maximize soil absorption and crop vigor.'}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Retail Price</span>
                      <span className="text-2xl font-black text-emerald-700">₹{(parseFloat(prod.price) || 0).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => navigate('/shop')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Leaf className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                <p>Loading featured products catalog...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Smart Farmer Tools & Services Grid */}
      <section id="services" className="py-20 bg-slate-50 border-t border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              Why Farmers Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3">
              Comprehensive Farm Support Hub
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Beyond products, we provide technical agricultural intelligence to ensure every rupee spent translates into healthy crops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fertilizer Compatibility Engine</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Check whether chemical fertilizers and pesticides can be safely tank-mixed before spraying to avoid crop scorching.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Seasonal Credit (Pay Later)</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Registered farmers enjoy interest-free and flexible credit terms with repayment scheduled upon crop harvest.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Cloud className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Weather & Government Schemes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Instant advisories for PM-KISAN, Soil Health Card subsidies, and localized weather forecasts for fertilizer timing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Store Location & Hours Section */}
      <section id="store-details" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-[3rem] p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/50">
                  Visit Our Physical Store
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-4 leading-tight">
                  AgriFert Agro Center & Fertilizer Depot
                </h2>
                <p className="text-emerald-100/90 text-sm mt-3 leading-relaxed">
                  Walk in for free soil testing consultation, bulk fertilizer booking, and direct seed procurement.
                </p>

                <div className="space-y-4 mt-8 text-sm">
                  <div className="flex items-start space-x-3.5">
                    <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Main Market Depot</span>
                      <span className="text-emerald-200 text-xs">Shop #4, Agricultural Market Yard, Main Road, AP, India</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Store Working Hours</span>
                      <span className="text-emerald-200 text-xs">Monday to Saturday: 7:00 AM - 8:30 PM (Sunday Open during Sowing Season)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <PhoneCall className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">Order via Phone / WhatsApp</span>
                      <span className="text-emerald-200 text-xs">+91 98765 43210 (Quick WhatsApp Bill Booking Available)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/shop')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg"
                  >
                    Browse Catalog Online
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-all"
                  >
                    Register as Farmer
                  </button>
                </div>
              </div>

              {/* Quick Contact & Farmer Benefits Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 space-y-5">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>Farmer Membership Benefits</span>
                </h3>
                <ul className="space-y-3.5 text-xs text-emerald-100">
                  <li className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Access to wholesale distributor pricing on bulk NPK and Urea</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Free SMS and WhatsApp alerts on crop disease outbreaks</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Eligible for seasonal credit lines with 0% advance booking deposit</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Printed GST invoice with QR code verification on every purchase</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Leaf className="w-6 h-6 text-emerald-500" />
                <span className="text-lg font-black text-white">AgriFert Hub</span>
              </div>
              <p className="text-gray-400 leading-relaxed text-xs">
                Your trusted regional agricultural partner for genuine agro-chemicals, micro-nutrients, and hybrid seeds.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">Products Catalog</Link></li>
                <li><Link to="/mobile-app" className="hover:text-emerald-400 transition-colors">Mobile App</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Farmer Login</Link></li>
                <li><Link to="/signup" className="hover:text-emerald-400 transition-colors">New Registration</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Shop Services</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-400">Fertilizer Mixing Advisory</span></li>
                <li><span className="text-gray-400">Crop Health Diagnosis</span></li>
                <li><span className="text-gray-400">Farmer Credit Management</span></li>
                <li><span className="text-gray-400">Bulk Sowing Bookings</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">Helpline Support</h4>
              <p className="text-gray-400 mb-2">Available 7 AM - 9 PM daily</p>
              <p className="text-emerald-400 font-bold text-sm">+91 98765 43210</p>
              <p className="text-gray-500 mt-1">support@agrifert-shop.com</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-500">
            <p>© {new Date().getFullYear()} AgriFert Management System. All rights reserved.</p>
            <p className="flex items-center space-x-1 text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Govt. Fertilizer License Valid & Certified</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Landing
