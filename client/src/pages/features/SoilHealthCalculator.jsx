import { Sprout, Sparkles, ShieldCheck } from 'lucide-react'
import FertilizerCalculator from '../../components/common/FertilizerCalculator'
import { useLanguage } from '../../contexts/LanguageContext'

const SoilHealthCalculator = () => {
  const { t } = useLanguage()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Premium Header */}
      <div className="glass-card premium-shadow p-8 rounded-[2.5rem] border border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 via-white to-green-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-20">
          <Sprout className="w-48 h-48 text-emerald-600 -mr-12 -mt-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-emerald-500 text-white rounded-3xl shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <Sprout className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                  PREMIUM
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Smart Agronomy
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {t('soilHealth') || 'Soil Health'} & {t('fertilizerCalculator') || 'Fertilizer Calculator'}
              </h1>
              <p className="text-gray-600 text-sm mt-1 max-w-2xl">
                Calculate scientific NPK nutrient deficits, soil-conditioned fertilizer dosages (Urea, DAP, MOP), seasonal application schedules, and estimated input costs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-4 py-2 bg-white/80 rounded-2xl border border-emerald-100 shadow-sm text-xs font-semibold text-emerald-800 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
              ICAR Validated Guidelines
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Calculator */}
      <div className="glass-card premium-shadow rounded-[2rem] border border-gray-100 p-6 md:p-8 bg-white/80 backdrop-blur-md">
        <FertilizerCalculator />
      </div>
    </div>
  )
}

export default SoilHealthCalculator
