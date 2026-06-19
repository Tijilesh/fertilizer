import { useState, useEffect } from 'react'
import { Plus, Search, CreditCard, DollarSign, Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown, Trash2, Edit } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import PromptModal from '../../components/common/PromptModal'
import { DEMO_PAYMENTS, paymentMethods } from '../../data/demoData'

const Payments = () => {
  const { t } = useLanguage()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ sale_id: '', purchase_order_id: '', amount: '', payment_method: 'Cash', payment_type: 'income', status: 'completed', notes: '' })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments')
      setPayments(response.data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error(t('failedToFetchData') || 'Failed to fetch payments. Using demo data.')
      setPayments(DEMO_PAYMENTS)
    } finally {
      setLoading(false)
    }
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = (payment.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    const matchesMethod = filterMethod === 'all' || (payment.payment_method || '').toLowerCase().includes(filterMethod.toLowerCase())
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('completed')}
        </span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          {t('pending')}
        </span>
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          {t('processingLabel')}
        </span>
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('failedLabel')}
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
    }
  }

  const getMethodIcon = (method) => {
    const methodData = paymentMethods.find(m => m.id === method.toLowerCase() || m.name.toLowerCase().includes(method.toLowerCase()))
    if (methodData) {
      const Icon = methodData.icon
      return <Icon className="h-4 w-4" />
    }
    return <DollarSign className="h-4 w-4" />
  }

  const totalIncome = payments.filter(p => p.payment_type === 'income' && p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const totalExpense = payments.filter(p => p.payment_type === 'expense' && p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const netProfit = totalIncome - totalExpense

  const [promptOpen, setPromptOpen] = useState(false)
  const [promptDefault, setPromptDefault] = useState('')
  const [promptHandler, setPromptHandler] = useState(() => {})

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('paymentManagement')}</h1>
        <button onClick={() => setShowAddPayment(!showAddPayment)} className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          {t('recordPayment')}
        </button>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalIncome') || 'Total Income'}</p>
              <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalExpense') || 'Total Expense'}</p>
              <p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('netProfit') || 'Net Balance'}</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                ₹{netProfit.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Form */}
      {showAddPayment && (
        <div className="glass-card premium-shadow p-6 rounded-2xl border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recordPayment')}</h3>
          <form onSubmit={async (e) => {
            e.preventDefault()
            try {
              await api.post('/payments', { ...newPayment, amount: parseFloat(newPayment.amount) })
              toast.success(t('paymentRecordedSuccess') || 'Payment recorded successfully')
              setShowAddPayment(false)
              setNewPayment({ sale_id: '', purchase_order_id: '', amount: '', payment_method: 'Cash', payment_type: 'income', status: 'completed', notes: '' })
              fetchPayments()
            } catch (error) {
              toast.error(error.response?.data?.error || 'Failed to record payment')
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder={t('amount') || 'Amount'} value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} required className="px-3 py-2 border rounded-lg" />
              <select value={newPayment.payment_method} onChange={(e) => setNewPayment({...newPayment, payment_method: e.target.value})} className="px-3 py-2 border rounded-lg">
                <option value="Cash">{t('cash') || 'Cash'}</option>
                <option value="UPI">UPI</option>
                <option value="Card">{t('card') || 'Card'}</option>
                <option value="Bank Transfer">{t('transfer') || 'Bank Transfer'}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select value={newPayment.payment_type} onChange={(e) => setNewPayment({...newPayment, payment_type: e.target.value})} className="px-3 py-2 border rounded-lg">
                <option value="income">{t('saleIncome') || 'Income'}</option>
                <option value="expense">{t('purchaseExpense') || 'Expense'}</option>
              </select>
              <input type="text" placeholder={t('notes') || 'Notes'} value={newPayment.notes} onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})} className="px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{t('save')}</button>
              <button type="button" onClick={() => setShowAddPayment(false)} className="btn-secondary">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPaymentsPlaceholder')}
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
          <option value="all">{t('allStatus')}</option>
          <option value="completed">{t('completed')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="processing">{t('processingLabel')}</option>
          <option value="failed">{t('failedLabel')}</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">{t('allMethods')}</option>
          <option value="cash">{t('cash') || 'Cash'}</option>
          <option value="upi">UPI</option>
          <option value="card">{t('card') || 'Card'}</option>
          <option value="transfer">{t('transfer') || 'Bank Transfer'}</option>
        </select>
      </div>

      {/* Payment Methods */}
      <div className="glass-card premium-shadow p-6 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentMethodsTitle')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 mr-3">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-900">{t('cash') || 'Cash'}</span>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-900">UPI</span>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 mr-3">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-900">{t('card') || 'Card'}</span>
          </div>
          <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 mr-3">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="font-medium text-gray-900">{t('transfer') || 'Bank Transfer'}</span>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="glass-card premium-shadow rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('recentPayments')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('method')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reference')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.payment_type === 'income' ? payment.customer_name : payment.supplier_name}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      {payment.payment_type === 'income' ? t('saleIncome') || 'Sale Income' : t('purchaseExpense') || 'Purchase Expense'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${payment.payment_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {payment.payment_type === 'income' ? '+' : '-'} ₹{parseFloat(payment.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMethodIcon(payment.payment_method)}
                      <span className="ml-2 text-sm text-gray-900">{payment.payment_method}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_type === 'income' ? `SALE #${payment.sale_id}` : `PO #${payment.purchase_order_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setPromptDefault(payment.status)
                          setPromptHandler(() => async (val) => {
                            if (!val) return
                            try {
                              await api.put(`/payments/${payment.id}`, { status: val })
                              toast.success('Payment updated')
                              fetchPayments()
                            } catch (e) {
                              toast.error(e.response?.data?.error || 'Failed to update')
                            } finally {
                              setPromptOpen(false)
                            }
                          })
                          setPromptOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" /> {t('edit') || 'Edit'}
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete this payment?')) {
                            api.delete(`/payments/${payment.id}`)
                              .then(() => { toast.success('Payment deleted'); fetchPayments() })
                              .catch(e => toast.error(e.response?.data?.error || 'Failed to delete'))
                          }
                        }}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> {t('delete') || 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CreditCard className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPaymentsFound')}</h3>
          <p className="text-gray-600">{t('adjustSearchFilter')}</p>
        </div>
      )}
      <PromptModal
        open={promptOpen}
        title={'Update Payment Status'}
        defaultValue={promptDefault}
        placeholder={'completed/pending/processing/failed'}
        onCancel={() => setPromptOpen(false)}
        onConfirm={(val) => {
          if (typeof promptHandler === 'function') promptHandler(val)
        }}
      />
    </div>
  )
}

export default Payments
