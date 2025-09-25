import { useState, useRef } from 'react'
import { Camera, Upload, X, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const DiseaseDetection = () => {
  const { t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Mock disease detection results
  const mockResults = [
    {
      disease: t('leafBlight'),
      confidence: 85,
      description: t('leafBlightDesc'),
      treatment: t('leafBlightTreatment'),
      preventive: t('leafBlightPreventive')
    },
    {
      disease: t('healthyPlant'),
      confidence: 92,
      description: t('healthyPlantDesc'),
      treatment: t('healthyPlantTreatment'),
      preventive: t('healthyPlantPreventive')
    },
    {
      disease: t('powderyMildew'),
      confidence: 78,
      description: t('powderyMildewDesc'),
      treatment: t('powderyMildewTreatment'),
      preventive: t('powderyMildewPreventive')
    }
  ]

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      setError(null)
      setResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setAnalyzing(true)
    setError(null)

    try {
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Randomly select a result for demonstration
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
      setResult(randomResult)
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t('cropDiseaseDetection')}</h3>
      </div>

      {!preview ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
              <Camera className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {t('uploadOrCapture')}
          </h4>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {t('takePhoto')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCameraCapture}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Camera className="w-5 h-5" />
              <span>{t('takePhoto')}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-white text-green-600 border border-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors duration-200"
            >
              <Upload className="w-5 h-5" />
              <span>{t('uploadImage')}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            capture="environment"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={preview}
              alt="Plant preview"
              className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={resetAnalysis}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Analysis Button */}
          {!result && !analyzing && (
            <button
              onClick={analyzeImage}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{t('analyzeForDiseases')}</span>
            </button>
          )}

          {/* Analyzing State */}
          {analyzing && (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">{t('analyzingImage')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('takePhoto')}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                {result.disease === 'Healthy Plant' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
                <h4 className="text-lg font-semibold text-gray-900">
                  {t('analysisResult')}: {result.disease}
                </h4>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-gray-600">{t('confidence')}:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        result.confidence > 80 ? 'bg-green-500' :
                        result.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{result.confidence}%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">{t('diseaseDescription')}</h5>
                  <p className="text-gray-600 text-sm">{result.description}</p>
                </div>

                {result.disease !== 'Healthy Plant' && (
                  <>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{t('recommendedTreatment')}</h5>
                      <p className="text-gray-600 text-sm">{result.treatment}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{t('preventionTips')}</h5>
                      <p className="text-gray-600 text-sm">{result.preventive}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  ⚠️ {t('aiAnalysisNote')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DiseaseDetection