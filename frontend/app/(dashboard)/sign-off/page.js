"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarOff, Clock, History, AlertCircle, ArrowRight, Lock } from 'lucide-react';

export default function SignOffPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [signOffs, setSignOffs] = useState([]);
  const [toast, setToast] = useState(null);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetch('http://localhost:5000/api/signoffs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
       if (res.status === 403) {
          setNotRegistered(true);
          return null;
       }
       return res.json();
    })
    .then(data => {
      if(Array.isArray(data)) setSignOffs(data);
    })
    .catch(err => console.log('Error fetching signoffs', err));
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start <= today) {
      setToast('Start date must be after today');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (end < start) {
      setToast('End date cannot be before start date');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:5000/api/signoffs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToast('Sign-off recorded successfully!');
        setSignOffs([data, ...signOffs]);
        setStartDate('');
        setEndDate('');
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

  if (notRegistered) {
     return (
        <div className="max-w-[1200px] mt-2 mb-10 pb-10 flex flex-col items-center justify-center pt-20">
           <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6">
              <Lock size={32} />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
           <p className="text-lg text-gray-500 font-medium mb-8">You are not registered to any mess. You cannot declare leaves.</p>
           <button onClick={() => router.push('/registration')} className="bg-gray-900 text-white font-bold px-8 py-4 rounded-full hover:bg-black transition">
              Browse Messes
           </button>
        </div>
     );
  }

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      {toast && (
        <div className="fixed top-10 right-10 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <AlertCircle size={20} className="text-yellow-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Sign-Off Retreat</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium w-full sm:w-2/3">Going home for the weekend or taking a vacation? Notify the culinary team to freeze your bills and prevent food waste.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)]">
             <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                   <CalendarOff size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-gray-900">New Declaration</h2>
                   <p className="text-sm text-gray-400 font-medium">Please declare at least 24h in advance</p>
                </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Start Date</label>
                      <input 
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800"
                      />
                   </div>
                   <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">End Date</label>
                      <input 
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Reason (Optional)</label>
                   <textarea 
                     rows="3"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     placeholder="e.g. Traveling home for holidays"
                     className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800 resize-none"
                   ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-full shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                  >
                     {loading ? 'Submitting...' : 'Confirm Retreat'}
                  </button>
                </div>
             </form>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-[#F8F9FA] rounded-[2.5rem] p-10 h-full border border-gray-200/50 flex flex-col">
              <div className="flex items-center space-x-3 mb-8">
                 <History size={20} className="text-gray-400" />
                 <h2 className="text-xl font-bold text-gray-900">Recent History</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                 {signOffs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                       <Clock size={40} className="mb-4 opacity-50 text-gray-300" />
                       <p className="font-medium text-sm">No recent sign-offs</p>
                    </div>
                 ) : (
                    signOffs.map(so => (
                       <div key={so.signoff_id} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50 flex justify-between items-center">
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center">
                               {formatDate(so.startDate)} <ArrowRight size={10} className="mx-2" /> {formatDate(so.endDate)}
                             </p>
                             <p className="font-semibold text-gray-800 text-sm">Valid Retreat</p>
                          </div>
                          <span className="px-3 py-1 bg-[#D1FAE5] text-[#065F46] text-[9px] font-black uppercase rounded-md tracking-widest">
                             Applied
                          </span>
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
