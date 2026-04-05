"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, Zap, Lock, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [notRegistered, setNotRegistered] = useState(false);
  
  useEffect(() => {
    fetch('http://localhost:5000/api/menu', {
       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
       if (res.status === 403) {
          setNotRegistered(true);
          return null;
       }
       return res.json();
    })
    .then(data => {
       if(data) setMenu(data);
    })
    .catch(err => console.log('Error fetching menu', err))
    .finally(() => setLoading(false));
  }, [router]);

  if (notRegistered) {
     return (
        <div className="max-w-[1200px] mt-2 mb-10 pb-10 flex flex-col items-center justify-center pt-20">
           <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6">
              <Lock size={32} />
           </div>
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
           <p className="text-lg text-gray-500 font-medium mb-8">You are not registered to any mess. Please enroll first to view the weekly schedule.</p>
           <button onClick={() => router.push('/registration')} className="bg-gray-900 text-white font-bold px-8 py-4 rounded-full hover:bg-black transition">
              Browse Messes
           </button>
        </div>
     );
  }

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 space-y-4 sm:space-y-0">
         <div>
            <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Weekly Curation</h1>
            <p className="text-base sm:text-lg text-gray-500 font-medium">Explore the Indian culinary schedule for your registered Mess.</p>
         </div>
         <div className="flex w-full sm:w-auto space-x-3 overflow-x-auto pb-2 sm:pb-0">
            <button className="flex items-center px-4 sm:px-5 py-3 bg-white border border-gray-200 rounded-full shadow-sm text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 transition whitespace-nowrap">
               <Calendar size={16} className="mr-2 text-gray-400" /> Export
            </button>
            <button className="flex items-center px-4 sm:px-5 py-3 bg-gray-900 text-white rounded-full shadow-md text-xs sm:text-sm font-bold hover:bg-black transition whitespace-nowrap">
               <Download size={16} className="mr-2 opacity-70" /> PDF
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((dayStr, idx) => {
           const mealsForDay = menu[dayStr] || [];
           return (
              <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] border border-transparent hover:border-gray-100 transition-all">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">{dayStr}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Served</span>
                 </div>
                 
                 <div className="space-y-6 min-h-[250px]">
                    {mealsForDay.map((m, i) => (
                       <div key={i} className="group cursor-pointer">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                             {m.mealType}
                             <span className="w-full h-px bg-gray-100 ml-3 flex-1"></span>
                          </h3>
                          <p className="font-bold text-gray-800 text-[15px] group-hover:text-blue-600 transition mb-1">{m.item?.name}</p>
                          <div className="flex items-center text-[11px] font-bold text-gray-400">
                             <Zap size={10} className="mr-1 text-yellow-500" /> {Math.floor(Math.random() * 400 + 200)} Kcal
                          </div>
                       </div>
                    ))}
                    {mealsForDay.length === 0 && (
                       <div className="h-full flex items-center justify-center pt-10 text-sm text-gray-400 italic">No meals scheduled</div>
                    )}
                 </div>
              </div>
           );
        })}
      </div>

      <div className="bg-[#1e293b] rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center shadow-xl text-white">
         <div className="mb-6 md:mb-0 max-w-lg">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Chef's Inquiry</h2>
            <p className="text-slate-400 font-medium">How was yesterday's meals? The culinary team values your feedback.</p>
         </div>
         <div className="flex space-x-4">
            <button className="flex items-center px-6 py-4 rounded-full bg-white text-slate-900 font-bold hover:scale-105 transition shadow-lg">
               <ThumbsUp size={18} className="mr-2 text-emerald-500" /> Excellent
            </button>
            <button className="flex items-center px-6 py-4 rounded-full bg-slate-800 text-white font-bold hover:bg-slate-700 transition">
               <ThumbsDown size={18} className="mr-2 opacity-50" /> Needs Work
            </button>
         </div>
      </div>
    </div>
  );
}
