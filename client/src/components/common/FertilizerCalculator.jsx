import { useState } from 'react'
import { Calculator, Beaker, Leaf, Target } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const FertilizerCalculator = () => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    cropType: '',
    area: '',
    areaUnit: 'acres',
    soilType: '',
    currentNPK: { n: '', p: '', k: '' },
    targetNPK: { n: '', p: '', k: '' }
  })
  const [result, setResult] = useState(null)

  const cropTypes = [
    { value: 'rice', label: 'Rice (Paddy)', npk: { n: 120, p: 60, k: 40 } },
    { value: 'wheat', label: 'Wheat', npk: { n: 120, p: 60, k: 40 } },
    { value: 'maize', label: 'Maize (Corn)', npk: { n: 150, p: 75, k: 50 } },
    { value: 'cotton', label: 'Cotton', npk: { n: 100, p: 50, k: 50 } },
    { value: 'sugarcane', label: 'Sugarcane', npk: { n: 250, p: 100, k: 150 } },
    { value: 'potato', label: 'Potato', npk: { n: 150, p: 100, k: 150 } },
    { value: 'tomato', label: 'Tomato', npk: { n: 100, p: 50, k: 100 } },
    { value: 'onion', label: 'Onion', npk: { n: 100, p: 50, k: 50 } }
  ]

  const soilTypes = [
    { value: 'sandy', label: 'Sandy Soil', factor: 1.2 },
    { value: 'loamy', label: 'Loamy Soil', factor: 1.0 },
    { value: 'clay', label: 'Clay Soil', factor: 0.8 },
    { value: 'silt', label: 'Silt Soil', factor: 0.9 }
  ]

  const fertilizers = [
    { name: 'Urea (46% N)', n: 46, p: 0, k: 0, price: 300 },
    { name: 'DAP (18% N, 46% P)', n: 18, p: 46, k: 0, price: 1200 },
    { name: 'MOP (60% K)', n: 0, p: 0, k: 60, price: 1800 },
    { name: 'NPK 10-26-26', n: 10, p: 26, k: 26, price: 1400 },
    { name: 'NPK 12-32-16', n: 12, p: 32, k: 16, price: 1500 },
    { name: 'NPK 20-20-20', n: 20, p: 20, k: 20, price: 1600 }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNPKChange = (type, nutrient, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [nutrient]: value
      }
    }))
  }

  const calculateFertilizer = () => {
    const selectedCrop = cropTypes.find(crop => crop.value === formData.cropType)
    const selectedSoil = soilTypes.find(soil => soil.value === formData.soilType)

    if (!selectedCrop || !selectedSoil || !formData.area) return

    const areaInHectares = formData.areaUnit === 'acres' ? formData.area * 0.4047 : formData.area

    // Calculate required NPK per hectare
    const requiredNPK = {
      n: selectedCrop.npk.n * selectedSoil.factor,
      p: selectedCrop.npk.p * selectedSoil.factor,
      k: selectedCrop.npk.k * selectedSoil.factor
    }

    // Subtract current soil NPK
    const currentN = parseFloat(formData.currentNPK.n) || 0
    const currentP = parseFloat(formData.currentNPK.p) || 0
    const currentK = parseFloat(formData.currentNPK.k) || 0

    const neededNPK = {
      n: Math.max(0, requiredNPK.n - currentN),
      p: Math.max(0, requiredNPK.p - currentP),
      k: Math.max(0, requiredNPK.k - currentK)
    }

    // Calculate fertilizer requirements
    const recommendations = fertilizers.map(fert => {
      const nNeeded = neededNPK.n * areaInHectares
      const pNeeded = neededNPK.p * areaInHectares
      const kNeeded = neededNPK.k * areaInHectares

      let quantity = 0
      if (fert.n > 0) quantity = Math.max(quantity, nNeeded / (fert.n / 100))
      if (fert.p > 0) quantity = Math.max(quantity, pNeeded / (fert.p / 100))
      if (fert.k > 0) quantity = Math.max(quantity, kNeeded / (fert.k / 100))

      return {
        ...fert,
        quantity: Math.ceil(quantity),
        cost: Math.ceil(quantity) * fert.price
      }
    }).filter(rec => rec.quantity > 0)

    setResult({
      requiredNPK,
      neededNPK,
      areaInHectares,
      recommendations
    })
  }

  const resetCalculator = () => {
    setFormData({
      cropType: '',
      area: '',
      areaUnit: 'acres',
      soilType: '',
      currentNPK: { n: '', p: '', k: '' },
      targetNPK: { n: '', p: '', k: '' }
    })
    setResult(null)
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t('fertilizerCalculator')}</h3>
      </div>

      <div className="space-y-6">
        {/* Crop Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('selectCropType')}
          </label>
          <select
            value={formData.cropType}
            onChange={(e) => handleInputChange('cropType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('chooseCrop')}</option>
            {cropTypes.map(crop => (
              <option key={crop.value} value={crop.value}>
                {crop.label} (N:{crop.npk.n} P:{crop.npk.p} K:{crop.npk.k})
              </option>
            ))}
          </select>
        </div>

        {/* Area Input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('landArea')}
            </label>
            <input
              type="number"
              value={formData.area}
              onChange={(e) => handleInputChange('area', e.target.value)}
              placeholder={t('enterArea')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('unit')}
            </label>
            <select
              value={formData.areaUnit}
              onChange={(e) => handleInputChange('areaUnit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="acres">{t('acres')}</option>
              <option value="hectares">{t('hectares')}</option>
            </select>
          </div>
        </div>

        {/* Soil Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('soilType')}
          </label>
          <select
            value={formData.soilType}
            onChange={(e) => handleInputChange('soilType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{t('chooseSoilType')}</option>
            {soilTypes.map(soil => (
              <option key={soil.value} value={soil.value}>
                {soil.value === 'sandy' ? t('sandySoil') :
                 soil.value === 'loamy' ? t('loamySoil') :
                 soil.value === 'clay' ? t('claySoil') :
                 t('siltSoil')}
              </option>
            ))}
          </select>
        </div>

        {/* Current Soil NPK */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('currentSoilNPKLevels')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="N"
              value={formData.currentNPK.n}
              onChange={(e) => handleNPKChange('currentNPK', 'n', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="P"
              value={formData.currentNPK.p}
              onChange={(e) => handleNPKChange('currentNPK', 'p', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="K"
              value={formData.currentNPK.k}
              onChange={(e) => handleNPKChange('currentNPK', 'k', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateFertilizer}
          disabled={!formData.cropType || !formData.area || !formData.soilType}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calculator className="w-5 h-5" />
          <span>{t('calculateFertilizerRequirements')}</span>
        </button>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-6 h-6 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">{t('fertilizerRecommendations')}</h4>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{t('area')}:</strong> {formData.area} {formData.areaUnit === 'acres' ? t('acres') : t('hectares')} ({result.areaInHectares.toFixed(2)} {t('hectares').toLowerCase()})
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>{t('requiredNPK')}:</strong> {result.requiredNPK.n.toFixed(0)}-{result.requiredNPK.p.toFixed(0)}-{result.requiredNPK.k.toFixed(0)} kg/ha
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">{t('recommendedFertilizers')}:</h5>
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{rec.name}</p>
                    <p className="text-sm text-gray-600">₹{rec.price}/bag</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{rec.quantity} {t('bags')}</p>
                    <p className="text-sm text-green-600">₹{rec.cost.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                {t('calculatorNote')}
              </p>
            </div>

            <button
              onClick={resetCalculator}
              className="w-full mt-4 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              {t('calculateAgain')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FertilizerCalculator