"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, LogOut, CheckCircle, ChevronRight, Activity, Bell, Lock } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [feeData, setFeeData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [userName, setUserName] = useState('');
  const [isRegistered, setIsRegistered] = useState(null);
  const [messName, setMessName] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUserName(localStorage.getItem('username') || 'Student');

    // 1. Check Registration State
    fetch('http://localhost:5000/api/mess/my-registration', {
       headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
       if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return null;
       }
       return res.json();
    })
    .then(regData => {
       setIsRegistered(regData.registered);
       if (regData.registered) {
          setMessName(regData.mess?.name);
          
          // 2. Fetch Fees
          fetch('http://localhost:5000/api/fees/my-fee', {
             headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.ok ? res.json() : null)
          .then(d => d && setFeeData(d));

          // 3. Fetch Menu
          fetch('http://localhost:5000/api/menu', {
             headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.ok ? res.json() : null)
          .then(menuData => {
             if(menuData && menuData['Monday']) {
                setMenu(menuData['Monday']); // Mock 'Today' as Monday
             }
          });
       }
    })
    .catch(err => console.log('Error', err));
  }, [router]);

  const handleResetCycle = async () => {
     if(!window.confirm('Simulate the end of the billing cycle? This drops your registration & clears payments to lock the system.')) return;
     const token = localStorage.getItem('token');
     try {
        const res = await fetch('http://localhost:5000/api/mess/reset-month', {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
           window.location.reload();
        }
     } catch (err) {
        console.error(err);
     }
  };

  if (isRegistered === null) return <div className="p-10 font-bold text-gray-500">Authenticating...</div>;

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 space-y-4 sm:space-y-0">
         <div>
            <h1 className="text-3xl sm:text-[2.5rem] font-bold text-gray-900 leading-tight tracking-tight">Welcome back, {userName}</h1>
            <p className="text-gray-500 font-medium text-base sm:text-lg">Here's your dining overview for today.</p>
         </div>
         <button className="hidden sm:flex w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition">
            <Bell size={20} className="text-gray-500" />
         </button>
      </div>

      {!isRegistered ? (
          <div className="bg-white rounded-[2.5rem] p-16 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] text-center flex flex-col items-center border border-red-50">
             <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mb-8 border border-red-100">
                <Lock size={40} />
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-4">You are not registered to any mess</h2>
             <p className="text-gray-500 font-medium text-lg max-w-lg mb-10">You cannot access the daily menus, sign-offs, or billing portal until you formally enroll in one of our active hostel messes.</p>
             <button onClick={() => router.push('/registration')} className="bg-gray-900 text-white font-bold px-10 py-5 text-lg rounded-full shadow-lg hover:bg-black transition hover:scale-105">
                Browse Available Messes
             </button>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
               
               <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] border border-transparent">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Active Registration</h2>
                        <p className="text-sm text-gray-500 font-medium">{messName}</p>
                     </div>
                     <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center">
                        <CheckCircle size={12} className="mr-1" /> Active
                     </span>
                  </div>
                  
                  <div className="flex space-x-6">
                     <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">Meals Left</p>
                        <p className="text-3xl font-black text-gray-900">42</p>
                     </div>
                     <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">Sign-Offs</p>
                        <p className="text-3xl font-black text-gray-900">{feeData?.signOffDays || 0}</p>
                     </div>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-6 px-2">
                     <h2 className="text-xl font-bold text-gray-900">Today's Menu</h2>
                     <button onClick={() => router.push('/menu')} className="text-blue-600 font-bold text-sm flex items-center hover:text-blue-700 transition">
                        View Full Week <ChevronRight size={16} className="ml-1" />
                     </button>
                  </div>

                  <div className="space-y-4">
                     {menu.length > 0 ? menu.map((m, idx) => (
                        <div key={idx} className="bg-white rounded-[1.5rem] p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)] border border-gray-50 flex items-center justify-between group cursor-pointer hover:border-blue-100 transition">
                           <div className="flex items-center space-x-5">
                              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                 {m.mealType === 'Breakfast' ? '☕' : m.mealType === 'Lunch' ? '🍛' : '🥘'}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{m.mealType}</p>
                                 <h3 className="text-lg font-bold text-gray-900">{m.item?.name}</h3>
                              </div>
                           </div>
                           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition">
                              <ChevronRight size={18} />
                           </button>
                        </div>
                     )) : (
                        <div className="bg-white rounded-[1.5rem] p-8 text-center text-gray-500 border border-gray-100">
                           No meals scheduled for today.
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-[#111827] rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  
                  <div className="flex justify-between items-start mb-6 sm:mb-10 relative z-10">
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Activity size={20} className="text-blue-300" />
                     </div>
                  </div>

                  <div className="relative z-10">
                     <p className="text-gray-400 font-medium text-sm mb-2">Pending Invoice</p>
                     <h2 className="text-4xl sm:text-[3.5rem] font-bold leading-none mb-6 tracking-tighter text-white">
                        ₹{feeData?.finalFee > 0 ? feeData.finalFee.toFixed(2) : '0.00'}
                     </h2>
                     <button onClick={() => router.push('/fees')} className="w-full bg-white text-gray-900 font-bold py-3.5 sm:py-4 rounded-xl shadow-lg hover:bg-gray-100 transition">
                        Process Payment
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] border border-transparent">
                   <h3 className="font-bold text-gray-900 mb-6">Quick Actions</h3>
                   <div className="space-y-3">
                      <button onClick={() => router.push('/sign-off')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition group text-left">
                         <div className="flex items-center font-bold text-gray-700 group-hover:text-red-600">
                            <LogOut size={18} className="mr-3 opacity-50 group-hover:opacity-100" /> Declare Leave
                         </div>
                         <ChevronRight size={16} className="opacity-30 group-hover:opacity-100" />
                      </button>
                      
                      <button onClick={handleResetCycle} className="w-full flex items-center justify-between p-4 bg-gray-900 hover:bg-black text-white rounded-xl transition shadow-lg mt-4 group">
                         <div className="flex items-center font-bold text-sm">
                            <span className="mr-3 opacity-70 group-hover:opacity-100 transition">⏩</span> End Next Month
                         </div>
                         <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 group-hover:text-amber-400 transition">Simulator</span>
                      </button>
                   </div>
               </div>
            </div>

          </div>
      )}
    </div>
  );
}
