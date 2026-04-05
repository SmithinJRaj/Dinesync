"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Star, Utensils, Coffee } from 'lucide-react';

export default function RegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messes, setMesses] = useState([]);
  const [toast, setToast] = useState(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check if user is actively enrolled to prevent multiple selections
    fetch('http://localhost:5000/api/mess/my-registration', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(reg => {
         if (reg.registered) {
            setAlreadyEnrolled(true);
            setLoading(false);
         }
      }).catch(console.error);

    fetch('http://localhost:5000/api/mess', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
         if (res.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
            return null;
         }
         return res.json();
      })
      .then(data => {
         if (data && data.length > 0) setMesses(data);
      })
      .catch(err => console.log('Error fetching messes', err));
  }, []);

  const handleEnroll = async (messId) => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/mess/${messId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setToast('Successfully enrolled in Mess!');
      } else {
        setToast(data.message || 'Error enrolling');
      }
    } catch (err) {
      setToast('Network error');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStyleForMess = (index) => {
     const styles = [
        { icon: Coffee, color: "text-blue-600", bgGradient: "from-blue-50 to-blue-100/50", btnClass: "bg-blue-100 hover:bg-blue-200 text-blue-700", price: "₹2500" },
        { icon: Star, color: "text-indigo-600", bgGradient: "from-indigo-50 to-indigo-100/50", btnClass: "bg-indigo-100 hover:bg-indigo-200 text-indigo-700", price: "₹3000" },
        { icon: Utensils, color: "text-gray-900", bgGradient: "from-gray-100 to-gray-200", btnClass: "bg-gray-200 hover:bg-gray-300 text-gray-800", price: "₹3500" }
     ];
     return styles[index % styles.length];
  };

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10 relative">
      {toast && (
        <div className="fixed top-10 right-10 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto mb-16 pt-10">
        <h1 className="text-[3rem] font-bold text-gray-900 leading-tight tracking-tight mb-4">Hostel Messes</h1>
        <p className="text-xl text-gray-500 font-medium">Select a mess hall that fits your schedule.</p>
      </div>

      {alreadyEnrolled ? (
         <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-[0_8px_30px_-15px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col items-center justify-center max-w-3xl mx-auto mt-10">
            <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-500 mb-8 border border-green-100/50">
               <CheckCircle2 size={40} className="fill-green-100" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You are actively enrolled</h2>
            <p className="text-lg text-gray-500 font-medium mb-10 max-w-md">Your mess subscription is currently locked in for this cycle. Mess transfers are restricted until the start of the next cycle.</p>
            <button onClick={() => router.push('/user')} className="bg-[#2A2F3D] hover:bg-black text-white font-bold py-4 px-10 rounded-full transition shadow-xl shadow-gray-900/10">
               Return to Dashboard
            </button>
         </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {messes.map((mess, index) => {
          const style = getStyleForMess(index);
          const Icon = style.icon;
          return (
            <div key={mess.id} className="relative bg-white rounded-[2.5rem] p-8 pb-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.05)] border border-gray-50 hover:border-blue-100 hover:shadow-[0_8px_30px_-15px_rgba(37,99,235,0.12)] transition-all duration-300">
              
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.bgGradient} flex items-center justify-center mb-8 border border-white shadow-sm`}>
                 <Icon size={28} className={style.color} />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{mess.name}</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8 h-10">Standard mess hall serving authentic daily meals.</p>
              
              <div className="mb-8 flex items-baseline">
                 <span className="text-5xl font-bold text-gray-900 tracking-tight">{style.price}</span>
                 <span className="text-sm text-gray-400 ml-2 font-medium">/month</span>
              </div>

              <ul className="space-y-4 mb-10 min-h-[160px]">
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className={`${style.color} mr-3 shrink-0 mt-0.5`} />
                    <span className="text-[14px] font-semibold text-gray-700">3 Meals a Day</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className={`${style.color} mr-3 shrink-0 mt-0.5`} />
                    <span className="text-[14px] font-semibold text-gray-700">Unlimited Rice & Chapati</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 size={18} className={`${style.color} mr-3 shrink-0 mt-0.5`} />
                    <span className="text-[14px] font-semibold text-gray-700">Daily Special Menu</span>
                  </li>
              </ul>

              <button 
                onClick={() => handleEnroll(mess.id)}
                disabled={loading}
                className={`w-full py-4 rounded-full font-bold text-[15px] transition-all disabled:opacity-50 ${style.btnClass}`}
              >
                 {loading ? 'Processing...' : 'Register'}
              </button>
            </div>
          )
        })}
      </div>
      )}
    </div>
  );
}
