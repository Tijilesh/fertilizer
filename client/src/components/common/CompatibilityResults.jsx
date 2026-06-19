import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const CompatibilityResults = ({ result, onReset }) => {
  if (!result) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        {result.compatible ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <XCircle className="w-6 h-6 text-red-600" />
        )}
        <h4 className="text-lg font-semibold text-gray-900">
          Compatibility Analysis Results
        </h4>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-yellow-800 mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Warnings</span>
          </h5>
          {result.warnings.map((warning, index) => (
            <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Safe Combinations */}
      {result.safeCombinations && result.safeCombinations.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Safe Combinations</span>
          </h5>
          {result.safeCombinations.map((combo, index) => (
            <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
              <p className="text-sm font-medium text-green-800">{combo.products.join(' + ')}</p>
              {combo.notes && <p className="text-xs text-green-700 mt-1">{combo.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Dangerous Mixes */}
      {result.dangerousMixes && result.dangerousMixes.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-red-800 mb-2 flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Dangerous Combinations</span>
          </h5>
          {result.dangerousMixes.map((mix, index) => (
            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
              <p className="text-sm font-medium text-red-800">{mix.products.join(' + ')}</p>
              <p className="text-xs text-red-700 mt-1">{mix.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Crop Specific Advice */}
      {result.cropAdvice && result.cropAdvice.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-indigo-800 mb-2 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span>Crop Specific Insights</span>
          </h5>
          {result.cropAdvice.map((advice, index) => (
            <div key={index} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-2">
              <p className="text-sm font-bold text-indigo-900 mb-1">{advice.product_name} x {result.crop_name || 'Selected Crop'}</p>
              <p className="text-sm text-indigo-800"><span className="font-semibold">Advice:</span> {advice.compatibility_notes}</p>
              {advice.recommended_dosage && (
                <p className="text-xs text-indigo-700 mt-1"><span className="font-semibold">Recommended Dosage:</span> {advice.recommended_dosage}</p>
              )}
              {advice.warnings && (
                <p className="text-xs text-red-600 mt-1"><span className="font-semibold">Warning:</span> {advice.warnings}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-800 mb-2">Recommendations</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full mt-4 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <CheckCircle className="w-4 h-4" />
        <span>Check Different Products</span>
      </button>
    </div>
  )
}

export default CompatibilityResults