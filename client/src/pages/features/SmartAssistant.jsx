import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  User,
  Send,
  Mic,
  Sun,
  CloudRain,
  Wind,
  Info,
  Maximize2,
  RefreshCcw,
  Sparkles,
  Thermometer,
  Leaf
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { CompatibilityChecker } from '../../components/common'
import { useLanguage } from '../../contexts/LanguageContext'

const SmartAssistant = () => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: t('assistantWelcome') || "Hello! I'm your Smart Farm Assistant. How can I help you today? You can ask me about weather, fertilizer recommendations, or crop health.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [farmData, setFarmData] = useState({
    farmSize: 5,
    mainCrop: 'Rice',
    soilType: 'Loamy',
    lastFertilizer: 'NPK 20-20-20'
  })
  const [activeTab, setActiveTab] = useState('chat')

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const userText = inputText
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputText('')
    setIsTyping(true)

    try {
      const response = await api.post('/smart-assistant/query', {
        message: userText,
        farmData: farmData
      })

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botResponse])

      if (response.data.text.length < 150) {
        speakResponse(response.data.text)
      }
    } catch (error) {
      console.error('Error querying smart assistant:', error)
      toast.error(t('assistantUnavailable') || 'Assistant is currently unavailable')
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: t('assistantError') || "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in your browser.")
      return
    }

    setIsListening(true)
    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setInputText(text)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast.error("Error recognizing speech.")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-sm">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center tracking-tight">
          <Bot className="mr-3 h-8 w-8 text-blue-600" />
          {t('smartFarmAssistant')}
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-transparent hover:border-blue-100"
            title={t('clearChat')}
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-white rounded-xl transition-all duration-300 shadow-sm border border-transparent hover:border-blue-100">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'chat'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {t('aiFarmAssistant')}
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('compatibility')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeTab === 'compatibility'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {t('mixingCompatibility')}
          {activeTab === 'compatibility' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Left Panel: Profile & Weather */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl premium-hover relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('forecast')}</p>
                  <h3 className="text-2xl font-black">Lucknow, UP</h3>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl animate-vibrant">
                  <Sun className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <span className="text-4xl font-black tracking-tight">32°C</span>
                  <p className="text-xs text-blue-100/80 font-medium italic mt-1">{t('sunnyConditions')}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="flex items-center justify-end text-[11px] font-bold text-blue-50"><CloudRain className="h-3.5 w-3.5 mr-1.5" /> 5% {t('rain')}</p>
                  <p className="flex items-center justify-end text-[11px] font-bold text-blue-50"><Wind className="h-3.5 w-3.5 mr-1.5" /> 12 km/h</p>
                </div>
              </div>
            </div>

            <div className="glass-card premium-shadow p-5 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                {t('farmProfile')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('mainCropLabel')}</span>
                  <span className="text-xs font-bold text-gray-800">{farmData.mainCrop}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('sizeLabel')}</span>
                  <span className="text-xs font-bold text-gray-800">{farmData.farmSize} {t('acres')}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('soilTypeLabel')}</span>
                  <span className="text-xs font-bold text-gray-800">{farmData.soilType}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-xl p-6 rounded-[2rem] border border-blue-100/50 premium-shadow premium-hover group">
              <h3 className="font-black text-blue-900 mb-4 text-xs flex items-center uppercase tracking-widest">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600 group-hover:rotate-12 transition-transform" />
                {t('aiInsights')}
              </h3>
              <div className="space-y-4">
                <div className="flex space-x-3 p-3 bg-white/40 rounded-2xl border border-white/60">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-blue-800 font-bold leading-tight self-center">Temps rising. Check irrigation for {farmData.mainCrop}.</p>
                </div>
                <div className="flex space-x-3 p-3 bg-white/40 rounded-2xl border border-white/60">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-blue-800 font-bold leading-tight self-center">Apply Nitrogen-based fertilizer before next rain.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3 flex flex-col glass-card premium-shadow rounded-2xl border border-gray-100 overflow-hidden min-h-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t('farmAssistantAI')}</h4>
                  <p className="text-[10px] text-green-600 font-semibold uppercase">{t('online')}</p>
                </div>
              </div>
              {isSpeaking && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-3 bg-blue-500 animate-pulse"></div>
                  <div className="w-1 h-4 bg-blue-500 animate-pulse delay-75"></div>
                  <div className="w-1 h-3 bg-blue-500 animate-pulse delay-150"></div>
                  <span className="text-[10px] font-medium text-blue-600 ml-2">{t('speaking')}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                  {msg.type === 'bot' && (
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm ${msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] mt-1 opacity-60 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.type === 'user' && (
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center space-x-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                    <span className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Query Chips */}
            <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/50">
              {['Check my stock', 'Latest Govt schemes', 'Fertilizer advice', 'Weather forecast'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setInputText(chip)}
                  className="px-3 py-1 bg-white border border-purple-200 rounded-full text-xs font-medium text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-white">
              <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-4">
                {["Weather report?", "Rice fertilizer?", "Pest controls"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(suggestion)}
                    className="whitespace-nowrap px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-semibold"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t('queryPlaceholder')}
                    className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50/50"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={startListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex-shrink-0"
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <CompatibilityChecker />
        </div>
      )}
    </div>
  )
}

export default SmartAssistant
