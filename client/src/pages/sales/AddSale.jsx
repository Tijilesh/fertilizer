import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Save, Printer, FileText } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const AddSale = ({ products, onSuccess }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    payment_status: 'Paid Now',
    payment_method: 'Cash'
  })
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(false)

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addItem = () => {
    setSelectedItems(prev => [...prev, {
      product_id: '',
      quantity: 1,
      price_per_unit: 0,
      total_price: 0
    }])
  }

  const removeItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    setSelectedItems(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }

      // Calculate total price if product_id or quantity changed
      if (field === 'product_id' || field === 'quantity') {
        const product = products.find(p => p.id === parseInt(newItems[index].product_id))
        if (product && newItems[index].quantity) {
          newItems[index].price_per_unit = product.price
          newItems[index].total_price = product.price * newItems[index].quantity
        }
      }

      return newItems
    })
  }

  const getAvailableStock = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product ? product.quantity : 0
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleSubmit = async (e, printMode = null) => {
    if (e) e.preventDefault()

    if (selectedItems.length === 0) {
      toast.error(t('noItemsAddedWarning'))
      return
    }

    if (selectedItems.some(item => !item.product_id || item.quantity <= 0)) {
      toast.error(t('fillCorrectDetailsWarning'))
      return
    }

    // Check stock availability
    for (const item of selectedItems) {
      const availableStock = getAvailableStock(item.product_id)
      if (item.quantity > availableStock) {
        const product = products.find(p => p.id === parseInt(item.product_id))
        toast.error(`${t('insufficientStockWarning')} ${product.name}. Available: ${availableStock}`)
        return
      }
    }

    setLoading(true)

    try {
      const res = await api.post('/sales', {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        items: selectedItems,
        total_amount: calculateTotal(),
        payment_status: formData.payment_status,
        payment_method: formData.payment_status === 'Paid Now' ? formData.payment_method : null
      })

      toast.success(t('saleRecordedSuccess') || 'Sale recorded successfully!')
      if (onSuccess) onSuccess()

      const createdSaleId = res.data?.id
      if (printMode && createdSaleId) {
        navigate(`/sales/${createdSaleId}?format=${printMode}&autoPrint=true`)
      } else {
        navigate('/sales')
      }
    } catch (error) {
      console.error('Error recording sale:', error)
      toast.error(error.response?.data?.error || 'Error recording sale')
    } finally {
      setLoading(false)
    }
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="glass-card premium-shadow p-8 rounded-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('customerInformation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customerNameLabel')}
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleFormChange}
                className="input-field"
                placeholder={t('enterCustomerName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phoneNumberLabel')}
              </label>
              <input
                type="text"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleFormChange}
                className="input-field"
                placeholder={t('enterPhoneNumber')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleFormChange}
                className="input-field"
              >
                <option value="Paid Now">Paid Now</option>
                <option value="Pay Later / Credit">Pay Later / Credit</option>
              </select>
            </div>

            {formData.payment_status === 'Paid Now' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('paymentMethod')}
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  <option value="Cash">{t('cash') || 'Cash'}</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">{t('card') || 'Card'}</option>
                  <option value="Bank Transfer">{t('transfer') || 'Bank Transfer'}</option>
                </select>
              </div>
            )}
          </div>
          
          {formData.payment_status === 'Pay Later / Credit' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <strong>Note:</strong> You are recording a credit sale. Ensure the customer has sufficient credit limit. This will not add to your current cash/bank balance.
            </div>
          )}
        </div>

        {/* Sale Items */}
        <div className="glass-card premium-shadow p-8 rounded-2xl border border-white/20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('saleItems')}</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addItem')}</span>
            </button>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noItemsAddedMessage')}</p>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('product')} *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        required
                        className="input-field"
                      >
                        <option value="">{t('selectProduct')}</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ₹{product.price} (Stock: {product.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('quantityLabel')} *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        max={getAvailableStock(item.product_id)}
                        required
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pricePerUnit')}
                      </label>
                      <input
                        type="number"
                        value={item.price_per_unit}
                        readOnly
                        className="input-field bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('totalPrice')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={item.total_price}
                          readOnly
                          className="input-field bg-gray-50 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {selectedItems.length > 0 && (
          <div className="glass-card premium-shadow p-8 rounded-2xl border border-white/20">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{t('totalAmountLabel')}</h3>
              <span className="text-2xl font-bold text-primary-600">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold"
            disabled={loading}
          >
            {t('cancel')}
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
            disabled={loading || selectedItems.length === 0}
          >
            <Save className="w-4 h-4" />
            <span>{t('recordSale') || 'Save Only'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'thermal')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            disabled={loading || selectedItems.length === 0}
          >
            <Printer className="w-4 h-4" />
            <span>Save &amp; 3&quot; POS Thermal Slip</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'a4')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
            disabled={loading || selectedItems.length === 0}
          >
            <FileText className="w-4 h-4" />
            <span>Save &amp; A4 Tax Invoice</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddSale 
