import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import PrintableInvoice from '../../components/sales/PrintableInvoice'
import { getPendingOfflineSales, getCachedSettings } from '../../utils/offlineStorage'

const SaleDetail = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [sale, setSale] = useState(null)
  const [shopSettings, setShopSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const initialFormat = searchParams.get('format') || 'a4'
  const autoPrint = searchParams.get('autoPrint') === 'true'

  useEffect(() => {
    fetchSaleData()
  }, [id])

  const fetchSaleData = async () => {
    // Check if viewing an offline sale
    if (String(id).startsWith('offline-') || String(id).startsWith('off_')) {
      const offlineInv = String(id).replace('offline-', '')
      const pendingSales = getPendingOfflineSales()
      const found = pendingSales.find(s => s.offline_invoice_number === offlineInv || s.id === id || s.offline_invoice_number === id)
      if (found) {
        setSale({
          ...found,
          id: found.offline_invoice_number
        })
        setShopSettings(getCachedSettings())
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      const [saleRes, settingsRes] = await Promise.all([
        api.get(`/sales/${id}`),
        api.get('/settings').catch(() => ({ data: {} }))
      ])
      setSale(saleRes.data)
      setShopSettings(settingsRes.data || {})
    } catch (error) {
      console.error('Error fetching sale:', error)
      const pendingSales = getPendingOfflineSales()
      const found = pendingSales.find(s => String(s.id) === String(id) || s.offline_invoice_number === id)
      if (found) {
        setSale({
          ...found,
          id: found.offline_invoice_number
        })
        setShopSettings(getCachedSettings())
        return
      }
      toast.error(error.response?.data?.error || t('errorLoadingSale') || 'Error loading sale')
      navigate('/sales')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{t('loadingSaleDetails') || 'Loading sale & invoice details...'}</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      <PrintableInvoice
        sale={sale}
        shopSettings={shopSettings}
        initialFormat={initialFormat}
        autoPrint={autoPrint}
        onBack={() => navigate('/sales')}
      />
    </div>
  )
}

export default SaleDetail
