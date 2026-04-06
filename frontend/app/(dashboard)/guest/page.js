"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { History, AlertCircle, ArrowRight, Wallet, Users, Clock, Loader2, UtensilsCrossed } from 'lucide-react';

export default function GuestPage() {
  const router = useRouter();
  const [messes, setMesses] = useState([]);
  const [selectedMess, setSelectedMess] = useState('1'); // Match typically seeded IDs or handle gracefully
  const [guestRollNo, setGuestRollNo] = useState('');
  const [date, setDate] = useState('');
  const [mealType, setMealType] = useState('Lunch');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  // Dynamic fee calculation based on MealType and Mess
  const getGuestFee = () => {
    let basePrice = 0;
    if (mealType === 'Breakfast') basePrice = 40;
    else if (mealType === 'Lunch') basePrice = 70;
    else if (mealType === 'Dinner') basePrice = 60;

    // Small modifier based on Mess selection for dynamic pricing demo
    const messModifier = parseInt(selectedMess) % 3 === 0 ? 10 : parseInt(selectedMess) % 2 === 0 ? 5 : 0;
    return basePrice + messModifier;
  };

  const guestFee = getGuestFee();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch available messes
    fetch('http://localhost:5000/api/mess', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setMesses(data);
      if (data.length > 0) setSelectedMess(data[0].id.toString());
    })
    .catch(err => console.log(err));

    // Fetch guest history
    fetch('http://localhost:5000/api/guests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
       if(Array.isArray(data)) setHistory(data);
    })
    .catch(err => console.log(err));
  }, [router]);

  const handleProceedToPayment = (e) => {
     e.preventDefault();
     if (!selectedMess || !date || !guestRollNo) return;
     setShowPayment(true);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:5000/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messId: parseInt(selectedMess),
          guestRollNo,
          date: new Date(date).toISOString(),
          mealType: mealType
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToast('Guest payment successful!');
        setHistory([data, ...history]);
        setGuestRollNo('');
        setDate('');
        setMealType('Lunch');
        setShowPayment(false);
      } else {
        setToast(data.message || 'Error occurred');
      }
    } catch (err) {
      setToast('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatDate = (isoStr) => {
     return new Date(isoStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      {toast && (
        <div className="fixed top-10 right-10 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <AlertCircle size={20} className="text-yellow-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h3>
              <p className="text-gray-500 font-medium mb-6">Confirm and pay for your guest's meal.</p>
              
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                 <div className="flex justify-between items-center mb-3 text-sm font-medium">
                    <span className="text-gray-500">Guest Roll No.</span>
                    <span className="text-gray-900 font-bold">{guestRollNo}</span>
                 </div>
                 <div className="flex justify-between items-center mb-3 text-sm font-medium">
                    <span className="text-gray-500">Meal</span>
                    <span className="text-gray-900 font-bold">{mealType}</span>
                 </div>
                 <div className="flex justify-between items-center mb-3 text-sm font-medium">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900 font-bold">{date}</span>
                 </div>
                 <div className="h-px bg-gray-200 my-4"></div>
                 <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-500 font-bold">Total Amount</span>
                    <span className="text-blue-600 font-black">₹{guestFee}</span>
                 </div>
              </div>

              <div className="flex space-x-3">
                 <button onClick={() => setShowPayment(false)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition flex-1">
                    Cancel
                 </button>
                 <button onClick={handlePaymentSubmit} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition flex-1 flex items-center justify-center">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Pay Now'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Guest Access</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium w-full sm:w-2/3">Bring your friends or family to the mess. Simply register them, pay upfront, and enjoy the meal together.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] h-full">
             <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                   <Users size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-gray-900">New Guest Request</h2>
                   <p className="text-sm text-gray-400 font-medium">Flat ₹{guestFee} fee per guest meal</p>
                </div>
             </div>

             <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Mess</label>
                   <select 
                     required
                     value={selectedMess}
                     onChange={(e) => setSelectedMess(e.target.value)}
                     className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800 appearance-none"
                   >
                     <option value="" disabled>Select a mess</option>
                     {messes.length > 0 ? messes.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                     )) : (
                        <>
                           <option value="1">Mess A</option>
                           <option value="2">Mess B</option>
                           <option value="3">Mess C</option>
                        </>
                     )}
                   </select>
                </div>

                <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Guest Roll No.</label>
                   <input 
                     type="text"
                     required
                     value={guestRollNo}
                     onChange={(e) => setGuestRollNo(e.target.value)}
                     placeholder="e.g., 2026CS1083"
                     className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800"
                   />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date</label>
                      <input 
                        type="date"
                        required
                        min={minDate}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800"
                      />
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Meal Type</label>
                      <select 
                        required
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800 appearance-none"
                      >
                         <option value="Breakfast">Breakfast</option>
                         <option value="Lunch">Lunch</option>
                         <option value="Dinner">Dinner</option>
                      </select>
                   </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="font-bold text-xl text-gray-900 flex items-center">
                     <span className="text-gray-400 font-medium text-sm mr-3">Total</span>
                     ₹{guestFee}
                  </div>
                  <button 
                     type="submit" 
                     className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-blue-600/20 transition flex items-center"
                  >
                     <Wallet className="mr-2" size={18} /> Proceed to Pay
                  </button>
                </div>
             </form>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-[#F8F9FA] rounded-[2.5rem] p-10 h-full border border-gray-200/50 flex flex-col min-h-[400px]">
              <div className="flex items-center space-x-3 mb-8">
                 <History size={20} className="text-gray-400" />
                 <h2 className="text-xl font-bold text-gray-900">Guest History</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                 {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-20">
                       <UtensilsCrossed size={40} className="mb-4 opacity-30 text-gray-300" />
                       <p className="font-medium text-sm">No guest records yet</p>
                    </div>
                 ) : (
                    history.map((record, idx) => (
                       <div key={record.id || idx} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50">
                          <div className="flex justify-between items-start mb-2">
                             <div className="w-full">
                                <h4 className="font-bold text-gray-900 mb-0.5">{record.guestRollNo}</h4>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex justify-between w-full">
                                  <span>{record.mealType}</span>
                                  <span className="text-blue-500">{formatDate(record.date)}</span>
                                </p>
                             </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                             <span className="text-xs font-bold text-gray-800">Paid ₹{guestFee}</span>
                             <span className="px-3 py-1 bg-[#D1FAE5] text-[#065F46] text-[9px] font-black uppercase rounded-md tracking-widest shrink-0">
                                {record.status || 'CONFIRMED'}
                             </span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
