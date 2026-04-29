"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Hash, ShieldCheck, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setProfile(data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading Profile...</div>;

  return (
    <div className="max-w-[700px] mt-2 mb-10 pb-10">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Your Profile</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium">Manage your personal settings and active session.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)]">
          <div className="flex items-center space-x-6 mb-10 pb-10 border-b border-gray-100">
             <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner">
                <User size={40} />
             </div>
             <div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900">{profile?.name || 'Unknown User'}</h2>
                <div className="flex items-center mt-2 space-x-3">
                   <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full flex items-center">
                      <ShieldCheck size={14} className="mr-1" /> {profile?.account_status}
                   </span>
                   <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Role: {profile?.role}</span>
                </div>
             </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 mr-5">
                   <Hash size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Username</p>
                   <p className="font-bold text-gray-900 text-[17px]">{profile?.username}</p>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 mr-5">
                   <Mail size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Bound</p>
                   <p className="font-bold text-gray-900 text-[17px]">{profile?.email}</p>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 mr-5">
                   <Phone size={20} />
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mobile Contact</p>
                   <p className="font-bold text-gray-900 text-[17px]">{profile?.phone_number || 'N/A'}</p>
                </div>
             </div>
          </div>

          <button onClick={handleLogout} className="mt-12 w-full flex items-center justify-center bg-[#FCEBEA] hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition shadow-sm group">
             <LogOut size={20} className="mr-3 group-hover:-translate-x-1 transition" /> Terminate Session
          </button>
      </div>
    </div>
  );
}
