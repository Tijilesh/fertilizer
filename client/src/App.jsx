import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Login, Signup, ProtectedRoute } from './components/auth'
import { LoadingSpinner, MainContent } from './components/common'
import Shop from './pages/store/Shop'
import Landing from './pages/users/Landing'
import api from './utils/api'

import { useAuth } from './contexts/AuthContext'

function AppContent() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState(null)
  const { user } = useAuth()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsRes, salesRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales')
      ])

      // Robustly handle products data
      const rawProducts = Array.isArray(productsRes.data) ? productsRes.data : []
      const processedProducts = rawProducts.map(p => ({
        ...p,
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        quantity: typeof p.quantity === 'string' ? parseInt(p.quantity, 10) : (p.quantity || 0)
      }))

      // Robustly handle sales data
      const rawSales = Array.isArray(salesRes.data) ? salesRes.data : []

      setProducts(processedProducts)
      setSales(rawSales)
      setServerError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      // Show banner only for connectivity/server issues, not auth/session errors.
      if (!err.response) {
        setServerError('Unable to connect to server. Please try again later.')
      } else if (err.response.status >= 500) {
        setServerError('Server error. Please try again later.')
      } else {
        setServerError(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    } else {
      setProducts([])
      setSales([])
      setServerError(null)
      setLoading(false)
    }
  }, [user])

  const refreshData = () => {
    if (user) fetchData()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {serverError && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center flex items-center justify-center">
          <span className="mr-2">⚠️</span>
          {serverError}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/shop" element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <Shop products={products} />
          </ProtectedRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <MainContent products={products} sales={sales} onRefresh={refreshData} />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App 