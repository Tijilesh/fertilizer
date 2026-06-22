import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Package, Sprout, Leaf, Search, Filter } from 'lucide-react'
import api from '../../utils/api'
import VoiceInputButton from '../../components/common/VoiceInputButton'
import { useLanguage } from '../../contexts/LanguageContext'

const Products = ({ products, onRefresh }) => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const productList = Array.isArray(products) ? products : []

  const filteredProducts = productList.filter(product => {
    const name = product.name || ''
    const type = product.type || ''
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || type === filterType
    return matchesSearch && matchesFilter
  })

  const productTypes = [...new Set(productList.map(p => p.type).filter(Boolean))]

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDeleteProduct') || 'Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`)
        onRefresh()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert(t('errorDeletingProduct') || 'Error deleting product')
      }
    }
  }

  const getStockStatus = (quantity) => {
    if (quantity <= 5) return { text: t('lowStock') || 'Low Stock', color: 'text-red-600 bg-red-100' }
    if (quantity <= 10) return { text: t('mediumStock') || 'Medium Stock', color: 'text-yellow-600 bg-yellow-100' }
    return { text: t('goodStock') || 'Good Stock', color: 'text-green-600 bg-green-100' }
  }

  return (
    <div className="space-y-6">
      {/* Header with Agricultural Theme */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-green-600/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Sprout className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('fertilizerInventory')}</h1>
              <p className="text-green-100 mt-1">{t('manageInventoryDesc')}</p>
            </div>
          </div>
          <Link
            to="/products/add"
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addProduct')}</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card premium-shadow p-8 rounded-[2rem] border-2 border-white/50 hover:border-primary-100 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('filterSearch')}</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>{t('searchProducts')}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('searchProductsPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-12 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <VoiceInputButton
                  onTranscript={(transcript) => setSearchTerm(prev => prev + transcript)}
                  placeholder={t('voiceSearch')}
                  className="text-green-600 hover:text-green-700"
                />
              </div>
            </div>
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Leaf className="w-4 h-4" />
              <span>{t('filterByType')}</span>
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 outline-none shadow-sm font-medium text-gray-700"
            >
              <option value="all">{t('allTypes')}</option>
              {productTypes.map(type => (
                <option key={type} value={type}>🌿 {type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card premium-shadow border-2 border-white/50 overflow-hidden rounded-[2rem] shadow-xl">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('product')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('type')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('stock')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('supplier')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-green-700 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.quantity)
                  return (
                    <tr key={product.id} className="hover:bg-green-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                              <Sprout className="w-7 h-7 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-600 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          🌿 {product.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{(typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{product.quantity}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color} border`}>
                            {stockStatus.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.supplier || '🏭 Direct'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            to={`/products/edit/${product.id}`}
                            className="text-green-600 hover:text-green-700 flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                            <span>{t('edit')}</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700 flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('delete')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                <Sprout className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? t('noProductsMatch') : t('noProductsInventory')}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterType !== 'all'
                ? t('adjustSearchFilter')
                : t('startInventoryDesc')
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <div className="space-y-4">
                <Link
                  to="/products/add"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('addFirstProduct')}</span>
                </Link>
                <p className="text-sm text-gray-500">🌱 Begin your agricultural journey</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products 
