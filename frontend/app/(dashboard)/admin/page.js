"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, CheckCircle2, XCircle, RefreshCw, Trash2, Plus, Edit3, ShieldCheck } from 'lucide-react';

function AdminPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeTab = searchParams.get('tab') || 'mess';

    const tabs = [
        { id: 'mess', label: 'Mess Overrides' },
        { id: 'menu', label: 'Menu Schemas' },
        { id: 'billing', label: 'Cycle Registry' },
        { id: 'requests', label: 'Approvals' },
        { id: 'fees', label: 'Fee Monitor' },
        { id: 'users', label: 'Account Matrix' }
    ];

    useEffect(() => {
        const t = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (!t || role !== 'ADMIN') {
            router.push('/login');
        } else {
            setToken(t);
            setLoading(false);
        }
    }, [router]);

    if(loading) return <div className="p-10 text-gray-500 font-bold">Verifying Matrix Credentials...</div>;

    return (
        <div className="max-w-[1400px] mt-2 mb-10 pb-10">
            <div className="mb-10">
                <h1 className="text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-2">Command Center</h1>
                <p className="text-lg text-gray-500 font-medium">God-level database access and manual logic overrides strictly bound to schema definitions.</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8 bg-[#F4F5F7] p-2 rounded-2xl border border-gray-100/50 hidden md:flex">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => router.push(`/admin?tab=${t.id}`)} className={`px-6 py-3.5 rounded-xl font-bold tracking-wide text-sm transition-all ${activeTab === t.id ? 'bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_8px_30px_-15px_rgba(0,0,0,0.03)] p-10 min-h-[500px]">
               {activeTab === 'mess' && <MessManagement token={token} />}
               {activeTab === 'menu' && <MenuManagement token={token} />}
               {activeTab === 'billing' && <BillingManagement token={token} />}
               {activeTab === 'requests' && <RequestManagement token={token} />}
               {activeTab === 'fees' && <FeeManagement token={token} />}
               {activeTab === 'users' && <UserManagement token={token} />}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="p-10 text-gray-500 font-bold">Loading Administration Console...</div>}>
            <AdminPageInner />
        </Suspense>
    );
}

// ============================================
// 1. MESS MANAGEMENT
// ============================================
function MessManagement({ token }) {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({ name: '', location: '', capacity: '', guest_capacity_per_session: '' });
    
    useEffect(() => { loadData(); }, []);

    const loadData = () => {
        fetch('http://localhost:5000/api/admin/mess', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(d => setData(d)).catch(console.error);
    };

    const handleAdd = async () => {
        const res = await fetch('http://localhost:5000/api/admin/mess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        if(res.ok) { loadData(); setForm({ name: '', location: '', capacity: '', guest_capacity_per_session: ''}); }
        else alert((await res.json()).message);
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Attempt database sequence deletion for Mess node?")) return;
        const res = await fetch(`http://localhost:5000/api/admin/mess/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) loadData();
        else alert((await res.json()).message);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Logical Mess Units</h2>
            <div className="grid grid-cols-5 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
               <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="col-span-1 p-3 rounded-xl border border-gray-200" />
               <input placeholder="Location" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="col-span-1 p-3 rounded-xl border border-gray-200" />
               <input placeholder="Cap" type="number" value={form.capacity} onChange={e=>setForm({...form, capacity: e.target.value})} className="col-span-1 p-3 rounded-xl border border-gray-200" />
               <input placeholder="Guest Cap" type="number" value={form.guest_capacity_per_session} onChange={e=>setForm({...form, guest_capacity_per_session: e.target.value})} className="col-span-1 p-3 rounded-xl border border-gray-200" />
               <button onClick={handleAdd} className="col-span-1 bg-gray-900 font-bold text-white rounded-xl shadow-lg hover:bg-black transition flex items-center justify-center">
                   <Plus size={18} className="mr-2"/> Append Node
               </button>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-gray-100">
               <table className="w-full text-left">
                  <thead className="bg-[#F8F9FA] text-gray-500 text-xs uppercase tracking-widest font-black">
                     <tr><th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Location</th><th className="p-4">Total/Guest</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                     {data.map(m => (
                         <tr key={m.mess_id} className="hover:bg-gray-50 transition">
                             <td className="p-4 font-bold text-gray-400">#{m.mess_id}</td>
                             <td className="p-4 font-bold">{m.name}</td>
                             <td className="p-4">{m.location}</td>
                             <td className="p-4">{m.capacity} / {m.guest_capacity_per_session}</td>
                             <td className="p-4 text-right">
                                 <button onClick={()=>handleDelete(m.mess_id)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition"><Trash2 size={16}/></button>
                             </td>
                         </tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
    );
}

// ============================================
// 2. MENU MANAGEMENT
// ============================================
function MenuManagement({ token }) {
    const [messes, setMesses] = useState([]);
    const [context, setContext] = useState({ cycles: [], items: [] });
    const [selectedMess, setSelectedMess] = useState('');
    const [menuData, setMenuData] = useState([]);
    const [assignmentParams, setParams] = useState({ cycle_id: '', items: [] });
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/mess', { headers: { Authorization: `Bearer ${token}` } })
           .then(res => res.json()).then(setMesses);
        fetch('http://localhost:5000/api/admin/menu/context', { headers: { Authorization: `Bearer ${token}` } })
           .then(res => res.json()).then(setContext);
    }, []);

    const fetchMenu = () => {
        if(!selectedMess) return;
        fetch(`http://localhost:5000/api/admin/menu?messId=${selectedMess}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(setMenuData);
    };

    useEffect(() => { fetchMenu(); }, [selectedMess]);

    const handleMenuSwap = async () => {
        if(!selectedMess || !assignmentParams.cycle_id || assignmentParams.items.length === 0) return alert('Invalid params setup');
        const res = await fetch(`http://localhost:5000/api/admin/menu`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
             body: JSON.stringify({ mess_id: selectedMess, cycle_id: assignmentParams.cycle_id, items: assignmentParams.items.map(Number) })
        });
        if(res.ok) fetchMenu();
        else alert((await res.json()).message);
    };

    const handleAddItem = async () => {
        if (!newItemName) return;
        const res = await fetch('http://localhost:5000/api/admin/menu/item', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: newItemName, price: 50.00 })
        });
        if (res.ok) {
            setNewItemName('');
            fetch('http://localhost:5000/api/admin/menu/context', { headers: { Authorization: `Bearer ${token}` } })
               .then(res => res.json()).then(setContext);
            alert("Item Add Success");
        } else {
            alert((await res.json()).message);
        }
    }

    return (
        <div>
           <div className="flex justify-between items-end mb-8">
               <h2 className="text-2xl font-bold text-gray-900">Menu Injection Grid</h2>
               <select value={selectedMess} onChange={e=>setSelectedMess(e.target.value)} className="bg-gray-50 border border-gray-200 font-bold p-3 rounded-xl focus:ring-2 outline-none cursor-pointer">
                   <option value="">-- Connect to Mess --</option>
                   {messes.map(m => <option key={m.mess_id} value={m.mess_id}>{m.name}</option>)}
               </select>
           </div>
           
           {!selectedMess ? (
               <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold">Attach to a mess node recursively to query layout schema.</div>
           ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-100">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-[#F8F9FA] text-gray-500 text-[10px] uppercase tracking-widest font-black">
                             <tr><th className="p-4">Pattern Key</th><th className="p-4">Day</th><th className="p-4">Session Map</th><th className="p-4">Assigned Item</th></tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700 font-medium font-mono">
                             {menuData.map((r, i) => (
                                 <tr key={i} className="hover:bg-blue-50 transition">
                                     <td className="p-4 opacity-50">#{r.cycle_id}</td>
                                     <td className="p-4 font-sans font-bold">{r.day_of_week}</td>
                                     <td className="p-4">{r.meal_session}</td>
                                     <td className="p-4 text-blue-600">[{r.item_id}] {r.name}</td>
                                 </tr>
                             ))}
                          </tbody>
                       </table>
                   </div>
                   <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col space-y-8">
                       <div>
                           <h3 className="font-bold text-gray-900 mb-6">Slot Re-assignment</h3>
                           <div className="space-y-4">
                               <select value={assignmentParams.cycle_id} onChange={e=>setParams({...assignmentParams, cycle_id: e.target.value})} className="w-full p-3 rounded-xl font-medium border border-gray-200 cursor-pointer">
                                   <option value="">Target Shift Instance</option>
                                   {context.cycles.map(c => <option key={c.cycle_id} value={c.cycle_id}>{c.day_of_week} - {c.meal_session}</option>)}
                               </select>
                               
                               <div>
                                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assign Items (Hold Ctrl)</p>
                                   <select multiple value={assignmentParams.items} onChange={e=>setParams({...assignmentParams, items: Array.from(e.target.selectedOptions, o=>o.value)})} className="w-full p-3 rounded-xl border border-gray-200 h-48">
                                      {context.items.map(i => <option key={i.item_id} value={i.item_id}>{i.name}</option>)}
                                   </select>
                               </div>

                               <button onClick={handleMenuSwap} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                   <RefreshCw size={18} className="mr-2"/> Overwrite Target
                               </button>
                               <p className="text-[10px] text-gray-400 font-medium text-center uppercase tracking-widest">WIPES EXISTING DATA IN SPECIFIED SLOT</p>
                           </div>
                       </div>
                       
                       <div className="pt-8 border-t border-gray-200">
                           <h3 className="font-bold text-gray-900 mb-6 flex items-center"><Plus size={16} className="mr-2 text-blue-600"/> Append Master Item</h3>
                           <div className="flex space-x-2">
                               <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Type item name..." className="flex-1 w-full p-3 rounded-xl font-medium border border-gray-200" />
                               <button onClick={handleAddItem} className="bg-gray-900 text-white px-5 rounded-xl font-bold hover:bg-black transition">Add</button>
                           </div>
                           <p className="text-[10px] text-gray-400 font-medium mt-2 uppercase tracking-widest">Pricing unified globally by backend</p>
                       </div>
                   </div>
               </div>
           )}
        </div>
    );
}

// ============================================
// 3. BILLING CYCLES
// ============================================
function BillingManagement({ token }) {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({ cycle_name: '', start_date: '', end_date: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = () => {
        fetch('http://localhost:5000/api/admin/billing', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(setData);
    };

    const handleAdd = async () => {
        const res = await fetch('http://localhost:5000/api/admin/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        if(res.ok) { loadData(); setForm({ cycle_name: '', start_date: '', end_date: ''}); }
        else alert((await res.json()).message);
    };

    const handleSimulateEnd = async () => {
        if(!window.confirm("End active cycle globally for all users?")) return;
        const res = await fetch('http://localhost:5000/api/admin/billing/simulate', {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) { loadData(); alert("Cycle Ended! Fee Generation triggered upon next logic call."); }
        else alert((await res.json()).message);
    };

    const handleDeleteCycle = async (id) => {
        if(!window.confirm("WARNING: Deleting an Epoch will also wipe all fee records and registrations associated with it. Proceed?")) return;
        const res = await fetch(`http://localhost:5000/api/admin/billing/${id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) loadData();
        else alert((await res.json()).message);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Billing Epochs</h2>
            
            <div className="flex space-x-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
               <input placeholder="Epoch Name (e.g., April 2026)" value={form.cycle_name} onChange={e=>setForm({...form, cycle_name: e.target.value})} className="flex-1 p-3 rounded-xl border border-gray-200" />
               <input type="date" value={form.start_date} onChange={e=>setForm({...form, start_date: e.target.value})} className="p-3 rounded-xl border border-gray-200" />
               <input type="date" value={form.end_date} onChange={e=>setForm({...form, end_date: e.target.value})} className="p-3 rounded-xl border border-gray-200" />
               <button onClick={handleAdd} className="bg-green-50 text-green-700 hover:bg-green-100 px-6 font-bold rounded-xl transition flex items-center shadow-sm">
                  Initialize Epoch
               </button>
               <button onClick={handleSimulateEnd} className="bg-red-50 text-red-700 hover:bg-red-100 px-6 font-bold rounded-xl transition flex items-center shadow-sm">
                  Simulate End
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {data.map(c => {
                     const isActive = new Date() >= new Date(c.start_date) && new Date() <= new Date(c.end_date);
                     return (
                         <div key={c.cycle_id} className={`p-6 rounded-3xl border transition ${isActive ? 'bg-[#ECFDF5] border-green-200 shadow-md' : 'bg-white border-gray-100 opacity-70 hover:opacity-100'}`}>
                             <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-bold text-gray-900">{c.cycle_name}</h3>
                                  <button onClick={() => handleDeleteCycle(c.cycle_id)} title="Delete Epoch" className="text-gray-300 hover:text-red-500 transition ml-1"><Trash2 size={16}/></button>
                                </div>
                                {isActive && <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>}
                             </div>
                             <p className="text-xs text-gray-400 font-mono tracking-tighter">[{c.cycle_id}] OVERRIDE KEY</p>
                             <div className="mt-4 pt-4 border-t border-gray-200/50 flex justify-between text-sm font-semibold text-gray-600">
                                 <span>{new Date(c.start_date).toLocaleDateString()}</span>
                                 <span>→</span>
                                 <span>{new Date(c.end_date).toLocaleDateString()}</span>
                             </div>
                         </div>
                     );
                 })}
            </div>
        </div>
    );
}

// ============================================
// 4. APPROVALS
// ============================================
function RequestManagement({ token }) {
    const [data, setData] = useState({ signoffs: [], guests: [] });

    const fetchOps = () => {
        fetch('http://localhost:5000/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(setData);
    };

    useEffect(() => { fetchOps(); }, []);

    const patchReq = async (endpoint, id, status) => {
        const res = await fetch(`http://localhost:5000/api/admin/${endpoint}/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status })
        });
        if(res.ok) fetchOps();
        else alert((await res.json()).message);
    };

    const renderTable = (items, type) => (
        <div className="overflow-hidden rounded-2xl border border-gray-100 mb-8 bg-white">
           <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F9FA] text-gray-500 text-[10px] uppercase tracking-widest font-black">
                 <tr><th className="p-4">User</th><th className="p-4">Details</th><th className="p-4">State</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                 {items.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">Queue Empty</td></tr>}
                 {items.map(r => {
                     const identifier = type === 'SignOff' ? r.signoff_id : r.guest_request_id;
                     return (
                         <tr key={identifier} className="hover:bg-gray-50 transition">
                             <td className="p-4 font-bold">{r.student_name} <span className="text-gray-400 font-mono text-xs ml-2">ID:{r.student_id}</span></td>
                             <td className="p-4 text-xs">
                                 {type === 'SignOff' ? `Break: ${new Date(r.start_date).toLocaleDateString()} to ${new Date(r.end_date).toLocaleDateString()}` 
                                                     : `1 Guest for ${r.meal_session} (${new Date(r.request_date).toLocaleDateString()})`}
                             </td>
                             <td className="p-4">
                                <span className={`px-3 py-1 bg-gray-100 rounded-full font-bold text-[10px] tracking-widest uppercase ${r.status==='APPROVED'?'bg-green-100 text-green-700':r.status==='REJECTED'?'bg-red-100 text-red-700':''}`}>{r.status}</span>
                             </td>
                             <td className="p-4 text-right">
                                 {(() => {
                                     const isSignOff = type === 'SignOff';
                                     return (
                                         <div className="flex justify-end space-x-2">
                                            {r.status === 'PENDING' && <button onClick={()=>patchReq(isSignOff?'signoff':'guest', identifier, 'APPROVED')} title="Approve" className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition flex items-center justify-center"><CheckCircle2 size={16}/></button>}
                                            {r.status !== 'REJECTED' && <button onClick={()=>patchReq(isSignOff?'signoff':'guest', identifier, 'REJECTED')} title="Disapprove (requires future date)" className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition flex items-center justify-center"><XCircle size={16}/></button>}
                                         </div>
                                     );
                                 })()}
                             </td>
                         </tr>
                     );
                 })}
              </tbody>
           </table>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
               <h3 className="font-bold text-gray-900 mb-4 flex items-center">Guest Access Overrides <span className="ml-3 bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{data.guests?.length || 0}</span></h3>
               {renderTable(data.guests || [], 'Guest')}
            </div>
            <div>
               <h3 className="font-bold text-gray-900 mb-4 flex items-center">Subscription Leave Rules <span className="ml-3 bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{data.signoffs?.length || 0}</span></h3>
               {renderTable(data.signoffs || [], 'SignOff')}
            </div>
        </div>
    );
}

// ============================================
// 5. FEE MONITORING
// ============================================
function FeeManagement({ token }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/admin/fees', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(setData);
    }, []);

    return (
        <div>
           <h2 className="text-2xl font-bold text-gray-900 mb-6">Ledger Verification Matrix</h2>
           <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
               <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8F9FA] text-gray-500 text-[10px] uppercase tracking-widest font-black">
                     <tr><th className="p-4">Tracing #</th><th className="p-4">Target Schema</th><th className="p-4">Epoch Context</th><th className="p-4">Calculative Breakdown</th><th className="p-4">Due Bound</th><th className="p-4 text-right">Flag</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                     {data.map(f => (
                         <tr key={f.fee_record_id} className="hover:bg-gray-50 transition cursor-default">
                             <td className="p-4 font-mono text-xs opacity-50">TX-{f.fee_record_id}</td>
                             <td className="p-4 font-bold text-gray-900">{f.student_name}</td>
                             <td className="p-4">{f.cycle_name}</td>
                             <td className="p-4">
                                <p className="text-xs">Base: ₹{f.base_charge}</p>
                                <p className="text-xs text-blue-500">+ Extra: ₹{f.addon_total}</p>
                                <p className="text-xs text-red-400">- Ded: ₹{f.signoff_deduction}</p>
                             </td>
                             <td className="p-4">
                                <p className="font-black text-blue-600">₹{parseFloat(f.remaining_due).toFixed(2)}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total: ₹{parseFloat(f.total_due).toFixed(2)}</p>
                             </td>
                             <td className="p-4 text-right">
                                <span className={`px-3 py-1 bg-gray-100 rounded-full font-bold text-[9px] tracking-widest uppercase ${f.payment_status==='PAID'?'bg-green-100 text-green-700':f.payment_status==='PARTIAL'?'bg-amber-100 text-amber-700':'bg-red-50 text-red-500'}`}>{f.payment_status}</span>
                             </td>
                         </tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
    );
}

// ============================================
// 6. USER DIRECTORY
// ============================================
function UserManagement({ token }) {
    const [data, setData] = useState([]);

    const fetchUsers = () => {
        fetch('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json()).then(setData);
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (id) => {
        const res = await fetch(`http://localhost:5000/api/admin/users/${id}/toggle`, {
            method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) fetchUsers();
    };

    return (
        <div>
           <h2 className="text-2xl font-bold text-gray-900 mb-6">Global Identity Protocols</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {data.map(u => (
                   <div key={u.user_id} className="p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                       <div>
                           <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-blue-50 text-blue-600">
                                   {u.username.charAt(0).toUpperCase()}
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{u.role}</span>
                           </div>
                           <h3 className="font-bold text-gray-900 text-lg">{u.name || u.username}</h3>
                           <p className="text-gray-400 font-medium text-xs truncate">{u.email || '@' + u.username}</p>
                       </div>
                       {u.role !== 'ADMIN' ? (
                           <button onClick={()=>toggleStatus(u.user_id)} className={`mt-6 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center border-2 ${u.account_status === 'ACTIVE' ? 'bg-white border-green-500 text-green-600 hover:bg-green-50' : 'bg-red-50 border-red-100 text-red-500'}`}>
                               <ShieldCheck size={16} className="mr-2" /> {u.account_status}
                           </button>
                       ) : (
                           <div className="mt-6 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center border-2 bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed">
                               <ShieldCheck size={16} className="mr-2" /> {u.account_status}
                           </div>
                       )}
                   </div>
               ))}
           </div>
        </div>
    );
}
