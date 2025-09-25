import { useState } from 'react'
import { BookOpen, Play, FileText, Search, Filter, Clock, User, ThumbsUp } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const EducationHub = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('videos')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: t('educationAllTopics'), icon: '🌱' },
    { id: 'soil', label: t('soilManagement'), icon: '🧪' },
    { id: 'water', label: t('irrigation'), icon: '💧' },
    { id: 'pest', label: t('pestControl'), icon: '🐛' },
    { id: 'organic', label: t('organicFarming'), icon: '🌿' },
    { id: 'technology', label: t('agriTech'), icon: '🤖' },
    { id: 'business', label: t('farmBusiness'), icon: '💼' }
  ]

  const videos = [
    {
      id: 1,
      title: 'Modern Irrigation Techniques for Better Crop Yield',
      category: 'water',
      duration: '12:34',
      thumbnail: 'https://via.placeholder.com/300x200/4ade80/ffffff?text=Irrigation+Techniques',
      views: 1250,
      likes: 89,
      author: 'Dr. Rajesh Kumar',
      description: 'Learn about drip irrigation, sprinkler systems, and water conservation methods.'
    },
    {
      id: 2,
      title: 'Soil Testing: Why It Matters for Your Farm',
      category: 'soil',
      duration: '8:45',
      thumbnail: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Soil+Testing',
      views: 890,
      likes: 67,
      author: 'Soil Science Institute',
      description: 'Understanding soil pH, nutrient levels, and how to interpret soil test results.'
    },
    {
      id: 3,
      title: 'Integrated Pest Management Strategies',
      category: 'pest',
      duration: '15:20',
      thumbnail: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Pest+Management',
      views: 2100,
      likes: 145,
      author: 'AgriTech Solutions',
      description: 'Biological, cultural, and chemical methods for sustainable pest control.'
    },
    {
      id: 4,
      title: 'Organic Farming: From Seed to Harvest',
      category: 'organic',
      duration: '18:30',
      thumbnail: 'https://via.placeholder.com/300x200/22c55e/ffffff?text=Organic+Farming',
      views: 750,
      likes: 52,
      author: 'Green Earth Farms',
      description: 'Complete guide to organic farming practices and certification.'
    }
  ]

  const articles = [
    {
      id: 1,
      title: '10 Essential Tips for Wheat Cultivation',
      category: 'business',
      readTime: '5 min read',
      thumbnail: 'https://via.placeholder.com/200x150/f59e0b/ffffff?text=Wheat+Farming',
      excerpt: 'Learn the best practices for wheat farming from sowing to harvesting...',
      author: 'Farmers Weekly',
      publishedDate: '2024-01-15'
    },
    {
      id: 2,
      title: 'Climate-Smart Agriculture: Adapting to Changing Weather',
      category: 'technology',
      readTime: '8 min read',
      thumbnail: 'https://via.placeholder.com/200x150/3b82f6/ffffff?text=Climate+Smart',
      excerpt: 'How to make your farm resilient to climate change impacts...',
      author: 'Climate Agri Research',
      publishedDate: '2024-01-10'
    },
    {
      id: 3,
      title: 'Composting: Turn Waste into Wealth',
      category: 'organic',
      readTime: '6 min read',
      thumbnail: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Composting',
      excerpt: 'Create nutrient-rich compost from farm waste for better soil health...',
      author: 'Organic Farmers Network',
      publishedDate: '2024-01-08'
    }
  ]

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
      <div className="flex items-center space-x-2 mb-6">
        <BookOpen className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t('farmerEducationHub')}</h3>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchEducationalContent')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'videos'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-purple-100'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>{t('videos')}</span>
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'articles'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-purple-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('articles')}</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'videos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVideos.map(video => (
            <div key={video.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{video.author}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span>{video.views} views</span>
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{video.likes}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-24 h-24 object-cover rounded-l-lg"
                />
                <div className="flex-1 p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{article.author}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                      </span>
                    </div>
                    <span>{article.publishedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {((activeTab === 'videos' && filteredVideos.length === 0) ||
        (activeTab === 'articles' && filteredArticles.length === 0)) && (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noContentFound')}</h4>
          <p className="text-gray-600">{t('educationAdjustSearchFilter')}</p>
        </div>
      )}
    </div>
  )
}

export default EducationHub