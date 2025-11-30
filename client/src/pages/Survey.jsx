import { useState } from 'react'
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Navbar'
import VoiceInputButton from '../components/common/VoiceInputButton'

const Survey = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [responses, setResponses] = useState({
    // User Experience
    easeOfUse: '',
    interfaceDesign: '',
    mobileExperience: '',

    // Product Features
    productVariety: '',
    productInfo: '',
    searchFilters: '',

    // Shopping Features
    cartFunctionality: '',
    checkoutProcess: '',
    paymentOptions: '',

    // Additional Features
    fertilizerCalculator: '',
    diseaseDetection: '',
    educationHub: '',
    weatherWidget: '',
    communityForum: '',

    // Owner Features (if applicable)
    inventoryManagement: '',
    salesAnalytics: '',
    customerManagement: '',
    reportingTools: '',

    // Overall Satisfaction
    overallSatisfaction: '',
    likelihoodToRecommend: '',

    // Open Feedback
    mostValuableFeature: '',
    missingFeatures: '',
    improvementSuggestions: '',
    additionalComments: ''
  })

  const [submitted, setSubmitted] = useState(false)

  const ratingOptions = [
    { value: '1', label: 'Poor', color: 'text-red-600' },
    { value: '2', label: 'Fair', color: 'text-orange-600' },
    { value: '3', label: 'Good', color: 'text-yellow-600' },
    { value: '4', label: 'Very Good', color: 'text-green-600' },
    { value: '5', label: 'Excellent', color: 'text-emerald-600' }
  ]


  const handleRatingChange = (question, value) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }))
  }

  const handleTextChange = (question, value) => {
    setResponses(prev => ({
      ...prev,
      [question]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Basic validation - check if at least some ratings are provided
    const hasRatings = Object.values(responses).some(value => value !== '')

    if (!hasRatings) {
      toast.error('Please provide at least some feedback before submitting.')
      return
    }

    // In a real app, this would send to backend
    console.log('Survey responses:', responses)

    toast.success('Thank you for your valuable feedback!')
    setSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setResponses(Object.keys(responses).reduce((acc, key) => ({ ...acc, [key]: '' }), {}))
      setSubmitted(false)
    }, 3000)
  }

  const RatingQuestion = ({ question, label, icon: Icon }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
      </div>
      <div className="flex space-x-2">
        {ratingOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleRatingChange(question, option.value)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 ${
              responses[question] === option.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl font-bold">{option.value}</span>
              <span className={`text-sm font-medium ${responses[question] === option.value ? 'text-emerald-700' : option.color}`}>
                {option.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const TextQuestion = ({ question, label, placeholder, rows = 3 }) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
      <div className="relative">
        <textarea
          value={responses[question]}
          onChange={(e) => handleTextChange(question, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none"
        />
        <div className="absolute top-2 right-2">
          <VoiceInputButton
            onTranscript={(transcript) => handleTextChange(question, responses[question] + transcript)}
            placeholder="Voice input"
            className="text-emerald-600 hover:text-emerald-700"
          />
        </div>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen gradient-bg">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`container-padding overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Thank You!</h2>
                <p className="text-lg text-slate-600">Your feedback has been submitted successfully.</p>
                <p className="text-slate-500 mt-2">We appreciate your input in helping us improve AgriFert.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`container-padding overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center section-padding">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-gradient mb-4">Help Us Improve AgriFert</h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Your feedback is invaluable in helping us create the best fertilizer shop management system.
              Please take a few minutes to share your thoughts and suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* User Experience Section */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <Users className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">User Experience</h2>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="easeOfUse"
                  label="How easy is it to navigate and use the application?"
                  icon={TrendingUp}
                />
                <RatingQuestion
                  question="interfaceDesign"
                  label="How would you rate the overall interface design?"
                  icon={Star}
                />
                <RatingQuestion
                  question="mobileExperience"
                  label="How well does the application work on mobile devices?"
                  icon={CheckCircle}
                />
              </div>
            </div>

            {/* Product Features Section */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Product Features</h2>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="productVariety"
                  label="How satisfied are you with the variety of products available?"
                  icon={Package}
                />
                <RatingQuestion
                  question="productInfo"
                  label="How comprehensive and helpful is the product information?"
                  icon={Info}
                />
                <RatingQuestion
                  question="searchFilters"
                  label="How effective are the search and filter options?"
                  icon={Search}
                />
              </div>
            </div>

            {/* Shopping Features Section */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Shopping Features</h2>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="cartFunctionality"
                  label="How well does the shopping cart functionality work?"
                  icon={ShoppingCart}
                />
                <RatingQuestion
                  question="checkoutProcess"
                  label="How smooth is the checkout and ordering process?"
                  icon={CreditCard}
                />
                <RatingQuestion
                  question="paymentOptions"
                  label="How satisfied are you with the available payment options?"
                  icon={PiggyBank}
                />
              </div>
            </div>

            {/* Additional Features Section */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <Heart className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Additional Features</h2>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="fertilizerCalculator"
                  label="How useful is the fertilizer calculator tool?"
                  icon={Calculator}
                />
                <RatingQuestion
                  question="diseaseDetection"
                  label="How helpful is the disease detection feature?"
                  icon={AlertTriangle}
                />
                <RatingQuestion
                  question="educationHub"
                  label="How valuable is the education hub content?"
                  icon={BookOpen}
                />
                <RatingQuestion
                  question="weatherWidget"
                  label="How useful is the weather information widget?"
                  icon={Cloud}
                />
                <RatingQuestion
                  question="communityForum"
                  label="How engaging is the community forum?"
                  icon={MessageCircle}
                />
              </div>
            </div>

            {/* Owner Features Section */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <Building className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Owner/Management Features</h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">For shop owners and managers</span>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="inventoryManagement"
                  label="How effective are the inventory management tools?"
                  icon={Package}
                />
                <RatingQuestion
                  question="salesAnalytics"
                  label="How useful are the sales analytics and reporting?"
                  icon={BarChart3}
                />
                <RatingQuestion
                  question="customerManagement"
                  label="How well does the customer management system work?"
                  icon={Users}
                />
                <RatingQuestion
                  question="reportingTools"
                  label="How comprehensive are the reporting tools?"
                  icon={FileText}
                />
              </div>
            </div>

            {/* Overall Satisfaction */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <Star className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Overall Satisfaction</h2>
              </div>
              <div className="space-y-8">
                <RatingQuestion
                  question="overallSatisfaction"
                  label="Overall, how satisfied are you with AgriFert?"
                  icon={Heart}
                />
                <RatingQuestion
                  question="likelihoodToRecommend"
                  label="How likely are you to recommend AgriFert to others?"
                  icon={Share}
                />
              </div>
            </div>

            {/* Open Feedback */}
            <div className="card-elevated">
              <div className="flex items-center space-x-3 mb-8">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-800">Additional Feedback</h2>
              </div>
              <div className="space-y-8">
                <TextQuestion
                  question="mostValuableFeature"
                  label="What do you find most valuable about AgriFert?"
                  placeholder="Tell us about your favorite features..."
                />
                <TextQuestion
                  question="missingFeatures"
                  label="What features are you missing that would make AgriFert better?"
                  placeholder="Describe any features you'd like to see added..."
                />
                <TextQuestion
                  question="improvementSuggestions"
                  label="Any suggestions for improvement?"
                  placeholder="Share your ideas for making AgriFert better..."
                />
                <TextQuestion
                  question="additionalComments"
                  label="Additional comments or feedback"
                  placeholder="Anything else you'd like to share..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-3 px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Send className="w-6 h-6" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Survey