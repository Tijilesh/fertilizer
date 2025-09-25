import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, MapPin, RefreshCw } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const WeatherWidget = () => {
  const { t } = useLanguage()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock weather data for demonstration
  const mockWeatherData = {
    location: t('yourFarmArea'),
    temperature: 28,
    condition: t('partlyCloudy'),
    humidity: 65,
    windSpeed: 12,
    precipitation: 20,
    forecast: [
      { day: t('today'), temp: 28, condition: 'partly-cloudy', icon: Cloud },
      { day: t('tomorrow'), temp: 30, condition: 'sunny', icon: Sun },
      { day: t('day3'), temp: 26, condition: 'rainy', icon: CloudRain },
      { day: t('day4'), temp: 29, condition: 'sunny', icon: Sun },
      { day: t('day5'), temp: 27, condition: 'cloudy', icon: Cloud }
    ],
    farmingAdvice: t('goodConditionsFertilizer')
  }

  useEffect(() => {
    // Simulate API call
    const fetchWeather = async () => {
      try {
        setLoading(true)
        // In a real app, you would call a weather API here
        // For now, we'll use mock data
        setTimeout(() => {
          setWeather(mockWeatherData)
          setLoading(false)
        }, 1000)
      } catch (err) {
        setError(t('failedToLoadWeatherData'))
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />
      case 'partly-cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-600" />
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-500" />
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t('weatherInsights')}</h3>
      </div>

      {/* Current Weather */}
      <div className="bg-white bg-opacity-70 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Cloud className="w-6 h-6 text-gray-500" />
              <span className="text-lg font-medium text-gray-900">{weather.condition}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-gray-600 mt-1">{weather.location}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Droplets className="w-4 h-4" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
              <Wind className="w-4 h-4" />
              <span>{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Farming Advice */}
      <div className="bg-green-50 p-3 rounded-lg mb-4">
        <div className="flex items-start space-x-2">
          <Thermometer className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm text-green-800">
              <strong>{t('recommendation')}:</strong> {weather.farmingAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">5-{t('dayForecast')}</h4>
        <div className="grid grid-cols-5 gap-2">
          {weather.forecast.map((day, index) => {
            const Icon = day.icon
            return (
              <div key={index} className="bg-white bg-opacity-50 p-2 rounded-lg text-center">
                <div className="text-xs text-gray-600 mb-1">{day.day}</div>
                <Icon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <div className="text-sm font-semibold text-gray-900">{day.temp}°</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeatherWidget