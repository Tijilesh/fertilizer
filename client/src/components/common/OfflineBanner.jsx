import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { getPendingOfflineSales, syncOfflineSales } from '../../utils/offlineStorage'

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(getPendingOfflineSales().length)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      toast.success('Connection restored! Reconnected to shop server.')
      
      // Auto sync pending transactions
      const currentPending = getPendingOfflineSales()
      if (currentPending.length > 0) {
        await handleSyncNow()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You are offline. Running in field mode with local cache.')
    }

    const handleQueueChange = (e) => {
      setPendingCount(e.detail?.count ?? getPendingOfflineSales().length)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-queue-changed', handleQueueChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-changed', handleQueueChange)
    }
  }, [])

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      toast.error('Cannot sync while still offline')
      return
    }

    try {
      setSyncing(true)
      const res = await syncOfflineSales(api)
      if (res.syncedCount > 0) {
        toast.success(`Successfully synced ${res.syncedCount} offline transaction(s) to cloud!`)
      }
      setPendingCount(res.remainingCount || 0)
    } catch (err) {
      console.error('Error syncing offline sales:', err)
      toast.error('Some offline sales failed to sync. Will retry automatically.')
    } finally {
      setSyncing(false)
    }
  }

  // If online and no pending sales, keep screen completely clean
  if (isOnline && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-bottom duration-300">
      {!isOnline ? (
        <div className="bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-amber-500 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-700/60 rounded-xl animate-pulse">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide uppercase">Offline Field Mode Active</p>
              <p className="text-[11px] text-amber-100">
                Products and Farmers cached locally. Sales will queue safely.
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-800 text-white font-bold rounded-lg text-xs whitespace-nowrap">
              {pendingCount} Queued
            </span>
          )}
        </div>
      ) : (
        <div className="bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-emerald-600 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-800 rounded-xl">
              <UploadCloud className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide uppercase flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-300" /> Back Online
              </p>
              <p className="text-[11px] text-emerald-100">
                {pendingCount} field transaction{pendingCount > 1 ? 's' : ''} waiting to sync
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-3.5 py-1.5 bg-white text-emerald-800 font-bold rounded-xl text-xs hover:bg-emerald-50 transition shadow-sm flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  )
}

export default OfflineBanner
