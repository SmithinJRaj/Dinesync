"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Utensils, ClipboardList, LogOut, ReceiptText, Settings } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/user' },
    { name: 'Menu', icon: Utensils, href: '/menu' },
    { name: 'Registration', icon: ClipboardList, href: '/registration' },
    { name: 'Sign-Off', icon: LogOut, href: '/sign-off' }, 
    { name: 'Guest', icon: Utensils, href: '/guest' }, 
    { name: 'Fees', icon: ReceiptText, href: '/fees' },
  ];

  if (role === 'ADMIN') {
    navLinks.push({ name: 'Admin', icon: Settings, href: '/admin' });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen bg-[#F9FAFB] flex-col border-r border-gray-100 shrink-0">
        <div className="p-8 pb-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
            <Utensils size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">DineSync</h1>
            <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest mt-0.5">Culinary Concierge</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-blue-600 font-bold' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? "text-blue-600" : "text-gray-400"} />
                <span className="text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 pt-0 space-y-4">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center text-gray-500 hover:text-red-600 font-medium px-4 py-4 bg-gray-100 hover:bg-red-50 rounded-2xl transition text-sm shadow-sm"
          >
            <LogOut size={16} className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full h-[4.5rem] bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.04)] z-[100] flex items-center justify-around px-2 pb-safe">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} className={isActive ? 'mb-1 text-blue-600' : 'mb-1'} />
                <span className="text-[9px] font-bold tracking-tight text-center">{link.name}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all text-red-400 hover:text-red-600">
             <LogOut size={22} className="mb-1" />
             <span className="text-[9px] font-bold tracking-tight text-center">Logout</span>
          </button>
      </div>
    </>
  );
}
