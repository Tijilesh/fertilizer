import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Star,
  X,
  Smartphone,
  Globe,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Info
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
  const [isInitializing, setIsInitializing] = useState(true)
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [shippingAddress, setShippingAddress] = useState(localStorage.getItem('profileAddress') || '')
  const [isEditingAddress, setIsEditingAddress] = useState(!shippingAddress)
  const [currentStep, setCurrentStep] = useState(2)

  const isAdmin = user?.role === 'owner' || user?.role === 'admin'

  // Simulate initial network fetch for skeleton loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const handleSetLocation = () => {
    if (isGeolocating) return; // Prevent spam clicking

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsGeolocating(true)
    const toastId = toast.loading('Finding your location...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Use OpenStreetMap Nominatim for free reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          
          if (!response.ok) throw new Error('Failed to fetch address')
          
          const data = await response.json()
          
          if (data && data.display_name) {
            setShippingAddress(data.display_name)
            localStorage.setItem('profileAddress', data.display_name)
            setIsEditingAddress(false)
            toast.success('Location updated successfully!', { id: toastId })
          } else {
            throw new Error('Address not found')
          }
        } catch (error) {
          console.error('Geocoding error:', error)
          toast.error('Could not determine exact address. Please enter manually.', { id: toastId })
          setIsEditingAddress(true)
        } finally {
          setIsGeolocating(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Location access denied. Please enter manually.', { id: toastId })
        setIsGeolocating(false)
        setIsEditingAddress(true)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

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
    toast.success(`${productName} removed from cart`)
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
        totalAmount: getCartTotal() + 50 + (getCartTotal() * 0.18),
        shippingAddress: shippingAddress.trim() || 'Default Address',
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'netbanking' ? 'Netbanking' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash On Delivery'
      }

      const result = await api.post('/orders', orderData)
      toast.success(`${t('orderPlacedSuccess')} ${t('orderNumberLabel')}${result.data.orderNumber}`)
      clearCart()
      setShowPaymentModal(false)
      setCurrentStep(2) // reset for next time
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.response?.data?.error || t('failedToPlaceOrder'))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (isAdmin) {
      toast.error(t('adminCheckoutDisabled') || 'Checkout is disabled for administrators.')
      return
    }

    if (shippingAddress.trim().length < 5) {
      toast.error(t('addressRequired') || 'Please enter a valid delivery address.')
      setIsEditingAddress(true)
      return
    }

    localStorage.setItem('profileAddress', shippingAddress.trim())

    if (paymentMethod !== 'cod') {
      setShowPaymentModal(true)
    } else {
      executeOrder()
    }
  }

  if (isInitializing) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="bg-gray-200 h-24 rounded-[2rem] w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-200 h-48 rounded-[2.5rem] w-full" />
            <div className="bg-gray-200 h-96 rounded-[2.5rem] w-full" />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-200 h-96 rounded-[2.5rem] w-full" />
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t('addSomethingSpecial') || 'Your cart is feeling light!'}</h1>
          <p className="text-gray-500 text-lg font-medium">{t('discoverOurProducts') || 'Discover our premium products'}</p>
        </div>

        <Link
          to="/shop"
          className="bg-primary-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/40 active:scale-95 transition-all flex items-center gap-3 group"
        >
          <span>{t('continueShopping') || 'Continue Shopping'}</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    )
  }

  const mrp = cartItems.reduce((sum, item) => sum + (item.price * 1.5 * item.quantity), 0)
  const finalPrice = getCartTotal()
  const totalDiscount = mrp - finalPrice
  const shipping = finalPrice > 1000 ? 0 : 50
  const total = finalPrice + shipping

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Flipkart Stepper Header */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex items-center justify-center mb-8 relative overflow-hidden">
          <div className="relative flex items-start justify-between w-full max-w-2xl pt-2">
            
            {/* Connecting Lines */}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-gray-200 z-0"></div>
            <div className={`absolute top-[18px] left-[10%] h-0.5 bg-primary-600 z-0 transition-all duration-500 ${currentStep === 3 ? 'right-[10%]' : 'right-[50%]'}`}></div>

            {/* Step 1: Address */}
            <div className="relative z-10 flex flex-col items-center gap-3 w-32 cursor-pointer" onClick={() => setCurrentStep(2)}>
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg ring-8 ring-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest text-center">Address</span>
            </div>
            
            {/* Step 2: Order Summary */}
            <div className="relative z-10 flex flex-col items-center gap-3 w-32 cursor-pointer" onClick={() => setCurrentStep(2)}>
              <div className={`w-9 h-9 rounded-full ${currentStep === 3 ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'} font-black flex items-center justify-center ring-8 ring-white transition-colors`}>
                {currentStep === 3 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-xs uppercase tracking-widest text-center ${currentStep === 3 ? 'font-bold text-primary-600' : 'font-black text-gray-900'}`}>Order Summary</span>
            </div>
            
            {/* Step 3: Payment */}
            <div className="relative z-10 flex flex-col items-center gap-3 w-32">
              <div className={`w-9 h-9 rounded-full ${currentStep === 3 ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-gray-200 text-gray-400'} font-black flex items-center justify-center ring-8 ring-white transition-colors`}>
                3
              </div>
              <span className={`text-xs uppercase tracking-widest text-center ${currentStep === 3 ? 'font-black text-gray-900' : 'font-bold text-gray-400'}`}>Payment</span>
            </div>
            
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Flipkart Style) */}
          <div className="lg:col-span-2 space-y-6">
            
            {currentStep === 2 ? (
              <>
                {/* Delivery Address Block */}
                <div className="glass-card premium-shadow p-8 rounded-[2.5rem] border-2 border-white/50 bg-white group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Deliver to:</h3>
                    </div>
                    {!isEditingAddress && (
                      <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="px-6 py-2 rounded-xl border-2 border-gray-100 text-primary-600 font-black text-xs uppercase tracking-widest hover:border-primary-100 hover:bg-primary-50 transition-all"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter full delivery address..."
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 font-medium focus:border-primary-500 focus:bg-white outline-none min-h-[100px]"
                      />
                      <div className="flex justify-between items-center mt-4">
                        <button
                          onClick={handleSetLocation}
                          disabled={isGeolocating}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {isGeolocating ? <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <MapPin className="w-4 h-4" />}
                          Use Current Location
                        </button>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setIsEditingAddress(false)}
                            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              localStorage.setItem('profileAddress', shippingAddress)
                              setIsEditingAddress(false)
                            }}
                            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-black hover:bg-primary-700 shadow-lg transition-colors"
                          >
                            Save Address
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-11">
                      <h4 className="text-lg font-black text-gray-900 mb-1">{user?.username || 'Guest User'}</h4>
                      <p className="text-gray-600 font-medium leading-relaxed max-w-md">{shippingAddress || 'No address provided'}</p>
                      
                      <div className="mt-6 bg-amber-50 border-2 border-amber-100/50 rounded-2xl p-4 flex items-center justify-between">
                        <p className="text-amber-800 text-sm font-medium">Help us reach you faster. Please set exact location on map.</p>
                        <button 
                          onClick={handleSetLocation}
                          disabled={isGeolocating}
                          className="px-4 py-2 bg-white rounded-xl border-2 border-amber-200 text-amber-700 font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-colors flex items-center gap-2"
                        >
                          {isGeolocating ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : null}
                          {isGeolocating ? 'Locating...' : 'Set Location'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="glass-card premium-shadow rounded-[2.5rem] border-2 border-white/50 bg-white overflow-hidden">
                  <div className="divide-y-2 divide-gray-50">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-8 group hover:bg-gray-50/50 transition-colors">
                        <div className="flex gap-8">
                          {/* Left: Image & Qty Dropdown */}
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center relative shadow-inner">
                              <ShoppingCart className="w-12 h-12 text-gray-300" />
                              <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              </div>
                            </div>
                            
                            <div className="relative w-full">
                              <select 
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), 99)}
                                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl py-2 pl-4 pr-8 text-sm font-black text-gray-700 focus:outline-none focus:border-primary-500 shadow-sm"
                              >
                                {[...Array(10)].map((_, i) => (
                                  <option key={i+1} value={i+1}>Qty: {i+1}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                          </div>

                          {/* Right: Item Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{item.name}</h3>
                                <p className="text-sm font-bold text-gray-400 mt-1">{item.type} • Premium Pack</p>
                                
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="flex items-center bg-emerald-500 px-2 py-0.5 rounded-lg text-white">
                                    <span className="text-xs font-black mr-1">4.5</span>
                                    <Star className="w-3 h-3 fill-white text-white" />
                                  </div>
                                  <span className="text-xs font-bold text-gray-400">(2,143)</span>
                                </div>

                                <div className="flex items-baseline gap-3 mt-4">
                                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">33% off</span>
                                  <span className="text-sm font-bold text-gray-400 line-through">₹{(item.price * 1.5).toFixed(0)}</span>
                                  <span className="text-2xl font-black text-gray-900">₹{item.price.toFixed(0)}</span>
                                </div>

                                <p className="text-sm font-bold text-gray-600 mt-4 flex items-center gap-2">
                                  Delivery by <span className="text-gray-900">Wed, Jun 24</span> 
                                  <span className="text-gray-300">|</span> 
                                  <span className="text-emerald-600 font-black tracking-widest text-[10px] uppercase bg-emerald-50 px-2 py-1 rounded">Free</span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                              <button 
                                onClick={() => handleRemoveItem(item.id, item.name)}
                                className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Payment Options Block */
              <div className="glass-card premium-shadow p-8 rounded-[2.5rem] border-2 border-white/50 bg-white animate-in slide-in-from-right-8 duration-500">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  Select Payment Method
                </h3>
                <div className="space-y-4">
                  {[
                    { id: 'upi', name: 'UPI (GPay, PhonePe, Paytm)', icon: <Smartphone className="w-5 h-5" /> },
                    { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" /> },
                    { id: 'netbanking', name: 'Net Banking', icon: <Globe className="w-5 h-5" /> },
                    { id: 'cod', name: 'Cash on Delivery', icon: <div className="w-5 h-5 font-black flex items-center justify-center">₹</div> }
                  ].map((method) => (
                    <label key={method.id} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50/50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.id} 
                        checked={paymentMethod === method.id} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                      />
                      <div className={`p-2 rounded-xl ${paymentMethod === method.id ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-500 shadow-sm'}`}>
                        {method.icon}
                      </div>
                      <span className="font-bold text-gray-900">{method.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column (Price Details Sidebar) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Price Details Card */}
              <div className="glass-card premium-shadow p-8 rounded-[2.5rem] border-2 border-white/50 bg-white">
                <h3 className="font-black text-gray-500 uppercase text-xs tracking-widest mb-6 pb-4 border-b border-gray-100">
                  Price Details
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Price ({cartItems.length} items)</span>
                    <span>₹{mrp.toFixed(0)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Discount</span>
                    <span className="text-emerald-600">-₹{totalDiscount.toFixed(0)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span>Delivery Charges</span>
                    <span className="text-emerald-600">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                    <span className="flex items-center gap-1.5 group relative cursor-help">
                      Platform Fee
                      <Info className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-900 text-white text-xs p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-medium">
                        Maintains our secure servers and fast delivery services.
                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </span>
                    <span>₹3</span>
                  </div>

                  <div className="pt-6 mt-4 border-t-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black text-gray-900">Total Amount</span>
                      <span className="text-2xl font-black text-gray-900">₹{(total + 3).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="mt-4 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider p-4 rounded-2xl text-center border-2 border-emerald-100/50">
                    You will save ₹{totalDiscount.toFixed(0)} on this order
                  </div>
                </div>

                <div className="mt-8">
                   <button
                     onClick={() => {
                       if (currentStep === 2) {
                         if (shippingAddress.trim().length < 5) {
                           toast.error(t('addressRequired') || 'Please enter a valid delivery address.')
                           setIsEditingAddress(true)
                           return
                         }
                         setCurrentStep(3)
                       } else {
                         handleCheckout()
                       }
                     }}
                     disabled={loading || isAdmin || (currentStep === 2 && shippingAddress.trim().length < 5)}
                     className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl group disabled:opacity-50 active:scale-95 ${isAdmin || (currentStep === 2 && shippingAddress.trim().length < 5) ? 'bg-gray-200 text-gray-500' : 'bg-amber-400 text-gray-900 hover:bg-amber-500 hover:shadow-amber-400/30'}`}
                   >
                     {isAdmin ? 'Admin Restricted' : currentStep === 2 ? 'Continue' : 'Place Order'}
                   </button>
                </div>
              </div>

              {/* Trust Banner */}
              <div className="flex items-center gap-4 p-6 glass-card premium-shadow border-2 border-white/50 rounded-[2rem] bg-gray-50">
                <ShieldCheck className="w-10 h-10 text-gray-400" />
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  Safe and secure payments. Easy returns. 100% Authentic products.
                </p>
              </div>

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
                  {paymentMethod === 'upi' ? 'Scan QR or use UPI App' : paymentMethod === 'netbanking' ? 'Login to your bank account' : 'Enter your card details'} to securely pay <span className="font-bold text-gray-900">₹{(total+3).toFixed(0)}</span>.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200/60 rounded-lg w-full"></div>
                  <div className="h-10 bg-gray-200/60 rounded-lg w-full"></div>
                </div>
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
