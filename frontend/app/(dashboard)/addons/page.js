"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Minus, CheckCircle } from 'lucide-react';

export default function AddOnsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [activeItem, setActiveItem] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData(token);
  }, [router]);

  const fetchData = async (token) => {
    try {
      const itemsRes = await fetch('http://localhost:5000/api/addons/items', { headers: { 'Authorization': `Bearer ${token}` } });
      const transRes = await fetch('http://localhost:5000/api/addons', { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (id, delta) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handlePurchase = async (item_id, item_name, quantity) => {
    if (quantity <= 0) return;
    setProcessing(true);
    const token = localStorage.getItem('token');
    try {
       const res = await fetch('http://localhost:5000/api/addons', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ item_id, quantity })
       });
       if (res.ok) {
         setToast(`Successfully purchased ${quantity}x ${item_name}`);
         setTimeout(() => setToast(''), 3000);
         setCart({ ...cart, [item_id]: 0 });
         fetchData(token); // refresh
       } else {
         const data = await res.json();
         alert(data.message);
       }
    } catch (e) {
       console.error(e);
    } finally {
       setProcessing(false);
    }
  };

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading Add-Ons...</div>;

  return (
    <div className="max-w-[1200px] mt-2 mb-10 pb-10 relative">
      {toast && (
        <div className="fixed top-10 right-10 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Dining Add-Ons</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium">Purchase extra menu items dynamically. Charges will reflect on your next billing cycle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.04)] border border-transparent">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-6">Select Add-On</h3>
                  <div className="flex flex-col sm:flex-row gap-6 mb-8">
                      <select 
                         onChange={(e) => {
                             setActiveItem(e.target.value);
                             if(e.target.value && !cart[e.target.value]) setCart(prev => ({...prev, [e.target.value]: 1}));
                         }} 
                         value={activeItem}
                         className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium text-gray-800"
                      >
                         <option value="">-- Choose an item --</option>
                         {items.map(item => (
                             <option key={item.item_id} value={item.item_id}>{item.name} - ₹{item.price}</option>
                         ))}
                      </select>
                      
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden self-start">
                          <button onClick={() => updateCart(activeItem, -1)} disabled={!activeItem} className="px-6 py-4 hover:bg-gray-200 transition text-gray-600 disabled:opacity-50"><Minus size={16} /></button>
                          <span className="font-black w-10 text-center text-gray-800">{activeItem ? (cart[activeItem] || 0) : 0}</span>
                          <button onClick={() => updateCart(activeItem, 1)} disabled={!activeItem} className="px-6 py-4 hover:bg-gray-200 transition text-gray-600 disabled:opacity-50"><Plus size={16} /></button>
                      </div>
                  </div>
                  
                  <button 
                     disabled={!activeItem || (cart[activeItem] || 0) === 0 || processing}
                     onClick={() => activeItem && handlePurchase(parseInt(activeItem), items.find(i => i.item_id === parseInt(activeItem))?.name, cart[activeItem] || 0)}
                     className={`w-full py-4 rounded-2xl font-bold transition flex items-center justify-center shadow-lg ${!activeItem || (cart[activeItem] || 0) === 0 ? 'bg-gray-100 text-gray-400' : 'bg-[#2A2F3D] text-white hover:bg-black shadow-gray-900/10'}`}
                  >
                     <ShoppingBag size={20} className="mr-3" /> Execute Purchase
                  </button>
              </div>
          </div>
         <div className="lg:col-span-4 space-y-6">
             <h3 className="text-2xl font-bold text-gray-900">Purchase History</h3>
             <div className="space-y-4">
                 {transactions.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-8 text-center text-gray-400 border border-gray-50 font-medium">
                       No add-ons purchased yet.
                    </div>
                 ) : transactions.map(t => (
                    <div key={t.transaction_id} className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50 flex justify-between items-center group">
                       <div>
                           <p className="font-bold text-gray-800 text-[15px]">{t.quantity}x {t.name}</p>
                           <p className="text-xs text-gray-400 font-bold mt-0.5 tracking-wide">{new Date(t.purchase_date).toLocaleDateString()}</p>
                       </div>
                       <p className="font-black text-gray-900 text-lg">₹{(t.quantity * parseFloat(t.price)).toFixed(2)}</p>
                    </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
