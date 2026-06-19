import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from '../Navbar'
import Dashboard from '../../pages/dashboard/Dashboard'
import Products from '../../pages/inventory/Products'
import Sales from '../../pages/sales/Sales'
import Customers from '../../pages/users/Customers'
import Purchases from '../../pages/store/Purchases'
import Payments from '../../pages/store/Payments'
import Accounting from '../../pages/dashboard/Accounting'
import StockExpiry from '../../pages/inventory/StockExpiry'
import MobileApp from '../../pages/features/MobileApp'
import Analytics from '../../pages/dashboard/Analytics'
import Reports from '../../pages/dashboard/Reports'
import AddProduct from '../../pages/inventory/AddProduct'
import AddSale from '../../pages/sales/AddSale'
import EditProduct from '../../pages/inventory/EditProduct'
import SaleDetail from '../../pages/sales/SaleDetail'
import Shop from '../../pages/store/Shop'
import Cart from '../../pages/store/Cart'
import OrderHistory from '../../pages/sales/OrderHistory'
import Survey from '../../pages/features/Survey'
import SmartAssistant from '../../pages/features/SmartAssistant'
import GovernmentSchemes from '../../pages/features/GovernmentSchemes'
import { Farmers, AddFarmer, EditFarmer, FarmerDetail } from '../../pages/farmers'

import { ProtectedRoute } from '../auth'

/**
 * MainContent Component
 * Contains the sidebar and all protected routes
 */
const MainContent = ({ products, sales, onRefresh }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`p-8 overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Routes>
          <Route path="/" element={<Dashboard products={products} sales={sales} />} />
          <Route path="dashboard" element={<Dashboard products={products} sales={sales} />} />

          {/* Farmer & Admin Routes */}
          <Route path="shop" element={<Shop products={products} />} />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="survey" element={<Survey />} />
          <Route path="smart-assistant" element={<SmartAssistant />} />
          <Route path="schemes" element={<GovernmentSchemes />} />
          <Route path="mobile-app" element={<MobileApp />} />

          {/* Admin & Owner Only Routes */}
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Products products={products} onRefresh={onRefresh} />
            </ProtectedRoute>
          } />
          <Route path="products/add" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <AddProduct onSuccess={onRefresh} />
            </ProtectedRoute>
          } />
          <Route path="products/edit/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <EditProduct onSuccess={onRefresh} />
            </ProtectedRoute>
          } />
          <Route path="sales" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Sales sales={sales} onRefresh={onRefresh} />
            </ProtectedRoute>
          } />
          <Route path="sales/add" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <AddSale products={products} onSuccess={onRefresh} />
            </ProtectedRoute>
          } />
          <Route path="sales/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <SaleDetail />
            </ProtectedRoute>
          } />
          <Route path="customers" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Customers sales={sales} />
            </ProtectedRoute>
          } />
          <Route path="purchases" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Purchases />
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Payments />
            </ProtectedRoute>
          } />
          <Route path="accounting" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Accounting />
            </ProtectedRoute>
          } />
          <Route path="stock-expiry" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <StockExpiry />
            </ProtectedRoute>
          } />
          <Route path="analytics" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Analytics products={products} sales={sales} />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Reports products={products} sales={sales} />
            </ProtectedRoute>
          } />
          
          <Route path="farmers" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Farmers />
            </ProtectedRoute>
          } />
          <Route path="farmers/add" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <AddFarmer />
            </ProtectedRoute>
          } />
          <Route path="farmers/edit/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <EditFarmer />
            </ProtectedRoute>
          } />
          <Route path="farmers/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <FarmerDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default MainContent