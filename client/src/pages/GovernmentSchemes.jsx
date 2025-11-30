import { useState } from 'react'
import { Building, FileText, ExternalLink, Users, TrendingUp, Calculator, AlertTriangle, BookOpen } from 'lucide-react'
import Sidebar from '../components/Navbar'

const GovernmentSchemes = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const schemes = [
    {
      id: 1,
      name: 'PM-KISAN',
      fullName: 'Pradhan Mantri Kisan Samman Nidhi',
      description: 'Income support scheme for farmers providing ₹6,000 per year in three installments.',
      eligibility: [
        'Small and marginal farmers',
        'Landholding farmers',
        'Age 18-40 years',
        'Valid Aadhaar number'
      ],
      benefits: '₹2,000 per installment (3 installments per year)',
      application: [
        'Visit PM-KISAN portal',
        'Register with Aadhaar',
        'Verify land records',
        'Receive direct bank transfer'
      ],
      link: 'https://pmkisan.gov.in/'
    },
    {
      id: 2,
      name: 'Soil Health Card',
      fullName: 'Soil Health Card Scheme',
      description: 'Provides soil health assessment and recommendations for optimal fertilizer use.',
      eligibility: [
        'All farmers',
        'Landholding farmers',
        'Cooperative farmers'
      ],
      benefits: 'Free soil testing, nutrient recommendations, fertilizer guidance',
      application: [
        'Contact local agriculture office',
        'Provide land details',
        'Soil sample collection',
        'Receive health card within 30 days'
      ],
      link: 'https://soilhealth.dac.gov.in/'
    },
    {
      id: 3,
      name: 'Fertilizer Subsidy',
      fullName: 'Fertilizer Subsidy Scheme',
      description: 'Subsidized fertilizers to ensure affordable inputs for farmers.',
      eligibility: [
        'Registered farmers',
        'Valid ID proof',
        'Purchase from authorized dealers'
      ],
      benefits: '50-70% subsidy on fertilizer costs',
      application: [
        'Purchase from registered dealers',
        'Automatic subsidy calculation',
        'Direct bank transfer',
        'DBT system integration'
      ],
      link: 'https://www.urvarak.co.in/'
    },
    {
      id: 4,
      name: 'PMFBY',
      fullName: 'Pradhan Mantri Fasal Bima Yojana',
      description: 'Crop insurance scheme to protect farmers from natural calamities.',
      eligibility: [
        'All farmers growing notified crops',
        'Loanee and non-loanee farmers',
        'Voluntary participation'
      ],
      benefits: 'Up to 100% compensation for crop loss',
      application: [
        'Register through CSC centers',
        'Provide crop and land details',
        'Pay nominal premium',
        'Automatic claim settlement'
      ],
      link: 'https://pmfby.gov.in/'
    },
    {
      id: 5,
      name: 'PKVY',
      fullName: 'Paramparagat Krishi Vikas Yojana',
      description: 'Promotes organic farming and sustainable agriculture practices.',
      eligibility: [
        'Farmers groups (50+ members)',
        'Cluster of villages',
        'Organic farming interest'
      ],
      benefits: '₹50,000 per hectare for 3 years, training, certification',
      application: [
        'Form farmer producer groups',
        'Prepare cluster proposal',
        'Submit to district agriculture office',
        'Implementation monitoring'
      ],
      link: 'https://pgsindia-ncof.gov.in/pkvy.aspx'
    }
  ]

  return (
    <div className="min-h-screen gradient-bg">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`container-padding overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center section-padding">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Building className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-gradient mb-4">Government Schemes & Subsidies</h1>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">
              Access comprehensive information about agricultural schemes, subsidies, and government programs
              designed to support farmers and enhance agricultural productivity.
            </p>
          </div>

          {/* Schemes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {schemes.map((scheme) => (
              <div key={scheme.id} className="card-elevated">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{scheme.name}</h3>
                    <p className="text-sm text-emerald-600 font-medium">{scheme.fullName}</p>
                  </div>
                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Visit official website"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>

                <p className="text-slate-600 mb-6">{scheme.description}</p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-emerald-600" />
                      Eligibility Criteria
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1 ml-6">
                      {scheme.eligibility.map((item, index) => (
                        <li key={index} className="list-disc">{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                      Benefits
                    </h4>
                    <p className="text-sm text-slate-600 ml-6">{scheme.benefits}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                      <Calculator className="w-4 h-4 mr-2 text-emerald-600" />
                      Application Process
                    </h4>
                    <ol className="text-sm text-slate-600 space-y-1 ml-6">
                      {scheme.application.map((step, index) => (
                        <li key={index} className="list-decimal">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resources Section */}
          <div className="card-elevated">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-emerald-600" />
              Additional Resources
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                <h3 className="font-semibold text-slate-800 mb-2">Ministry of Agriculture</h3>
                <p className="text-sm text-slate-600 mb-3">Official government portal for agriculture schemes</p>
                <a
                  href="https://agricoop.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Visit Portal →
                </a>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                <h3 className="font-semibold text-slate-800 mb-2">Department of Fertilizers</h3>
                <p className="text-sm text-slate-600 mb-3">Fertilizer subsidy and policy information</p>
                <a
                  href="https://fert.nic.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Visit Department →
                </a>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                <h3 className="font-semibold text-slate-800 mb-2">Local Agriculture Office</h3>
                <p className="text-sm text-slate-600 mb-3">Contact your district agriculture office for assistance</p>
                <p className="text-emerald-600 text-sm font-medium">Helpline: 1800-XXX-XXXX</p>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important Note</h3>
                <p className="text-amber-700 text-sm">
                  Scheme details and eligibility criteria may vary by state and are subject to change.
                  Always verify current requirements with your local agriculture office or the official government portals.
                  Some schemes may require additional documentation or have seasonal application windows.
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