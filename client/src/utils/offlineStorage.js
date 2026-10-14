/**
 * Offline Storage & Field Synchronization Utility
 * Supports rural field sales when offline and auto-syncs when online
 */

const STORAGE_KEYS = {
  PRODUCTS: 'offline_products_cache',
  FARMERS: 'offline_farmers_cache',
  SETTINGS: 'offline_settings_cache',
  PENDING_SALES: 'offline_pending_sales'
}

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('LocalStorage quota or write error:', e)
  }
}

const safeGet = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch (e) {
    console.warn('LocalStorage read error:', e)
    return defaultValue
  }
}

// ── Cache Getters & Setters ────────────────────────────────────────────────

export const saveCachedProducts = (products) => {
  if (Array.isArray(products) && products.length > 0) {
    safeSet(STORAGE_KEYS.PRODUCTS, {
      timestamp: Date.now(),
      data: products
    })
  }
}

export const getCachedProducts = () => {
  const cached = safeGet(STORAGE_KEYS.PRODUCTS)
  return cached?.data || []
}

export const saveCachedFarmers = (farmers) => {
  if (Array.isArray(farmers) && farmers.length > 0) {
    safeSet(STORAGE_KEYS.FARMERS, {
      timestamp: Date.now(),
      data: farmers
    })
  }
}

export const getCachedFarmers = () => {
  const cached = safeGet(STORAGE_KEYS.FARMERS)
  return cached?.data || []
}

export const saveCachedSettings = (settings) => {
  if (settings && typeof settings === 'object') {
    safeSet(STORAGE_KEYS.SETTINGS, {
      timestamp: Date.now(),
      data: settings
    })
  }
}

export const getCachedSettings = () => {
  const cached = safeGet(STORAGE_KEYS.SETTINGS)
  return cached?.data || {}
}

// ── Offline Sales Queue ────────────────────────────────────────────────────

export const queueOfflineSale = (saleData) => {
  const pending = safeGet(STORAGE_KEYS.PENDING_SALES, [])
  const offlineId = 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
  const offlineInvoiceNumber = 'OFF-' + Date.now().toString().slice(-6)

  const offlineRecord = {
    id: offlineId,
    offline_invoice_number: offlineInvoiceNumber,
    created_at: new Date().toISOString(),
    sale_date: new Date().toISOString(),
    customer_name: saleData.customer_name || 'Farmer',
    customer_phone: saleData.customer_phone || '',
    total_amount: saleData.total_amount,
    payment_method: saleData.payment_method || 'Cash',
    payment_status: saleData.payment_status || 'Paid',
    items: saleData.items || [],
    payload: saleData,
    sync_status: 'PENDING'
  }

  pending.push(offlineRecord)
  safeSet(STORAGE_KEYS.PENDING_SALES, pending)

  // Dispatch custom event so OfflineBanner & components update immediately
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: pending.length } }))

  return offlineRecord
}

export const getPendingOfflineSales = () => {
  return safeGet(STORAGE_KEYS.PENDING_SALES, [])
}

export const removeOfflineSale = (id) => {
  const pending = safeGet(STORAGE_KEYS.PENDING_SALES, [])
  const updated = pending.filter(item => item.id !== id)
  safeSet(STORAGE_KEYS.PENDING_SALES, updated)
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: updated.length } }))
}

export const clearAllOfflineSales = () => {
  safeSet(STORAGE_KEYS.PENDING_SALES, [])
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: 0 } }))
}

// ── Auto Sync Runner ───────────────────────────────────────────────────────

export const syncOfflineSales = async (apiInstance) => {
  const pending = getPendingOfflineSales()
  if (pending.length === 0) return { syncedCount: 0, failedCount: 0 }

  let syncedCount = 0
  let failedCount = 0
  const remaining = []

  for (const item of pending) {
    try {
      await apiInstance.post('/sales', item.payload)
      syncedCount++
    } catch (err) {
      console.error('Failed to sync offline sale:', item.id, err)
      failedCount++
      remaining.push(item)
    }
  }

  safeSet(STORAGE_KEYS.PENDING_SALES, remaining)
  window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: remaining.length } }))

  return { syncedCount, failedCount, remainingCount: remaining.length }
}
