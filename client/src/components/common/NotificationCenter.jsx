import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, Clock, CreditCard, Building, CheckCircle } from 'lucide-react'
import api from '../../utils/api'
import { format } from 'date-fns'
import { useLanguage } from '../../contexts/LanguageContext'

const NotificationCenter = ({ isOpen, onClose }) => {
    const { t } = useLanguage()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const [stockRes, expiryRes, creditRes] = await Promise.all([
                api.get('/reports/inventory'),
                api.get('/inventory/expiry'),
                api.get('/dashboard/credit-reminders')
            ])

            const allNotifications = []

            // Low Stock Notifications
            const lowStock = (stockRes.data || []).filter(item => item.stock_status === 'Low Stock')
            lowStock.forEach(item => {
                allNotifications.push({
                    id: `stock-${item.id}`,
                    type: 'error',
                    icon: AlertTriangle,
                    title: t('lowStockAlert'),
                    message: `${item.name} ${t('runningLow')} (${item.quantity} ${t('remaining')}).`,
                    time: new Date(),
                    color: 'text-red-600',
                    bgColor: 'bg-red-50'
                })
            })

            // Expiry Notifications
            const expiring = (expiryRes.data || []).filter(item => item.status === 'Critical' || item.status === 'Warning')
            expiring.forEach(item => {
                allNotifications.push({
                    id: `expiry-${item.id}`,
                    type: 'warning',
                    icon: Clock,
                    title: t('productExpiringSoon'),
                    message: `${item.name} (Batch: ${item.batch_number}) ${t('expiresOn')} ${item.expiry_date}.`,
                    time: new Date(),
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50'
                })
            })

            // Credit Reminders
            const credits = (creditRes.data || []).filter(item => item.status === 'overdue')
            credits.forEach(item => {
                allNotifications.push({
                    id: `credit-${item.id}`,
                    type: 'info',
                    icon: CreditCard,
                    title: t('overduePayment'),
                    message: `${item.customer} ${t('overdueOf')} ₹${item.amount}.`,
                    time: new Date(),
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
                })
            })

            setNotifications(allNotifications.sort((a, b) => b.time - a.time))
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    <h2 className="font-bold text-gray-800">{t('notifications')}</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="text-sm text-gray-500">{t('checkingForUpdates')}</p>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => {
                        const Icon = notif.icon
                        return (
                            <div key={notif.id} className={`${notif.bgColor} p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all cursor-default group`}>
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg bg-white shadow-sm ${notif.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{notif.title}</p>
                                        <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                            {format(notif.time, 'HH:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-gray-900 font-semibold">{t('allCaughtUp')}</p>
                        <p className="text-sm text-gray-500 mt-1">{t('noNewAlerts')}</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                    onClick={fetchNotifications}
                    className="w-full py-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                    {t('refreshAlerts')}
                </button>
            </div>
        </div>
    )
}
export default NotificationCenter
