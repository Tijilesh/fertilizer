import { useState } from 'react'
import { Smartphone, Download, QrCode, Wifi, Cloud, Shield, Zap, Globe } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const MobileApp = () => {
  const { t } = useLanguage()
  const [appFeatures] = useState([
    {
      id: 1,
      title: 'Quick Billing & Delivery',
      description: 'Process sales and track deliveries on the go',
      icon: Zap,
      color: 'bg-blue-100 text-blue-600',
      status: 'active'
    },
    {
      id: 2,
      title: 'Inventory Management',
      description: 'Update stock levels and track products remotely',
      icon: Cloud,
      color: 'bg-green-100 text-green-600',
      status: 'active'
    },
    {
      id: 3,
      title: 'Customer Management',
      description: 'Access customer data and credit information',
      icon: Shield,
      color: 'bg-purple-100 text-purple-600',
      status: 'active'
    },
    {
      id: 4,
      title: 'Payment Processing',
      description: 'Accept payments through mobile devices',
      icon: Globe,
      color: 'bg-orange-100 text-orange-600',
      status: 'active'
    }
  ])

  const [appStats] = useState({
    downloads: 1250,
    activeUsers: 890,
    dailyTransactions: 45,
    averageRating: 4.8
  })

  const [recentActivities] = useState([
    {
      id: 1,
      action: 'Sale completed',
      user: 'Ravi Kumar',
      time: '2 minutes ago',
      amount: '₹2,400'
    },
    {
      id: 2,
      action: 'Stock updated',
      user: 'Priya Sharma',
      time: '5 minutes ago',
      product: 'NPK 20-20-20'
    },
    {
      id: 3,
      action: 'Payment received',
      user: 'Amit Patel',
      time: '10 minutes ago',
      amount: '₹1,500'
    },
    {
      id: 4,
      action: 'Customer added',
      user: 'Sita Devi',
      time: '15 minutes ago',
      customer: 'New customer'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('mobileAppIntegration')}</h1>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <QrCode className="h-4 w-4 mr-2" />
            {t('downloadQR')}
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            {t('downloadApp')}
          </button>
        </div>
      </div>

      {/* App Overview */}
      <div className="glass-card bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white premium-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('appTitle') || 'Fertilizer Shop Mobile App'}</h2>
            <p className="text-blue-50 mb-4">{t('mobileAppDesc')}</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-blue-200" />
                <span className="font-medium">{t('availableOnIOSAndroid')}</span>
              </div>
              <div className="flex items-center">
                <Wifi className="h-5 w-5 mr-2 text-blue-200" />
                <span className="font-medium">{t('realTimeSync')}</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl animate-vibrant">
              <Smartphone className="h-16 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* App Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalDownloads')}</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.downloads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('activeUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dailyTransactions')}</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.dailyTransactions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('appRating')}</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.averageRating}/5.0</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* App Features */}
      <div className="glass-card premium-shadow p-6 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('mobileAppFeatures')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.id} className="flex items-start space-x-4 p-5 border border-gray-100 rounded-xl hover:bg-white/50 transition-all duration-300 premium-hover shadow-sm">
                <div className={`p-3 rounded-xl ${feature.color} shadow-inner`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100/80 text-green-800 mt-3 border border-green-200">
                    {feature.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Mobile Activities */}
      <div className="glass-card premium-shadow p-6 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recentMobileActivities')}</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/20 hover:bg-white/60 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100/80 rounded-full flex items-center justify-center border border-blue-200 shadow-inner">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">by {activity.user}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">{activity.time}</p>
                {(activity.amount || activity.product || activity.customer) && (
                  <p className="text-sm font-bold text-gray-900">
                    {activity.amount || activity.product || activity.customer}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download Instructions */}
      <div className="glass-card premium-shadow p-6 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('downloadInstructions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-white/40 p-5 rounded-2xl border border-white/30">
            <h4 className="font-bold text-gray-900 flex items-center">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-md flex items-center justify-center text-xs mr-2">iOS</div>
              {t('iosUsers')}
            </h4>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start"><span className="font-bold mr-2">1.</span> Open App Store on your iPhone</li>
              <li className="flex items-start"><span className="font-bold mr-2">2.</span> Search for "Fertilizer Shop Manager"</li>
              <li className="flex items-start"><span className="font-bold mr-2">3.</span> Tap "Get" to download the app</li>
              <li className="flex items-start"><span className="font-bold mr-2">4.</span> Use Face ID or Touch ID to authenticate</li>
              <li className="flex items-start"><span className="font-bold mr-2">5.</span> Open the app and sign in with your credentials</li>
            </ol>
          </div>
          <div className="space-y-4 bg-white/40 p-5 rounded-2xl border border-white/30">
            <h4 className="font-bold text-gray-900 flex items-center">
              <div className="w-6 h-6 bg-green-600 text-white rounded-md flex items-center justify-center text-xs mr-2">D</div>
              {t('androidUsers')}
            </h4>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start"><span className="font-bold mr-2">1.</span> Open Google Play Store on your device</li>
              <li className="flex items-start"><span className="font-bold mr-2">2.</span> Search for "Fertilizer Shop Manager"</li>
              <li className="flex items-start"><span className="font-bold mr-2">3.</span> Tap "Install" to download the app</li>
              <li className="flex items-start"><span className="font-bold mr-2">4.</span> Grant necessary permissions when prompted</li>
              <li className="flex items-start"><span className="font-bold mr-2">5.</span> Open the app and sign in with your credentials</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileApp
