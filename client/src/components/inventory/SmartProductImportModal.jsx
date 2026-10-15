import { useState, useMemo } from 'react'
import { X, Check, AlertCircle, FileSpreadsheet, ArrowRight, Table, RefreshCw, Sparkles, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'

// Target system fields that products require
const TARGET_FIELDS = [
  { key: 'name', label: 'Product Name', required: true, description: 'e.g. Urea, DAP, Coragen' },
  { key: 'price', label: 'Selling Price (₹)', required: true, description: 'Unit or bag price' },
  { key: 'quantity', label: 'Stock Quantity', required: false, description: 'Available units/bags' },
  { key: 'type', label: 'Category / Type', required: false, description: 'NPK, Insecticide, Fungicide, etc.' },
  { key: 'supplier', label: 'Company / Brand', required: false, description: 'IFFCO, Bayer, Syngenta, Coromandel' },
  { key: 'batch_number', label: 'Batch No.', required: false, description: 'Manufacturing batch tag' },
  { key: 'expiry_date', label: 'Expiry Date', required: false, description: 'YYYY-MM-DD or DD/MM/YYYY' },
  { key: 'description', label: 'Description / Composition', required: false, description: 'Chemical active ingredients or notes' }
]

// Common synonyms used across different agro-chemical manufacturers & distributors
const SYNONYMS = {
  name: [
    'name', 'product', 'item', 'item_name', 'product_name', 'productname', 'itemname', 
    'description_of_goods', 'goods', 'particulars', 'material', 'material_description', 
    'brand', 'product_description', 'chem_name', 'trade_name', 'title'
  ],
  price: [
    'price', 'rate', 'unit_price', 'mrp', 'sales_price', 'selling_price', 'sale_rate', 
    'rate_per_unit', 'amount', 'net_rate', 'dealer_price', 'billing_rate', 'cost', 'retail_price'
  ],
  quantity: [
    'quantity', 'qty', 'stock', 'available_stock', 'units', 'bags', 'bal_qty', 
    'closing_stock', 'boxes', 'packets', 'nos', 'count', 'inventory', 'total_qty'
  ],
  type: [
    'type', 'category', 'group', 'product_type', 'item_group', 'class', 'sub_category', 
    'segment', 'chemical_class', 'fertilizer_type'
  ],
  supplier: [
    'supplier', 'company', 'manufacturer', 'mfg', 'vendor', 'brand_name', 'make', 
    'distributor', 'source', 'party', 'corp', 'firm'
  ],
  batch_number: [
    'batch', 'batch_number', 'batch_no', 'batchno', 'lot', 'lot_no', 'lot_number', 'b_no'
  ],
  expiry_date: [
    'expiry', 'expiry_date', 'exp_date', 'exp', 'valid_till', 'expiry_dt', 'best_before', 'use_by'
  ],
  description: [
    'description', 'technical_name', 'active_ingredient', 'composition', 'molecule', 
    'details', 'remarks', 'specification', 'content', 'pack_size'
  ]
}

const guessFieldMapping = (fileHeaders) => {
  const mapping = {}
  const usedHeaders = new Set()

  TARGET_FIELDS.forEach(target => {
    const syns = SYNONYMS[target.key] || [target.key]
    
    // Find best matching header
    const matched = fileHeaders.find(header => {
      if (usedHeaders.has(header)) return false
      const cleanH = header.toString().toLowerCase().trim().replace(/[\s\-_.\(\)]+/g, '')
      return syns.some(s => {
        const cleanS = s.toLowerCase().replace(/[\s\-_.\(\)]+/g, '')
        return cleanH === cleanS || cleanH.includes(cleanS) || cleanS.includes(cleanH)
      })
    })

    if (matched) {
      mapping[target.key] = matched
      usedHeaders.add(matched)
    } else {
      mapping[target.key] = ''
    }
  })

  return mapping
}

export default function SmartProductImportModal({ isOpen, onClose, rawData, fileHeaders, fileName, onImportSuccess }) {
  if (!isOpen) return null

  const [columnMapping, setColumnMapping] = useState(() => guessFieldMapping(fileHeaders))
  const [defaultCompany, setDefaultCompany] = useState('')
  const [defaultCategory, setDefaultCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('mapping') // 'mapping' | 'preview'

  const handleAutoMap = () => {
    setColumnMapping(guessFieldMapping(fileHeaders))
    toast.success('Auto-detected best column matches!')
  }

  // Pre-process and validate data based on mapping
  const mappedPreview = useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    return rawData.map((row, idx) => {
      const getVal = (fieldKey) => {
        const mappedCol = columnMapping[fieldKey]
        if (!mappedCol) return null
        return row[mappedCol] !== undefined && row[mappedCol] !== null ? String(row[mappedCol]).trim() : null
      }

      // Name
      const name = getVal('name') || ''

      // Clean numeric Price (strips ₹, commas, etc.)
      const rawPrice = getVal('price')
      let price = 0
      if (rawPrice) {
        const cleaned = String(rawPrice).replace(/[^\d.]/g, '')
        price = parseFloat(cleaned) || 0
      }

      // Clean Quantity
      const rawQty = getVal('quantity')
      let quantity = 0
      if (rawQty) {
        const cleanedQty = String(rawQty).replace(/[^\d]/g, '')
        quantity = parseInt(cleanedQty, 10) || 0
      }

      // Supplier / Company
      const supplier = getVal('supplier') || defaultCompany || 'General Agro'

      // Type / Category
      let type = getVal('type') || defaultCategory || ''
      if (!type) {
        // Auto-infer from product name if empty
        const lowerName = name.toLowerCase()
        if (lowerName.includes('urea')) type = 'Urea'
        else if (lowerName.includes('dap')) type = 'DAP'
        else if (lowerName.includes('npk') || lowerName.includes(':')) type = 'NPK'
        else if (lowerName.includes('zinc') || lowerName.includes('boron') || lowerName.includes('sulph')) type = 'Micronutrients'
        else if (lowerName.includes('bio') || lowerName.includes('compost') || lowerName.includes('organic')) type = 'Bio Fertilizer'
        else if (lowerName.includes('cide') || lowerName.includes('fungi') || lowerName.includes('insect') || lowerName.includes('herb')) type = 'Pesticide'
        else type = 'Other'
      }

      // Batch & Expiry
      const batch_number = getVal('batch_number') || null
      let expiry_date = getVal('expiry_date') || null

      // Normalize date if needed (e.g. DD/MM/YYYY to YYYY-MM-DD)
      if (expiry_date && expiry_date.includes('/')) {
        const parts = expiry_date.split('/')
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            expiry_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }
      }

      const description = getVal('description') || null

      const isValid = Boolean(name && price > 0)

      return {
        _id: idx,
        name,
        type,
        price,
        quantity,
        supplier,
        batch_number,
        expiry_date,
        description,
        _isValid: isValid
      }
    })
  }, [rawData, columnMapping, defaultCompany, defaultCategory])

  const validCount = mappedPreview.filter(p => p._isValid).length

  const handleImport = async () => {
    if (!columnMapping.name) {
      toast.error('Please map a column to "Product Name"')
      return
    }
    if (!columnMapping.price) {
      toast.error('Please map a column to "Selling Price"')
      return
    }

    const validProducts = mappedPreview.filter(p => p._isValid).map(({ _id, _isValid, ...rest }) => rest)

    if (validProducts.length === 0) {
      toast.error('No valid products to import. Ensure Product Name and Price are mapped correctly.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.post('/products/bulk', { products: validProducts })
      toast.success(res.data.message || `Successfully imported ${validProducts.length} products!`)
      if (onImportSuccess) onImportSuccess(validProducts)
      onClose()
    } catch (err) {
      console.error('Import error:', err)
      toast.error(err.response?.data?.error || 'Failed to import products')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex justify-between items-center relative">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Universal Company Catalog Importer</h3>
                <span className="text-xs bg-emerald-500/50 text-white font-medium px-2.5 py-0.5 rounded-full border border-white/20">
                  Any Company Format
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                Importing: <span className="font-semibold underline">{fileName || 'Uploaded Sheet'}</span> ({rawData?.length || 0} rows found)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Different companies use different column headers (e.g., <i>Item / Rate / MRP / Qty</i>). Match them below once to import effortlessly.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoMap}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 font-semibold transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Detect Columns
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-3 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('mapping')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'mapping'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table className="w-4 h-4" />
            1. Column Mapping ({Object.values(columnMapping).filter(Boolean).length} / {TARGET_FIELDS.length})
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Check className="w-4 h-4" />
            2. Live Preview ({validCount} Ready to Import)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'mapping' && (
            <div className="space-y-6">
              {/* Optional Company Overrides */}
              <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    Default Company / Manufacturer (Optional)
                  </label>
                  <input
                    type="text"
                    value={defaultCompany}
                    onChange={(e) => setDefaultCompany(e.target.value)}
                    placeholder="e.g. Bayer / IFFCO / Coromandel / Syngenta"
                    className="w-full text-xs px-3 py-2 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <p className="text-[11px] text-teal-700 mt-1">Applied if company column is missing or blank in file.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    Default Category / Type (Optional)
                  </label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">Auto-Detect from Product Name</option>
                    <option value="NPK">NPK Complex</option>
                    <option value="Urea">Urea</option>
                    <option value="DAP">DAP</option>
                    <option value="Potassium">Potassium / MOP</option>
                    <option value="Insecticide">Insecticide</option>
                    <option value="Fungicide">Fungicide</option>
                    <option value="Herbicide">Herbicide</option>
                    <option value="Micronutrients">Micronutrients</option>
                    <option value="Bio Fertilizer">Bio Fertilizer</option>
                    <option value="Other">Other</option>
                  </select>
                  <p className="text-[11px] text-teal-700 mt-1">Will categorize products automatically if left on Auto-Detect.</p>
                </div>
              </div>

              {/* Column Mapping Grid */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="col-span-5">System Field Required</div>
                  <div className="col-span-2 text-center">Mapping</div>
                  <div className="col-span-5">Column in Your File</div>
                </div>

                <div className="divide-y divide-gray-100 bg-white">
                  {TARGET_FIELDS.map((field) => {
                    const currentMatch = columnMapping[field.key]
                    return (
                      <div key={field.key} className="px-4 py-3 grid grid-cols-12 items-center hover:bg-emerald-50/30 transition text-sm">
                        <div className="col-span-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{field.label}</span>
                            {field.required && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                Required
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 block mt-0.5">{field.description}</span>
                        </div>

                        <div className="col-span-2 flex justify-center text-gray-400">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        <div className="col-span-5">
                          <select
                            value={currentMatch || ''}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                            className={`w-full text-xs px-3 py-2 rounded-xl border font-semibold outline-none transition ${
                              currentMatch
                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                                : field.required
                                ? 'border-amber-300 bg-amber-50/30 text-amber-800'
                                : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}
                          >
                            <option value="">-- Do Not Import / Blank --</option>
                            {fileHeaders.map((hdr) => (
                              <option key={hdr} value={hdr}>
                                {hdr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-600">
                  Showing first 20 products formatted for your shop database:
                </p>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  {validCount} valid of {mappedPreview.length} total rows
                </span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Product Name</th>
                      <th className="px-3 py-2.5">Price (₹)</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Company</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Batch</th>
                      <th className="px-3 py-2.5">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {mappedPreview.slice(0, 20).map((p) => (
                      <tr key={p._id} className={!p._isValid ? 'bg-red-50/50 text-gray-400' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2">
                          {p._isValid ? (
                            <span className="inline-flex items-center text-emerald-600 font-bold gap-1">
                              <Check className="w-3.5 h-3.5" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-500 font-bold gap-1" title="Missing Name or valid Price">
                              <AlertCircle className="w-3.5 h-3.5" /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900">{p.name || '—'}</td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-700">₹{p.price.toFixed(2)}</td>
                        <td className="px-3 py-2">{p.quantity}</td>
                        <td className="px-3 py-2 text-gray-700">{p.supplier}</td>
                        <td className="px-3 py-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700">
                            {p.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px]">{p.batch_number || '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{p.expiry_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {activeTab === 'mapping' ? (
              <span>Click <b>"Preview Products"</b> to review rows before importing.</span>
            ) : (
              <span>Duplicates will automatically update price &amp; increase quantity.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            {activeTab === 'mapping' ? (
              <button
                onClick={() => setActiveTab('preview')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-md flex items-center gap-2"
              >
                <span>Preview Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={isSubmitting || validCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Import ({validCount} Products)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
