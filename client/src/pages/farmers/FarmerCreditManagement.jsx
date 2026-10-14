import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, FileText, AlertTriangle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { WhatsAppReminderModal } from '../../components/common';

const FarmerCreditManagement = ({ farmer, onUpdate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Modals state
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Form states
  const [interestRate, setInterestRate] = useState(farmer?.interest_rate || 0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, farmer.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/farmers/${farmer.id}/credit-history`);
      setHistory(res.data);
    } catch (err) {
      toast.error('Failed to load credit history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInterestRate = async () => {
    try {
      await api.put(`/farmers/${farmer.id}/interest-rate`, { interest_rate: parseFloat(interestRate) });
      toast.success('Interest rate updated');
      setShowInterestModal(false);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update interest rate');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return toast.error('Enter valid amount');
    try {
      await api.post(`/farmers/${farmer.id}/payment`, { amount: parseFloat(paymentAmount) });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      onUpdate();
      if (showHistory) fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleWaiveInterest = async () => {
    if (!waiveAmount || parseFloat(waiveAmount) <= 0 || !waiveReason) return toast.error('Enter valid amount and reason');
    try {
      await api.post(`/farmers/${farmer.id}/waive-interest`, { amount: parseFloat(waiveAmount), reason: waiveReason });
      toast.success('Interest waived successfully');
      setShowWaiveModal(false);
      setWaiveAmount('');
      setWaiveReason('');
      onUpdate();
      if (showHistory) fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to waive interest');
    }
  };

  const handleCalculateInterest = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    try {
      const res = await api.post(`/farmers/${farmer.id}/calculate-interest`, { calculation_period: currentMonth });
      toast.success(res.data.message || 'Monthly interest calculated successfully');
      onUpdate();
      if (showHistory) fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate interest');
    }
  };

  const availableCredit = parseFloat(farmer.credit_limit) - parseFloat(farmer.current_credit);
  const totalPayable = parseFloat(farmer.current_credit) + parseFloat(farmer.accrued_interest);

  return (
    <div className="glass-card premium-shadow p-8 rounded-3xl border mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <DollarSign className="mr-2 text-green-600 w-6 h-6" /> Credit Management
        </h2>
        <div className="space-x-2 flex flex-wrap gap-2 justify-end">
          {totalPayable > 0 && (
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Reminder
            </button>
          )}
          <button onClick={() => setShowInterestModal(true)} className="btn-secondary px-4 py-2 rounded-lg text-sm">Edit Rate</button>
          <button onClick={() => setShowPaymentModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition">Record Payment</button>
          <button onClick={() => setShowWaiveModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition">Waive Interest</button>
          <button onClick={handleCalculateInterest} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition flex items-center"><Calendar className="w-4 h-4 mr-1"/> Calc Monthly Interest</button>
          <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center"><FileText className="w-4 h-4 mr-1"/> History</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">Credit Limit</p>
          <p className="text-xl font-bold text-gray-900 mt-1">₹{parseFloat(farmer.credit_limit || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500">Current Credit (Principal)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">₹{parseFloat(farmer.current_credit || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
          <p className="text-sm text-green-600">Available Credit</p>
          <p className="text-xl font-bold text-green-700 mt-1">₹{availableCredit.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 flex items-center"><TrendingUp className="w-4 h-4 mr-1 text-gray-400"/> Interest Rate</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{parseFloat(farmer.interest_rate || 0)}% / mo</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-sm text-orange-600">Accrued Interest</p>
          <p className="text-xl font-bold text-orange-700 mt-1">₹{parseFloat(farmer.accrued_interest || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Total Payable</p>
            <p className="text-2xl font-black text-red-700 mt-1">₹{totalPayable.toFixed(2)}</p>
          </div>
          {totalPayable > 0 && (
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
              title="Send WhatsApp Reminder"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Remind
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Credit & Interest History</h3>
          {loading ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 font-bold text-gray-700">Date</th>
                    <th className="text-left py-2 font-bold text-gray-700">Type</th>
                    <th className="text-right py-2 font-bold text-gray-700">Amount</th>
                    <th className="text-right py-2 font-bold text-gray-700">Principal</th>
                    <th className="text-right py-2 font-bold text-gray-700">Interest</th>
                    <th className="text-left py-2 pl-4 font-bold text-gray-700">Reason / Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? history.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-gray-600">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          tx.transaction_type === 'CREDIT_PURCHASE' ? 'bg-blue-100 text-blue-800' :
                          tx.transaction_type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                          tx.transaction_type === 'WAIVER' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {tx.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold">₹{parseFloat(tx.amount).toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-600">₹{parseFloat(tx.principal_amount).toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-600">₹{parseFloat(tx.interest_amount).toFixed(2)}</td>
                      <td className="py-3 pl-4 text-gray-500 text-xs">{tx.reason || tx.reference_id || '-'} <br/><span className="text-[10px] text-gray-400">By: {tx.performed_by_name}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="py-4 text-center text-gray-500">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Interest Rate Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4">Edit Interest Rate</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per month)</label>
              <input type="number" step="0.01" min="0" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowInterestModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdateInterestRate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4">Record Payment</h3>
            <div className="mb-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between mb-1"><span>Total Payable:</span> <span className="font-bold text-gray-900">₹{totalPayable.toFixed(2)}</span></div>
              <div className="flex justify-between mb-1"><span>Accrued Interest:</span> <span className="font-bold text-orange-600">₹{parseFloat(farmer.accrued_interest || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Current Principal:</span> <span className="font-bold text-blue-600">₹{parseFloat(farmer.current_credit || 0).toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-gray-500 mb-4 italic">Payments are automatically applied to interest first, then principal.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
              <input type="number" step="0.01" min="0.01" max={totalPayable} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500" />
            </div>
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <div className="mb-4 p-2 bg-green-50 rounded border border-green-100 text-xs space-y-1">
                <div className="flex justify-between"><span>Interest Applied:</span> <span>₹{Math.min(parseFloat(paymentAmount), parseFloat(farmer.accrued_interest || 0)).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Principal Applied:</span> <span>₹{Math.max(0, parseFloat(paymentAmount) - parseFloat(farmer.accrued_interest || 0)).toFixed(2)}</span></div>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleRecordPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Waive Interest Modal */}
      {showWaiveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-orange-600">Waive Interest</h3>
            <div className="mb-4 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="flex justify-between items-center">
                <span>Accrued Interest:</span> 
                <span className="font-bold text-orange-700 text-lg">₹{parseFloat(farmer.accrued_interest || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waiver Amount (₹)</label>
                <input type="number" step="0.01" min="0.01" max={parseFloat(farmer.accrued_interest || 0)} value={waiveAmount} onChange={e => setWaiveAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Mandatory)</label>
                <textarea required value={waiveReason} onChange={e => setWaiveReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500" rows="2" placeholder="e.g. Farmer unable to pay"></textarea>
              </div>
              
              {waiveAmount && parseFloat(waiveAmount) > 0 && (
                <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Remaining Interest After Waiver:</span> 
                    <span>₹{Math.max(0, parseFloat(farmer.accrued_interest || 0) - parseFloat(waiveAmount)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowWaiveModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleWaiveInterest} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Confirm Waiver</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        farmer={farmer}
        totalDue={totalPayable}
      />
    </div>
  );
};

export default FarmerCreditManagement;
