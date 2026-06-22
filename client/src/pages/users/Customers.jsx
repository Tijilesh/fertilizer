import { useState, useEffect } from 'react'
import { Search, Phone, Mail, Calendar, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const Customers = ({ sales }) => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [customerOverrides, setCustomerOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('customerOverrides')) || {}
    } catch {
      return {}
    }
  })
  const [deletedCustomerIds, setDeletedCustomerIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('deletedCustomerIds')) || []
    } catch {
      return []
    }
  })
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    localStorage.setItem('customerOverrides', JSON.stringify(customerOverrides))
  }, [customerOverrides])

  useEffect(() => {
    localStorage.setItem('deletedCustomerIds', JSON.stringify(deletedCustomerIds))
  }, [deletedCustomerIds])

  const salesList = Array.isArray(sales) ? sales : []

  // Derive unique customers from sales
  const customerMap = new Map()

  // Add some demo customers initially if no sales
  const demoCustomers = [
    { id: 1, name: 'Ravi Kumar', phone: '9876543210', email: 'ravi.kumar@email.com', creditLimit: 10000, currentCredit: 5000, dueDate: '2024-01-15', status: 'overdue', lastPurchase: '2024-01-10' },
    { id: 2, name: 'Sita Devi', phone: '9123456780', email: 'sita.devi@email.com', creditLimit: 8000, currentCredit: 3000, dueDate: '2024-01-20', status: 'due', lastPurchase: '2024-01-12' },
    { id: 3, name: 'Amit Patel', phone: '9456781230', email: 'amit.patel@email.com', creditLimit: 15000, currentCredit: 1500, dueDate: '2024-01-25', status: 'due', lastPurchase: '2024-01-14' }
  ]

  demoCustomers.forEach(c => customerMap.set(c.name, c))

  salesList.forEach(sale => {
    if (sale.customer_name) {
      const existing = customerMap.get(sale.customer_name)
      customerMap.set(sale.customer_name, {
        id: existing?.id || sale.id,
        name: sale.customer_name,
        phone: sale.customer_phone || existing?.phone || 'No phone',
        email: existing?.email || 'N/A',
        creditLimit: existing?.creditLimit || 10000,
        currentCredit: existing?.currentCredit || 0,
        dueDate: existing?.dueDate || 'N/A',
        status: existing?.status || 'good',
        lastPurchase: sale.sale_date ? new Date(sale.sale_date).toISOString().split('T')[0] : (existing?.lastPurchase || 'N/A')
      })
    }
  })

  const customersList = Array.from(customerMap.values())
    .map(customer => ({
      ...customer,
      ...(customerOverrides[customer.id] || {})
    }))
    .filter(customer => !deletedCustomerIds.includes(customer.id))

  const filteredCustomers = customersList.filter(customer => {
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
          {t('overdueLabel')}
        </span>
      case 'due':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Calendar className="h-3 w-3 mr-1" />
          {t('dueSoon')}
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('goodStanding')}
        </span>
    }
  }

  const openEditModal = (customer) => {
    setEditingCustomer({ ...customer })
  }

  const closeEditModal = () => setEditingCustomer(null)

  const saveEditedCustomer = () => {
    if (!editingCustomer) return
    setCustomerOverrides(prev => ({
      ...prev,
      [editingCustomer.id]: {
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        email: editingCustomer.email,
        creditLimit: Number(editingCustomer.creditLimit) || 0,
        currentCredit: Number(editingCustomer.currentCredit) || 0,
        dueDate: editingCustomer.dueDate,
        status: (editingCustomer.status || 'good').toLowerCase(),
        lastPurchase: editingCustomer.lastPurchase
      }
    }))
    closeEditModal()
  }

  const handleDeleteCustomer = (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return

    setDeletedCustomerIds(prev => [...prev, customer.id])
    setCustomerOverrides(prev => {
      const next = { ...prev }
      delete next[customer.id]
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('customerManagement')}</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 glass-card premium-shadow p-6 rounded-2xl border">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          <input
            type="text"
            placeholder={t('searchCustomersPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm font-medium text-gray-700"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="overdue">{t('overdueLabel')}</option>
          <option value="due">{t('dueSoon')}</option>
          <option value="good">{t('goodStanding')}</option>
        </select>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="glass-card premium-shadow premium-hover p-6 rounded-2xl border transition-all duration-300">
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
                <span className="text-gray-600">{t('creditLimitLabel')}:</span>
                <span className="font-medium">₹{customer.creditLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('currentCreditLabel')}:</span>
                <span className={`font-medium ${customer.currentCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{customer.currentCredit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('dueDateLabel')}:</span>
                <span className="font-medium">{customer.dueDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('lastPurchaseLabel')}:</span>
                <span className="font-medium">{customer.lastPurchase}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <button className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                  {t('sendReminder')}
                </button>
                <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100">
                  {t('viewHistory')}
                </button>
                <button
                  onClick={() => openEditModal(customer)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" value={editingCustomer.name} onChange={e => setEditingCustomer(prev => ({ ...prev, name: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingCustomer.phone} onChange={e => setEditingCustomer(prev => ({ ...prev, phone: e.target.value }))} />
              <input className="w-full p-2 border rounded" value={editingCustomer.email} onChange={e => setEditingCustomer(prev => ({ ...prev, email: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full p-2 border rounded" value={editingCustomer.creditLimit} onChange={e => setEditingCustomer(prev => ({ ...prev, creditLimit: e.target.value }))} />
                <input className="w-full p-2 border rounded" value={editingCustomer.currentCredit} onChange={e => setEditingCustomer(prev => ({ ...prev, currentCredit: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full p-2 border rounded" value={editingCustomer.dueDate} onChange={e => setEditingCustomer(prev => ({ ...prev, dueDate: e.target.value }))} />
                <input className="w-full p-2 border rounded" value={editingCustomer.lastPurchase} onChange={e => setEditingCustomer(prev => ({ ...prev, lastPurchase: e.target.value }))} />
              </div>
              <input className="w-full p-2 border rounded" value={editingCustomer.status} onChange={e => setEditingCustomer(prev => ({ ...prev, status: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeEditModal} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={saveEditedCustomer} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCustomersFound') || 'No customers found'}</h3>
          <p className="text-gray-600">{t('adjustSearchFilter')}</p>
        </div>
      )}
    </div>
  )
}

export default Customers
