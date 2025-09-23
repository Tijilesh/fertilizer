import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { Login, Signup, ProtectedRoute } from './components/auth'
import { DEMO_PRODUCTS, DEMO_SALES } from './data/demoData'
import { LoadingSpinner, MainContent } from './components/common'
import Shop from './pages/Shop'
import api from './utils/api'

function App() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales')
      ])

      let productsData = productsRes.data
      let salesData = salesRes.data

      // If backend returns empty, use demo data
      if (!productsData || productsData.length === 0) {
        productsData = DEMO_PRODUCTS
      }
      if (!salesData || salesData.length === 0) {
        salesData = DEMO_SALES
      }

      setProducts(productsData)
      setSales(salesData)
    } catch (error) {
      // If backend fails, use demo data
      setProducts(DEMO_PRODUCTS)
      setSales(DEMO_SALES)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchInitialData()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
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
  )
}

export default App 