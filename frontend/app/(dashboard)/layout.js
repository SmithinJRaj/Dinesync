"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { Search, Bell, CircleHelp } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('Chef');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedName = localStorage.getItem('username');
    if (!token) {
      router.push('/login');
    } else {
      if(storedName) setUsername(storedName);
      setLoading(false);
    }
  }, [router]);

  if (loading) return (
    <div className="flex h-screen bg-[#F9FAFB] items-center justify-center">
      Loading...
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-[4.5rem] md:pb-0">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] bg-[#F8F9FA]">
        {/* Top Navigation */}
        <header className="h-20 md:h-24 px-6 md:px-10 flex items-center justify-end z-10 w-full relative shrink-0">
          <div className="flex items-center space-x-4 md:space-x-8 shrink-0">
            <div className="flex items-center space-x-3 md:space-x-4">
              <span className="hidden sm:block text-sm font-semibold text-gray-800 capitalize tracking-wide">{username}</span>
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden shadow-sm border-2 border-white">
                <img src="/images/chef_avatar.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-6 md:pb-10 z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
