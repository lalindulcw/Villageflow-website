import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE as API, BASE_URL } from '../config';
import {
  Construction, BarChart3, ClipboardList, Search, Filter, ChevronDown,
  RefreshCw, Edit3, X, CheckCircle, Clock, TrendingUp, XCircle,
  AlertTriangle, Droplets, Zap, Trash2, Waves, ArrowLeftRight,
  Wrench, MapPin, User, FileText, MessageSquare, Shield, CalendarDays,
  Eye, Activity, Inbox, Save
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Road Damage',  emoji: '🛣️', icon: Construction,           color: '#e17055' },
  { id: 'Water Supply', emoji: '💧', icon: Droplets,       color: '#0984e3' },
  { id: 'Electricity',  emoji: '⚡', icon: Zap,            color: '#fdcb6e' },
  { id: 'Garbage',      emoji: '🗑️', icon: Trash2,         color: '#55efc4' },
  { id: 'Drainage',     emoji: '🌊', icon: Waves,          color: '#74b9ff' },
  { id: 'Bridge',       emoji: '🌉', icon: ArrowLeftRight, color: '#a29bfe' },
  { id: 'Other',        emoji: '🔧', icon: Wrench,         color: '#b2bec3' },
];

const STATUS_CONFIG = {
  Submitted:    { color: '#0984e3', bg: '#e8f4fd', icon: Clock },
  'In Progress':{ color: '#e17055', bg: '#fef3ee', icon: TrendingUp },
  Resolved:     { color: '#00b894', bg: '#d4f5ed', icon: CheckCircle },
  Rejected:     { color: '#d63031', bg: '#ffe0e0', icon: XCircle },
};

const PRIORITIES = [
  { value: 'Low',    color: '#00b894', bg: '#d4f5ed' },
  { value: 'Medium', color: '#e17055', bg: '#fdecea' },
  { value: 'High',   color: '#d63031', bg: '#ffe0e0' },
];

//  Toast 
let _tid = 0;
function Toast({ toasts, remove }) {
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10, minWidth:320 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: t.type==='error' ? '#d63031' : t.type==='success' ? '#00b894' : '#0984e3',
          color:'#fff', padding:'14px 18px', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          display:'flex', alignItems:'center', gap:10, animation:'slideInRight 0.3s ease',
          cursor:'pointer', fontSize:14, fontWeight:500,
        }}>
          {t.type==='error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
          <span style={{ flex:1 }}>{t.message}</span>
          <span style={{ opacity:0.7, fontSize:18 }}>×</span>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type='info') => {
    const id = ++_tid;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

//  Stat Card 
function StatCard({ label, value, color, bg, icon: Icon, subtitle }) {
  return (
    <div style={{
      background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)',
      border:'1px solid #f0f0f0', transition:'all 0.25s', cursor:'default',
      borderTop:`4px solid ${color}`, position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:bg, opacity:0.6 }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#b2bec3', textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
          <h2 style={{ margin:'6px 0 4px', fontSize:34, fontWeight:800, color }}>{value ?? '—'}</h2>
          {subtitle && <p style={{ margin:0, fontSize:12, color:'#b2bec3' }}>{subtitle}</p>}
        </div>
        <div style={{ background:bg, padding:12, borderRadius:12 }}>
          <Icon size={22} color={color}/>
        </div>
      </div>
    </div>
  );
}

//  Category Bar 
function CategoryBreakdown({ complaints }) {
  const total = complaints.length || 1;
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f0f0f0' }}>
      <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:8 }}>
        <BarChart3 size={18} color="#8B0000"/> Category Breakdown
      </h3>
      {CATEGORIES.map(cat => {
        const count = complaints.filter(c => c.category === cat.id).length;
        const pct = Math.round((count / total) * 100);
        const Icon = cat.icon;
        return (
          <div key={cat.id} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ background:cat.color+'18', padding:6, borderRadius:8 }}><Icon size={14} color={cat.color}/></div>
              <span style={{ fontSize:13, fontWeight:600, color:'#2d3436', flex:1 }}>{cat.id}</span>
              <span style={{ fontSize:13, fontWeight:700, color:cat.color }}>{count}</span>
              <span style={{ fontSize:12, color:'#b2bec3', width:32, textAlign:'right' }}>{pct}%</span>
            </div>
            <div style={{ background:'#f0f0f0', borderRadius:50, height:8, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:50, width:`${pct}%`,
                background:`linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                transition:'width 0.8s cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

//  Update Modal 
function UpdateModal({ complaint, onClose, onUpdated, toast }) {
  const [form, setForm] = useState({
    status: complaint.status || 'Submitted',
    priority: complaint.priority || 'Medium',
    assignedTo: complaint.assignedTo || '',
    officerNote: complaint.officerNote || '',
  });
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('token');

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/infra/complaints/${complaint._id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add('Complaint updated successfully!', 'success');
      onUpdated({ ...complaint, ...form });
      onClose();
    } catch (err) {
      if (!err.response) {
        toast.add('Network error — cannot reach the server.', 'error');
      } else if (err.response.status === 404 || err.response.status === 503) {
        toast.add('Update endpoint not available yet. Please try again later.', 'error');
      } else {
        toast.add(err.response?.data?.message || 'Failed to update complaint.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const cat = CATEGORIES.find(c => c.id === complaint.category) || CATEGORIES[6];
  const CatIcon = cat.icon;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
      zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:540,
        boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'fadeInUp 0.3s ease', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Modal Header */}
        <div style={{ background:'linear-gradient(135deg, #8B0000, #5c0000)', padding:'20px 28px', borderRadius:'20px 20px 0 0',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:'rgba(251,197,49,0.15)', padding:10, borderRadius:12 }}>
              <CatIcon size={20} color="#D4AF37"/>
            </div>
            <div>
              <h3 style={{ margin:0, color:'#fff', fontSize:16, fontWeight:700 }}>Update Complaint</h3>
              <p style={{ margin:'2px 0 0', color:'rgba(255,255,255,0.65)', fontSize:12 }}>{complaint.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.12)', border:'none', cursor:'pointer',
            color:'#fff', borderRadius:8, padding:8, display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Complaint Info Strip */}
        <div style={{ padding:'16px 28px', background:'#f8f9fa', borderBottom:'1px solid #e8e8e8', display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#636e72' }}>
            <User size={14} color="#8B0000"/> {complaint.citizenName}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#636e72' }}>
            <MapPin size={14} color="#8B0000"/> {complaint.location}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#636e72' }}>
            <CalendarDays size={14} color="#8B0000"/>
            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-GB') : '—'}
          </div>
        </div>

        {/* Complaint Description & Attachment */}
        <div style={{ padding:'20px 28px 10px', borderBottom:'1px solid #f0f0f0' }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#b2bec3', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>
            Complaint Description
          </label>
          <p style={{ margin:0, fontSize:14, color:'#2d3436', lineHeight:1.5, background:'#fdfdfd', padding:'12px', borderRadius:10, border:'1px solid #f0f0f0' }}>
            {complaint.description}
          </p>

          {complaint.photo && (
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#b2bec3', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>
                Attached Image
              </label>
              <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #e0e0e0', maxWidth:'320px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <img 
                  src={`${BASE_URL}/${complaint.photo}?token=${token || localStorage.getItem('token')}`} 
                  alt="Complaint attachment" 
                  style={{ width:'100%', maxHeight:'160px', objectFit:'cover', display:'block', cursor:'pointer', transition:'transform 0.2s' }}
                  onClick={() => window.open(`${BASE_URL}/${complaint.photo}?token=${token || localStorage.getItem('token')}`, '_blank')}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Status */}
          <div>
            <label style={{ fontSize:13, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <Activity size={14} color="#8B0000"/> Status
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
                const SI = cfg.icon;
                return (
                  <div key={s} onClick={() => setForm(f => ({ ...f, status:s }))} style={{
                    padding:'10px 14px', borderRadius:10, cursor:'pointer',
                    border:`2px solid ${form.status===s ? cfg.color : '#e8e8e8'}`,
                    background: form.status===s ? cfg.bg : '#fafafa',
                    display:'flex', alignItems:'center', gap:8, transition:'all 0.2s',
                  }}>
                    <SI size={15} color={cfg.color}/>
                    <span style={{ fontSize:13, fontWeight: form.status===s ? 700:500, color: form.status===s ? cfg.color:'#636e72' }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize:13, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <AlertTriangle size={14} color="#8B0000"/> Priority
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {PRIORITIES.map(p => (
                <div key={p.value} onClick={() => setForm(f => ({ ...f, priority:p.value }))} style={{
                  padding:'10px', borderRadius:10, cursor:'pointer', textAlign:'center',
                  border:`2px solid ${form.priority===p.value ? p.color : '#e8e8e8'}`,
                  background: form.priority===p.value ? p.bg : '#fafafa', transition:'all 0.2s',
                }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, margin:'0 auto 4px' }}/>
                  <span style={{ fontSize:13, fontWeight: form.priority===p.value ? 700:500, color: form.priority===p.value ? p.color:'#636e72' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label style={{ fontSize:13, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <User size={14} color="#8B0000"/> Assigned To
            </label>
            <input type="text" placeholder="Officer / department name"
              value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo:e.target.value }))}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                fontSize:14, color:'#2d3436', background:'#fafafa', boxSizing:'border-box', outline:'none',
                transition:'all 0.2s', fontFamily:'inherit' }}
              onFocus={e => { e.target.style.borderColor='#8B0000'; e.target.style.boxShadow='0 0 0 3px rgba(128,0,0,0.1)'; }}
              onBlur={e => { e.target.style.borderColor='#e0e0e0'; e.target.style.boxShadow='none'; }}
            />
          </div>

          {/* Officer Note */}
          <div>
            <label style={{ fontSize:13, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <MessageSquare size={14} color="#8B0000"/> Officer Note
            </label>
            <textarea rows={4} placeholder="Add notes for the citizen about this complaint..."
              value={form.officerNote} onChange={e => setForm(f => ({ ...f, officerNote:e.target.value }))}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e0e0e0',
                fontSize:14, color:'#2d3436', background:'#fafafa', resize:'vertical', boxSizing:'border-box',
                outline:'none', transition:'all 0.2s', fontFamily:'inherit' }}
              onFocus={e => { e.target.style.borderColor='#8B0000'; e.target.style.boxShadow='0 0 0 3px rgba(128,0,0,0.1)'; }}
              onBlur={e => { e.target.style.borderColor='#e0e0e0'; e.target.style.boxShadow='none'; }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:12, marginTop:4 }}>
            <button onClick={onClose} style={{
              flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e0e0e0',
              background:'#fafafa', color:'#636e72', fontWeight:600, fontSize:14, cursor:'pointer',
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              flex:2, padding:'12px', borderRadius:10, border:'none',
              background: saving ? '#b2bec3' : 'linear-gradient(135deg,#8B0000,#5c0000)',
              color:'#fff', fontWeight:700, fontSize:14, cursor: saving ? 'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 16px rgba(128,0,0,0.3)', transition:'all 0.2s',
            }}>
              {saving ? <><RefreshCw size={16} style={{ animation:'pulse 1s infinite' }}/> Saving…</> : <><Save size={16}/> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

//  Main Component 
export default function InfraManagement() {
  const [lang] = useLanguage();
  const t = translations[lang] || translations.si;
  const toast = useToast();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab]   = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [catFilter, setCatFilter]   = useState('All');
  const [hovered, setHovered]       = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/infra/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data.data || res.data || []);
    } catch (err) {
      if (!err.response) {
        toast.add('Cannot reach the server. Check your connection.', 'error');
      } else if (err.response.status === 404 || err.response.status === 503) {
        toast.add('Infrastructure module not yet deployed on the server.', 'error');
      } else if (err.response.status === 401 || err.response.status === 403) {
        toast.add('Unauthorized — please log in again.', 'error');
      } else {
        toast.add('Failed to load complaints. Please try again.', 'error');
      }
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpdated = (updated) => {
    setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
  };

  // Stats
  const stats = {
    total:      complaints.length,
    submitted:  complaints.filter(c => c.status === 'Submitted').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved:   complaints.filter(c => c.status === 'Resolved').length,
    rejected:   complaints.filter(c => c.status === 'Rejected').length,
  };

  // Recent (last 5)
  const recent = [...complaints].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);

  // Filtered table
  const filtered = complaints.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.title?.toLowerCase().includes(q) || c.citizenName?.toLowerCase().includes(q)
      || c.location?.toLowerCase().includes(q) || c.nic?.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || c.status === statusFilter;
    const matchC = catFilter === 'All' || c.category === catFilter;
    return matchQ && matchS && matchC;
  });

  const catInfo = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[6];
  const priInfo = p  => PRIORITIES.find(x => x.value === p) || PRIORITIES[0];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f4f7f6 0%,#e8eceb 100%)', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .trow:hover { background:#f8f0f0 !important; }
        .edit-btn:hover { background:#8B0000 !important; color:#fff !important; }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.12) !important; }
      `}</style>

      <Toast toasts={toast.toasts} remove={toast.remove}/>
      {editTarget && <UpdateModal complaint={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} toast={toast}/>}

      {/* ── Header ── */}
      <div style={{
        background:'linear-gradient(135deg,#8B0000 0%,#5c0000 50%,#3d0000 100%)',
        padding:'28px 40px', boxShadow:'0 4px 24px rgba(128,0,0,0.4)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:'rgba(251,197,49,0.07)' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ background:'rgba(251,197,49,0.15)', padding:14, borderRadius:16, border:'1.5px solid rgba(251,197,49,0.3)' }}>
              <Construction size={28} color="#D4AF37"/>
            </div>
            <div>
              <h1 style={{ color:'#fff', margin:0, fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>{t.infra.officerTitle}</h1>
              <p style={{ color:'rgba(255,255,255,0.65)', margin:'4px 0 0', fontSize:13 }}>
                Manage & resolve village infrastructure complaints
              </p>
            </div>
          </div>
          <button onClick={fetchAll} style={{
            display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10,
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
            color:'#fff', cursor:'pointer', fontWeight:600, fontSize:13, backdropFilter:'blur(8px)',
          }}>
            <RefreshCw size={15} style={{ animation: loading ? 'pulse 1s infinite':'none' }}/> Refresh
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8eceb', padding:'0 40px', display:'flex', gap:0 }}>
        {[
          { id:'overview', label: t.infra.overview,       icon:BarChart3 },
          { id:'table',    label: t.infra.complaintList, icon:ClipboardList },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'16px 24px',
              border:'none', background:'transparent', cursor:'pointer',
              color: active ? '#8B0000':'#636e72', fontWeight: active ? 700:500, fontSize:14,
              borderBottom: active ? '3px solid #8B0000':'3px solid transparent', transition:'all 0.2s',
            }}>
              <Icon size={16}/> {tab.label}
              {tab.id === 'table' && complaints.length > 0 && (
                <span style={{ background:'#8B0000', color:'#fff', fontSize:11, fontWeight:700,
                  padding:'2px 7px', borderRadius:20, marginLeft:4 }}>{complaints.length}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding:'32px 40px', animation:'fadeInUp 0.4s ease' }}>

        {/*  OVERVIEW  */}
        {activeTab === 'overview' && (
          <div>
            {/* Loading State */}
            {loading && (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#8B0000' }}>
                <RefreshCw size={36} style={{ animation:'pulse 1s infinite' }}/>
                <p style={{ marginTop:12, color:'#636e72' }}>Loading data…</p>
              </div>
            )}

            {!loading && (
              <>
                {/* Stat Cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:28 }}>
                  {[
                    { label:'Total',       value:stats.total,      color:'#8B0000', bg:'#f8e8e8', icon:ClipboardList },
                    { label:'Submitted',   value:stats.submitted,  color:'#0984e3', bg:'#e8f4fd', icon:Clock },
                    { label:'In Progress', value:stats.inProgress, color:'#e17055', bg:'#fef3ee', icon:TrendingUp },
                    { label:'Resolved',    value:stats.resolved,   color:'#00b894', bg:'#d4f5ed', icon:CheckCircle },
                    { label:'Rejected',    value:stats.rejected,   color:'#d63031', bg:'#ffe0e0', icon:XCircle },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ transition:'all 0.25s' }}>
                      <StatCard {...s}/>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                  {/* Category Breakdown */}
                  <CategoryBreakdown complaints={complaints}/>

                  {/* Recent Submissions */}
                  <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)', border:'1px solid #f0f0f0' }}>
                    <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700, color:'#2d3436', display:'flex', alignItems:'center', gap:8 }}>
                      <Eye size={18} color="#8B0000"/> Recent Submissions
                    </h3>
                    {recent.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'40px 0', color:'#b2bec3' }}>
                        <Inbox size={40} style={{ marginBottom:8 }}/>
                        <p style={{ margin:0, fontSize:14 }}>No complaints yet</p>
                      </div>
                    ) : recent.map((c, i) => {
                      const cat = catInfo(c.category);
                      const Icon = cat.icon;
                      const st = STATUS_CONFIG[c.status] || STATUS_CONFIG['Submitted'];
                      const StIcon = st.icon;
                      return (
                        <div key={c._id || i} onClick={() => setEditTarget(c)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:12,
                            cursor:'pointer', transition:'all 0.2s', marginBottom:8,
                            background: hovered===i ? '#f8f0f0':'#fafafa', border:'1px solid #f0f0f0' }}
                          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                          {c.photo ? (
                            <img 
                              src={`${BASE_URL}/${c.photo}?token=${token || localStorage.getItem('token')}`} 
                              alt="Complaint attachment" 
                              style={{ width:32, height:32, borderRadius:8, objectFit:'cover', flexShrink:0, border:'1px solid #e0e0e0' }}
                            />
                          ) : (
                            <div style={{ background:cat.color+'18', padding:8, borderRadius:10, flexShrink:0 }}>
                              <Icon size={16} color={cat.color}/>
                            </div>
                          )}
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#2d3436',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</p>
                            <p style={{ margin:'2px 0 0', fontSize:11, color:'#b2bec3' }}>{c.citizenName} · {c.location}</p>
                          </div>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11,
                            fontWeight:700, color:st.color, background:st.bg, padding:'3px 8px', borderRadius:20, flexShrink:0 }}>
                            <StIcon size={10}/> {c.status}
                          </span>
                          <Edit3 size={14} color="#8B0000" style={{ flexShrink:0 }}/>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/*  ALL COMPLAINTS TABLE  */}
        {activeTab === 'table' && (
          <div>
            {/* Filter Row */}
            <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
              {/* Search */}
              <div style={{ flex:2, minWidth:220, display:'flex', alignItems:'center', gap:10,
                background:'#fff', borderRadius:10, padding:'10px 16px', border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <Search size={16} color="#8B0000"/>
                <input type="text" placeholder="Search by title, citizen, NIC, location…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:13, color:'#2d3436', outline:'none', flex:1 }}/>
              </div>
              {/* Status Filter */}
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:10, padding:'10px 14px',
                border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:1, minWidth:150 }}>
                <Filter size={14} color="#8B0000"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:13, color:'#2d3436', outline:'none', cursor:'pointer', flex:1 }}>
                  {['All','Submitted','In Progress','Resolved','Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {/* Category Filter */}
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:10, padding:'10px 14px',
                border:'1px solid #e0e0e0', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:1, minWidth:160 }}>
                <ChevronDown size={14} color="#8B0000"/>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  style={{ border:'none', background:'transparent', fontSize:13, color:'#2d3436', outline:'none', cursor:'pointer', flex:1 }}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.id}</option>)}
                </select>
              </div>
              <div style={{ fontSize:13, color:'#636e72', fontWeight:600, whiteSpace:'nowrap' }}>
                {filtered.length} of {complaints.length} records
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#8B0000' }}>
                <RefreshCw size={36} style={{ animation:'pulse 1s infinite' }}/>
                <p style={{ marginTop:12, color:'#636e72' }}>Loading complaints…</p>
              </div>
            )}

            {/* Table */}
            {!loading && (
              <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
                border:'1px solid #f0f0f0', overflow:'hidden' }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'80px 40px', color:'#b2bec3' }}>
                    <Inbox size={56} style={{ marginBottom:12 }}/>
                    <h3 style={{ margin:'0 0 8px', color:'#636e72' }}>No complaints found</h3>
                    <p style={{ margin:0, fontSize:14 }}>Try adjusting the filters or search query.</p>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
                      <thead>
                        <tr style={{ background:'linear-gradient(135deg,#8B0000,#5c0000)' }}>
                          {['#','Photo','Category','Title','Citizen','Location','Priority','Status','Date','Actions'].map(h => (
                            <th key={h} style={{ padding:'14px 16px', textAlign:'left', color:'rgba(255,255,255,0.85)',
                              fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8,
                              whiteSpace:'nowrap', borderRight: h!=='Actions' ? '1px solid rgba(255,255,255,0.1)':undefined }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c, i) => {
                          const cat = catInfo(c.category);
                          const CIcon = cat.icon;
                          const st = STATUS_CONFIG[c.status] || STATUS_CONFIG['Submitted'];
                          const StI = st.icon;
                          const pri = priInfo(c.priority);
                          return (
                            <tr key={c._id || i} className="trow" style={{
                              borderBottom:'1px solid #f5f5f5', transition:'background 0.15s', cursor:'default',
                              background: i%2===0 ? '#fff':'#fafafa',
                            }}>
                              <td style={{ padding:'13px 16px', fontSize:12, color:'#b2bec3', fontWeight:700, width:40 }}>
                                {i+1}
                              </td>
                              <td style={{ padding:'13px 16px' }}>
                                {c.photo ? (
                                  <img 
                                    src={`${BASE_URL}/${c.photo}?token=${token || localStorage.getItem('token')}`} 
                                    alt="Complaint thumbnail" 
                                    style={{ width:40, height:40, borderRadius:8, objectFit:'cover', cursor:'pointer', border:'1px solid #e0e0e0' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`${BASE_URL}/${c.photo}?token=${token || localStorage.getItem('token')}`, '_blank');
                                    }}
                                  />
                                ) : (
                                  <span style={{ color:'#b2bec3', fontSize:12 }}>—</span>
                                )}
                              </td>
                              <td style={{ padding:'13px 16px', minWidth:130 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ background:cat.color+'18', padding:6, borderRadius:8 }}>
                                    <CIcon size={14} color={cat.color}/>
                                  </div>
                                  <span style={{ fontSize:12, fontWeight:600, color:'#2d3436' }}>{c.category}</span>
                                </div>
                              </td>
                              <td style={{ padding:'13px 16px', minWidth:180 }}>
                                <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#2d3436',
                                  maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {c.title}
                                </p>
                              </td>
                              <td style={{ padding:'13px 16px', minWidth:120 }}>
                                <p style={{ margin:0, fontSize:12, fontWeight:600, color:'#2d3436' }}>{c.citizenName}</p>
                                <p style={{ margin:'2px 0 0', fontSize:11, color:'#b2bec3' }}>{c.nic}</p>
                              </td>
                              <td style={{ padding:'13px 16px', minWidth:130 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                  <MapPin size={12} color="#8B0000"/>
                                  <span style={{ fontSize:12, color:'#636e72', maxWidth:130,
                                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.location}</span>
                                </div>
                              </td>
                              <td style={{ padding:'13px 16px' }}>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                                  color:pri.color, background:pri.bg, padding:'3px 10px', borderRadius:20 }}>
                                  <div style={{ width:6,height:6,borderRadius:'50%',background:pri.color,flexShrink:0 }}/>
                                  {c.priority}
                                </span>
                              </td>
                              <td style={{ padding:'13px 16px' }}>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                                  color:st.color, background:st.bg, padding:'4px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                                  <StI size={11}/> {c.status}
                                </span>
                              </td>
                              <td style={{ padding:'13px 16px', minWidth:90 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                  <CalendarDays size={11} color="#b2bec3"/>
                                  <span style={{ fontSize:11, color:'#b2bec3' }}>
                                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding:'13px 16px' }}>
                                <button className="edit-btn" onClick={() => setEditTarget(c)} style={{
                                  display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px',
                                  borderRadius:8, border:'1.5px solid #8B0000', background:'transparent',
                                  color:'#8B0000', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.2s',
                                }}>
                                  <Edit3 size={13}/> Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Table Footer */}
                    <div style={{ padding:'14px 20px', borderTop:'1px solid #f0f0f0', background:'#fafafa',
                      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:'#b2bec3' }}>
                        Showing <strong style={{ color:'#8B0000' }}>{filtered.length}</strong> complaints
                      </span>
                      <span style={{ fontSize:12, color:'#b2bec3' }}>
                        Resolved rate: <strong style={{ color:'#00b894' }}>
                          {complaints.length ? Math.round((stats.resolved/complaints.length)*100) : 0}%
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
