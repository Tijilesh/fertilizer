import { useState } from 'react'
import { Plus, Search, Phone, Mail, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

const Customers = () => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'Ravi Kumar',
      phone: '9876543210',
      email: 'ravi.kumar@email.com',
      creditLimit: 10000,
      currentCredit: 5000,
      dueDate: '2024-01-15',
      status: 'overdue',
      lastPurchase: '2024-01-10'
    },
    {
      id: 2,
      name: 'Sita Devi',
      phone: '9123456780',
      email: 'sita.devi@email.com',
      creditLimit: 8000,
      currentCredit: 3000,
      dueDate: '2024-01-20',
      status: 'due',
      lastPurchase: '2024-01-12'
    },
    {
      id: 3,
      name: 'Amit Patel',
      phone: '9456781230',
      email: 'amit.patel@email.com',
      creditLimit: 15000,
      currentCredit: 1500,
      dueDate: '2024-01-25',
      status: 'due',
      lastPurchase: '2024-01-14'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </span>
      case 'due':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Calendar className="h-3 w-3 mr-1" />
          Due Soon
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Good Standing
        </span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="overdue">Overdue</option>
          <option value="due">Due Soon</option>
          <option value="good">Good Standing</option>
        </select>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Phone className="h-4 w-4 mr-1" />
                  {customer.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  {customer.email}
                </div>
              </div>
              {getStatusBadge(customer.status)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credit Limit:</span>
                <span className="font-medium">₹{customer.creditLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Credit:</span>
                <span className={`font-medium ${customer.currentCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{customer.currentCredit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{customer.dueDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Purchase:</span>
                <span className="font-medium">{customer.lastPurchase}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                  Send Reminder
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100">
                  View History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Customers
