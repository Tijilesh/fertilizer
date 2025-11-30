import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Login, Signup, ProtectedRoute } from './components/auth'
import { DEMO_PRODUCTS, DEMO_SALES } from './data/demoData'
import { LoadingSpinner, MainContent } from './components/common'
import Shop from './pages/Shop'
import Landing from './pages/Landing'
import api from './utils/api'

function App() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use demo data directly for frontend-only mode
    setProducts(DEMO_PRODUCTS)
    setSales(DEMO_SALES)
    setLoading(false)
  }, [])

  const refreshData = () => {
    fetchInitialData()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50">
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
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App 