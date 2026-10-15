import { useState } from 'react'
import { Calculator, Beaker, Leaf, Target, Brain, Sprout, Sparkles, CheckCircle2, RotateCcw, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import toast from 'react-hot-toast'

const FertilizerCalculator = () => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    season: 'all',
    cropType: '',
    area: '1',
    areaUnit: 'acres',
    soilType: 'loamy',
    phLevel: '6.5',
    currentNPK: { n: '', p: '', k: '' }
  })
  const [result, setResult] = useState(null)

  const seasons = [
    { value: 'all', label: 'All Seasons / General', months: 'Year-Round' },
    { value: 'kharif', label: 'Kharif (Monsoon)', months: 'June - Oct' },
    { value: 'rabi', label: 'Rabi (Winter)', months: 'Oct - March' },
    { value: 'zaid', label: 'Zaid (Summer)', months: 'March - June' }
  ]

  const allCropTypes = [
    // Staple & Cash Crops
    { value: 'rice', label: 'Rice (Paddy)', category: 'Cereals', season: 'kharif', npk: { n: 120, p: 60, k: 40 }, duration: '120-150 days' },
    { value: 'wheat', label: 'Wheat', category: 'Cereals', season: 'rabi', npk: { n: 120, p: 60, k: 40 }, duration: '110-130 days' },
    { value: 'maize', label: 'Maize (Corn)', category: 'Cereals', season: 'kharif', npk: { n: 150, p: 75, k: 50 }, duration: '90-110 days' },
    { value: 'cotton', label: 'Cotton', category: 'Fiber', season: 'kharif', npk: { n: 120, p: 60, k: 60 }, duration: '150-180 days' },
    { value: 'sugarcane', label: 'Sugarcane', category: 'Commercial', season: 'kharif', npk: { n: 250, p: 100, k: 120 }, duration: '300-360 days' },
    { value: 'chilli', label: 'Chilli / Pepper', category: 'Spices', season: 'kharif', npk: { n: 120, p: 60, k: 60 }, duration: '150-180 days' },
    
    // Pulses & Oilseeds
    { value: 'soybean', label: 'Soybean', category: 'Pulses', season: 'kharif', npk: { n: 30, p: 60, k: 40 }, duration: '90-105 days' },
    { value: 'groundnut', label: 'Groundnut', category: 'Oilseeds', season: 'kharif', npk: { n: 25, p: 50, k: 40 }, duration: '105-120 days' },
    { value: 'mustard', label: 'Mustard', category: 'Oilseeds', season: 'rabi', npk: { n: 80, p: 40, k: 40 }, duration: '90-110 days' },
    { value: 'bengalgram', label: 'Bengal Gram (Chana)', category: 'Pulses', season: 'rabi', npk: { n: 25, p: 50, k: 25 }, duration: '90-110 days' },

    // Vegetables & Fruits
    { value: 'tomato', label: 'Tomato', category: 'Vegetables', season: 'zaid', npk: { n: 120, p: 80, k: 100 }, duration: '100-120 days' },
    { value: 'onion', label: 'Onion', category: 'Vegetables', season: 'rabi', npk: { n: 100, p: 50, k: 80 }, duration: '120-140 days' },
    { value: 'potato', label: 'Potato', category: 'Vegetables', season: 'rabi', npk: { n: 150, p: 100, k: 120 }, duration: '90-110 days' },
    { value: 'watermelon', label: 'Watermelon', category: 'Fruits', season: 'zaid', npk: { n: 100, p: 50, k: 80 }, duration: '80-100 days' },
    { value: 'banana', label: 'Banana', category: 'Fruits', season: 'all', npk: { n: 200, p: 60, k: 300 }, duration: '300-365 days' }
  ]

  // Filter crops based on season, or show all if 'all' is selected
  const cropTypes = formData.season === 'all' 
    ? allCropTypes 
    : allCropTypes.filter(crop => crop.season === formData.season || crop.season === 'all')

  const soilTypes = [
    { value: 'loamy', label: 'Loamy Soil (Ideal Retention)', factor: 1.0, desc: 'Balanced nutrient availability' },
    { value: 'black', label: 'Black Cotton Soil (High Clay)', factor: 0.85, desc: 'High fertility, retain moisture well' },
    { value: 'sandy', label: 'Sandy / Light Soil', factor: 1.25, desc: 'High leaching; needs split dosages' },
    { value: 'red', label: 'Red / Laterite Soil', factor: 1.1, desc: 'Low in Nitrogen and Phosphorus' },
    { value: 'clay', label: 'Heavy Clay Soil', factor: 0.9, desc: 'Slow release, avoid waterlogging' }
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
    if (!formData.cropType) {
      toast.error('Please choose a crop type first')
      return
    }
    const numArea = parseFloat(formData.area)
    if (!numArea || numArea <= 0) {
      toast.error('Please enter a valid farm land area')
      return
    }

    const selectedCrop = allCropTypes.find(crop => crop.value === formData.cropType)
    const selectedSoil = soilTypes.find(soil => soil.value === formData.soilType) || soilTypes[0]

    if (!selectedCrop) return

    // Convert area to hectares (1 Acre = 0.404686 Hectare)
    const areaInHectares = formData.areaUnit === 'acres' ? numArea * 0.404686 : numArea

    // Seasonal adjustment factors
    const seasonalFactors = {
      all: { n: 1.0, p: 1.0, k: 1.0 },
      kharif: { n: 1.15, p: 1.05, k: 1.0 }, // Rain leaching compensation
      rabi: { n: 0.95, p: 1.0, k: 0.95 },   // Stable winter assimilation
      zaid: { n: 1.05, p: 1.1, k: 1.05 }    // High transpiration demand
    }
    const seasonFactor = seasonalFactors[formData.season] || seasonalFactors.all

    // Target NPK per hectare
    const baseNPK = selectedCrop.npk
    const requiredNPKPerHa = {
      n: Math.round(baseNPK.n * selectedSoil.factor * seasonFactor.n),
      p: Math.round(baseNPK.p * selectedSoil.factor * seasonFactor.p),
      k: Math.round(baseNPK.k * selectedSoil.factor * seasonFactor.k)
    }

    // Total required for farmer's entire field
    const fieldRequiredNPK = {
      n: Math.round(requiredNPKPerHa.n * areaInHectares),
      p: Math.round(requiredNPKPerHa.p * areaInHectares),
      k: Math.round(requiredNPKPerHa.k * areaInHectares)
    }

    // Subtract existing soil test values if entered
    const currentN = (parseFloat(formData.currentNPK.n) || 0) * areaInHectares
    const currentP = (parseFloat(formData.currentNPK.p) || 0) * areaInHectares
    const currentK = (parseFloat(formData.currentNPK.k) || 0) * areaInHectares

    const netNutrientsNeeded = {
      n: Math.max(0, fieldRequiredNPK.n - currentN),
      p: Math.max(0, fieldRequiredNPK.p - currentP),
      k: Math.max(0, fieldRequiredNPK.k - currentK)
    }

    // ── Agronomic Science Combination Calculator ──
    // Standard Commercial Bags are 50kg (Urea is 45kg bag by Govt subsidy)
    // 1 bag DAP (50kg) contains 9kg N + 23kg P2O5
    // 1 bag MOP (50kg) contains 30kg K2O
    // 1 bag Urea (45kg) contains 20.7kg N (46%)

    // Step 1: Supply all Phosphorus using DAP
    const dapBags = Math.ceil(netNutrientsNeeded.p / 23)
    const nSuppliedByDap = dapBags * 9

    // Step 2: Supply remaining Nitrogen using Neem Coated Urea
    const remainingNNeeded = Math.max(0, netNutrientsNeeded.n - nSuppliedByDap)
    const ureaBags = Math.ceil(remainingNNeeded / 20.7)

    // Step 3: Supply all Potassium using MOP (Muriate of Potash)
    const mopBags = Math.ceil(netNutrientsNeeded.k / 30)

    const standardPlan = [
      {
        name: 'Neem Coated Urea (45kg)',
        nutrientDetail: '46% Nitrogen (N)',
        bags: ureaBags,
        pricePerBag: 266.50,
        stage: 'Split into Basal (33%) + 2 Top Dressings (33% each at Tillering & Panicle)',
        badge: 'Nitrogen Booster'
      },
      {
        name: 'DAP - Diammonium Phosphate (50kg)',
        nutrientDetail: '18% N + 46% P₂O₅',
        bags: dapBags,
        pricePerBag: 1350.00,
        stage: '100% at Sowing / Basal Application (Deep root zone placement)',
        badge: 'Root & Shoot Strength'
      },
      {
        name: 'MOP - Muriate of Potash (50kg)',
        nutrientDetail: '60% K₂O',
        bags: mopBags,
        pricePerBag: 1700.00,
        stage: '50% Basal + 50% at Flowering / Grain Filling stage',
        badge: 'Disease & Yield Quality'
      }
    ].filter(item => item.bags > 0)

    const totalEstimatedCost = standardPlan.reduce((sum, item) => sum + (item.bags * item.pricePerBag), 0)

    // Bio & Organic Soil Conditioner recommendation
    const compostTonnes = Math.round(areaInHectares * 2.5 * 10) / 10
    const zincKg = Math.round(numArea * 5)

    setResult({
      selectedCrop,
      selectedSoil,
      areaInHectares,
      requiredNPKPerHa,
      fieldRequiredNPK,
      netNutrientsNeeded,
      standardPlan,
      totalEstimatedCost,
      compostTonnes,
      zincKg
    })

    toast.success('Soil nutrients & fertilizer schedule generated!')
  }

  const resetCalculator = () => {
    setFormData({
      season: 'all',
      cropType: '',
      area: '1',
      areaUnit: 'acres',
      soilType: 'loamy',
      phLevel: '6.5',
      currentNPK: { n: '', p: '', k: '' }
    })
    setResult(null)
  }

  return (
    <div className="space-y-8">
      {/* Input Form Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Season Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                🌱 Cropping Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => {
                  handleInputChange('season', e.target.value)
                  // Reset crop if not in selected season
                  const currentSeason = e.target.value
                  if (currentSeason !== 'all') {
                    const match = allCropTypes.find(c => c.value === formData.cropType && (c.season === currentSeason || c.season === 'all'))
                    if (!match) handleInputChange('cropType', '')
                  }
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              >
                {seasons.map(season => (
                  <option key={season.value} value={season.value}>
                    {season.label} ({season.months})
                  </option>
                ))}
              </select>
            </div>

            {/* Crop Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                🌾 Target Crop
              </label>
              <select
                value={formData.cropType}
                onChange={(e) => handleInputChange('cropType', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              >
                <option value="">-- Choose Your Crop --</option>
                {cropTypes.map(crop => (
                  <option key={crop.value} value={crop.value}>
                    {crop.label} [{crop.category}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Land Area */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                📏 Farm Land Area
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="e.g. 2.5"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
                <select
                  value={formData.areaUnit}
                  onChange={(e) => handleInputChange('areaUnit', e.target.value)}
                  className="w-28 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                >
                  <option value="acres">Acres</option>
                  <option value="hectares">Hectares</option>
                </select>
              </div>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                🏞️ Soil Classification
              </label>
              <select
                value={formData.soilType}
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 outline-none"
              >
                {soilTypes.map(soil => (
                  <option key={soil.value} value={soil.value}>
                    {soil.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={calculateFertilizer}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-600/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5 text-emerald-200" />
              <span>Generate Scientific Dosage &amp; Cost Estimation</span>
            </button>
          </div>
        </div>

        {/* Soil Test / Advanced Options Card */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-emerald-700" />
            <h4 className="font-bold text-gray-900 text-sm">Soil Test Values (Optional)</h4>
          </div>
          <p className="text-xs text-gray-600">
            Have a Soil Health Card? Enter available N-P-K (kg/ha) to credit what already exists in your soil.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Nitrogen (N)</label>
              <input
                type="number"
                placeholder="kg/ha"
                value={formData.currentNPK.n}
                onChange={(e) => handleNPKChange('currentNPK', 'n', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-center font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Phosphorus (P)</label>
              <input
                type="number"
                placeholder="kg/ha"
                value={formData.currentNPK.p}
                onChange={(e) => handleNPKChange('currentNPK', 'p', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-center font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Potash (K)</label>
              <input
                type="number"
                placeholder="kg/ha"
                value={formData.currentNPK.k}
                onChange={(e) => handleNPKChange('currentNPK', 'k', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-center font-mono font-semibold"
              />
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              If you leave these blank, the calculator applies standard agronomic recommendations calibrated for your soil type.
            </span>
          </div>
        </div>
      </div>

      {/* Output / Results Section */}
      {result && (
        <div className="space-y-6 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Metric Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Target Crop</span>
              <span className="text-base font-extrabold text-gray-900 mt-1 block">{result.selectedCrop.label}</span>
              <span className="text-xs text-emerald-600 font-medium">Cycle: {result.selectedCrop.duration}</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Area</span>
              <span className="text-base font-extrabold text-gray-900 mt-1 block">
                {formData.area} {formData.areaUnit}
              </span>
              <span className="text-xs text-gray-500 font-medium">({result.areaInHectares.toFixed(2)} ha)</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Net Nutrient Need</span>
              <span className="text-base font-extrabold text-emerald-700 mt-1 block font-mono">
                {result.netNutrientsNeeded.n}N - {result.netNutrientsNeeded.p}P - {result.netNutrientsNeeded.k}K
              </span>
              <span className="text-xs text-gray-500 font-medium">kg total active</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Estimated Cost</span>
              <span className="text-lg font-black text-emerald-900 mt-1 block font-mono">
                ₹{result.totalEstimatedCost.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-700 font-medium">Govt. Subsidized Rates</span>
            </div>
          </div>

          {/* Detailed Bag Recommendation Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-lg flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-200" />
                  Prescribed Commercial Fertilizer Dosage
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Scientifically combined so DAP and Urea do not over-supply nitrogen
                </p>
              </div>
              <button
                onClick={resetCalculator}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {result.standardPlan.map((item, idx) => (
                <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-emerald-50/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-base">{item.name}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 font-mono">{item.nutrientDetail}</p>
                    <p className="text-xs text-teal-800 font-medium mt-1">
                      <span className="font-bold">Application Timing:</span> {item.stage}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 text-right border-t md:border-t-0 pt-3 md:pt-0">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block">Required Bags</span>
                      <span className="text-2xl font-black text-gray-900">{item.bags} Bags</span>
                    </div>

                    <div className="min-w-[100px]">
                      <span className="text-xs text-gray-500 font-semibold uppercase block">Approx Price</span>
                      <span className="text-base font-extrabold text-emerald-700 font-mono">
                        ₹{(item.bags * item.pricePerBag).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-400 block">(₹{item.pricePerBag}/bag)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Micronutrient & Organic Advisory Box */}
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-amber-900 text-sm">Organic Carbon Advisory</h5>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Apply approx. <b>{result.compostTonnes} tonnes</b> of Farm Yard Manure (FYM) or Vermicompost before final plowing to improve soil organic carbon (SOC) and microbial activity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-teal-900 text-sm">Micronutrient Boost (Zinc)</h5>
                  <p className="text-xs text-teal-800 mt-0.5">
                    Broadcast <b>{result.zincKg} kg</b> of Zinc Sulphate (33% Zn) separately (do not mix directly with DAP) to prevent hidden hunger and yellowing in crops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FertilizerCalculator