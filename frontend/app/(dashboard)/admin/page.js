"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CookingPot, DollarSign, Activity } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetch('http://localhost:5000/api/auth/getAllUsers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if(Array.isArray(data)) setUsers(data);
    })
    .catch(err => console.log('Admin fetch error', err))
    .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading command center...</div>;

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10">
      <div className="mb-12">
        <h1 className="text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Executive Dashboard</h1>
        <p className="text-lg text-gray-500 font-medium">Platform orchestration, member lists, and financial statistics.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
         {[ {title: 'Total Members', icon: Users, val: users.length, diff: '+12%'}, {title: 'Active Plans', icon: CookingPot, val: Math.floor(users.length * 0.8), diff: '+5%'}, {title: 'Monthly Revenue', icon: DollarSign, val: '₹1,42,400', diff: '+2%'}, {title: 'System Health', icon: Activity, val: '99.9%', diff: 'Uptime'} ].map((stat, i) => {
            const Icon = stat.icon;
            return (
               <div key={i} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-gray-50">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        <Icon size={18} />
                     </div>
                     <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">{stat.diff}</span>
                  </div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.title}</h3>
                  <p className="text-3xl font-black text-gray-900">{stat.val}</p>
               </div>
            )
         })}
      </div>

      {/* User Registry Table */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] mb-10 border border-gray-50">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Platform Registry</h2>
            <button className="bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm">Export CSV</button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-gray-100">
                     <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Username</th>
                     <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-1/3">Role Level</th>
                     <th className="pb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest w-1/3">System ID</th>
                  </tr>
               </thead>
               <tbody>
                  {users.map((user, idx) => (
                     <tr key={user.id || idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-5">
                           <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-4">
                                 {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                              </div>
                              <span className="font-semibold text-gray-900 text-[15px]">{user.username}</span>
                           </div>
                        </td>
                        <td className="py-5">
                           <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {user.role || 'USER'}
                           </span>
                        </td>
                        <td className="py-5 text-gray-400 font-mono text-sm">{user.id}</td>
                     </tr>
                  ))}
                  {users.length === 0 && (
                     <tr>
                        <td colSpan="3" className="py-8 text-center text-gray-400 font-medium">No users found.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
