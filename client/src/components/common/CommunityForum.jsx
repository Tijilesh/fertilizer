import { useState } from 'react'
import { MessageCircle, ThumbsUp, MessageSquare, User, Clock, Search, Plus, Filter } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

const CommunityForum = () => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newPostContent, setNewPostContent] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)

  const categories = [
    { id: 'all', label: t('forumAllTopics'), icon: '🌱' },
    { id: 'crops', label: t('cropDiscussion'), icon: '🌾' },
    { id: 'pests', label: t('pestProblems'), icon: '🐛' },
    { id: 'equipment', label: t('equipment'), icon: '🚜' },
    { id: 'market', label: t('marketPrices'), icon: '💰' },
    { id: 'advice', label: t('forumFarmingAdvice'), icon: '💡' }
  ]

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Best practices for rice cultivation in monsoon season?',
      content: 'I\'m planning to cultivate rice this season. What are the best varieties for our region and irrigation methods?',
      author: 'Rajesh Farmer',
      avatar: 'https://via.placeholder.com/40x40/4ade80/ffffff?text=R',
      category: 'crops',
      timestamp: '2 hours ago',
      likes: 12,
      replies: 8,
      tags: ['rice', 'monsoon', 'irrigation']
    },
    {
      id: 2,
      title: 'Whitefly infestation in cotton crops - urgent help needed!',
      content: 'Noticed whiteflies on my cotton plants. They\'re spreading rapidly. What pesticides should I use?',
      author: 'Priya Cotton Farmer',
      avatar: 'https://via.placeholder.com/40x40/8b5cf6/ffffff?text=P',
      category: 'pests',
      timestamp: '4 hours ago',
      likes: 5,
      replies: 15,
      tags: ['cotton', 'whitefly', 'pesticides']
    },
    {
      id: 3,
      title: 'Tractor maintenance tips for small farmers',
      content: 'Sharing some tips on maintaining tractors on a budget. Regular oil changes, cleaning air filters...',
      author: 'Mohan Equipment Expert',
      avatar: 'https://via.placeholder.com/40x40/ef4444/ffffff?text=M',
      category: 'equipment',
      timestamp: '1 day ago',
      likes: 23,
      replies: 6,
      tags: ['tractor', 'maintenance', 'budget']
    },
    {
      id: 4,
      title: 'Current tomato prices in local market',
      content: 'Checking current market rates for tomatoes. Anyone selling or buying?',
      author: 'Venkat Trader',
      avatar: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=V',
      category: 'market',
      timestamp: '3 hours ago',
      likes: 3,
      replies: 12,
      tags: ['tomato', 'prices', 'market']
    }
  ])

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleNewPost = () => {
    if (newPostContent.trim()) {
      const newPost = {
        id: posts.length + 1,
        title: 'New Discussion',
        content: newPostContent,
        author: 'You',
        avatar: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=Y',
        category: selectedCategory === 'all' ? 'advice' : selectedCategory,
        timestamp: 'Just now',
        likes: 0,
        replies: 0,
        tags: []
      }
      setPosts([newPost, ...posts])
      setNewPostContent('')
      setShowNewPost(false)
    }
  }

  const handleLike = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ))
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('communityForum')}</h3>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newPost')}</span>
        </button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder={t('shareFarmingExperience')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows="4"
          />
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setShowNewPost(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleNewPost}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              {t('post')}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchDiscussions')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-indigo-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full"
              />

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{post.title}</h4>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    {categories.find(cat => cat.id === post.category)?.label}
                  </span>
                </div>

                <p className="text-gray-700 mb-3">{post.content}</p>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.timestamp}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{post.replies}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noDiscussionsFound')}</h4>
          <p className="text-gray-600">{t('forumAdjustSearchFilter')}</p>
        </div>
      )}
    </div>
  )
}

export default CommunityForum