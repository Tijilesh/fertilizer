import { useState, useEffect } from 'react'
import { Plus, Search, FileText, Calculator, TrendingUp, Download } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'

import { DEMO_ACCOUNTING } from '../../data/demoData'

const Accounting = () => {
  const { t } = useLanguage()
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalGST: 0,
    totalInvoices: 0,
    invoices: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAccountingData()
  }, [])

  const fetchAccountingData = async () => {
    try {
      const response = await api.get('/accounting/summary')
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching accounting data:', error)
      toast.error('Failed to load accounting data. Using demo data.')
      setSummary(DEMO_ACCOUNTING)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = summary.invoices.filter(invoice =>
    invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toString().includes(searchTerm)
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{t('paid') || 'Paid'}</span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{t('pending') || 'Pending'}</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('accountingAndGst')}</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          {t('generateInvoice')}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalRevenueLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalGstLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalGST.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="glass-card premium-shadow p-6 rounded-xl border premium-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('totalInvoicesLabel')}</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalInvoices}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
        <input
          type="text"
          placeholder={t('searchInvoicesPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-card w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm outline-none"
        />
      </div>

      {/* Invoices List */}
      <div className="glass-card premium-shadow rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('recentInvoices')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('invoice')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('gst')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">INV-{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{invoice.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{invoice.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{invoice.gstAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{invoice.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">{t('view')}</button>
                    <button className="text-gray-600 hover:text-gray-900">{t('download')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Features */}
      <div className="glass-card premium-shadow p-8 rounded-2xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('gstFeatures')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/40 border border-white/40 rounded-2xl hover:bg-white/60 transition-all duration-300 premium-hover shadow-sm group">
            <div className="p-3 bg-blue-100/80 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{t('eInvoiceGen')}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{t('eInvoiceGenDesc') || 'Automatically generate e-invoices with QR codes'}</p>
          </div>
          <div className="p-6 bg-white/40 border border-white/40 rounded-2xl hover:bg-white/60 transition-all duration-300 premium-hover shadow-sm group">
            <div className="p-3 bg-green-100/80 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{t('autoGstCalc')}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{t('autoGstCalcDesc') || 'Automatic GST calculation based on product categories'}</p>
          </div>
          <div className="p-6 bg-white/40 border border-white/40 rounded-2xl hover:bg-white/60 transition-all duration-300 premium-hover shadow-sm group">
            <div className="p-3 bg-purple-100/80 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <Download className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{t('gstrReports')}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{t('gstrReportsDesc') || 'Generate GSTR-1 and GSTR-3B reports automatically'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Accounting
