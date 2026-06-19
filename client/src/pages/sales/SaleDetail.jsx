import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Phone, Calendar, Package } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'

const SaleDetail = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSale()
  }, [id])

  const fetchSale = async () => {
    try {
      const response = await api.get(`/sales/${id}`)
      setSale(response.data)
    } catch (error) {
      console.error('Error fetching sale:', error)
      alert(error.response?.data?.error || t('errorLoadingSale') || 'Error loading sale')
      navigate('/sales')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingSaleDetails')}</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('backToSales')}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Sale Header */}
        <div className="glass-card premium-shadow p-8 rounded-3xl border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('saleLabel') || 'Sale'} #{sale.id}</h1>
              <div className="flex items-center space-x-2 text-gray-500 mt-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(sale.sale_date).toLocaleDateString()} at{' '}
                  {new Date(sale.sale_date).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('totalAmountLabel')}</p>
              <p className="text-4xl font-black text-emerald-600 mt-1">
                ₹{(parseFloat(sale.total_amount) || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="glass-card premium-shadow p-8 rounded-3xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('customerInformation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center space-x-5">
              <div className="p-4 bg-blue-50 rounded-2xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('customerNameLabel')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {sale.customer_name || t('anonymous')}
                </p>
              </div>
            </div>
            {sale.customer_phone && (
              <div className="flex items-center space-x-5">
                <div className="p-4 bg-emerald-50 rounded-2xl">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{t('phoneNumberLabel')}</p>
                  <p className="text-xl font-bold text-gray-900">{sale.customer_phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sale Items */}
        <div className="glass-card premium-shadow p-8 rounded-3xl border border-white/20 overflow-hidden">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('itemsSoldLabel')}</h2>
          {sale.items && sale.items.length > 0 ? (
            <div className="overflow-x-auto -mx-8">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t('productLabel')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t('typeLabel')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t('quantityLabel')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t('pricePerUnitLabel')}
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {t('totalLabel')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <Package className="w-6 h-6 text-emerald-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-base font-bold text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 uppercase tracking-wider">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                        ₹{(parseFloat(item.price_per_unit) || 0).toFixed(2)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base font-bold text-gray-900">
                        ₹{(parseFloat(item.total_price) || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">{t('noItemsFoundSale')}</p>
          )}
        </div>

        {/* Sale Summary */}
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{t('saleSummary')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {sale.items ? sale.items.length : 0} {t('itemsSold') || 'items sold'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('totalAmountLabel')}</p>
              <p className="text-2xl font-bold text-primary-600">
                ₹{(parseFloat(sale.total_amount) || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaleDetail 
