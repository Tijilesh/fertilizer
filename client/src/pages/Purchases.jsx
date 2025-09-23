import { useState } from 'react'
import { Plus, Search, Building, Phone, Mail, Calendar, Package, DollarSign } from 'lucide-react'

const Purchases = () => {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'AgroChem Industries',
      contact: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh@agrochem.com',
      address: 'Mumbai, Maharashtra',
      creditLimit: 50000,
      currentBalance: 15000,
      lastOrder: '2024-01-10',
      status: 'active'
    },
    {
      id: 2,
      name: 'GreenGrow Solutions',
      contact: 'Priya Sharma',
      phone: '9123456780',
      email: 'priya@greengrow.com',
      address: 'Pune, Maharashtra',
      creditLimit: 75000,
      currentBalance: 0,
      lastOrder: '2024-01-12',
      status: 'active'
    },
    {
      id: 3,
      name: 'EcoFarms Ltd',
      contact: 'Amit Patel',
      phone: '9456781230',
      email: 'amit@ecofarms.com',
      address: 'Nashik, Maharashtra',
      creditLimit: 100000,
      currentBalance: 25000,
      lastOrder: '2024-01-08',
      status: 'active'
    }
  ])

  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 1,
      supplier: 'AgroChem Industries',
      orderDate: '2024-01-10',
      deliveryDate: '2024-01-15',
      totalAmount: 25000,
      status: 'pending',
      items: [
        { name: 'NPK 20-20-20', quantity: 20, price: 1200 },
        { name: 'Urea', quantity: 15, price: 900 }
      ]
    },
    {
      id: 2,
      supplier: 'GreenGrow Solutions',
      orderDate: '2024-01-12',
      deliveryDate: '2024-01-18',
      totalAmount: 18000,
      status: 'delivered',
      items: [
        { name: 'Organic Compost', quantity: 25, price: 700 }
      ]
    }
  ])

  const [activeTab, setActiveTab] = useState('suppliers')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Pending
        </span>
      case 'delivered':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Delivered
        </span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Cancelled
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Purchase Orders
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === 'suppliers' ? 'Search suppliers...' : 'Search orders...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.contact}</p>
                </div>
                <Building className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {supplier.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {supplier.email}
                </div>
                <div className="text-sm text-gray-600">
                  {supplier.address}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium">₹{supplier.creditLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Balance:</span>
                  <span className={`font-medium ${supplier.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{supplier.currentBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Order:</span>
                  <span className="font-medium">{supplier.lastOrder}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                    Place Order
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100">
                    View History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {purchaseOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.supplier}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{order.items.length} items</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Order Date: {order.orderDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Delivery Date: {order.deliveryDate}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Total: ₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                    View Details
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100">
                    Track Delivery
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Purchases
