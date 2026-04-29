"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, CreditCard, ChevronRight, CheckCircle, Activity, Bell } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [dash, setDash] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setUserName(localStorage.getItem('username') || 'Student');

    Promise.all([
       fetch('http://localhost:5000/api/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
       fetch('http://localhost:5000/api/fees/record', { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    .then(async ([dashRes, feeRes]) => {
       if (dashRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
       }
       const dashData = await dashRes.json();
       const feeData = feeRes.ok ? await feeRes.json() : null;
       
       if (feeData && feeData.fee_record_id) {
           dashData.feeSummary = feeData;
       }
       setDash(dashData);
    })
    .catch(err => console.log('Error', err))
    .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10">
         <div>
            <h1 className="text-3xl sm:text-[2.5rem] font-bold text-gray-900 leading-tight tracking-tight">Welcome back, {userName}</h1>
            <p className="text-gray-500 font-medium text-base sm:text-lg">Here's your dining summary aligned with our active records.</p>
         </div>
      </div>

      {!dash?.messRegistration ? (
          <div className="bg-white rounded-[2.5rem] p-16 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] text-center flex flex-col items-center border border-red-50">
             <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-8 border border-red-100">
                <Lock size={40} />
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-4">You are not registered to any mess</h2>
             <p className="text-gray-500 font-medium text-lg max-w-lg mb-10">
               {dash?.billingCycle === null 
                  ? "There are currently NO active Billing Cycles registered in the database. Wait for an admin to open one."
                  : "You haven't enrolled for the active cycle yet."}
             </p>
             <button onClick={() => router.push('/registration')} className="bg-[#2A2F3D] text-white font-bold px-10 py-5 text-lg rounded-full shadow-lg hover:bg-black transition hover:scale-105">
                Browse Available Messes
             </button>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
               
               <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] flex justify-between items-start border border-transparent">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">{dash.messRegistration.mess_name}</h2>
                    <p className="text-sm font-bold text-gray-400 tracking-wide uppercase">{dash.billingCycle?.cycle_name || 'Active Cycle'}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-full flex items-center">
                    <CheckCircle size={14} className="mr-1" /> Active Registration
                  </span>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-6 px-2">
                     <h2 className="text-2xl font-bold text-gray-900">Server Localized Menu</h2>
                     <button onClick={() => router.push('/menu')} className="text-blue-600 font-bold text-sm flex items-center hover:text-blue-700 transition">
                        View Full Week <ChevronRight size={16} className="ml-1" />
                     </button>
                  </div>

                  <div className="space-y-4">
                     {dash?.todaysMenu ? (
                        Object.entries(dash.todaysMenu).map(([sessionName, items], idx) => {
                           if (items.length === 0) return null;
                           return (
                              <div key={idx} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-50 flex flex-col transition hover:border-gray-200">
                                 <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-4">{sessionName}</h3>
                                 <div className="space-y-4">
                                    {items.map((item, i) => (
                                       <div key={i} className="flex justify-between items-center group cursor-pointer border-b border-gray-50 pb-4 last:pb-0 last:border-0">
                                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition text-lg tracking-tight">{item.name}</p>
                                          <p className="font-bold text-gray-400">₹{parseFloat(item.price).toFixed(2)}</p>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )
                        })
                     ) : (
                        <div className="bg-white rounded-[1.5rem] p-8 text-center text-gray-500 border border-gray-100">
                           No meals resolved for server date today.
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-[#111827] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  
                  <div className="flex justify-between items-start mb-6 sm:mb-10 relative z-10">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Activity size={24} className="text-blue-300" />
                     </div>
                  </div>

                  <div className="relative z-10">
                     <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mb-2">Total Due</p>
                     <h2 className="text-5xl sm:text-6xl font-black leading-none mb-8 tracking-tighter text-white">
                        ₹{parseFloat(dash.feeSummary?.remaining_due || 0).toFixed(2)}
                     </h2>
                     <button onClick={() => router.push('/fees')} className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-lg hover:bg-gray-100 transition shadow-gray-900/10">
                        View Records
                     </button>
                  </div>
               </div>
            </div>

          </div>
      )}
    </div>
  );
}
