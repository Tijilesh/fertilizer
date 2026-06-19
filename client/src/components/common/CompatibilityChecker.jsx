import { useState, useEffect } from 'react'
import { CheckCircle, Loader } from 'lucide-react'
import api from '../../utils/api'
import ProductSelector from './ProductSelector'
import CompatibilityResults from './CompatibilityResults'

const CompatibilityChecker = () => {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [crops, setCrops] = useState([])
  const [selectedCrop, setSelectedCrop] = useState('')
  const [compatibilityResult, setCompatibilityResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await api.get('/crops')
        setCrops(response.data)
      } catch (error) {
        console.error('Error fetching crops:', error)
      }
    }
    fetchCrops()
  }, [])

  const addProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }])
    }
  }

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ))
  }

  const checkCompatibility = async () => {
    if (selectedProducts.length < 2) return

    setLoading(true)
    try {
      const response = await api.post('/compatibility/check', {
        productIds: selectedProducts.map(p => p.id),
        cropId: selectedCrop
      })
      setCompatibilityResult(response.data)
    } catch (error) {
      console.error('Error checking compatibility:', error)
      setCompatibilityResult({
        compatible: false,
        warnings: ['Error checking compatibility. Please try again.'],
        safeCombinations: [],
        dangerousMixes: [],
        recommendations: []
      })
    } finally {
      setLoading(false)
    }
  }

  const resetChecker = () => {
    setSelectedProducts([])
    setCompatibilityResult(null)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-6">
        <CheckCircle className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Fertilizer Mixing Compatibility Checker</h3>
      </div>

      <div className="space-y-6">
        {/* Crop Selection */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Target Crop (Optional)
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block"
          >
            <option value="">Select a crop for specific advice</option>
            {crops.map(crop => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 italic">
            Selecting a crop provides specific dosage and application warnings for that crop.
          </p>
        </div>
        {/* Product Selection */}
        <ProductSelector
          selectedProducts={selectedProducts}
          onProductAdd={addProduct}
          onProductRemove={removeProduct}
          onQuantityChange={updateQuantity}
        />

        {/* Check Compatibility Button */}
        <button
          onClick={checkCompatibility}
          disabled={selectedProducts.length < 2 || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Checking Compatibility...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Check Compatibility</span>
            </>
          )}
        </button>

        {/* Results */}
        <CompatibilityResults
          result={compatibilityResult}
          onReset={resetChecker}
        />
      </div>
    </div>
  )
}

export default CompatibilityChecker