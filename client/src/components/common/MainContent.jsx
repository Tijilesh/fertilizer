import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '../Navbar'
import Dashboard from '../../pages/Dashboard'
import Products from '../../pages/Products'
import Sales from '../../pages/Sales'
import Customers from '../../pages/Customers'
import Purchases from '../../pages/Purchases'
import Payments from '../../pages/Payments'
import Accounting from '../../pages/Accounting'
import StockExpiry from '../../pages/StockExpiry'
import MobileApp from '../../pages/MobileApp'
import Analytics from '../../pages/Analytics'
import Reports from '../../pages/Reports'
import AddProduct from '../../pages/AddProduct'
import AddSale from '../../pages/AddSale'
import EditProduct from '../../pages/EditProduct'
import SaleDetail from '../../pages/SaleDetail'
import Shop from '../../pages/Shop'
import Cart from '../../pages/Cart'
import OrderHistory from '../../pages/OrderHistory'
import Survey from '../../pages/Survey'
import SmartAssistant from '../../pages/SmartAssistant'
import GovernmentSchemes from '../../pages/GovernmentSchemes'

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
          <Route path="/dashboard" element={<Dashboard products={products} sales={sales} />} />
          <Route path="/shop" element={<Shop products={products} />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/smart-assistant" element={<SmartAssistant />} />
          <Route path="/schemes" element={<GovernmentSchemes />} />
          <Route path="/products" element={<Products products={products} onRefresh={onRefresh} />} />
          <Route path="/products/add" element={<AddProduct onSuccess={onRefresh} />} />
          <Route path="/products/edit/:id" element={<EditProduct onSuccess={onRefresh} />} />
          <Route path="/sales" element={<Sales sales={sales} onRefresh={onRefresh} />} />
          <Route path="/sales/add" element={<AddSale products={products} onSuccess={onRefresh} />} />
          <Route path="/sales/:id" element={<SaleDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/stock-expiry" element={<StockExpiry />} />
          <Route path="/mobile-app" element={<MobileApp />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}

export default MainContent