import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Shield, Zap, Globe, Users, TrendingUp, ChevronRight,
  Star, ArrowRight, CheckCircle2, Package, Smartphone, BarChart3,
  Cloud, MessageSquare, Heart, ShieldCheck, Award, Leaf, Sprout,
  Tractor, Brain, Quote, RefreshCcw, Sparkles, Sun, CloudRain, Wind,
  Info, Bot
} from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const Landing = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ farmers: 0, products: 0, orders: 0, satisfaction: 0 })

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
      setStats(prev => {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">AgriFert</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/shop" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">{t('shopNow')}</Link>
              <Link to="/mobile" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">{t('getTheApp') || 'Mobile App'}</Link>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-emerald-600 font-medium transition-colors"
              >
                {t('login') || 'Login'}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                {t('getStarted') || 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-emerald-50 rounded-l-[100px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{t('trustedByFarmers') || 'Trusted by 50,000+ Farmers'}</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900">
                {t('landingHeroTitle') || 'Modern Solutions for'} <br />
                <span className="text-emerald-600">{t('landingHeroSubtitle') || 'Superior Farming'}</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                {t('landingHeroDesc') || 'Empowering farmers and shop owners with smart tools to manage inventory, sales, and crop health in one unified platform.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/shop')}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <span>{t('shopNow')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/mobile')}
                  className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{t('getTheApp') || 'Get Mobile App'}</span>
                  <Smartphone className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative group">
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden premium-shadow transition-all duration-500 group-hover:shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1470&auto=format&fit=crop"
                  alt="Farmer using technology"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 z-20 glass-card premium-shadow p-8 rounded-3xl border border-white/40 animate-vibrant">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">+25% Yield</p>
                    <p className="text-xs text-gray-500">Average Improvement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-emerald-600 py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 border-4 border-white rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2">{stats.farmers.toLocaleString()}+</p>
              <p className="text-emerald-100 font-medium uppercase tracking-wider text-sm">{t('happyFarmers') || 'Happy Farmers'}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2">{stats.products}+</p>
              <p className="text-emerald-100 font-medium uppercase tracking-wider text-sm">{t('productsAvailable') || 'Products'}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2">{stats.orders.toLocaleString()}+</p>
              <p className="text-emerald-100 font-medium uppercase tracking-wider text-sm">{t('ordersDelivered') || 'Orders'}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2">{stats.satisfaction}%</p>
              <p className="text-emerald-100 font-medium uppercase tracking-wider text-sm">{t('satisfactionRate') || 'Satisfaction'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('powerfulFeatures') || 'Smart Tools for Better Yield'}</h2>
            <p className="text-lg text-gray-600">
              {t('featureDesc') || 'Everything you need to maximize your farm\'s potential through advanced technology and expert guidance.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card premium-shadow p-10 rounded-3xl border border-white/20 hover:shadow-2xl transition-all duration-500 group premium-hover">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all duration-300">
                <Brain className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('aiCropInsights') || 'AI Assistant'}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{t('aiDesc') || 'Get personalized fertilizer recommendations and crop health diagnosis powered by advanced AI.'}</p>
            </div>

            <div className="glass-card premium-shadow p-10 rounded-3xl border border-white/20 hover:shadow-2xl transition-all duration-500 group premium-hover">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-300">
                <Cloud className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('weatherForecast') || 'Weather Alerts'}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{t('weatherDesc') || 'Real-time hyper-local weather alerts to help you plan your farm activities precisely.'}</p>
            </div>

            <div className="glass-card premium-shadow p-10 rounded-3xl border border-white/20 hover:shadow-2xl transition-all duration-500 group premium-hover">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-600 transition-all duration-300">
                <Smartphone className="w-10 h-10 text-orange-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('voiceControl') || 'Voice Guided'}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">{t('voiceDesc') || 'Full control using voice commands in your local language. No typing required.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-900 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Sprout className="w-64 h-64 text-emerald-400 rotate-12" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 relative z-10">
              {t('ctaTitle') || 'Ready to Grow Your Harvest?'}
            </h2>
            <p className="text-xl text-emerald-100 mb-12 max-w-2xl mx-auto relative z-10">
              {t('ctaDesc') || 'Join thousands of farmers already using AgriFert to transform their agricultural practices and increase their income.'}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <button
                onClick={() => navigate('/signup')}
                className="bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl"
              >
                {t('getStarted') || 'Start for Free'}
              </button>
              <button
                onClick={() => navigate('/shop')}
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                {t('viewProducts') || 'View Products'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <Leaf className="w-6 h-6 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">AgriFert</span>
            </div>
            <div className="flex space-x-8">
              <Link to="/about" className="text-gray-500 hover:text-emerald-600 text-sm">{t('aboutUs') || 'About'}</Link>
              <Link to="/contact" className="text-gray-500 hover:text-emerald-600 text-sm">{t('contact') || 'Contact'}</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-emerald-600 text-sm">{t('privacy') || 'Privacy'}</Link>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AgriFert. {t('allRightsReserved') || 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
