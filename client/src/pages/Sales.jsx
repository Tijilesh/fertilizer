import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, ShoppingCart } from 'lucide-react'

const Sales = ({ sales, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSales = sales.filter(sale => {
    const customerName = (sale.customer_name || '').toLowerCase()
    const customerPhone = (sale.customer_phone || '').toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    return customerName.includes(searchLower) || 
           customerPhone.includes(searchLower) ||
           sale.id.toString().includes(searchLower)
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Sales</h1>
        <Link to="/sales/add" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Record Sale</span>
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Sales</label>
          <input
            type="text"
            placeholder="Search by customer name, phone, or sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{sale.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customer_name || 'Anonymous'}
                        </div>
                        {sale.customer_phone && (
                          <div className="text-sm text-gray-500">{sale.customer_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.items || 'Multiple items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${sale.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/sales/${sale.id}`}
                        className="text-primary-600 hover:text-primary-900 flex items-center justify-end space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search criteria.'
                : 'Get started by recording your first sale.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link to="/sales/add" className="btn-primary">
                  Record Sale
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sales 