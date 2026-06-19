import { X, ShoppingCart, ShieldCheck, Truck, Info, Star } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useCart } from '../../contexts/CartContext'

const ProductDetailModal = ({ product, isOpen, onClose, isAdmin }) => {
    const { t } = useLanguage()
    const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart()

    if (!isOpen || !product) return null

    const handleAddToCart = () => {
        if (isAdmin) return
        addToCart(product, 1)
    }

    const quantity = getItemQuantity(product.id)

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-colors z-10"
                >
                    <X className="w-6 h-6 text-gray-600" />
                </button>

                {/* Left Side: Product Visuals */}
                <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            {t('premiumLabel') || 'Premium Choice'}
                        </span>
                        {product.discount && (
                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                {product.discount}% OFF
                            </span>
                        )}
                    </div>

                    <div className="w-64 h-64 bg-white rounded-3xl shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                        <ShoppingCart className="w-32 h-32 text-primary-600/20" />
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-xs text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            <span>{t('originalProduct') || '100% Original'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-blue-500" />
                            <span>{t('fastDelivery') || 'Quick Delivery'}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details */}
                <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <p className="text-primary-600 text-sm font-bold tracking-widest uppercase mb-2">{product.type}</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h2>
                            <div className="flex items-center mt-3 gap-1">
                                {[1, 2, 3, 4].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                                <Star className="w-4 h-4 text-gray-300" />
                                <span className="text-sm text-gray-500 ml-2 font-medium">(4.2 / 5.0)</span>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-gray-900">₹{product.price.toFixed(2)}</span>
                            <span className="text-lg text-gray-400 line-through">₹{(product.price * 1.15).toFixed(0)}</span>
                            <span className="text-green-600 font-bold text-sm">(15% Savings)</span>
                        </div>

                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                            <h4 className="text-sm font-bold text-green-800 mb-1 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                {t('expertAdvice') || 'Expert Advice'}
                            </h4>
                            <p className="text-xs text-green-700 leading-relaxed">
                                {product.usage || t('usageNoticeDefault') || 'Best used during early vegetative growth stages. Ensure proper soil moisture before application.'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-2">{t('description')}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {product.description || 'This high-quality agricultural supplement is designed to enhance crop yields and promote healthy soil ecosystems. Formulated with essential nutrients for optimal growth.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{t('stockStatus') || 'Availability'}</p>
                                <p className={`text-sm font-bold ${product.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {product.quantity > 0 ? `${product.quantity} ${t('unitsInStock') || 'Units Left'}` : t('outOfStock')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{t('supplier')}</p>
                                <p className="text-sm font-bold text-gray-800">{product.supplier || 'Premium Agri-Feed Inc.'}</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            {isAdmin ? (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                                    <p className="text-sm text-blue-700 font-medium">
                                        {t('adminViewOnlyNotice') || 'Administrator View Only'}
                                    </p>
                                </div>
                            ) : isInCart(product.id) ? (
                                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                    <span className="font-bold text-gray-700">{t('inCart')} ({quantity})</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(product.id, quantity - 1)}
                                            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center font-bold text-xl hover:bg-gray-50 active:scale-95 transition-all"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-black text-lg">{quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center font-bold text-xl hover:bg-gray-50 active:scale-95 transition-all"
                                            disabled={quantity >= product.quantity}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.quantity <= 0}
                                    className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/40 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center gap-3 group"
                                >
                                    <ShoppingCart className="w-6 h-6 group-hover:animate-bounce" />
                                    {product.quantity <= 0 ? t('outOfStock') : t('addToCart')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetailModal
