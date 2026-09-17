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
    const mapWeatherCode = (code) => {
      if (code <= 1) return { text: 'Sunny', id: 'sunny', icon: Sun }
      if (code === 2) return { text: 'Partly Cloudy', id: 'partly-cloudy', icon: Cloud }
      if (code === 3 || code === 45 || code === 48) return { text: 'Cloudy', id: 'cloudy', icon: Cloud }
      if (code >= 51 && code <= 67) return { text: 'Rainy', id: 'rainy', icon: CloudRain }
      if (code >= 71 && code <= 75) return { text: 'Snowy', id: 'cloudy', icon: Cloud }
      if (code >= 80 && code <= 82) return { text: 'Rain Showers', id: 'rainy', icon: CloudRain }
      if (code >= 95) return { text: 'Thunderstorm', id: 'rainy', icon: CloudRain }
      return { text: 'Clear', id: 'sunny', icon: Sun }
    }

    const getWeatherData = async (lat, lon) => {
      try {
        // 1. Get Location Name using reverse geocoding
        let locName = t('yourFarmArea') || 'Your Area'
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const geoData = await geoRes.json()
          locName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || geoData.address.state || locName
        } catch (e) {
          console.warn("Geocoding failed, using generic location name.")
        }

        // 2. Fetch from Open-Meteo (Free, no API key required)
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`)
        const data = await weatherRes.json()

        const current = data.current
        const daily = data.daily
        const currentCondition = mapWeatherCode(current.weather_code)

        // 3. Dynamic Farming Advice
        let advice = t('goodConditionsFertilizer') || 'Good conditions for fertilizer application. Soil moisture is optimal.'
        if (current.weather_code >= 51 && current.weather_code <= 82) {
          advice = "Rain expected. Delay fertilizer application to prevent runoff."
        } else if (current.wind_speed_10m > 20) {
          advice = "High winds. Avoid spraying liquid fertilizers to prevent drift."
        } else if (current.temperature_2m > 35) {
          advice = "High temperatures. Apply fertilizers during cooler morning or evening hours."
        }

        // 4. Populate 5-day forecast
        const days = [t('today') || 'Today', t('tomorrow') || 'Tomorrow', t('day3') || 'Day 3', t('day4') || 'Day 4', t('day5') || 'Day 5']
        const forecast = []
        for (let i = 0; i < 5; i++) {
          const dayCode = mapWeatherCode(daily.weather_code[i])
          forecast.push({
            day: days[i],
            temp: Math.round(daily.temperature_2m_max[i]),
            condition: dayCode.id,
            icon: dayCode.icon
          })
        }

        setWeather({
          location: locName,
          temperature: Math.round(current.temperature_2m),
          condition: currentCondition.text,
          humidity: Math.round(current.relative_humidity_2m),
          windSpeed: Math.round(current.wind_speed_10m),
          precipitation: current.precipitation || 0,
          forecast: forecast,
          farmingAdvice: advice
        })
        setLoading(false)

      } catch (err) {
        console.error("Weather fetch failed:", err)
        // Fallback to mock data if API fails
        setWeather(mockWeatherData)
        setLoading(false)
      }
    }

    const fetchWeather = () => {
      setLoading(true)
      
      // Try to get real location from browser
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            getWeatherData(position.coords.latitude, position.coords.longitude)
          },
          (error) => {
            console.warn("Geolocation denied or failed. Defaulting to New Delhi.", error)
            getWeatherData(28.6139, 77.2090) // Default to New Delhi if user denies location
          },
          { timeout: 10000 }
        )
      } else {
        // Geolocation not supported by browser
        getWeatherData(28.6139, 77.2090)
      }
    }

    fetchWeather()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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