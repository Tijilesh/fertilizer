import { useState } from 'react'
import { ShoppingCart, Package, Plus, Minus } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import Sidebar from '../components/Navbar'
import toast from 'react-hot-toast'

const Shop = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart()

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || product.type === filterType
    return matchesSearch && matchesFilter && product.quantity > 0
  })

  const productTypes = [...new Set(products.map(p => p.type))]

  const handleAddToCart = (product) => {
    const currentQuantity = getItemQuantity(product.id)
    if (currentQuantity < product.quantity) {
      addToCart(product, 1)
      toast.success(`${product.name} added to cart!`)
    } else {
      toast.error('Maximum quantity reached')
    }
  }

  const handleQuantityChange = (product, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove from cart if quantity is 0
      updateQuantity(product.id, 0)
      toast.success(`${product.name} removed from cart`)
    } else if (newQuantity <= product.quantity) {
      updateQuantity(product.id, newQuantity)
      toast.success(`Updated ${product.name} quantity`)
    } else {
      toast.error('Cannot exceed available stock')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`p-8 overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Fertilizer Shop</h1>
            <p className="text-gray-600 mt-2">Browse and purchase quality fertilizers</p>
          </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <input
              type="text"
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.type}
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
              )}

              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-primary-600">${product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500">Stock: {product.quantity}</span>
              </div>

              {product.supplier && (
                <p className="text-sm text-gray-500 mb-4">Supplier: {product.supplier}</p>
              )}

              {isInCart(product.id) ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(product, getItemQuantity(product.id) - 1)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                        disabled={getItemQuantity(product.id) <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{getItemQuantity(product.id)}</span>
                      <button
                        onClick={() => handleQuantityChange(product, getItemQuantity(product.id) + 1)}
                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                        disabled={getItemQuantity(product.id) >= product.quantity}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-green-600 font-medium">In Cart</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                  disabled={product.quantity === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products available</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No products are currently in stock.'
              }
            </p>
          </div>
        )}
      </div>
        </div>
      </main>
    </div>
  )
}

export default Shop