import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, ShoppingCart, Search, Trash2 } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Sales = ({ sales, onRefresh }) => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  const handleDeleteSale = async (saleId) => {
    if (window.confirm('Delete this sale? This action cannot be undone.')) {
      try {
        await api.delete(`/sales/${saleId}`)
        toast.success('Sale deleted successfully')
        onRefresh()
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete sale')
      }
    }
  }

  const salesList = Array.isArray(sales) ? sales : []

  const filteredSales = salesList.filter(sale => {
    const customerName = (sale.customer_name || '').toLowerCase()
    const customerPhone = (sale.customer_phone || '').toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    const saleId = (sale.id || '').toString().toLowerCase()

    return customerName.includes(searchLower) ||
      customerPhone.includes(searchLower) ||
      saleId.includes(searchLower)
  })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex justify-between items-center transition-all duration-300 premium-hover">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{t('sales')}</h1>
            <p className="text-blue-100 mt-1 opacity-90">{t('manageSalesDesc') || 'Track and manage your customer transactions'}</p>
          </div>
        </div>
        <Link to="/sales/add" className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <Plus className="w-5 h-5" />
          <span>{t('recordSale')}</span>
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card premium-shadow p-6 rounded-2xl border">
        <div className="max-w-md">
          <label className="block text-sm font-bold text-gray-700 mb-2">{t('searchSales') || 'Search Sales'}</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder={t('searchSalesPlaceholder') || 'Search by customer name, phone, or sale ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card premium-shadow rounded-2xl border overflow-hidden">
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('saleId') || 'Sale ID'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('date')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('items')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('method')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('totalAmountLabel')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-widest">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customer_name || 'Anonymous'}
                        </div>
                        {sale.customer_phone && (
                          <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.items || 'Multiple items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.payment_method || 'Cash'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{(parseFloat(sale.total_amount) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{t('view') || 'View'}</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900 flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('delete') || 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noSalesFound') || 'No sales found'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? t('adjustSearchCriteria') || 'Try adjusting your search criteria.'
                : t('getStartedRecordingSale') || 'Get started by recording your first sale.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link to="/sales/add" className="btn-primary">
                  {t('recordSale')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sales 
