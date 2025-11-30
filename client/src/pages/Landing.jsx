import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Leaf, Tractor, Sprout, Shield, Users, Award, Truck, BarChart3, Brain, Zap, Star, Quote, TrendingUp, MapPin, Phone, Mail, CheckCircle, Play } from 'lucide-react'

const Landing = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Leaf className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">Fertilizer Shop</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Empowering Agriculture with
            <span className="text-green-600"> Quality Fertilizers</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your trusted partner in agricultural solutions. We provide premium fertilizers,
            expert guidance, and comprehensive farming support to help you achieve bountiful harvests.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-700 hover:text-white font-semibold text-lg transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Fertilizer Shop</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We are committed to supporting farmers and agricultural businesses with high-quality fertilizers
              and innovative solutions that drive productivity and sustainability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assurance</h3>
              <p className="text-gray-600">All our products meet the highest quality standards and are thoroughly tested.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">Our team of agricultural experts provides personalized guidance and recommendations.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Reliable and timely delivery to ensure your farming operations run smoothly.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">We stay ahead with the latest fertilizer technologies and sustainable practices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Comprehensive agricultural solutions for modern farming</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fertilizer Supply</h3>
              <p className="text-gray-600">Wide range of fertilizers including NPK, urea, organic compost, and specialty blends.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Smart Assistant</h3>
              <p className="text-gray-600">AI-powered farming recommendations based on weather, soil type, and crop data.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Crop Consulting</h3>
              <p className="text-gray-600">Expert advice on crop nutrition, soil health, and optimal fertilizer application.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Tractor className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Farm Management</h3>
              <p className="text-gray-600">Comprehensive farm management solutions including inventory tracking and analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Farmers Across India</h2>
            <p className="text-xl text-green-100">Join thousands of successful farmers using our platform</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.farmers.toLocaleString()}+</div>
              <div className="text-green-100">Happy Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.products}+</div>
              <div className="text-green-100">Fertilizer Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.orders.toLocaleString()}+</div>
              <div className="text-green-100">Orders Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.satisfaction}%</div>
              <div className="text-green-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Farmers Say</h2>
            <p className="text-lg text-gray-600">Real stories from farmers who trust Fertilizer Shop</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-green-600 mr-3" />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The AI crop recommendations helped me increase my wheat yield by 25%. The fertilizer suggestions were spot-on for my soil type."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">RK</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Rajesh Kumar</div>
                  <div className="text-sm text-gray-500">Wheat Farmer, Punjab</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-green-600 mr-3" />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "The disease detection feature saved my tomato crop from complete destruction. Quick diagnosis and treatment recommendations!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">SD</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sunita Devi</div>
                  <div className="text-sm text-gray-500">Vegetable Farmer, Karnataka</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-green-600 mr-3" />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Voice input makes it so easy for farmers like me who aren't tech-savvy. The government schemes section is incredibly helpful."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">MP</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mohan Prasad</div>
                  <div className="text-sm text-gray-500">Rice Farmer, Andhra Pradesh</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Modern Farming</h2>
            <p className="text-lg text-gray-600">Everything you need to maximize your farm's potential</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Crop Intelligence</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Smart Fertilizer Recommendations</h4>
                    <p className="text-gray-600">Get personalized fertilizer suggestions based on your crop, soil, and season.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Disease Detection</h4>
                    <p className="text-gray-600">Upload plant photos for instant disease diagnosis and treatment advice.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Voice Commands</h4>
                    <p className="text-gray-600">Navigate and input data using voice commands - perfect for rural farmers.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Government Schemes</h4>
                    <p className="text-gray-600">Access information about subsidies, loans, and farmer support programs.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">AI Smart Assistant</h4>
                <p className="text-gray-600">Your 24/7 farming companion powered by advanced AI</p>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 italic">"What's the best fertilizer for paddy in monsoon season?"</p>
                </div>
                <div className="bg-green-600 p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-white">Based on your location and season, I recommend NPK 20-10-10 with zinc supplement. Apply 50kg per acre.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 italic">"How to identify tomato leaf curl virus?"</p>
                </div>
                <div className="bg-green-600 p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-white">Upload a photo of the affected leaves for instant diagnosis, or look for yellowing and curling symptoms.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Boost Your Farm's Productivity?</h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers who trust Fertilizer Shop for their agricultural needs.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-colors"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold">Fertilizer Shop</span>
          </div>
          <p className="text-center text-gray-400">
            © 2024 Fertilizer Shop. Empowering agriculture, nurturing growth.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing