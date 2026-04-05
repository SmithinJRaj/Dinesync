"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Download, CreditCard, ShieldCheck, Lock, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function FeesPage() {
  const router = useRouter();
  const [feeData, setFeeData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    Promise.all([
       fetch('http://localhost:5000/api/fees/my-fee', {
         headers: { 'Authorization': `Bearer ${token}` }
       }),
       fetch('http://localhost:5000/api/fees/payments', {
         headers: { 'Authorization': `Bearer ${token}` }
       })
    ])
    .then(async ([feeRes, payRes]) => {
       if (feeRes.status === 403) {
          setNotRegistered(true);
          return;
       }
       const feePayload = await feeRes.json();
       const payPayload = await payRes.ok ? await payRes.json() : [];
       setFeeData(feePayload);
       setPaymentHistory(payPayload);
    })
    .catch(err => console.log('Error fetching records', err))
    .finally(() => setLoading(false));
  }, [router]);

  const handlePayment = async () => {
     setIsProcessing(true);
     const token = localStorage.getItem('token');
     try {
       const res = await fetch('http://localhost:5000/api/fees/pay', {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ amount: feeData.finalFee || 0 })
       });
       
       if (res.ok) {
          const newPayment = await res.json();
          // Prepend the new payment to the history locally so it reflects instantly
          setPaymentHistory([newPayment, ...paymentHistory]);
          setToast(`Successfully Paid ₹${newPayment.amount.toFixed(2)}`);
          setIsModalOpen(false);
       } else {
          setToast('Payment simulation failed');
       }
     } catch (err) {
       setToast('Network Error processing payment');
     } finally {
       setIsProcessing(false);
       setTimeout(() => setToast(null), 4000);
     }
  };

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading financial records...</div>;

  if (notRegistered) {
     return (
        <div className="max-w-[1200px] mt-2 mb-10 pb-10 flex flex-col items-center justify-center pt-20">
           <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6">
              <Lock size={32} />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
           <p className="text-lg text-gray-500 font-medium mb-8">You are not registered to any mess. Please enroll first to view fee breakdowns.</p>
           <button onClick={() => router.push('/registration')} className="bg-gray-900 text-white font-bold px-8 py-4 rounded-full hover:bg-black transition">
              Browse Messes
           </button>
        </div>
     );
  }

  const billAmount = feeData?.finalFee > 0 ? feeData.finalFee.toFixed(2) : '0.00';

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 right-10 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* Payment Processing Modal Overaly */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white w-[90%] max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in relative">
               <button onClick={() => !isProcessing && setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition">
                  <X size={20} />
               </button>
               
               <div className="p-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                     <CreditCard size={30} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Confirm Payment</h2>
                  <p className="text-gray-500 font-medium mt-1 mb-6 text-sm">You are manually processing a simulated billing cycle charge.</p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex justify-between items-center mb-8">
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{billAmount}</p>
                     </div>
                     <ShieldCheck size={28} className="text-green-600 opacity-50" />
                  </div>

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
        <p className="text-base sm:text-lg text-gray-500 font-medium w-full sm:w-2/3">Review your ongoing dining subscriptions, process payments, and track your historical invoices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Current Cycle Breakdown</h2>
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <p className="font-semibold text-gray-700">Base Subscription (Current Tier)</p>
                    <p className="font-bold text-gray-900 text-lg">₹{feeData?.basePrice ? feeData.basePrice.toFixed(2) : '3000.00'}</p>
                 </div>
                 <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <div>
                       <p className="font-semibold text-gray-700">Sign-off Deductions</p>
                       <p className="text-xs text-gray-400 font-medium">{feeData?.signOffDays || 0} valid days registered</p>
                    </div>
                    <p className="font-bold text-green-600 text-lg">-₹{feeData?.deduction ? feeData.deduction.toFixed(2) : '0.00'}</p>
                 </div>
                 <div className="flex justify-between items-center pt-4">
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">Monthly Total</p>
                    <p className="font-black text-gray-900 text-3xl">₹{billAmount}</p>
                 </div>
              </div>
           </div>

           <h3 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h3>
           <div className="space-y-4">
              {paymentHistory.length === 0 ? (
                 <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-50 font-medium text-sm">
                    No verified payments have been logged yet.
                 </div>
              ) : paymentHistory.map((inv) => (
                 <div key={inv.id} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50 flex justify-between items-center group cursor-pointer hover:border-blue-100 transition">
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                          <Receipt size={18} />
                       </div>
                       <div>
                          <p className="font-semibold text-gray-800">Verified Web Transaction</p>
                          <p className="text-xs text-gray-400 font-medium">TXN-{inv.id.toString().padStart(5, '0')}</p>
                       </div>
                    </div>
                    <div className="flex items-center space-x-8">
                       <p className="font-bold text-gray-900">₹{inv.amount.toFixed(2)}</p>
                       <span className="px-3 py-1 bg-[#D1FAE5] text-[#065F46] text-[9px] font-black uppercase rounded-md tracking-widest">
                          SUCCESS
                       </span>
                       <Download size={18} className="text-gray-300 hover:text-blue-500" />
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className={`rounded-[2.5rem] p-10 flex flex-col justify-between shadow-[0_8px_30px_-15px_rgba(0,0,0,0.02)] border border-transparent ${feeData?.finalFee <= 0 ? 'bg-[#ECFDF5]' : 'bg-[#FCEBEA]'}`}>
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 shadow-md ${feeData?.finalFee <= 0 ? 'bg-[#10B981]' : 'bg-[#FF7B7B]'}`}>
                   <CreditCard size={28} className={feeData?.finalFee <= 0 ? "fill-green-400" : "fill-red-400"} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{feeData?.finalFee <= 0 ? 'Dues Cleared' : 'Total Outstanding'}</h3>
                <p className="text-[15px] text-gray-500 font-medium mb-8">Maintenance & Mess charges</p>
                
                <p className={`text-5xl sm:text-6xl font-black tracking-tighter ${feeData?.finalFee <= 0 ? 'text-[#047857]' : 'text-[#b93737]'}`}>
                  ₹{billAmount}
                </p>
                <div className="mt-4 flex items-center space-x-2 bg-white/40 px-4 py-2 rounded-lg w-max shadow-sm">
                   <ShieldCheck size={16} className={feeData?.finalFee <= 0 ? 'text-green-800' : 'text-red-800'} />
                   <p className={`text-xs font-bold tracking-wide ${feeData?.finalFee <= 0 ? 'text-green-900' : 'text-red-900'}`}>SECURE SSL CHECKOUT</p>
                </div>
              </div>
              
              {feeData?.finalFee <= 0 ? (
                  <button disabled className="w-full mt-10 bg-[#A7F3D0] text-[#065F46] text-[15px] font-bold py-5 rounded-full shadow-inner cursor-not-allowed">
                     Cycle Fully Paid
                  </button>
              ) : (
                  <button 
                     onClick={() => setIsModalOpen(true)}
                     className="w-full mt-10 bg-[#2A2F3D] hover:bg-black text-white text-[15px] font-bold py-5 rounded-full transition shadow-xl shadow-gray-900/10"
                  >
                    Pay Now
                  </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
