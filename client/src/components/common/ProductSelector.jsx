import { useState, useEffect } from 'react'
import { Search, Plus, Minus, XCircle } from 'lucide-react'
import api from '../../utils/api'

const ProductSelector = ({ selectedProducts, onProductAdd, onProductRemove, onQuantityChange }) => {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Select Fertilizer Products</h4>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
        {filteredProducts.map(product => (
          <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div>
              <p className="font-medium text-sm">{product.name}</p>
              <p className="text-xs text-gray-600">{product.type}</p>
            </div>
            <button
              onClick={() => onProductAdd(product)}
              disabled={isProductSelected(product.id)}
              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-medium text-gray-700">Selected Products:</h5>
          {selectedProducts.map(product => (
            <div key={product.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex-1">
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-gray-600">{product.type}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onQuantityChange(product.id, product.quantity - 1)}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium min-w-[2rem] text-center">{product.quantity}</span>
                  <button
                    onClick={() => onQuantityChange(product.id, product.quantity + 1)}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => onProductRemove(product.id)}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductSelector