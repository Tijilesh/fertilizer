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
  Leaf,
  Pencil,
  X
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { CompatibilityChecker } from '../../components/common'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

const SmartAssistant = () => {
  const { t } = useLanguage()
  const { user } = useAuth()
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
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    farmSize: user?.farm_size || '',
    mainCrop: user?.crop_type || '',
    soilType: user?.soil_type || '',
    location: user?.location || ''
  })
  const [farmData, setFarmData] = useState({
    farmSize: user?.farm_size || '',
    mainCrop: user?.crop_type || '',
    soilType: user?.soil_type || '',
    location: user?.location || '',
    lastFertilizer: 'NPK 20-20-20'
  })
  const [activeTab, setActiveTab] = useState('chat')
  const [weatherData, setWeatherData] = useState(null)
  const [dynamicInsights, setDynamicInsights] = useState([])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchWeather = async (customLoc) => {
    try {
      const targetLoc = customLoc || farmData.location
      if (targetLoc && String(targetLoc).trim()) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(targetLoc).trim())}&count=1&language=en&format=json`)
          const geoData = await geoRes.json()
          if (geoData?.results && geoData.results.length > 0) {
            const place = geoData.results[0]
            const locLabel = `${place.name}${place.admin1 ? ', ' + place.admin1 : (place.country ? ', ' + place.country : '')}`
            await getWeatherData(place.latitude, place.longitude, locLabel)
            return
          }
        } catch (_e) {
          // Fall through to browser geolocation or default
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await getWeatherData(position.coords.latitude, position.coords.longitude)
          },
          () => {
            getWeatherData(28.6139, 77.2090, 'Delhi, India')
          }
        )
      } else {
        getWeatherData(28.6139, 77.2090, 'Delhi, India')
      }
    } catch (err) {
      console.error("Weather fetch failed:", err)
    }
  }

  const getWeatherData = async (lat, lon, fallbackName) => {
    try {
      let locName = fallbackName || 'Local Region'
      if (!fallbackName) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const geoData = await geoRes.json()
          locName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || geoData.address.state || locName
        } catch (_e) {
          // Ignore reverse geocoding error
        }
      }

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code`)
      const data = await res.json()
      const current = data.current
      
      let condition = 'Clear'
      if (current.weather_code >= 51 && current.weather_code <= 67) condition = 'Rainy'
      else if (current.weather_code >= 80 && current.weather_code <= 99) condition = 'Rain Showers'
      else if (current.weather_code >= 3) condition = 'Cloudy'

      setWeatherData({
        location: locName,
        temperature: Math.round(current.temperature_2m),
        condition: condition,
        windSpeed: Math.round(current.wind_speed_10m),
        rainChance: current.precipitation > 0 ? 80 : 5
      })

      // Generate dynamic insights
      const insights = []
      if (farmData.mainCrop) {
        if (current.temperature_2m > 30) {
          insights.push({ icon: 'temp', text: `Temps rising (${Math.round(current.temperature_2m)}°C). Check irrigation schedule for ${farmData.mainCrop}.` })
        } else if (current.temperature_2m < 15) {
          insights.push({ icon: 'temp', text: `Cool weather (${Math.round(current.temperature_2m)}°C). Vegetative growth for ${farmData.mainCrop} may slow down.` })
        } else {
          insights.push({ icon: 'temp', text: `Optimal growing temperatures (${Math.round(current.temperature_2m)}°C) for ${farmData.mainCrop}.` })
        }

        if (current.weather_code >= 51) {
          insights.push({ icon: 'leaf', text: `Rain predicted for ${locName}. Hold off fertilizer application to prevent runoff.` })
        } else if (current.wind_speed_10m > 20) {
          insights.push({ icon: 'leaf', text: `High winds (${Math.round(current.wind_speed_10m)} km/h). Avoid spraying liquid fertilizers.` })
        } else {
          insights.push({ icon: 'leaf', text: `Favorable conditions for applying recommended nutrients for ${farmData.mainCrop}.` })
        }
      } else {
        insights.push({ icon: 'leaf', text: 'Configure your crop & farm profile above for tailored AI agronomy alerts.' })
        if (current.temperature_2m > 32) {
          insights.push({ icon: 'temp', text: `High regional heat (${Math.round(current.temperature_2m)}°C). Keep fields adequately irrigated.` })
        } else if (current.precipitation > 0) {
          insights.push({ icon: 'leaf', text: 'Rain detected in your region. Check soil drainage.' })
        } else {
          insights.push({ icon: 'temp', text: `Regional weather: ${condition}, ${Math.round(current.temperature_2m)}°C.` })
        }
      }
      setDynamicInsights(insights)

    } catch(err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile')
        const profile = response.data
        if (profile) {
          const loadedData = {
            farmSize: profile.farm_size || '',
            mainCrop: profile.crop_type || '',
            soilType: profile.soil_type || '',
            location: profile.location || '',
            lastFertilizer: 'NPK 20-20-20'
          }
          setFarmData(loadedData)
          setProfileForm({
            farmSize: profile.farm_size || '',
            mainCrop: profile.crop_type || '',
            soilType: profile.soil_type || '',
            location: profile.location || ''
          })
          fetchWeather(profile.location)
        } else {
          fetchWeather()
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        fetchWeather()
      }
    }
    
    if (user) {
      fetchProfile()
    } else {
      fetchWeather()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    setProfileSaving(true)
    try {
      await api.put('/users/profile', {
        name: user?.username || user?.name,
        email: user?.email,
        crop_type: profileForm.mainCrop,
        farm_size: profileForm.farmSize,
        soil_type: profileForm.soilType,
        location: profileForm.location
      })
      const updated = {
        farmSize: profileForm.farmSize,
        mainCrop: profileForm.mainCrop,
        soilType: profileForm.soilType,
        location: profileForm.location,
        lastFertilizer: farmData.lastFertilizer
      }
      setFarmData(updated)
      setIsEditingProfile(false)
      toast.success('Farm profile updated successfully!')
      fetchWeather(profileForm.location)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update farm profile')
    } finally {
      setProfileSaving(false)
    }
  }


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
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('forecast') || 'FORECAST'}</p>
                  <h3 className="text-2xl font-black">{weatherData ? weatherData.location : (farmData.location || 'Local Weather')}</h3>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl animate-vibrant">
                  {weatherData?.condition === 'Rainy' || weatherData?.condition === 'Rain Showers' ? <CloudRain className="h-8 w-8 text-blue-200" /> : <Sun className="h-8 w-8 text-yellow-300" />}
                </div>
              </div>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <span className="text-4xl font-black tracking-tight">{weatherData ? weatherData.temperature : 28}°C</span>
                  <p className="text-xs text-blue-100/80 font-medium italic mt-1">{weatherData ? weatherData.condition : (t('sunnyConditions') || 'Sunny Conditions')}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="flex items-center justify-end text-[11px] font-bold text-blue-50"><CloudRain className="h-3.5 w-3.5 mr-1.5" /> {weatherData ? weatherData.rainChance : 5}% {t('rain') || 'Rain'}</p>
                  <p className="flex items-center justify-end text-[11px] font-bold text-blue-50"><Wind className="h-3.5 w-3.5 mr-1.5" /> {weatherData ? weatherData.windSpeed : 12} km/h</p>
                </div>
              </div>
            </div>

            <div className="glass-card premium-shadow p-5 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  {t('farmProfile') || 'Farm Profile'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      farmSize: farmData.farmSize || '',
                      mainCrop: farmData.mainCrop || '',
                      soilType: farmData.soilType || '',
                      location: farmData.location || ''
                    })
                    setIsEditingProfile(true)
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg flex items-center transition-colors shadow-sm"
                  title="Configure Farm Profile"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {farmData.mainCrop ? 'Edit' : 'Configure'}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('mainCropLabel') || 'Main Crop'}</span>
                  <span className="text-xs font-bold text-gray-800">
                    {farmData.mainCrop || <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('sizeLabel') || 'Size'}</span>
                  <span className="text-xs font-bold text-gray-800">
                    {farmData.farmSize ? `${farmData.farmSize} ${t('acres') || 'Acres'}` : <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600 font-medium">{t('soilTypeLabel') || 'Soil Type'}</span>
                  <span className="text-xs font-bold text-gray-800">
                    {farmData.soilType || <span className="text-gray-400 font-normal italic">Not configured</span>}
                  </span>
                </div>
                {farmData.location && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 font-medium">Location</span>
                    <span className="text-xs font-bold text-gray-800 truncate max-w-[140px] text-right" title={farmData.location}>
                      {farmData.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-xl p-6 rounded-[2rem] border border-blue-100/50 premium-shadow premium-hover group">
              <h3 className="font-black text-blue-900 mb-4 text-xs flex items-center uppercase tracking-widest">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600 group-hover:rotate-12 transition-transform" />
                {t('aiInsights') || 'AI INSIGHTS'}
              </h3>
              <div className="space-y-4">
                {dynamicInsights.length > 0 ? dynamicInsights.map((insight, idx) => (
                  <div key={idx} className="flex space-x-3 p-3 bg-white/60 rounded-2xl border border-white/80 shadow-sm">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${insight.icon === 'temp' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      {insight.icon === 'temp' ? <Thermometer className="h-4 w-4 text-blue-600" /> : <Leaf className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-blue-900 font-bold leading-tight self-center">{insight.text}</p>
                  </div>
                )) : (
                  <div className="flex space-x-3 p-3 bg-white/60 rounded-2xl border border-white/80 shadow-sm">
                    <div className="p-2 bg-emerald-100 rounded-xl flex-shrink-0">
                      <Leaf className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-blue-900 font-bold leading-tight self-center">
                      Configure your farm profile to get personalized weather and crop recommendations.
                    </p>
                  </div>
                )}
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

      {/* Configure Farm Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Pencil className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Configure Farm Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Main Crop
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Wheat, Cotton, Maize, Chilli"
                  value={profileForm.mainCrop}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, mainCrop: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Farm Size (Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5"
                  value={profileForm.farmSize}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, farmSize: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Soil Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loamy, Black Soil, Clay, Red Soil, Sandy"
                  value={profileForm.soilType}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, soilType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Location / District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad, Guntur, Warangal, Lucknow"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md transition-colors"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartAssistant
