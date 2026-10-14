import { useState } from 'react'
import { Printer, FileText, Smartphone, ArrowLeft } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

// Helper to convert number to Indian currency words
function numberToWords(num) {
  if (!num || isNaN(num)) return 'Zero Rupees Only'
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const n = Math.floor(num)
  if (n === 0) return 'Zero Rupees Only'

  function convertGroup(n) {
    let str = ''
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += a[n] + ' '
    }
    return str
  }

  let words = ''
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const remainder = n % 1000

  if (crore > 0) words += convertGroup(crore) + 'Crore '
  if (lakh > 0) words += convertGroup(lakh) + 'Lakh '
  if (thousand > 0) words += convertGroup(thousand) + 'Thousand '
  if (remainder > 0) words += convertGroup(remainder)

  return words.trim() + ' Rupees Only'
}

const PrintableInvoice = ({ sale, shopSettings, onBack }) => {
  const [printFormat, setPrintFormat] = useState('a4') // 'a4' or 'thermal'

  const shop = {
    name: shopSettings?.shop_name || 'Kisan Agro & Fertilizer Center',
    phone: shopSettings?.shop_phone || '+91 98765 43210',
    address: shopSettings?.shop_address || 'Main Market Mandi, Station Road',
    gstin: shopSettings?.shop_gstin || '09AAACK1234M1Z5',
    license: shopSettings?.shop_license || 'FERT/DL/2024/481',
    upiId: shopSettings?.upi_id || ''
  }

  const invoiceNumber = `INV-${new Date(sale.sale_date).getFullYear()}-${String(sale.id).padStart(5, '0')}`
  const totalAmount = parseFloat(sale.total_amount) || 0
  const taxableSubtotal = (totalAmount / 1.18).toFixed(2)
  const totalGst = (totalAmount - parseFloat(taxableSubtotal)).toFixed(2)
  const halfGst = (parseFloat(totalGst) / 2).toFixed(2)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Non-Printable Header & Controls */}
      <div className="no-print glass-card premium-shadow p-4 sm:p-6 rounded-3xl bg-white border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sales
        </button>

        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setPrintFormat('a4')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              printFormat === 'a4'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            A4 Tax Invoice
          </button>
          <button
            onClick={() => setPrintFormat('thermal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              printFormat === 'thermal'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            3&quot; POS Thermal Slip
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30"
        >
          <Printer className="w-5 h-5" />
          Print {printFormat === 'a4' ? 'Invoice' : 'Slip'}
        </button>
      </div>

      {/* Embedded Print Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-invoice-container, .printable-invoice-container * {
            visibility: visible !important;
          }
          .printable-invoice-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }
          @page {
            margin: 10mm;
            size: ${printFormat === 'a4' ? 'A4 portrait' : '80mm auto'};
          }
        }
      `}</style>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Standard A4 GST Tax Invoice Format */}
      {/* ───────────────────────────────────────────────────────────── */}
      {printFormat === 'a4' && (
        <div className="printable-invoice-container bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-200 max-w-4xl mx-auto text-gray-900">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-widest rounded-md mb-2">
                  Tax Invoice / Cash Memo
                </span>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">{shop.name}</h1>
                <p className="text-sm text-gray-600 font-medium mt-1">{shop.address}</p>
                <p className="text-sm text-gray-600 font-medium">Helpline / Phone: {shop.phone}</p>
              </div>
              <div className="text-right text-xs space-y-1 font-mono">
                <p><span className="font-bold text-gray-500">GSTIN:</span> <span className="font-bold text-gray-900">{shop.gstin}</span></p>
                <p><span className="font-bold text-gray-500">FERT LIC NO:</span> <span className="font-bold text-gray-900">{shop.license}</span></p>
                <p className="pt-2 text-emerald-700 font-sans font-bold text-sm">Govt. Authorized Dealer</p>
              </div>
            </div>
          </div>

          {/* Invoice Metadata & Customer Info */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 text-sm">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Billed To (Farmer / Buyer)</p>
              <p className="font-bold text-base text-gray-900">{sale.customer_name || 'Walk-in Farmer'}</p>
              <p className="text-gray-600 font-medium mt-0.5">Phone: {sale.customer_phone || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invoice Details</p>
              <p className="font-mono font-bold text-emerald-700">{invoiceNumber}</p>
              <p className="text-gray-600 font-medium mt-0.5">
                Date: {new Date(sale.sale_date).toLocaleDateString()} at {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-gray-600 font-medium">
                Payment: <span className="font-bold text-gray-900">{sale.payment_method || 'Cash'}</span> ({sale.payment_status || 'Paid'})
              </p>
            </div>
          </div>

          {/* Table of Items */}
          <table className="w-full text-left text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-300 text-gray-700 uppercase text-xs tracking-wider bg-gray-100">
                <th className="py-3 px-3 font-bold">#</th>
                <th className="py-3 px-3 font-bold">Product Description</th>
                <th className="py-3 px-3 font-bold">Category</th>
                <th className="py-3 px-3 font-bold">Batch No.</th>
                <th className="py-3 px-3 font-bold text-center">Qty</th>
                <th className="py-3 px-3 font-bold text-right">Rate (₹)</th>
                <th className="py-3 px-3 font-bold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sale.items && sale.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-gray-900">{item.name}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{item.type}</td>
                  <td className="py-3 px-3 font-mono text-xs text-gray-500">{item.batch_number || 'BATCH-2026'}</td>
                  <td className="py-3 px-3 text-center font-semibold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{(parseFloat(item.price_per_unit) || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">{(parseFloat(item.total_price) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations & Tax Breakdown */}
          <div className="flex justify-between items-start border-t-2 border-gray-200 pt-4 mb-8">
            <div className="max-w-md">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount In Words</p>
              <p className="font-semibold text-gray-800 italic bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-sm">
                {numberToWords(totalAmount)}
              </p>

              {/* Terms */}
              <div className="mt-4 text-[11px] text-gray-500 space-y-1">
                <p className="font-bold text-gray-700">Terms &amp; Conditions:</p>
                <p>1. Check bag seal, batch number, and expiry date before application.</p>
                <p>2. Keep agrochemicals stored in a dry, ventilated shed away from livestock.</p>
                <p>3. Goods once sold will not be returned. Computer-generated tax invoice.</p>
              </div>
            </div>

            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Value:</span>
                <span className="font-mono">₹{taxableSubtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{halfGst}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{halfGst}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-emerald-700 border-t-2 border-gray-800 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-12 border-t border-dashed border-gray-300 text-center text-xs">
            <div>
              <div className="w-48 border-b border-gray-400 mx-auto mb-2"></div>
              <p className="font-semibold text-gray-700">Customer / Farmer Signature</p>
            </div>
            <div>
              <div className="w-48 border-b border-gray-400 mx-auto mb-2"></div>
              <p className="font-bold text-gray-900">For {shop.name}</p>
              <p className="text-[10px] text-gray-500">Authorized Signatory &amp; Stamp</p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. Compact 3-inch (80mm) POS Thermal Slip Format */}
      {/* ───────────────────────────────────────────────────────────── */}
      {printFormat === 'thermal' && (
        <div className="printable-invoice-container bg-white p-6 rounded-2xl shadow-xl border border-gray-300 max-w-[340px] mx-auto text-gray-900 font-mono text-xs">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400 space-y-0.5">
            <h2 className="text-base font-black tracking-tight">{shop.name}</h2>
            <p className="text-[10px] text-gray-600">{shop.address}</p>
            <p className="text-[10px] text-gray-600">Ph: {shop.phone}</p>
            <p className="text-[10px] font-bold">GSTIN: {shop.gstin}</p>
            <p className="text-[10px] font-bold">LIC: {shop.license}</p>
          </div>

          {/* Invoice Info */}
          <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-bold">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.sale_date).toLocaleDateString()} {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>Farmer:</span>
              <span className="font-bold">{sale.customer_name || 'Walk-in'}</span>
            </div>
            {sale.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{sale.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Pay Mode:</span>
              <span>{sale.payment_method || 'Cash'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-gray-400">
            <div className="flex justify-between font-bold text-[11px] mb-1">
              <span>Item</span>
              <span>Qty x Rate</span>
              <span>Total</span>
            </div>
            {sale.items && sale.items.map((item, idx) => (
              <div key={idx} className="py-1">
                <div className="font-bold truncate">{item.name}</div>
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>{item.type}</span>
                  <span>{item.quantity} x ₹{parseFloat(item.price_per_unit).toFixed(0)}</span>
                  <span className="font-bold text-gray-900">₹{parseFloat(item.total_price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span>₹{taxableSubtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST (9%):</span>
              <span>₹{halfGst}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST (9%):</span>
              <span>₹{halfGst}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-800">
              <span>NET PAYABLE:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* UPI QR Code if configured */}
          {shop.upiId && (
            <div className="py-3 text-center border-b border-dashed border-gray-400">
              <p className="text-[10px] font-bold mb-1">Scan &amp; Pay via UPI</p>
              <div className="flex justify-center p-1 bg-white inline-block border rounded">
                <QRCodeSVG value={`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.name)}&am=${totalAmount}&cu=INR`} size={90} />
              </div>
              <p className="text-[9px] text-gray-500 mt-1">{shop.upiId}</p>
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-3 text-center text-[10px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-800">Thank You! Happy Farming!</p>
            <p>Please visit again</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrintableInvoice
