"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Download, CreditCard, ShieldCheck, Lock, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function FeesPage() {
  const router = useRouter();
  const [feeRecord, setFeeRecord] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [toast, setToast] = useState(null);

  const fetchRecords = async () => {
    const token = localStorage.getItem('token');
    try {
       const [feeRes, payRes] = await Promise.all([
         fetch('http://localhost:5000/api/fees/record', { headers: { 'Authorization': `Bearer ${token}` } }),
         fetch('http://localhost:5000/api/fees/payments', { headers: { 'Authorization': `Bearer ${token}` } })
       ]);
       if(feeRes.ok) setFeeRecord(await feeRes.json());
       if(payRes.ok) setPaymentHistory(await payRes.json());
    } catch(err) {
       console.log(err);
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchRecords();
  }, [router]);

  const handlePayment = async () => {
     if(!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
         setToast('Enter a valid amount');
         setTimeout(() => setToast(null), 3000);
         return;
     }
     if(parseFloat(paymentAmount) > parseFloat(feeRecord.remaining_due)) {
         setToast(`Cannot pay more than ₹${parseFloat(feeRecord.remaining_due).toFixed(2)}`);
         setTimeout(() => setToast(null), 3000);
         return;
     }

     setIsProcessing(true);
     const token = localStorage.getItem('token');
     try {
       const res = await fetch('http://localhost:5000/api/fees/pay', {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ amount: paymentAmount, fee_record_id: feeRecord.fee_record_id })
       });
       
       if (res.ok) {
          const payload = await res.json();
          setPaymentHistory([payload.payment, ...paymentHistory]);
          setFeeRecord({
             ...feeRecord, 
             paid_amount: parseFloat(feeRecord.paid_amount) + parseFloat(paymentAmount),
             remaining_due: parseFloat(feeRecord.remaining_due) - parseFloat(paymentAmount),
             payment_status: payload.newStatus
          });
          setToast(`Successfully Paid ₹${parseFloat(paymentAmount).toFixed(2)}`);
          setIsModalOpen(false);
          setPaymentAmount('');
       } else {
          const errData = await res.json();
          setToast(errData.message || 'Payment failed');
       }
     } catch (err) {
       setToast('Network Error processing payment');
     } finally {
       setIsProcessing(false);
       setTimeout(() => setToast(null), 4000);
     }
  };

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading financial records...</div>;

  if (feeRecord?.total_due === 0 && !feeRecord.fee_record_id) {
     return (
        <div className="max-w-[1200px] mt-2 mb-10 pb-10 flex flex-col items-center justify-center pt-20">
           <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-6">
              <Lock size={32} />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Records</h1>
           <p className="text-lg text-gray-500 font-medium mb-8">No billing records found. Ensure you are registered to a mess in an active cycle.</p>
           <button onClick={() => router.push('/registration')} className="bg-[#2A2F3D] text-white font-bold px-8 py-4 rounded-full hover:bg-black transition">
              Browse Messes
           </button>
        </div>
     );
  }

  const remainingRounded = feeRecord ? parseFloat(feeRecord.remaining_due).toFixed(2) : '0.00';

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10 relative">
      
      {toast && (
        <div className="fixed top-10 right-10 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white w-[90%] max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in relative text-center">
               <button onClick={() => !isProcessing && setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition">
                  <X size={20} />
               </button>
               
               <div className="p-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto">
                     <CreditCard size={30} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Simulate Payment</h2>
                  <p className="text-gray-500 font-medium text-sm mb-6">Enter an amount to deduct from your remaining total.</p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center items-center mb-6">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Remaining Bound</p>
                     <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{remainingRounded}</p>
                  </div>

                  <input 
                     type="number" 
                     placeholder="Amount e.g. 500" 
                     className="w-full bg-white border border-gray-200 p-4 rounded-2xl mb-6 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                     value={paymentAmount}
                     onChange={(e) => setPaymentAmount(e.target.value)}
                  />

                  <button 
                     onClick={handlePayment} 
                     disabled={isProcessing}
                     className="w-full bg-[#2A2F3D] hover:bg-black text-white font-bold py-4 rounded-full shadow-lg shadow-gray-900/10 transition flex justify-center items-center disabled:opacity-50"
                  >
                     {isProcessing ? 'Processing...' : 'Authorize Transaction'}
                     {!isProcessing && <ChevronRight size={18} className="ml-2 opacity-50" />}
                  </button>
               </div>
            </div>
         </div>
      )}

      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Financial Overview</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium">Review your ongoing dining subscriptions and process partial or full payments seamlessly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] mb-10 border border-transparent">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-bold text-gray-900">Current Cycle Breakdown</h2>
                 <span className={`px-4 py-1.5 uppercase font-black text-[10px] tracking-widest rounded-full ${feeRecord?.payment_status === 'PAID' ? 'bg-[#D1FAE5] text-[#065F46]' : feeRecord?.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-50 text-red-600'}`}>
                    {feeRecord?.payment_status}
                 </span>
              </div>
              
              <div className="space-y-6">
                 {parseFloat(feeRecord?.base_charge) > 0 && (
                   <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                      <p className="font-semibold text-gray-700">Base Subscription Charge</p>
                      <p className="font-bold text-gray-900 text-lg">₹{parseFloat(feeRecord.base_charge).toFixed(2)}</p>
                   </div>
                 )}
                 {parseFloat(feeRecord?.addon_total) > 0 && (
                   <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                      <div>
                         <p className="font-semibold text-gray-700">Add-On Transactions</p>
                         <p className="text-xs text-gray-400 font-medium">Items purchased independently</p>
                      </div>
                      <p className="font-bold text-gray-900 text-lg">+₹{parseFloat(feeRecord.addon_total).toFixed(2)}</p>
                   </div>
                 )}
                 {parseFloat(feeRecord?.signoff_deduction) > 0 && (
                   <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                      <p className="font-semibold text-gray-700">Sign-off Deductions</p>
                      <p className="font-bold text-green-600 text-lg">-₹{parseFloat(feeRecord.signoff_deduction).toFixed(2)}</p>
                   </div>
                 )}
                 <div className="flex justify-between items-center pt-2 pb-6 border-b border-gray-100">
                    <p className="font-bold text-gray-400 tracking-widest text-sm">Gross Total</p>
                    <p className="font-black text-gray-900 text-2xl">₹{parseFloat(feeRecord?.total_due).toFixed(2)}</p>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                    <p className="font-bold text-gray-400 tracking-widest text-sm">Paid Total</p>
                    <p className="font-black text-blue-600 text-2xl">-₹{parseFloat(feeRecord?.paid_amount).toFixed(2)}</p>
                 </div>
              </div>
           </div>

           <h3 className="text-2xl font-bold text-gray-900 mb-6">Verified Payments Logs</h3>
           <div className="space-y-4">
              {paymentHistory.length === 0 ? (
                 <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-50 font-medium text-sm">
                    No verified payments have been logged yet.
                 </div>
              ) : paymentHistory.map((inv) => (
                 <div key={inv.payment_id} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50 flex justify-between items-center group">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          <Receipt size={18} />
                       </div>
                       <div>
                          <p className="font-semibold text-gray-800">Verified Transfer</p>
                          <p className="text-xs text-gray-400 font-medium">TXN-{inv.payment_id.toString().padStart(5, '0')}</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-8">
                       <p className="font-black text-gray-900">₹{parseFloat(inv.amount).toFixed(2)}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className={`rounded-[2.5rem] p-10 flex flex-col justify-between shadow-[0_8px_30px_-15px_rgba(0,0,0,0.02)] border border-transparent ${parseFloat(feeRecord?.remaining_due) <= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FCEBEA]'}`}>
              <div>
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white mb-8 shadow-md ${parseFloat(feeRecord?.remaining_due) <= 0 ? 'bg-[#10B981]' : 'bg-[#FF7B7B]'}`}>
                   <CreditCard size={28} className={parseFloat(feeRecord?.remaining_due) <= 0 ? "fill-green-400" : "fill-red-400"} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{parseFloat(feeRecord?.remaining_due) <= 0 ? 'Dues Cleared' : 'Remaining Due'}</h3>
                <p className="text-[15px] text-gray-500 font-medium mb-8">{feeRecord?.cycle_name || 'Billing Cycle'}</p>
                
                <p className={`text-5xl sm:text-6xl font-black tracking-tighter ${parseFloat(feeRecord?.remaining_due) <= 0 ? 'text-[#047857]' : 'text-[#b93737]'}`}>
                  ₹{remainingRounded}
                </p>
              </div>
              
              {parseFloat(feeRecord?.remaining_due) <= 0 ? (
                  <button disabled className="w-full mt-10 bg-[#A7F3D0] text-[#065F46] text-[15px] font-bold py-5 rounded-full shadow-inner cursor-not-allowed">
                     Cycle Fully Paid
                  </button>
              ) : (
                  <button 
                     onClick={() => setIsModalOpen(true)}
                     className="w-full mt-10 bg-[#2A2F3D] hover:bg-black text-white text-[15px] font-bold py-5 rounded-full transition shadow-xl shadow-gray-900/10"
                  >
                    Custom Payment
                  </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
