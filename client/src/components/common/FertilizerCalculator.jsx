import { useState } from 'react'
import { Calculator, Beaker, Leaf, Target, Brain, Sprout } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const FertilizerCalculator = () => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    season: '',
    cropType: '',
    area: '',
    areaUnit: 'acres',
    soilType: '',
    currentNPK: { n: '', p: '', k: '' }
  })
  const [result, setResult] = useState(null)

  const seasons = [
    { value: 'kharif', label: 'Kharif (Monsoon)', months: 'June-October' },
    { value: 'rabi', label: 'Rabi (Winter)', months: 'October-March' },
    { value: 'zaid', label: 'Zaid (Summer)', months: 'March-June' }
  ]

  const allCropTypes = [
    // Kharif crops (Monsoon season)
    { value: 'rice', label: 'Rice (Paddy)', season: 'kharif', npk: { n: 120, p: 60, k: 40 } },
    { value: 'maize', label: 'Maize (Corn)', season: 'kharif', npk: { n: 150, p: 75, k: 50 } },
    { value: 'cotton', label: 'Cotton', season: 'kharif', npk: { n: 100, p: 50, k: 50 } },
    { value: 'sugarcane', label: 'Sugarcane', season: 'kharif', npk: { n: 250, p: 100, k: 150 } },
    { value: 'soybean', label: 'Soybean', season: 'kharif', npk: { n: 20, p: 60, k: 20 } },
    { value: 'groundnut', label: 'Groundnut', season: 'kharif', npk: { n: 20, p: 40, k: 0 } },

    // Rabi crops (Winter season)
    { value: 'wheat', label: 'Wheat', season: 'rabi', npk: { n: 120, p: 60, k: 40 } },
    { value: 'barley', label: 'Barley', season: 'rabi', npk: { n: 80, p: 40, k: 20 } },
    { value: 'mustard', label: 'Mustard', season: 'rabi', npk: { n: 80, p: 40, k: 20 } },
    { value: 'peas', label: 'Peas', season: 'rabi', npk: { n: 25, p: 50, k: 25 } },

    // Zaid crops (Summer season)
    { value: 'potato', label: 'Potato', season: 'zaid', npk: { n: 150, p: 100, k: 150 } },
    { value: 'tomato', label: 'Tomato', season: 'zaid', npk: { n: 100, p: 50, k: 100 } },
    { value: 'onion', label: 'Onion', season: 'zaid', npk: { n: 100, p: 50, k: 50 } },
    { value: 'cucumber', label: 'Cucumber', season: 'zaid', npk: { n: 80, p: 40, k: 60 } },
    { value: 'watermelon', label: 'Watermelon', season: 'zaid', npk: { n: 80, p: 40, k: 60 } }
  ]

  // Filter crops based on selected season
  const cropTypes = formData.season ? allCropTypes.filter(crop => crop.season === formData.season) : []

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
    const selectedSeason = seasons.find(season => season.value === formData.season)

    if (!selectedCrop || !selectedSoil || !selectedSeason || !formData.area) return

    const areaInHectares = formData.areaUnit === 'acres' ? formData.area * 0.4047 : formData.area

    // Seasonal adjustment factors
    const seasonalFactors = {
      kharif: { n: 1.2, p: 1.1, k: 1.0 }, // Higher N during monsoon
      rabi: { n: 0.9, p: 1.0, k: 0.8 },   // Lower nutrients in winter
      zaid: { n: 1.1, p: 1.2, k: 1.1 }    // Balanced for summer
    }

    const seasonFactor = seasonalFactors[formData.season]

    // Calculate required NPK per hectare with seasonal and soil adjustments
    const baseNPK = selectedCrop.npk
    const requiredNPK = {
      n: baseNPK.n * selectedSoil.factor * seasonFactor.n,
      p: baseNPK.p * selectedSoil.factor * seasonFactor.p,
      k: baseNPK.k * selectedSoil.factor * seasonFactor.k
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
      season: '',
      cropType: '',
      area: '',
      areaUnit: 'acres',
      soilType: '',
      currentNPK: { n: '', p: '', k: '' }
    })
    setResult(null)
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-emerald-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Crop Recommendation System</h3>
      </div>

      <div className="space-y-6">
        {/* Season Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌱 Select Season
          </label>
          <select
            value={formData.season}
            onChange={(e) => handleInputChange('season', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Choose Season</option>
            {seasons.map(season => (
              <option key={season.value} value={season.value}>
                {season.label} ({season.months})
              </option>
            ))}
          </select>
        </div>
        {/* Crop Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌾 Select Crop Type
          </label>
          <select
            value={formData.cropType}
            onChange={(e) => handleInputChange('cropType', e.target.value)}
            disabled={!formData.season}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {formData.season ? 'Choose Crop' : 'Select season first'}
            </option>
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
          disabled={!formData.season || !formData.cropType || !formData.area || !formData.soilType}
          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="w-5 h-5" />
          <span>Get AI Fertilizer Recommendations</span>
        </button>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg border border-emerald-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Sprout className="w-6 h-6 text-emerald-600" />
              <h4 className="text-lg font-semibold text-gray-900">AI Fertilizer Recommendations</h4>
            </div>

            <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-800">🌱 Crop & Season:</p>
                  <p className="text-sm text-emerald-700">
                    {cropTypes.find(c => c.value === formData.cropType)?.label} in {seasons.find(s => s.value === formData.season)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">🏞️ Soil Type:</p>
                  <p className="text-sm text-emerald-700">
                    {soilTypes.find(s => s.value === formData.soilType)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">📏 Area:</p>
                  <p className="text-sm text-emerald-700">
                    {formData.area} {formData.areaUnit} ({result.areaInHectares.toFixed(2)} hectares)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">⚗️ Required NPK:</p>
                  <p className="text-sm text-emerald-700">
                    {result.requiredNPK.n.toFixed(0)}-{result.requiredNPK.p.toFixed(0)}-{result.requiredNPK.k.toFixed(0)} kg/ha
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                <Beaker className="w-4 h-4 text-emerald-600" />
                <span>AI Recommended Fertilizers:</span>
              </h5>
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <p className="font-medium text-gray-900">{rec.name}</p>
                    <p className="text-sm text-gray-600">₹{rec.price}/bag</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-800">{rec.quantity} bags</p>
                    <p className="text-sm text-emerald-600 font-medium">₹{rec.cost.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">AI Analysis Complete</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Recommendations are optimized for {seasons.find(s => s.value === formData.season)?.label.toLowerCase()} season,
                    {soilTypes.find(s => s.value === formData.soilType)?.label.toLowerCase()} conditions, and your crop's specific nutrient requirements.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={resetCalculator}
              className="w-full mt-4 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Get New AI Recommendations</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FertilizerCalculator