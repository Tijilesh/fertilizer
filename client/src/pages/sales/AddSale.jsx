import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Save } from 'lucide-react'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const AddSale = ({ products, onSuccess }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()

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
      await api.post('/sales', {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        items: selectedItems,
        total_amount: calculateTotal(),
        payment_method: formData.payment_method
      })

      onSuccess()
      navigate('/sales')
    } catch (error) {
      console.error('Error recording sale:', error)
      alert(error.response?.data?.error || 'Error recording sale')
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
          </div>
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

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="btn-secondary"
            disabled={loading}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={loading || selectedItems.length === 0}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('recording')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('recordSale')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddSale 
