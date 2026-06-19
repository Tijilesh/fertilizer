import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Search,
  Truck,
  ShieldCheck,
  CreditCard,
  Ticket,
  Calendar,
  AlertCircle,
  Star,
  X,
  Smartphone,
  Globe
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Cart = () => {
  const { user } = useAuth()
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart
  } = useCart()

  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [coupon, setCoupon] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  const handleQuantityChange = (productId, newQuantity, maxQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      toast.success(t('itemRemovedFromCart'))
    } else if (newQuantity <= maxQuantity) {
      updateQuantity(productId, newQuantity)
    } else {
      toast.error(t('cannotExceedStock'))
    }
  }

  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId)
    toast.success(`${productName} ${t('removedFromCart')}`)
  }

  const handleClearCart = () => {
    if (window.confirm(t('confirmClearCart'))) {
      clearCart()
      toast.success(t('cartCleared'))
    }
  }

  const handleApplyCoupon = () => {
    if (coupon.toUpperCase() === 'FARMER10') {
      setAppliedDiscount(getCartTotal() * 0.1)
      toast.success('Coupon Applied: 10% Discount!')
    } else {
      toast.error('Invalid Coupon Code')
    }
  }

  const executeOrder = async () => {
    setLoading(true)
    try {
      const orderData = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: getCartTotal() - appliedDiscount + 50 + (getCartTotal() * 0.18),
        shippingAddress: 'Default Address',
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'netbanking' ? 'Netbanking' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash On Delivery'
      }

      const result = await api.post('/orders', orderData)
      toast.success(`${t('orderPlacedSuccess')} ${t('orderNumberLabel')}${result.data.orderNumber}`)
      clearCart()
      setShowPaymentModal(false)
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(t('failedToPlaceOrder'))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (isAdmin) {
      toast.error(t('adminCheckoutDisabled') || 'Checkout is disabled for administrators. Please use Procurement to manage stock.')
      return
    }

    if (paymentMethod !== 'cod') {
      setShowPaymentModal(true)
    } else {
      executeOrder()
    }
  }

  if (cartItems.length === 0) {
    return (
          <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative">
              <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-24 w-24 text-gray-300" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border-2 border-gray-50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{t('emptyCart') || 'Cart is Empty'}</span>
              </div>
            </div>

    <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('addSomethingSpecial')}</h1>
              <p className="text-gray-500 text-lg font-medium">{t('discoverOurProducts')}</p>
            </div>

            <Link
              to="/shop"
              className="bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/40 active:scale-95 transition-all flex items-center gap-3 group"
            >
              <span>{t('continueShopping')}</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
    )
  }

  const subtotal = getCartTotal()
  const shipping = 50
  const tax = subtotal * 0.18
  const total = subtotal - appliedDiscount + shipping + tax
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3">
                <ShoppingCart className="w-3 h-3" />
                {t('secureCheckout') || 'Secure Checkout'}
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('shoppingCart')}</h1>
              <p className="text-gray-500 font-bold mt-1">{itemCount} {t('itemsInYourCart') || 'Items ready for harvest'}</p>
            </div>

            <button
              onClick={handleClearCart}
              className="bg-white border-2 border-red-50 text-red-600 px-6 py-3 rounded-xl text-sm font-black hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('clearCart')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div key={item.id} className="group glass-card p-6 rounded-[2rem] border-2 border-white hover:border-primary-100 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-500 bg-white">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Item Visual */}
                    <div className="w-full md:w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                      <ShoppingCart className="w-12 h-12 text-primary-600/20 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{item.type}</span>
                            {item.quantity >= 10 && <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded uppercase">Bulk Order</span>}
                          </div>
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors uppercase leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-l pl-4">Premium Quality</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-6 mt-8">
                        <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border-2 border-gray-100/50">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.quantity)}
                            className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-bold shadow-sm"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-black text-lg text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1, 999)}
                            className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all font-bold shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{t('total')}</p>
                          <p className="text-2xl font-black text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Delivery Info Professional Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 bg-white rounded-3xl border-2 border-gray-100 flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">{t('shippingDelivery') || 'Shipping & Delivery'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      Orders placed before 2 PM are processed same-day. Estimated delivery to your farm in 2-3 business days.
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-white rounded-3xl border-2 border-gray-100 flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">{t('qualityGuarantee') || 'Quality Guarantee'}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      100% Genuine agricultural inputs sourcing directly from certified companies. Freshness guaranteed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6 sticky top-24">
                {/* Coupon Section */}
                <div className="glass-card p-6 rounded-3xl border-2 border-white bg-white">
                  <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary-600" />
                    {t('promoOffer') || 'Apply Promo Code'}
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FARMER10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="flex-1 bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary-500/30 transition-all outline-none"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-gray-900 text-white px-5 py-3 rounded-xl font-black text-xs hover:bg-black transition-all"
                    >
                      {t('apply') || 'APPLY'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-3 text-center uppercase tracking-tighter">Try code <span className="text-primary-600">FARMER10</span> for extra savings</p>
                </div>

                {/* Summary Card */}
                <div className="glass-card p-8 rounded-3xl border-2 border-primary-50 bg-white shadow-2xl shadow-primary-900/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

                  <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">{t('orderSummary')}</h2>

                  <div className="space-y-5">
                    <div className="flex justify-between items-center group">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        {t('subtotal')}
                      </span>
                      <span className="text-lg font-black text-gray-900">₹{subtotal.toFixed(0)}</span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600 animate-in slide-in-from-right duration-300">
                        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <Ticket className="w-3 h-3" />
                          {t('discount') || 'Coupon Discount'}
                        </span>
                        <span className="text-sm font-black">-₹{appliedDiscount.toFixed(0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        {t('shipping')}
                        <Truck className="w-3 h-3" />
                      </span>
                      <span className="text-sm font-black text-gray-900">₹{shipping.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('tax')} (18% GST)</span>
                      <span className="text-sm font-black text-gray-400">₹{tax.toFixed(0)}</span>
                    </div>

                    <div className="pt-6 border-t-2 border-dashed border-gray-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t('totalPayable') || 'Total Payable'}</p>
                          <p className="text-4xl font-black text-primary-600 tracking-tight">₹{total.toFixed(0)}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-lg uppercase shadow-sm">
                            {t('taxIncluded') || 'Tax Included'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="mt-8">
                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-primary-200 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-primary-600" />
                          <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-gray-500" /><span className="font-bold text-gray-900">UPI / QR Code</span></div>
                        </div>
                      </label>
                      <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'netbanking' ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-primary-200 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" value="netbanking" checked={paymentMethod === 'netbanking'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-primary-600" />
                          <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-500" /><span className="font-bold text-gray-900">Netbanking</span></div>
                        </div>
                      </label>
                      <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-primary-200 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-primary-600" />
                          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-500" /><span className="font-bold text-gray-900">Credit / Debit Card</span></div>
                        </div>
                      </label>
                      <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50' : 'border-gray-100 hover:border-primary-200 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-primary-600" />
                          <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-gray-500" /><span className="font-bold text-gray-900">Cash on Delivery</span></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="mt-10 space-y-4">
                    <button
                      onClick={handleCheckout}
                      disabled={loading || isAdmin}
                      className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-3 shadow-xl group disabled:opacity-50 disabled:grayscale active:scale-95 ${isAdmin
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                          : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-600/30'
                        }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
                      ) : (
                        <>
                          <span>{isAdmin ? (t('checkoutDisabled') || 'Admin Restricted') : (t('completePurchase') || 'Complete Purchase')}</span>
                          {!isAdmin && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                        </>
                      )}
                    </button>

                    {/* Admin Restricted Message */}
                    {isAdmin && (
                      <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom duration-500">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-tighter">
                          {t('adminCartWarning') || 'Administrators cannot place retail orders. Manage bulk procurement in '}
                          <Link to="/purchases" className="text-primary-700 underline font-black">{t('purchases')}</Link>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trust Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <ShieldCheck className="w-5 h-5 text-gray-600" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">PCI Daily</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Support</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 text-gray-400 hover:text-primary-600 font-black text-xs uppercase tracking-widest transition-colors py-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  {t('backToShop') || 'Continue Browsing'}
                </Link>
              </div>
            </div>
          </div>
        </div>

      {/* Payment Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setShowPaymentModal(false)} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 disabled:opacity-50">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-primary-100">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Payment</h3>
                <p className="text-gray-500 font-medium">
                  {paymentMethod === 'upi' ? 'Scan QR or use UPI App' : paymentMethod === 'netbanking' ? 'Login to your bank account' : 'Enter your card details'} to securely pay <span className="font-bold text-gray-900">₹{total.toFixed(0)}</span>.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
                {paymentMethod === 'upi' ? (
                  <div className="space-y-4">
                     <div className="w-32 h-32 bg-gray-200 mx-auto rounded-xl flex items-center justify-center border-4 border-white shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Mock QR<br/>Code</span>
                     </div>
                     <p className="text-sm font-bold text-primary-600">UPI ID: fertilizer_shop@ybl</p>
                  </div>
                ) : paymentMethod === 'card' ? (
                  <div className="space-y-4">
                     <div className="h-10 bg-gray-200/60 rounded-lg w-full"></div>
                     <div className="flex gap-4">
                       <div className="h-10 bg-gray-200/60 rounded-lg w-1/2"></div>
                       <div className="h-10 bg-gray-200/60 rounded-lg w-1/2"></div>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="h-10 bg-gray-200/60 rounded-lg w-full"></div>
                     <div className="h-10 bg-gray-200/60 rounded-lg w-full"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  toast.loading('Processing payment...', { id: 'payment' })
                  setLoading(true)
                  setTimeout(() => {
                    toast.success('Payment successful!', { id: 'payment' })
                    executeOrder()
                  }, 2000)
                }}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Processing...' : 'Simulate Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative BG Elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary-500/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] -z-10 pointer-events-none" />
    </>
  )
}

export default Cart
