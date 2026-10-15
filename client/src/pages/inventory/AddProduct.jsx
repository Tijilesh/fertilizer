import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useLanguage } from '../../contexts/LanguageContext'
import SmartProductImportModal from '../../components/inventory/SmartProductImportModal'

const AddProduct = ({ onSuccess }) => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Smart Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [rawImportData, setRawImportData] = useState([])
  const [fileHeaders, setFileHeaders] = useState([])
  const [importFileName, setImportFileName] = useState('')

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          toast.error('The selected file has no data rows.');
          return;
        }

        const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
        setRawImportData(data);
        setFileHeaders(headers);
        setIsImportModalOpen(true);
      } catch (err) {
        console.error('Error reading spreadsheet file:', err);
        toast.error('Failed to read file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  }

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: '',
    quantity: '',
    supplier: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0
      })

      onSuccess()
      navigate('/products')
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error(error.response?.data?.error || t('errorAddingProduct') || 'Error adding product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('backToProducts')}</span>
        </button>
      </div>

      <div className="glass-card premium-shadow p-10 rounded-3xl border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('addNewProduct')}</h1>
            <p className="text-xs text-gray-500 mt-1">Add single product or upload any company Excel / CSV catalog</p>
          </div>
          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-sm"
              title="Upload file from any company (IFFCO, Bayer, Coromandel, etc.)"
            >
              <Upload className="w-4 h-4" />
              <span>Import Company File</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('productNameLabel')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder={t('productNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('typeLabel')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">{t('selectTypePlaceholder')}</option>
                <option value="NPK">NPK</option>
                <option value="Urea">Urea</option>
                <option value="DAP">DAP</option>
                <option value="Organic">Organic</option>
                <option value="Micronutrients">Micronutrients</option>
                <option value="Bio Fertilizer">Bio Fertilizer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('priceLabel')}
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder={t('pricePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('initialStockLabel')}
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="input-field"
                placeholder={t('quantityPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('supplierLabel')}
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="input-field"
                placeholder={t('supplierPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('descriptionLabel')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="input-field bg-white/50"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn-secondary"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-3 px-8 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('saving') || 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{t('saveProduct')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Universal Multi-Company Product Import Modal */}
      <SmartProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        rawData={rawImportData}
        fileHeaders={fileHeaders}
        fileName={importFileName}
        onImportSuccess={() => {
          if (onSuccess) onSuccess()
          navigate('/products')
        }}
      />
    </div>
  )
}

export default AddProduct 
