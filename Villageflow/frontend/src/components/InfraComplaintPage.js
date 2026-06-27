import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE as API, BASE_URL } from '../config';
import {
  Construction, Droplets, Zap, Trash2, Waves, ArrowLeftRight,
  Wrench, Send, ClipboardList, MapPin, Phone, User, FileText,
  AlertTriangle, CheckCircle, Clock, XCircle, Star, Filter,
  ChevronDown, RefreshCw, PlusCircle, MessageSquare, CalendarDays,
  Shield, TrendingUp, Inbox, Upload
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Road Damage',   label: 'Road Damage',   emoji: '🛣️',  icon: Construction,          color: '#e17055' },
  { id: 'Water Supply',  label: 'Water Supply',  emoji: '💧',  icon: Droplets,      color: '#0984e3' },
  { id: 'Electricity',   label: 'Electricity',   emoji: '⚡',  icon: Zap,           color: '#fdcb6e' },
  { id: 'Garbage',       label: 'Garbage',       emoji: '🗑️',  icon: Trash2,        color: '#55efc4' },
  { id: 'Drainage',      label: 'Drainage',      emoji: '🌊',  icon: Waves,         color: '#74b9ff' },
  { id: 'Bridge',        label: 'Bridge',        emoji: '🌉',  icon: ArrowLeftRight, color: '#a29bfe' },
  { id: 'Other',         label: 'Other',         emoji: '🔧',  icon: Wrench,        color: '#b2bec3' },
];

const PRIORITIES = [
  { value: 'Low',    color: '#00b894', bg: '#d4f5ed' },
  { value: 'Medium', color: '#e17055', bg: '#fdecea' },
  { value: 'High',   color: '#d63031', bg: '#ffe0e0' },
];

const STATUS_CONFIG = {
  Submitted:   { color: '#0984e3', bg: '#e8f4fd', icon: Clock },
  'In Progress': { color: '#e17055', bg: '#fef3ee', icon: TrendingUp },
  Resolved:    { color: '#00b894', bg: '#d4f5ed', icon: CheckCircle },
  Rejected:    { color: '#d63031', bg: '#ffe0e0', icon: XCircle },
};

//  Toast System 
let _toastId = 0;
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 320 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#d63031' : t.type === 'success' ? '#00b894' : '#0984e3',
          color: '#fff', padding: '14px 18px', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 10, animation: 'slideInRight 0.3s ease',
          cursor: 'pointer', fontSize: 14, fontWeight: 500,
        }} onClick={() => remove(t.id)}>
          {t.type === 'error' ? <AlertTriangle size={18}/> : t.type === 'success' ? <CheckCircle size={18}/> : <Shield size={18}/>}
          <span style={{ flex: 1 }}>{t.message}</span>
          <span style={{ opacity: 0.7, fontSize: 18, lineHeight: 1 }}>×</span>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

//  Star Rating Component 
function StarRating({ complaintId, onRated, toast }) {
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);

  const rate = async (stars) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/infra/complaints/${complaintId}`, { rating: stars }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add('Thank you for your rating!', 'success');
      onRated(stars);
    } catch {
      toast.add('Could not submit rating. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <span style={{ fontSize: 12, color: '#636e72', fontWeight: 600 }}>Rate Resolution:</span>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={20}
          style={{ cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            color: n <= hovered ? '#D4AF37' : '#dfe6e9',
            fill: n <= hovered ? '#D4AF37' : 'none',
            transform: n <= hovered ? 'scale(1.15)' : 'scale(1)' }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => !loading && rate(n)}
        />
      ))}
    </div>
  );
}

//  Category Pill 
function CategoryPill({ cat, selected, onClick }) {
  const Icon = cat.icon;
  const active = selected === cat.id;
  return (
    <button onClick={() => onClick(cat.id)} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 18px', borderRadius: 50, border: 'none', cursor: 'pointer',
      background: active ? '#8B0000' : '#fff',
      color: active ? '#fff' : '#636e72',
      fontWeight: active ? 700 : 500, fontSize: 13,
      boxShadow: active ? '0 4px 16px rgba(128,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.07)',
      transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
      whiteSpace: 'nowrap', flexShrink: 0,
      transform: active ? 'translateY(-2px)' : 'none',
    }}>
      <span style={{ fontSize: 16 }}>{cat.emoji}</span>
      <span>{cat.label}</span>
    </button>
  );
}

//  Main Component 
export default function InfraComplaintPage() {
  const [lang] = useLanguage();
  const t = translations[lang] || translations.si;
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab]     = useState('submit');
  const [selectedCat, setSelectedCat] = useState('Road Damage');
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [catFilter, setCatFilter]     = useState('All');
  const [ratedIds, setRatedIds]       = useState({});

  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    citizenName: user.name || '',
    nic: user.nic || '',
    mobileNumber: user.mobileNumber || '',
    category: 'Road Damage',
    title: '',
    description: '',
    location: '',
    priority: 'Medium',
    photo: null,
  });

  // Sync category pill → form
  useEffect(() => {
    setForm(f => ({ ...f, category: selectedCat }));
  }, [selectedCat]);

  const fetchComplaints = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await axios.get(`${API}/infra/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyComplaints(res.data.data || res.data || []);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 503) {
        toast.add('Infrastructure complaints feature is not yet available on the server.', 'error');
      } else if (!err.response) {
        toast.add('Cannot reach the server. Please check your connection.', 'error');
      } else {
        toast.add('Failed to load your complaints.', 'error');
      }
      setMyComplaints([]);
    } finally {
      setFetchLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'my') fetchComplaints();
  }, [activeTab, fetchComplaints]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.citizenName || !form.nic || !form.mobileNumber || !form.title || !form.description || !form.location) {
      toast.add('Please fill in all required fields.', 'error'); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'photo') {
          if (form[key]) formData.append('photo', form[key]);
        } else {
          formData.append(key, form[key]);
        }
      });

      await axios.post(`${API}/infra/complaints`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      toast.add('Complaint submitted successfully! 🎉', 'success');
      setForm(f => ({ ...f, title: '', description: '', location: '', priority: 'Medium', photo: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 503) {
        toast.add('This feature is not yet live on the server. Please try again later.', 'error');
      } else if (!err.response) {
        toast.add('Network error — please check your internet connection.', 'error');
      } else {
        toast.add(err.response?.data?.message || 'Submission failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = myComplaints.filter(c => {
    const statusOk = statusFilter === 'All' || c.status === statusFilter;
    const catOk    = catFilter === 'All'    || c.category === catFilter;
    return statusOk && catOk;
  });

  const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[6];
  const priInfo = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[0];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f4f7f6 0%, #e8eceb 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeInUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse        { 0%,100% { opacity:1; } 50% { opacity:.6; } }
        .pill-scroll::-webkit-scrollbar { height:4px; }
        .pill-scroll::-webkit-scrollbar-thumb { background:#8B0000; border-radius:2px; }
        .complaint-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,0.13) !important; }
        .tab-btn:hover { background: rgba(128,0,0,0.06) !important; }
        .field-input:focus { outline:none; border-color:#8B0000 !important; box-shadow:0 0 0 3px rgba(128,0,0,0.12) !important; }
        .submit-btn:hover:not(:disabled) { background:linear-gradient(135deg,#a00000,#600000) !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(128,0,0,0.35) !important; }
        .submit-btn:disabled { opacity:.65; cursor:not-allowed; }
      `}</style>

      <Toast toasts={toast.toasts} remove={toast.remove} />

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #8B0000 0%, #5c0000 50%, #3d0000 100%)',
        padding: '32px 40px 28px', boxShadow: '0 4px 24px rgba(128,0,0,0.4)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(251,197,49,0.08)' }}/>
        <div style={{ position:'absolute', bottom:-60, left:100, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>
          <div style={{ background:'rgba(251,197,49,0.15)', padding:14, borderRadius:16, border:'1.5px solid rgba(251,197,49,0.3)' }}>
            <Construction size={30} color="#D4AF37" />
          </div>
          <div>
            <h1 style={{ color:'#fff', margin:0, fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>{t.infra.title}</h1>
            <p style={{ color:'rgba(255,255,255,0.65)', margin:'4px 0 0', fontSize:14 }}>
              Report & track infrastructure issues in your village
            </p>
          </div>
        </div>

        {/* Category Pill Bar */}
        <div className="pill-scroll" style={{ display:'flex', gap:10, marginTop:22, overflowX:'auto', paddingBottom:4 }}>
          {CATEGORIES.map(cat => (
            <CategoryPill key={cat.id} cat={cat} selected={selectedCat} onClick={id => { setSelectedCat(id); if(activeTab!=='submit') setActiveTab('submit'); }} />
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8eceb', padding:'0 40px', display:'flex', gap:0 }}>
        {[
          { id:'submit', label: t.infra.submitTitle, icon:Send },
          { id:'my',     label: t.infra.myTitle,   icon:ClipboardList },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'16px 24px',
              border:'none', background:'transparent', cursor:'pointer',
              color: active ? '#8B0000' : '#636e72', fontWeight: active ? 700 : 500, fontSize:14,
              borderBottom: active ? '3px solid #8B0000' : '3px solid transparent',
              transition:'all 0.2s', borderRadius:'0',
            }}>
              <Icon size={16}/> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding:'32px 40px', maxWidth:900, margin:'0 auto', animation:'fadeInUp 0.4s ease' }}>

        {/*  SUBMIT TAB  */}
        {activeTab === 'submit' && (
          <div style={{
            background:'#fff', borderRadius:20, boxShadow:'0 8px 40px rgba(0,0,0,0.09)',
            overflow:'hidden', border:'1px solid #f0f0f0',
          }}>
            {/* Form Header */}
            <div style={{ background:'linear-gradient(135deg, #f8f0f0, #fff5e6)', padding:'24px 32px', borderBottom:'1px solid #f0e8e8' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {(() => { const cat = catInfo(selectedCat); const Icon = cat.icon;
                  return <div style={{ background:cat.color+'22', padding:10, borderRadius:12 }}><Icon size={22} color={cat.color}/></div>; })()}
                <div>
                  <h2 style={{ margin:0, color:'#8B0000', fontSize:18, fontWeight:700 }}>New Complaint — {selectedCat}</h2>
                  <p style={{ margin:'2px 0 0', color:'#636e72', fontSize:13 }}>Fill in the details below. All fields marked * are required.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding:'32px' }}>
              {/* Row 1 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                {[
                  { key:'citizenName', label:'Full Name *', icon:User,     placeholder:'e.g. Kamal Perera', type:'text' },
                  { key:'nic',         label:'NIC Number *', icon:Shield,  placeholder:'e.g. 198512345678V', type:'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                      <f.icon size={14} color="#8B0000"/> {f.label}
                    </label>
                    <input className="field-input" type={f.type} placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                        fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box' }}
                    />
                  </div>
                ))}
              </div>

              {/* Row 2 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                    <Phone size={14} color="#8B0000"/> Mobile Number *
                  </label>
                  <input className="field-input" type="tel" placeholder="e.g. 0771234567"
                    value={form.mobileNumber} onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                      fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                    <Filter size={14} color="#8B0000"/> Category *
                  </label>
                  <select className="field-input" value={form.category}
                    onChange={e => { setForm(p => ({ ...p, category: e.target.value })); setSelectedCat(e.target.value); }}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                      fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box', cursor:'pointer' }}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                    <FileText size={14} color="#8B0000"/> Title *
                  </label>
                  <input className="field-input" type="text" placeholder="Brief title of the issue"
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                      fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                    <AlertTriangle size={14} color="#8B0000"/> Priority *
                  </label>
                  <select className="field-input" value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                      fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box', cursor:'pointer' }}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.value} Priority</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                  <MessageSquare size={14} color="#8B0000"/> Description *
                </label>
                <textarea className="field-input" rows={4} placeholder="Describe the issue in detail..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                    fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', resize:'vertical',
                    boxSizing:'border-box', fontFamily:'inherit' }}
                />
              </div>

              {/* Location */}
              <div style={{ marginBottom:28 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                  <MapPin size={14} color="#8B0000"/> Location *
                </label>
                <input className="field-input" type="text" placeholder="Street name, landmark, village name..."
                  value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                    fontSize:14, color:'#2d3436', background:'#fafafa', transition:'all 0.2s', boxSizing:'border-box' }}
                />
              </div>

              {/* Priority Visual Row */}
              <div style={{ display:'flex', gap:10, marginBottom:28 }}>
                {PRIORITIES.map(p => (
                  <div key={p.value} onClick={() => setForm(f => ({ ...f, priority: p.value }))} style={{
                    flex:1, padding:'12px', borderRadius:12, border:`2px solid ${form.priority===p.value ? p.color : '#e8e8e8'}`,
                    background: form.priority===p.value ? p.bg : '#fafafa', cursor:'pointer',
                    transition:'all 0.2s', display:'flex', alignItems:'center', gap:10,
                  }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>
                    <span style={{ fontSize:13, fontWeight: form.priority===p.value ? 700:500, color: form.priority===p.value ? p.color : '#636e72' }}>
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Photo Upload */}
              <div style={{ marginBottom:28 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#2d3436', marginBottom:8 }}>
                  <Upload size={14} color="#8B0000"/> Attach Photo (Damage/Problem)
                </label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <label style={{
                    padding:'10px 16px', background:'#fff', border:'1.5px dashed #8B0000', borderRadius:10,
                    color:'#8B0000', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex',
                    alignItems:'center', gap:8, transition:'all 0.2s'
                  }}>
                    <Upload size={14}/> Choose File
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] }))} style={{ display:'none' }} />
                  </label>
                  <span style={{ fontSize:13, color: form.photo ? '#2d3436' : '#636e72' }}>
                    {form.photo ? form.photo.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn" style={{
                width:'100%', padding:'15px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg, #8B0000, #5c0000)',
                color:'#fff', fontSize:16, fontWeight:700, letterSpacing:0.5,
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                boxShadow:'0 4px 16px rgba(128,0,0,0.3)', transition:'all 0.25s',
              }}>
                {loading ? <><RefreshCw size={18} style={{ animation:'pulse 1s infinite' }}/> Submitting...</> : <><Send size={18}/> Submit Complaint</>}
              </button>
            </form>
          </div>
        )}

        {/*  MY COMPLAINTS TAB  */}
        {activeTab === 'my' && (
          <div>
            {/* Filter Bar */}
            <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:10, padding:'10px 14px',
                border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:1, minWidth:160 }}>
                <Filter size={15} color="#8B0000"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:13, color:'#2d3436', cursor:'pointer', fontWeight:500, outline:'none', flex:1 }}>
                  {['All','Submitted','In Progress','Resolved','Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:10, padding:'10px 14px',
                border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:1, minWidth:160 }}>
                <ChevronDown size={15} color="#8B0000"/>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:13, color:'#2d3436', cursor:'pointer', fontWeight:500, outline:'none', flex:1 }}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <button onClick={fetchComplaints} style={{
                display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:10,
                border:'none', background:'#8B0000', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13,
                boxShadow:'0 2px 8px rgba(128,0,0,0.25)',
              }}>
                <RefreshCw size={15} style={{ animation: fetchLoading ? 'pulse 1s infinite' : 'none' }}/> Refresh
              </button>
            </div>

            {/* Loading */}
            {fetchLoading && (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#8B0000' }}>
                <RefreshCw size={36} style={{ animation:'pulse 1s infinite' }}/>
                <p style={{ marginTop:12, color:'#636e72', fontWeight:500 }}>Loading your complaints…</p>
              </div>
            )}

            {/* Empty State */}
            {!fetchLoading && filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'80px 40px', background:'#fff', borderRadius:20,
                boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f0f0f0' }}>
                <Inbox size={64} color="#dfe6e9" style={{ marginBottom:16 }}/>
                <h3 style={{ color:'#636e72', fontWeight:700, margin:'0 0 8px' }}>No complaints found</h3>
                <p style={{ color:'#b2bec3', fontSize:14, margin:'0 0 24px' }}>
                  {myComplaints.length === 0 ? "You haven't submitted any complaints yet." : "No complaints match the selected filters."}
                </p>
                <button onClick={() => setActiveTab('submit')} style={{
                  display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:10,
                  background:'#8B0000', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:14,
                }}>
                  <PlusCircle size={16}/> Submit Your First Complaint
                </button>
              </div>
            )}

            {/* Complaint Cards */}
            {!fetchLoading && filtered.map((c, i) => {
              const cat = catInfo(c.category);
              const Icon = cat.icon;
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG['Submitted'];
              const StIcon = st.icon;
              const pri = priInfo(c.priority);
              const isResolved = c.status === 'Resolved';
              const hasRating = c.rating || ratedIds[c._id];

              return (
                <div key={c._id || i} className="complaint-card" style={{
                  background:'#fff', borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
                  border:'1px solid #f0f0f0', marginBottom:16, overflow:'hidden',
                  transition:'all 0.25s cubic-bezier(.4,0,.2,1)', animation:`fadeInUp 0.3s ease ${i*0.05}s both`,
                }}>
                  {/* Card top stripe */}
                  <div style={{ height:4, background:`linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }}/>

                  <div style={{ padding:'20px 24px' }}>
                    {/* Top row */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                      <div style={{ background:cat.color+'18', padding:14, borderRadius:14, flexShrink:0 }}>
                        <Icon size={26} color={cat.color}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#2d3436' }}>{c.title}</h3>
                          <span style={{ fontSize:11, fontWeight:700, color:cat.color, background:cat.color+'18',
                            padding:'2px 8px', borderRadius:20 }}>{c.category}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {/* Status */}
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
                            color:st.color, background:st.bg, padding:'4px 10px', borderRadius:20 }}>
                            <StIcon size={12}/> {c.status}
                          </span>
                          {/* Priority */}
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700,
                            color:pri.color, background:pri.bg, padding:'4px 10px', borderRadius:20 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:pri.color }}/>
                            {c.priority} Priority
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#b2bec3', fontSize:12 }}>
                          <CalendarDays size={13}/>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ margin:'14px 0 10px', color:'#636e72', fontSize:13, lineHeight:1.6,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {c.description}
                    </p>

                    {/* Attached Photo */}
                    {c.photo && (
                      <div style={{ margin: '12px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid #e0e0e0', maxWidth: '320px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <img 
                          src={`${BASE_URL}/${c.photo}?token=${token || localStorage.getItem('token')}`} 
                          alt="Complaint attachment" 
                          style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}
                          onClick={() => window.open(`${BASE_URL}/${c.photo}?token=${token || localStorage.getItem('token')}`, '_blank')}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                    )}

                    {/* Location */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#8B0000', fontSize:13, fontWeight:600 }}>
                      <MapPin size={14}/> {c.location}
                    </div>

                    {/* Officer Note */}
                    {c.officerNote && (
                      <div style={{ marginTop:14, background:'linear-gradient(135deg, #e8f4fd, #dbeeff)',
                        borderRadius:10, padding:'12px 16px', borderLeft:'4px solid #0984e3' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#0984e3', fontSize:12, fontWeight:700, marginBottom:4 }}>
                          <MessageSquare size={13}/> Officer Note
                        </div>
                        <p style={{ margin:0, color:'#2d3436', fontSize:13, lineHeight:1.5 }}>{c.officerNote}</p>
                        {c.assignedTo && (
                          <p style={{ margin:'6px 0 0', fontSize:11, color:'#636e72' }}>
                            Assigned to: <strong>{c.assignedTo}</strong>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Star Rating for resolved complaints */}
                    {isResolved && !hasRating && (
                      <div style={{ marginTop:14, padding:'12px 16px', background:'#fffbea',
                        borderRadius:10, border:'1px dashed #D4AF37' }}>
                        <StarRating complaintId={c._id} toast={toast}
                          onRated={(stars) => setRatedIds(p => ({ ...p, [c._id]: stars }))}/>
                      </div>
                    )}
                    {isResolved && hasRating && (
                      <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:12, color:'#636e72' }}>Your rating:</span>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={16}
                            style={{ color: n <= (c.rating || ratedIds[c._id]) ? '#D4AF37' : '#dfe6e9',
                              fill: n <= (c.rating || ratedIds[c._id]) ? '#D4AF37' : 'none' }}/>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
