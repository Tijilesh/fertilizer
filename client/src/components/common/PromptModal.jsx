import React from 'react'

const PromptModal = ({ open, title, defaultValue = '', placeholder = '', onCancel, onConfirm }) => {
  const [value, setValue] = React.useState(defaultValue)

  React.useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <input
          className="w-full p-2 border rounded mb-4"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button className="px-4 py-2 text-gray-600" onClick={() => onCancel && onCancel()}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onConfirm && onConfirm(value)}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromptModal
