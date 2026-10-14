import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const CompatibilityRulesManager = () => {
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    product1Id: '',
    product2Id: '',
    compatibilityType: 'caution',
    reason: '',
    cropSpecific: false
  })

  useEffect(() => {
    fetchRules()
    fetchProducts()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const res = await api.get('/compatibility/rules')
      setRules(res.data || [])
    } catch (error) {
      console.error('Failed to load rules:', error)
      toast.error('Failed to load compatibility rules')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const openAddModal = () => {
    setEditingRule(null)
    setFormData({
      product1Id: '',
      product2Id: '',
      compatibilityType: 'caution',
      reason: '',
      cropSpecific: false
    })
    setShowModal(true)
  }

  const openEditModal = (rule) => {
    setEditingRule(rule)
    setFormData({
      product1Id: rule.product1_id,
      product2Id: rule.product2_id,
      compatibilityType: rule.compatibility_type || 'caution',
      reason: rule.reason || '',
      cropSpecific: Boolean(rule.crop_specific)
    })
    setShowModal(true)
  }

  const handleSaveRule = async (e) => {
    e.preventDefault()

    setSubmitting(true)
    try {
      if (editingRule) {
        // Update existing rule (PUT /api/compatibility/rules/:id)
        await api.put(`/compatibility/rules/${editingRule.id}`, {
          compatibilityType: formData.compatibilityType,
          reason: formData.reason,
          cropSpecific: formData.cropSpecific
        })
        toast.success('Compatibility rule updated successfully')
      } else {
        // Add new rule (POST /api/compatibility/rules)
        if (!formData.product1Id || !formData.product2Id) {
          toast.error('Please select both products')
          setSubmitting(false)
          return
        }
        if (formData.product1Id === formData.product2Id) {
          toast.error('Please select two different products')
          setSubmitting(false)
          return
        }

        await api.post('/compatibility/rules', {
          product1Id: Number(formData.product1Id),
          product2Id: Number(formData.product2Id),
          compatibilityType: formData.compatibilityType,
          reason: formData.reason,
          cropSpecific: formData.cropSpecific
        })
        toast.success('Compatibility rule added successfully')
      }

      setShowModal(false)
      fetchRules()
    } catch (error) {
      console.error('Failed to save rule:', error)
      toast.error(error.response?.data?.error || 'Failed to save rule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this compatibility rule?')) return
    try {
      await api.delete(`/compatibility/rules/${id}`)
      toast.success('Rule deleted')
      setRules(rules.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete rule:', error)
      toast.error(error.response?.data?.error || 'Failed to delete rule')
    }
  }

  const filteredRules = rules.filter(r => {
    const search = searchTerm.toLowerCase()
    return (
      r.product1_name?.toLowerCase().includes(search) ||
      r.product2_name?.toLowerCase().includes(search) ||
      r.reason?.toLowerCase().includes(search) ||
      r.compatibility_type?.toLowerCase().includes(search)
    )
  })

  const getBadge = (type) => {
    switch (type) {
      case 'compatible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
          </span>
        )
      case 'incompatible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" /> Incompatible
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Caution
          </span>
        )
    }
  }

  return (
    <div className="glass-card premium-shadow bg-white rounded-[2rem] p-8 border-2 border-white/50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            Fertilizer Mixing Compatibility Rules
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Define safety combinations and tank-mix warnings for products in your shop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product name, rule type, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 font-medium">Loading compatibility rules...</div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          No compatibility rules found. Click &quot;Add Rule&quot; to create one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs bg-gray-50/50">
                <th className="py-3 px-4 font-semibold rounded-l-xl">Product Combination</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reason / Guidance</th>
                <th className="py-3 px-4 font-semibold text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">
                      {rule.product1_name} <span className="text-gray-400 font-normal">+</span> {rule.product2_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rule.product1_type} &middot; {rule.product2_type}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{getBadge(rule.compatibility_type)}</td>
                  <td className="py-3.5 px-4 text-gray-700 max-w-xs">{rule.reason || '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit rule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingRule ? 'Edit Compatibility Rule' : 'Add Compatibility Rule'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product 1
                </label>
                <select
                  value={formData.product1Id}
                  onChange={(e) => setFormData({ ...formData, product1Id: e.target.value })}
                  disabled={Boolean(editingRule)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select First Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product 2
                </label>
                <select
                  value={formData.product2Id}
                  onChange={(e) => setFormData({ ...formData, product2Id: e.target.value })}
                  disabled={Boolean(editingRule)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select Second Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Compatibility Type
                </label>
                <select
                  value={formData.compatibilityType}
                  onChange={(e) => setFormData({ ...formData, compatibilityType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none"
                >
                  <option value="compatible">Compatible (Safe to mix)</option>
                  <option value="caution">Caution (Potential issues / split application)</option>
                  <option value="incompatible">Incompatible (Dangerous mix / flocculation / damage)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason &amp; Advisory Note
                </label>
                <textarea
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Risk of precipitation or pH conflict; apply separately."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompatibilityRulesManager
