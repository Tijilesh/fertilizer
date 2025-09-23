import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Save } from 'lucide-react'

const AddSale = ({ products, onSuccess }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: ''
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
      alert('Please add at least one item to the sale')
      return
    }

    if (selectedItems.some(item => !item.product_id || item.quantity <= 0)) {
      alert('Please fill in all item details correctly')
      return
    }

    // Check stock availability
    for (const item of selectedItems) {
      const availableStock = getAvailableStock(item.product_id)
      if (item.quantity > availableStock) {
        const product = products.find(p => p.id === parseInt(item.product_id))
        alert(`Insufficient stock for ${product.name}. Available: ${availableStock}`)
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          items: selectedItems,
          total_amount: calculateTotal()
        })
      })

      if (response.ok) {
        onSuccess()
        navigate('/sales')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to record sale')
      }
    } catch (error) {
      console.error('Error recording sale:', error)
      alert('Error recording sale')
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
          <span>Back to Sales</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleFormChange}
                className="input-field"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleFormChange}
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        {/* Sale Items */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Sale Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items added yet. Click "Add Item" to get started.</p>
          ) : (
            <div className="space-y-4">
              {selectedItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product *
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        required
                        className="input-field"
                      >
                        <option value="">Select product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${product.price} (Stock: {product.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
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
                        Price per Unit
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
                        Total Price
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
          <div className="card">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Total Amount</h3>
              <span className="text-2xl font-bold text-primary-600">
                ${calculateTotal().toFixed(2)}
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
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
            disabled={loading || selectedItems.length === 0}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Recording...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Record Sale</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddSale 