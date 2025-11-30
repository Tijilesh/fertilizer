import { useState, useEffect } from 'react'
import { Brain, Cloud, Droplets, Thermometer, Wind, Sun, Moon, Zap, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Mic, MicOff, Send, MessageCircle } from 'lucide-react'
import api from '../utils/api'
import useVoiceInput from '../utils/useVoiceInput'

const SmartAssistant = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [farmData, setFarmData] = useState({
    location: '',
    soilType: 'loamy',
    currentCrops: [],
    farmSize: '',
    irrigationType: 'drip'
  })
  const [loading, setLoading] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your Smart Farm Assistant. How can I help you today?", sender: 'assistant' }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput()

  useEffect(() => {
    loadWeatherData()
    generateRecommendations()
  }, [farmData])

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setCurrentMessage(prev => prev + transcript)
      resetTranscript()
    }
  }, [transcript, resetTranscript])

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = { id: Date.now(), text: currentMessage, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')

    // Simulate assistant response (can be replaced with actual API call)
    setTimeout(() => {
      const assistantResponse = {
        id: Date.now() + 1,
        text: "Thank you for your question. I'm analyzing your farm data to provide the best recommendation. Based on your current setup, I suggest checking the weather forecast and adjusting irrigation accordingly.",
        sender: 'assistant'
      }
      setMessages(prev => [...prev, assistantResponse])
    }, 1000)
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const loadWeatherData = async () => {
    try {
      // Mock weather data for demonstration
      setWeatherData({
        temperature: 28,
        humidity: 65,
        rainfall: 2.5,
        windSpeed: 12,
        condition: 'partly_cloudy',
        forecast: [
          { day: 'Today', temp: 28, condition: 'partly_cloudy', rain: 10 },
          { day: 'Tomorrow', temp: 30, condition: 'sunny', rain: 5 },
          { day: 'Day 3', temp: 27, condition: 'rainy', rain: 80 }
        ]
      })
    } catch (error) {
      console.error('Error loading weather data:', error)
    }
  }

  const generateRecommendations = () => {
    const recs = []

    // Weather-based recommendations
    if (weatherData) {
      if (weatherData.temperature > 30) {
        recs.push({
          type: 'warning',
          title: 'High Temperature Alert',
          message: 'Temperatures above 30°C detected. Consider shade netting for sensitive crops.',
          icon: Thermometer,
          priority: 'high'
        })
      }

      if (weatherData.humidity > 70) {
        recs.push({
          type: 'info',
          title: 'High Humidity Conditions',
          message: 'Monitor for fungal diseases. Ensure proper air circulation in greenhouses.',
          icon: Droplets,
          priority: 'medium'
        })
      }

      if (weatherData.rainfall > 50) {
        recs.push({
          type: 'success',
          title: 'Good Rainfall Expected',
          message: 'Upcoming rain will help reduce irrigation needs. Monitor soil moisture.',
          icon: Cloud,
          priority: 'low'
        })
      }
    }

    // Soil-based recommendations
    if (farmData.soilType === 'sandy') {
      recs.push({
        type: 'tip',
        title: 'Sandy Soil Management',
        message: 'Sandy soils drain quickly. Consider organic matter amendments and frequent, light irrigation.',
        icon: Lightbulb,
        priority: 'medium'
      })
    }

    // Seasonal recommendations
    const currentMonth = new Date().getMonth() + 1
    if (currentMonth >= 6 && currentMonth <= 9) { // Monsoon season
      recs.push({
        type: 'success',
        title: 'Monsoon Season Optimization',
        message: 'Perfect time for planting monsoon crops. Ensure proper drainage to prevent waterlogging.',
        icon: CheckCircle,
        priority: 'high'
      })
    }

    // Irrigation recommendations
    if (farmData.irrigationType === 'drip') {
      recs.push({
        type: 'tip',
        title: 'Drip Irrigation Efficiency',
        message: 'Your drip system saves 30-50% water. Schedule irrigation during cooler hours to maximize efficiency.',
        icon: Droplets,
        priority: 'low'
      })
    }

    setRecommendations(recs)
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />
      case 'rainy': return <Cloud className="w-6 h-6 text-blue-500" />
      case 'partly_cloudy': return <Cloud className="w-6 h-6 text-gray-500" />
      default: return <Sun className="w-6 h-6 text-yellow-500" />
    }
  }

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'warning': return 'border-red-200 bg-red-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'info': return 'border-blue-200 bg-blue-50'
      case 'tip': return 'border-purple-200 bg-purple-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Brain className="w-8 h-8 text-purple-600 mr-3" />
            Smart Farm Assistant
          </h1>
          <p className="text-gray-600 mt-1">AI-powered farming recommendations and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">AI Active</span>
        </div>
      </div>

      {/* Farm Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Farm Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={farmData.location}
              onChange={(e) => setFarmData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter your location"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
            <select
              value={farmData.soilType}
              onChange={(e) => setFarmData(prev => ({ ...prev, soilType: e.target.value }))}
              className="input-field"
            >
              <option value="sandy">Sandy</option>
              <option value="loamy">Loamy</option>
              <option value="clay">Clay</option>
              <option value="silt">Silt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm Size (acres)</label>
            <input
              type="number"
              value={farmData.farmSize}
              onChange={(e) => setFarmData(prev => ({ ...prev, farmSize: e.target.value }))}
              placeholder="Farm size"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation Type</label>
            <select
              value={farmData.irrigationType}
              onChange={(e) => setFarmData(prev => ({ ...prev, irrigationType: e.target.value }))}
              className="input-field"
            >
              <option value="drip">Drip Irrigation</option>
              <option value="sprinkler">Sprinkler</option>
              <option value="flood">Flood Irrigation</option>
              <option value="rainfed">Rainfed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Weather */}
      {weatherData && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Cloud className="w-6 h-6 text-blue-600 mr-2" />
            Current Weather Conditions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.temperature}°C</div>
              <div className="text-sm text-gray-600">Temperature</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.humidity}%</div>
              <div className="text-sm text-gray-600">Humidity</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.rainfall}mm</div>
              <div className="text-sm text-gray-600">Rainfall</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Wind className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.windSpeed} km/h</div>
              <div className="text-sm text-gray-600">Wind Speed</div>
            </div>
          </div>

          {/* Weather Forecast */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">3-Day Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherData.forecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{day.day}</div>
                    <div className="text-sm text-gray-600">{day.temp}°C</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(day.condition)}
                    <span className="text-sm text-gray-600">{day.rain}% rain</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
          AI Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => {
              const Icon = rec.icon
              return (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${getRecommendationColor(rec.type)}`}>
                  <div className="flex items-start space-x-3">
                    <Icon className="w-6 h-6 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(rec.priority)} bg-white`}>
                          {rec.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-700">{rec.message}</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Analyzing your farm data... Recommendations will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Farm Analytics Preview */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
          Farm Performance Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">92%</div>
            <div className="text-sm text-gray-600">Crop Health Score</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">+15%</div>
            <div className="text-sm text-gray-600">Yield Improvement</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">78%</div>
            <div className="text-sm text-gray-600">Resource Efficiency</div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <MessageCircle className="w-6 h-6 text-purple-600 mr-2" />
          Chat with Smart Assistant
        </h2>
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me about farming, weather, fertilizers..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {isSupported && (
              <button
                onClick={handleVoiceToggle}
                className={`p-2 rounded-lg ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
          {!isSupported && (
            <p className="text-sm text-gray-500 text-center">
              Voice input is not supported in this browser. Please use text input.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartAssistant