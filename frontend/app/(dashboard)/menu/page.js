"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Download, Zap, Lock, ThumbsUp, ThumbsDown, Utensils } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [messes, setMesses] = useState([]);
  const [selectedMess, setSelectedMess] = useState('');
  
  const fetchMenu = useCallback((messId = '') => {
    setLoading(true);
    let url = 'http://localhost:5000/api/menu';
    if (messId) {
      url += `?messId=${messId}`;
    }
    fetch(url, {
       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
       if(data && data.schedule) {
          setMenu(data.schedule);
          // Set selection to the backend-determined mess if not already set by user
          if (!messId && data.messId) {
             setSelectedMess(data.messId.toString());
          }
       }
    })
    .catch(err => console.log('Error fetching menu', err))
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch available messes
    fetch('http://localhost:5000/api/mess', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setMesses(data);
    })
    .catch(err => console.log(err));

    // Fetch initial menu
    fetchMenu();
  }, [fetchMenu]);

  const handleMessChange = (e) => {
    const newMessId = e.target.value;
    setSelectedMess(newMessId);
    fetchMenu(newMessId);
  };

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 space-y-4 md:space-y-0">
         <div>
            <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Weekly Curation</h1>
            <p className="text-base sm:text-lg text-gray-500 font-medium">Explore the Indian culinary schedule for the selected Mess.</p>
         </div>
         <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 overflow-x-auto pb-2 sm:pb-0">
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Utensils size={16} className="text-gray-400" />
               </div>
               <select 
                 value={selectedMess}
                 onChange={handleMessChange}
                 className="pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none w-full min-w-[200px] cursor-pointer"
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
               <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
            </div>
         </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayStr, idx) => {
           const sessionsForDay = menu[dayStr] || {};
           const sessions = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
           const hasMeals = sessions.some(s => sessionsForDay[s] && sessionsForDay[s].length > 0);
           
           return (
              <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] border border-transparent hover:border-gray-100 transition-all">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">{dayStr}</h2>
                    {hasMeals && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Served</span>}
                 </div>
                 
                 <div className="space-y-6 min-h-[250px]">
                    {sessions.map(sessionName => {
                       const items = sessionsForDay[sessionName] || [];
                       if (items.length === 0) return null;
                       return (
                          <div key={sessionName} className="group mb-4">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                                {sessionName}
                                <span className="w-full h-px bg-gray-100 ml-3 flex-1"></span>
                             </h3>
                             {items.map((m, i) => (
                                 <div key={i} className="mb-2 cursor-pointer">
                                     <p className="font-bold text-gray-800 text-[15px] group-hover:text-blue-600 transition mb-1">{m.item?.name}</p>
                                     <div className="flex items-center text-[11px] font-bold text-gray-400">
                                         <Zap size={10} className="mr-1 text-yellow-500" /> ₹{m.item?.price}
                                     </div>
                                 </div>
                             ))}
                          </div>
                       )
                    })}
                    {!hasMeals && (
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
