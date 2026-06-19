import { useState, useEffect } from 'react'
import { Building, FileText, ExternalLink, Users, TrendingUp, Calculator, AlertTriangle, BookOpen, Loader2 } from 'lucide-react'
import Sidebar from '../../components/Navbar'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useLanguage } from '../../contexts/LanguageContext'

import { DEMO_SCHEMES } from '../../data/demoData'

const GovernmentSchemes = () => {
  const { t } = useLanguage()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchemes()
  }, [])

  const fetchSchemes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/government-schemes')
      setSchemes(response.data)
    } catch (error) {
      console.error('Error fetching schemes:', error)
      toast.error('Failed to load government schemes. Using demo data.')
      setSchemes(DEMO_SCHEMES)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`container-padding transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center py-16 px-4 bg-white/30 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-[100px] -z-10"></div>
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-200/50 rotate-3">
              <Building className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-700">
                {t('govtSchemesTitle')}
              </span>
            </h1>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed font-medium opacity-80">
              {t('govtSchemesDesc')}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">{t('fetchingSchemes')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
              {schemes.map((scheme) => (
                <div key={scheme.id} className="glass-card premium-shadow p-8 rounded-3xl border border-slate-100 transition-all duration-300 premium-hover">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{scheme.name}</h3>
                      <p className="text-xs text-emerald-600 font-black uppercase tracking-[0.2em]">{scheme.fullName}</p>
                    </div>
                    {scheme.link && (
                      <a
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm"
                        title="Visit official website"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>

                  <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                    {scheme.description}
                  </p>

                  <div className="space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-emerald-600" />
                        {t('eligibilityCriteria')}
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-2 ml-2">
                        {scheme.eligibility?.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                        {t('keyBenefits')}
                      </h4>
                      <p className="text-xs text-slate-700 ml-6 font-medium leading-relaxed">{scheme.benefits}</p>
                    </div>

                    <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-inner">
                      <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                        <Calculator className="w-4 h-4 mr-2 text-emerald-600" />
                        {t('howToApply')}
                      </h4>
                      <ol className="text-xs text-slate-600 space-y-3 ml-2">
                        {scheme.application?.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="font-bold text-emerald-600 mr-2">{index + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources Section */}
          <div className="glass-card premium-shadow p-10 rounded-[2rem] border border-slate-100 mx-4">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center">
              <BookOpen className="w-8 h-8 mr-4 text-emerald-600" />
              {t('additionalResources')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Ministry of Agriculture', desc: 'Official government portal for agriculture schemes', link: 'https://agricoop.gov.in/' },
                { title: 'Department of Fertilizers', desc: 'Fertilizer subsidy and policy information', link: 'https://fert.nic.in/' },
                { title: 'Farmer Portal India', desc: 'One-stop shop for all farmer-related information', link: 'https://farmer.gov.in/' }
              ].map((resource, i) => (
                <div key={i} className="group p-6 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-emerald-50 transition-all duration-300 border border-transparent hover:border-emerald-200 premium-shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-emerald-700">{resource.title}</h3>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{resource.desc}</p>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-800 text-sm font-bold tracking-tight"
                  >
                    {t('visitPortal')} <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <div className="mx-4 bg-amber-50 border border-amber-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-start">
              <div className="p-3 bg-amber-100 rounded-2xl mr-4 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">{t('importantDisclaimer')}</h3>
                <p className="text-amber-800 text-sm leading-relaxed opacity-90">
                  {t('disclaimerText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GovernmentSchemes
