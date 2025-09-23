import { useState } from 'react'
import { Smartphone, Download, QrCode, Wifi, Cloud, Shield, Zap, Globe } from 'lucide-react'

const MobileApp = () => {
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
        <h1 className="text-3xl font-bold text-gray-900">Mobile App Integration</h1>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <QrCode className="h-4 w-4 mr-2" />
            Download QR
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download App
          </button>
        </div>
      </div>

      {/* App Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Fertilizer Shop Mobile App</h2>
            <p className="text-blue-100 mb-4">Manage your business from anywhere with our powerful mobile application</p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                <span>Available on iOS & Android</span>
              </div>
              <div className="flex items-center">
                <Wifi className="h-5 w-5 mr-2" />
                <span>Real-time sync</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center">
              <Smartphone className="h-16 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* App Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.downloads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.dailyTransactions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">App Rating</p>
              <p className="text-2xl font-bold text-gray-900">{appStats.averageRating}/5.0</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* App Features */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile App Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className={`p-3 rounded-lg ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    {feature.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Mobile Activities */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Mobile Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">by {activity.user}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{activity.time}</p>
                {(activity.amount || activity.product || activity.customer) && (
                  <p className="text-sm font-medium text-gray-900">
                    {activity.amount || activity.product || activity.customer}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">iOS Users</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Open App Store on your iPhone</li>
              <li>Search for "Fertilizer Shop Manager"</li>
              <li>Tap "Get" to download the app</li>
              <li>Use Face ID or Touch ID to authenticate</li>
              <li>Open the app and sign in with your credentials</li>
            </ol>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Android Users</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Open Google Play Store on your device</li>
              <li>Search for "Fertilizer Shop Manager"</li>
              <li>Tap "Install" to download the app</li>
              <li>Grant necessary permissions when prompted</li>
              <li>Open the app and sign in with your credentials</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileApp
