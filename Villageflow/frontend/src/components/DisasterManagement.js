import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE } from '../config';
import {
  Shield, Bell, Send, Home, BarChart2, Plus, Edit2, Trash2,
  CheckCircle, Clock, Loader, X, AlertTriangle, MapPin,
  Users, TrendingUp, ChevronDown, ChevronUp, Save, RefreshCw,
  Activity, Flame, Wind, Droplets, Eye, AlertCircle, XCircle,
  FileText, Zap, ArrowRight, Info
} from 'lucide-react';


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

//  Keyframes
const STYLES = `
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideInModal {
    from { opacity:0; transform:scale(0.92) translateY(-20px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position:-800px 0; }
    100% { background-position:800px 0; }
  }
  @keyframes spin {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:0.4; transform:scale(1.5); }
  }
  @keyframes tabUnderline {
    from { width:0; }
    to   { width:100%; }
  }
  .dm-row:hover { background:#f8fafc !important; }
  .dm-btn:hover { opacity:0.88; transform:translateY(-1px); }
  .dm-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.12) !important; }
`;

//  Skeleton 
const Skeleton = ({ h = 60, mb = 10, radius = 10 }) => (
  <div style={{
    height: h, borderRadius: radius, marginBottom: mb,
    background: 'linear-gradient(90deg,#e8eceb 25%,#f4f7f6 50%,#e8eceb 75%)',
    backgroundSize: '800px 100%',
    animation: 'shimmer 1.4s infinite linear',
  }}/>
);

//  Severity / Status Configs 
const SEVERITY = {
  Low:      { color:'#16a34a', bg:'#dcfce7', border:'#16a34a' },
  Medium:   { color:'#d97706', bg:'#fef3c7', border:'#d97706' },
  High:     { color:'#ea580c', bg:'#ffedd5', border:'#ea580c' },
  Critical: { color:'#dc2626', bg:'#fee2e2', border:'#dc2626' },
};

const SOS_STATUS = {
  Pending:      { color:'#d97706', bg:'#fef3c7', icon:<Clock size={13}/> },
  'In Progress':{ color:'#2563eb', bg:'#dbeafe', icon:<Loader size={13}/> },
  Resolved:     { color:'#16a34a', bg:'#dcfce7', icon:<CheckCircle size={13}/> },
};

const TYPE_ICONS = {
  Flood:     <Droplets size={15}/>, Fire:<Flame size={15}/>,
  Cyclone:   <Wind size={15}/>, Earthquake:<Activity size={15}/>,
  Landslide: <TrendingUp size={15}/>,
  Default:   <AlertTriangle size={15}/>,
};
const getTypeIcon = t => TYPE_ICONS[t] || TYPE_ICONS.Default;

// DB stores facilities as a comma-separated string; UI expects an array.
const parseFacilities = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') return val.split(',').map(f => f.trim()).filter(Boolean);
  return [];
};

//  Shared Modal Wrapper 
function Modal({ title, subtitle, icon, onClose, children, maxW = 540 }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.55)',
        backdropFilter:'blur(7px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:9999, padding:20,
      }}
    >
      <div style={{
        background:'#fff',
        borderRadius:22,
        padding:'28px',
        width:'100%', maxWidth:maxW,
        animation:'slideInModal 0.28s ease',
        boxShadow:'0 32px 90px rgba(0,0,0,0.28)',
        maxHeight:'90vh', overflowY:'auto',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:'linear-gradient(135deg,#8B0000,#5c0000)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {icon || <Shield size={20} color="#fff"/>}
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'#1e293b' }}>{title}</h2>
              {subtitle && <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer' }}>
            <X size={18} color="#64748b"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

//  Form Field 
function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom:15 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#475569', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
        {label}{required && <span style={{ color:'#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'11px 14px', borderRadius:10,
  border:'2px solid #e2e8f0', fontSize:14, outline:'none',
  background:'#f8fafc', boxSizing:'border-box', color:'#1e293b',
  fontFamily:'inherit',
};

//  Stat Card 
function StatCard({ label, value, icon, color, bg, sub }) {
  return (
    <div
      className="dm-card"
      style={{
        background:'#fff',
        borderRadius:16,
        padding:'20px',
        boxShadow:'0 4px 16px rgba(0,0,0,0.07)',
        border:'1px solid #f1f5f9',
        display:'flex', flexDirection:'column', gap:10,
        transition:'all 0.25s ease',
        cursor:'default',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{
          width:46, height:46, borderRadius:13,
          background: bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize:30, fontWeight:800, color:'#1e293b' }}>{value}</span>
      </div>
      <div>
        <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#374151' }}>{label}</p>
        {sub && <p style={{ margin:'2px 0 0', fontSize:12, color:'#94a3b8' }}>{sub}</p>}
      </div>
    </div>
  );
}

//  Error Card 
function ErrorCard({ message, onRetry }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #fee2e2', borderRadius:16, padding:'28px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ width:52, height:52, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
        <XCircle size={26} color="#dc2626"/>
      </div>
      <h3 style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#1e293b' }}>Unable to Load Data</h3>
      <p style={{ margin:'0 0 14px', fontSize:13, color:'#64748b', maxWidth:380, marginLeft:'auto', marginRight:'auto' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          background:'linear-gradient(135deg,#8B0000,#5c0000)',
          color:'#fff', border:'none', borderRadius:10,
          padding:'9px 20px', fontSize:13, fontWeight:700,
          cursor:'pointer',
        }}>Retry</button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 24px', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1px solid #f1f5f9' }}>
      <div style={{ marginBottom:14, opacity:0.45 }}>{icon}</div>
      <h3 style={{ margin:'0 0 7px', fontSize:16, fontWeight:700, color:'#1e293b' }}>{title}</h3>
      <p style={{ margin:'0 0 18px', fontSize:13, color:'#94a3b8', maxWidth:300, marginLeft:'auto', marginRight:'auto' }}>{sub}</p>
      {action}
    </div>
  );
}


// MAIN COMPONENT
export default function DisasterManagement() {
  const [lang] = useLanguage();
  const t = translations[lang] || translations.si;
  const [activeTab, setActiveTab]   = useState('overview');
  const [alerts,   setAlerts]       = useState([]);
  const [sosList,  setSosList]      = useState([]);
  const [shelters, setShelters]     = useState([]);
  const [loading,  setLoading]      = useState({ alerts:true, sos:true, shelters:true });
  const [error,    setError]        = useState({});

  // Alert modal state
  const [showAlertModal, setShowAlertModal]     = useState(false);
  const [editingAlert,   setEditingAlert]       = useState(null);
  const [alertForm,      setAlertForm]          = useState({ title:'', disasterType:'', severity:'Medium', affectedArea:'', description:'', instructions:'', isActive:true });
  const [alertSaving,    setAlertSaving]        = useState(false);

  // SOS state
  const [resolutionNotes, setResolutionNotes]   = useState({});
  const [sosActioning,    setSosActioning]       = useState({});

  // Shelter modal
  const [showShelterModal, setShowShelterModal] = useState(false);
  const [editingShelter,   setEditingShelter]   = useState(null);
  const [shelterForm,      setShelterForm]      = useState({ name:'', location:'', capacity:0, currentOccupancy:0, facilities:[], contactNumber:'', isActive:true });
  const [shelterSaving,    setShelterSaving]    = useState(false);
  const [facilitiesInput,  setFacilitiesInput]  = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  // Inject styles
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  //  FETCH 
  const fetchAlerts = useCallback(async () => {
    setLoading(l => ({ ...l, alerts:true }));
    setError(e => ({ ...e, alerts:undefined }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/alerts/all`, { headers: getAuthHeaders() });
      setAlerts(Array.isArray(data) ? data : data.data || data.alerts || []);
    } catch (e) {
      setError(er => ({ ...er, alerts: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally { setLoading(l => ({ ...l, alerts:false })); }
  }, []);

  const fetchSOS = useCallback(async () => {
    setLoading(l => ({ ...l, sos:true }));
    setError(e => ({ ...e, sos:undefined }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/sos`, { headers: getAuthHeaders() });
      setSosList(Array.isArray(data) ? data : data.data || data.requests || []);
    } catch (e) {
      setError(er => ({ ...er, sos: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally { setLoading(l => ({ ...l, sos:false })); }
  }, []);

  const fetchShelters = useCallback(async () => {
    setLoading(l => ({ ...l, shelters:true }));
    setError(e => ({ ...e, shelters:undefined }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/shelters`, { headers: getAuthHeaders() });
      setShelters(Array.isArray(data) ? data : data.data || data.shelters || []);
    } catch (e) {
      setError(er => ({ ...er, shelters: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally { setLoading(l => ({ ...l, shelters:false })); }
  }, []);

  useEffect(() => { fetchAlerts(); fetchSOS(); fetchShelters(); }, [fetchAlerts, fetchSOS, fetchShelters]);

  //  ALERTS CRUD 
  const openAlertModal = (alert = null) => {
    setEditingAlert(alert);
    if (alert) {
      setAlertForm({ title:alert.title||'', disasterType:alert.disasterType||alert.type||'', severity:alert.severity||'Medium', affectedArea:alert.affectedArea||'', description:alert.description||alert.message||'', instructions:alert.instructions||'', isActive:alert.isActive!==false });
    } else {
      setAlertForm({ title:'', disasterType:'', severity:'Medium', affectedArea:'', description:'', instructions:'', isActive:true });
    }
    setShowAlertModal(true);
  };

  const saveAlert = async () => {
    if (!alertForm.title || !alertForm.disasterType || !alertForm.affectedArea || !alertForm.description) {
      alert('Please fill in all required fields: Title, Type, Affected Area, and Description.');
      return;
    }
    setAlertSaving(true);
    try {
      if (editingAlert) {
        await axios.put(`${API_BASE}/disaster/alerts/${editingAlert._id}`, alertForm, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_BASE}/disaster/alerts`, alertForm, { headers: getAuthHeaders() });
      }
      setShowAlertModal(false);
      fetchAlerts();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to save alert';
      alert(`Error: ${msg}`);
    } finally { setAlertSaving(false); }
  };

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${API_BASE}/disaster/alerts/${id}`, { headers: getAuthHeaders() });
      setAlerts(a => a.filter(x => x._id !== id));
    } catch (e) {
      alert(e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.');
    }
    setDeleteTarget(null);
  };

  //  SOS ACTIONS 
  const updateSOSStatus = async (id, status) => {
    setSosActioning(a => ({ ...a, [id]: true }));
    try {
      const payload = { status };
      if (status === 'Resolved' && resolutionNotes[id]) payload.resolutionNote = resolutionNotes[id];
      await axios.put(`${API_BASE}/disaster/sos/${id}`, payload, { headers: getAuthHeaders() });
      fetchSOS();
    } catch (e) {
      alert(e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.');
    } finally { setSosActioning(a => ({ ...a, [id]: false })); }
  };

  //  SHELTERS CRUD 
  const openShelterModal = (shelter = null) => {
    setEditingShelter(shelter);
    if (shelter) {
      // facilities is stored as a string in DB — convert to array for display
      const facArr = parseFacilities(shelter.facilities);
      setShelterForm({ name:shelter.name||'', location:shelter.location||shelter.address||'', capacity:shelter.capacity||0, currentOccupancy:shelter.currentOccupancy||0, facilities:facArr, contactNumber:shelter.contactNumber||'', isActive:shelter.isActive!==false });
      setFacilitiesInput(facArr.join(', '));
    } else {
      setShelterForm({ name:'', location:'', capacity:0, currentOccupancy:0, facilities:[], contactNumber:'', isActive:true });
      setFacilitiesInput('');
    }
    setShowShelterModal(true);
  };

  const saveShelter = async () => {
    if (!shelterForm.name || !shelterForm.location) {
      alert('Please fill in Shelter Name and Location/Address.');
      return;
    }
    if (!shelterForm.capacity || shelterForm.capacity <= 0) {
      alert('Please enter a valid capacity (must be greater than 0).');
      return;
    }
    setShelterSaving(true);
    const payload = { ...shelterForm, facilities: facilitiesInput.split(',').map(f => f.trim()).filter(Boolean) };
    try {
      if (editingShelter) {
        await axios.put(`${API_BASE}/disaster/shelters/${editingShelter._id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API_BASE}/disaster/shelters`, payload, { headers: getAuthHeaders() });
      }
      setShowShelterModal(false);
      fetchShelters();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Failed to save shelter';
      alert(`Error: ${msg}`);
    } finally { setShelterSaving(false); }
  };

  const deleteShelter = async (id) => {
    try {
      await axios.delete(`${API_BASE}/disaster/shelters/${id}`, { headers: getAuthHeaders() });
      setShelters(s => s.filter(x => x._id !== id));
    } catch (e) {
      alert(e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.');
    }
    setDeleteTarget(null);
  };

  //  Derived stats 
  const activeAlerts  = alerts.filter(a => a.isActive !== false).length;
  const pendingSOS    = sosList.filter(s => s.status === 'Pending').length;
  const inProgressSOS = sosList.filter(s => s.status === 'In Progress').length;

  const sosGrouped = {
    Pending:      sosList.filter(s => s.status === 'Pending'),
    'In Progress': sosList.filter(s => s.status === 'In Progress'),
    Resolved:     sosList.filter(s => s.status === 'Resolved'),
  };

  //  TABS 
  const TABS = [
    { id:'overview', label: t.disaster.overview,     icon:<BarChart2 size={15}/> },
    { id:'alerts',   label: t.disaster.alerts,       icon:<Bell size={15}/> },
    { id:'sos',      label: t.disaster.sosRequests, icon:<Send size={15}/>, badge: pendingSOS + inProgressSOS },
    { id:'shelters', label: t.disaster.shelters,     icon:<Home size={15}/> },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7f6', fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background:'linear-gradient(135deg,#8B0000 0%,#5c0000 50%,#3a0000 100%)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-70, right:-70, width:240, height:240, borderRadius:'50%', background:'rgba(251,197,49,0.07)' }}/>
        <div style={{ position:'absolute', bottom:-50, left:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ position:'relative', padding:'30px 28px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{
                width:56, height:56, borderRadius:16,
                background:'rgba(251,197,49,0.18)',
                border:'2px solid rgba(251,197,49,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Shield size={28} color="#D4AF37"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>
                  {t.disaster.officerTitle}
                </h1>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.6)' }}>
                  GN Officer Control Panel · Real-time Response
                </p>
              </div>
            </div>

            <button
              onClick={() => { fetchAlerts(); fetchSOS(); fetchShelters(); }}
              style={{
                background:'rgba(255,255,255,0.12)',
                color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
                borderRadius:10, padding:'9px 18px',
                fontSize:13, fontWeight:600,
                cursor:'pointer',
                display:'flex', alignItems:'center', gap:7,
              }}
            >
              <RefreshCw size={14}/> Refresh All
            </button>
          </div>

          {/* Quick stats row */}
          <div style={{ marginTop:20, display:'flex', gap:24, flexWrap:'wrap' }}>
            {[
              { label:'Total Alerts',  v:alerts.length,   c:'#D4AF37' },
              { label:'Active',        v:activeAlerts,    c:'#fca5a5' },
              { label:'Pending SOS',   v:pendingSOS,      c:'#fdba74' },
              { label:'Shelters',      v:shelters.length, c:'#86efac' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.2 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display:'flex', padding:'0 28px', borderTop:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.15)', overflowX:'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:'none', border:'none',
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                padding:'13px 20px', fontSize:13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor:'pointer',
                display:'flex', alignItems:'center', gap:7,
                whiteSpace:'nowrap', position:'relative',
                transition:'color 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background:'#dc2626', color:'#fff', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:800 }}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0,
                  height:3, background:'linear-gradient(90deg,#D4AF37,#f59e0b)',
                  borderRadius:'3px 3px 0 0',
                  animation:'tabUnderline 0.25s ease',
                }}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/*  CONTENT  */}
      <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto' }}>

        {/*  OVERVIEW  */}
        {activeTab === 'overview' && (
          <div style={{ animation:'fadeInUp 0.35s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16, marginBottom:28 }}>
              <StatCard label="Total Alerts"   value={alerts.length}   icon={<Bell size={22}/>}       color="#8B0000" bg="#fde8e8" sub="All time"/>
              <StatCard label="Active Alerts"  value={activeAlerts}    icon={<AlertTriangle size={22}/>} color="#ea580c" bg="#ffedd5" sub="Currently live"/>
              <StatCard label="Total SOS"      value={sosList.length}  icon={<Send size={22}/>}        color="#7c3aed" bg="#ede9fe" sub="All requests"/>
              <StatCard label="Pending SOS"    value={pendingSOS}      icon={<Clock size={22}/>}       color="#d97706" bg="#fef3c7" sub="Awaiting response"/>
              <StatCard label="Open Shelters"  value={shelters.filter(s=>s.isActive!==false).length} icon={<Home size={22}/>} color="#16a34a" bg="#dcfce7" sub="Available now"/>
            </div>

            {/* Recent SOS */}
            <div style={{ background:'#fff', borderRadius:18, padding:'22px', boxShadow:'0 4px 16px rgba(0,0,0,0.07)', marginBottom:20 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:'#1e293b', display:'flex', alignItems:'center', gap:8 }}>
                <Send size={16} color="#8B0000"/> Recent SOS Requests
              </h3>
              {loading.sos ? (
                Array(3).fill(0).map((_,i) => <Skeleton key={i} h={48} mb={8}/>)
              ) : sosList.slice(0,5).length === 0 ? (
                <p style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>No SOS requests yet.</p>
              ) : (
                sosList.slice(0,5).map((req, idx) => {
                  const st = SOS_STATUS[req.status] || SOS_STATUS.Pending;
                  return (
                    <div key={req._id||idx} className="dm-row" style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 14px', borderRadius:10, marginBottom:6,
                      background:'#f8fafc', gap:12, flexWrap:'wrap',
                      transition:'background 0.15s',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:200 }}>
                        <span style={{ background:st.bg, color:st.color, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                          {st.icon} {req.status}
                        </span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{req.disasterType} — {req.location}</span>
                      </div>
                      <span style={{ fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>{req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}</span>
                    </div>
                  );
                })
              )}
              {sosList.length > 5 && (
                <button onClick={() => setActiveTab('sos')} style={{ marginTop:8, background:'none', border:'none', color:'#8B0000', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  View all {sosList.length} requests <ArrowRight size={13}/>
                </button>
              )}
            </div>

            {/* Recent Alerts */}
            <div style={{ background:'#fff', borderRadius:18, padding:'22px', boxShadow:'0 4px 16px rgba(0,0,0,0.07)' }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:'#1e293b', display:'flex', alignItems:'center', gap:8 }}>
                <Bell size={16} color="#8B0000"/> Recent Alerts
              </h3>
              {loading.alerts ? (
                Array(3).fill(0).map((_,i) => <Skeleton key={i} h={48} mb={8}/>)
              ) : alerts.slice(0,5).length === 0 ? (
                <p style={{ color:'#94a3b8', fontSize:13, textAlign:'center', padding:'20px 0' }}>No alerts posted yet.</p>
              ) : (
                alerts.slice(0,5).map((a, idx) => {
                  const sev = SEVERITY[a.severity] || SEVERITY.Medium;
                  return (
                    <div key={a._id||idx} className="dm-row" style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'12px 14px', borderRadius:10, marginBottom:6,
                      background:'#f8fafc', transition:'background 0.15s',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ background:sev.bg, color:sev.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{a.severity}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{a.title || a.disasterType}</span>
                        <span style={{ fontSize:12, color:'#94a3b8' }}>{a.affectedArea}</span>
                      </div>
                      <span style={{ background: a.isActive!==false ? '#dcfce7':'#f1f5f9', color: a.isActive!==false?'#16a34a':'#94a3b8', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                        {a.isActive!==false ? 'Active':'Inactive'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/*  ALERTS TAB  */}
        {activeTab === 'alerts' && (
          <div style={{ animation:'fadeInUp 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1e293b' }}>
                Disaster Alerts <span style={{ fontSize:14, color:'#94a3b8', fontWeight:400 }}>({alerts.length} total)</span>
              </h2>
              <button
                onClick={() => openAlertModal()}
                className="dm-btn"
                style={{
                  background:'linear-gradient(135deg,#8B0000,#5c0000)',
                  color:'#fff', border:'none', borderRadius:11,
                  padding:'11px 20px', fontSize:13, fontWeight:700,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                  boxShadow:'0 4px 14px rgba(128,0,0,0.3)',
                  transition:'all 0.2s',
                }}
              >
                <Plus size={15}/> Post New Alert
              </button>
            </div>

            {error.alerts && <ErrorCard message={error.alerts} onRetry={fetchAlerts}/>}

            {loading.alerts ? (
              Array(4).fill(0).map((_,i) => <Skeleton key={i} h={90} mb={10}/>)
            ) : alerts.length === 0 && !error.alerts ? (
              <EmptyState
                icon={<Bell size={52} color="#cbd5e1"/>}
                title="No alerts posted"
                sub="Post a new disaster alert to notify citizens in affected areas."
                action={
                  <button onClick={() => openAlertModal()} style={{ background:'linear-gradient(135deg,#8B0000,#5c0000)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    <Plus size={14} style={{ marginRight:5 }}/> Post First Alert
                  </button>
                }
              />
            ) : (
              <div style={{ background:'#fff', borderRadius:18, boxShadow:'0 4px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                {/* Table header */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'1fr 110px 160px 90px 100px',
                  padding:'12px 20px',
                  background:'#f8fafc',
                  borderBottom:'1px solid #f1f5f9',
                  fontSize:11, fontWeight:700, color:'#94a3b8',
                  textTransform:'uppercase', letterSpacing:0.5,
                  gap:10,
                }}>
                  <span>Alert Details</span>
                  <span>Severity</span>
                  <span>Affected Area</span>
                  <span>Status</span>
                  <span style={{ textAlign:'right' }}>Actions</span>
                </div>

                {alerts.map((a, idx) => {
                  const sev = SEVERITY[a.severity] || SEVERITY.Medium;
                  return (
                    <div
                      key={a._id||idx}
                      className="dm-row"
                      style={{
                        display:'grid',
                        gridTemplateColumns:'1fr 110px 160px 90px 100px',
                        padding:'14px 20px',
                        borderBottom:'1px solid #f8fafc',
                        alignItems:'center', gap:10,
                        animation:'fadeInUp 0.3s ease',
                        animationDelay:`${idx*0.04}s`,
                        animationFillMode:'both',
                        transition:'background 0.15s',
                      }}
                    >
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          <span style={{ color:sev.color }}>{getTypeIcon(a.disasterType)}</span>
                          <span style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{a.title || a.disasterType}</span>
                        </div>
                        {a.message && <p style={{ margin:0, fontSize:12, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:320 }}>{a.message}</p>}
                      </div>

                      <span style={{ background:sev.bg, color:sev.color, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, width:'fit-content', display:'flex', alignItems:'center', gap:5 }}>
                        {a.severity === 'Critical' && <span style={{ width:6, height:6, borderRadius:'50%', background:sev.color, animation:'pulse-dot 1s ease-in-out infinite' }}/>}
                        {a.severity}
                      </span>

                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#475569' }}>
                        <MapPin size={12} color="#94a3b8"/>{a.affectedArea || '—'}
                      </div>

                      <span style={{
                        background: a.isActive!==false ? '#dcfce7':'#f1f5f9',
                        color: a.isActive!==false ? '#16a34a':'#94a3b8',
                        padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                        width:'fit-content',
                      }}>
                        {a.isActive!==false ? 'Active':'Inactive'}
                      </span>

                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <button
                          onClick={() => openAlertModal(a)}
                          className="dm-btn"
                          style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:'7px', cursor:'pointer', color:'#475569', transition:'all 0.2s' }}
                          title="Edit"
                        >
                          <Edit2 size={14}/>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type:'alert', id:a._id, name:a.title||a.disasterType })}
                          className="dm-btn"
                          style={{ background:'#fee2e2', border:'none', borderRadius:8, padding:'7px', cursor:'pointer', color:'#dc2626', transition:'all 0.2s' }}
                          title="Delete"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/*  SOS TAB  */}
        {activeTab === 'sos' && (
          <div style={{ animation:'fadeInUp 0.35s ease' }}>
            {error.sos && <ErrorCard message={error.sos} onRetry={fetchSOS}/>}
            {loading.sos ? (
              Array(5).fill(0).map((_,i) => <Skeleton key={i} h={100} mb={10}/>)
            ) : sosList.length === 0 && !error.sos ? (
              <EmptyState icon={<Send size={52} color="#cbd5e1"/>} title="No SOS requests" sub="SOS alerts from citizens will appear here." />
            ) : (
              Object.entries(sosGrouped).map(([status, items]) => {
                if (items.length === 0) return null;
                const st = SOS_STATUS[status] || SOS_STATUS.Pending;
                return (
                  <div key={status} style={{ marginBottom:24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:st.color }}/>
                      <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#1e293b' }}>{status}</h3>
                      <span style={{ background:st.bg, color:st.color, padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{items.length}</span>
                    </div>

                    {items.map((req, idx) => (
                      <div
                        key={req._id||idx}
                        style={{
                          background:'#fff',
                          borderRadius:14,
                          padding:'16px 18px',
                          marginBottom:10,
                          boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                          borderLeft:`4px solid ${st.color}`,
                          animation:'fadeInUp 0.3s ease',
                          animationDelay:`${idx*0.05}s`,
                          animationFillMode:'both',
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5, flexWrap:'wrap' }}>
                              <h4 style={{ margin:0, fontSize:14, fontWeight:700, color:'#1e293b' }}>
                                {req.disasterType} — {req.location}
                              </h4>
                              {req.severity && (
                                <span style={{ background:(SEVERITY[req.severity]||SEVERITY.Medium).bg, color:(SEVERITY[req.severity]||SEVERITY.Medium).color, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                                  {req.severity}
                                </span>
                              )}
                            </div>
                            {req.description && <p style={{ margin:'0 0 5px', fontSize:13, color:'#475569' }}>{req.description}</p>}
                            <div style={{ fontSize:12, color:'#94a3b8', display:'flex', gap:12, flexWrap:'wrap' }}>
                              <span><Clock size={11} style={{ verticalAlign:'middle', marginRight:3 }}/>{req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}</span>
                              {req.citizenName && <span><Users size={11} style={{ verticalAlign:'middle', marginRight:3 }}/>{req.citizenName}</span>}
                            </div>
                            {req.resolutionNote && (
                              <p style={{ margin:'8px 0 0', fontSize:12, color:'#16a34a', fontWeight:600 }}>
                                ✓ Resolution: {req.resolutionNote}
                              </p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', minWidth:180 }}>
                            {status === 'Pending' && (
                              <button
                                onClick={() => updateSOSStatus(req._id, 'In Progress')}
                                disabled={sosActioning[req._id]}
                                className="dm-btn"
                                style={{
                                  background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
                                  color:'#fff', border:'none', borderRadius:9,
                                  padding:'8px 16px', fontSize:12, fontWeight:700,
                                  cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                                  transition:'all 0.2s',
                                  boxShadow:'0 3px 10px rgba(37,99,235,0.3)',
                                }}
                              >
                                <Activity size={12}/> Mark In Progress
                              </button>
                            )}
                            {status !== 'Resolved' && (
                              <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%' }}>
                                <input
                                  placeholder="Resolution note..."
                                  value={resolutionNotes[req._id] || ''}
                                  onChange={e => setResolutionNotes(n => ({ ...n, [req._id]: e.target.value }))}
                                  style={{ ...inputStyle, padding:'7px 12px', fontSize:12, width:'100%', boxSizing:'border-box' }}
                                />
                                <button
                                  onClick={() => updateSOSStatus(req._id, 'Resolved')}
                                  disabled={sosActioning[req._id]}
                                  className="dm-btn"
                                  style={{
                                    background:'linear-gradient(135deg,#16a34a,#15803d)',
                                    color:'#fff', border:'none', borderRadius:9,
                                    padding:'8px 16px', fontSize:12, fontWeight:700,
                                    cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                                    transition:'all 0.2s',
                                    boxShadow:'0 3px 10px rgba(22,163,74,0.3)',
                                  }}
                                >
                                  <CheckCircle size={12}/> Resolve
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/*  SHELTERS TAB  */}
        {activeTab === 'shelters' && (
          <div style={{ animation:'fadeInUp 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1e293b' }}>
                Shelters <span style={{ fontSize:14, color:'#94a3b8', fontWeight:400 }}>({shelters.length} registered)</span>
              </h2>
              <button
                onClick={() => openShelterModal()}
                className="dm-btn"
                style={{
                  background:'linear-gradient(135deg,#8B0000,#5c0000)',
                  color:'#fff', border:'none', borderRadius:11,
                  padding:'11px 20px', fontSize:13, fontWeight:700,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                  boxShadow:'0 4px 14px rgba(128,0,0,0.3)',
                  transition:'all 0.2s',
                }}
              >
                <Plus size={15}/> Add Shelter
              </button>
            </div>

            {error.shelters && <ErrorCard message={error.shelters} onRetry={fetchShelters}/>}

            {loading.shelters ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                {Array(4).fill(0).map((_,i) => <Skeleton key={i} h={220} mb={0} radius={16}/>)}
              </div>
            ) : shelters.length === 0 && !error.shelters ? (
              <EmptyState
                icon={<Home size={52} color="#cbd5e1"/>}
                title="No shelters registered"
                sub="Register emergency shelters so citizens can find safe locations."
                action={<button onClick={() => openShelterModal()} style={{ background:'linear-gradient(135deg,#8B0000,#5c0000)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Add First Shelter</button>}
              />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:16 }}>
                {shelters.map((s, idx) => {
                  const pct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
                  const barColor = pct < 50 ? '#16a34a' : pct < 80 ? '#d97706' : '#dc2626';
                  return (
                    <div
                      key={s._id||idx}
                      className="dm-card"
                      style={{
                        background:'#fff',
                        borderRadius:16,
                        padding:'20px',
                        boxShadow:'0 4px 14px rgba(0,0,0,0.07)',
                        border:'1px solid #f1f5f9',
                        animation:'fadeInUp 0.3s ease',
                        animationDelay:`${idx*0.07}s`,
                        animationFillMode:'both',
                        transition:'all 0.25s ease',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                        <div style={{ flex:1 }}>
                          <h3 style={{ margin:'0 0 4px', fontSize:15, fontWeight:700, color:'#1e293b' }}>{s.name}</h3>
                          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#64748b' }}>
                            <MapPin size={12}/>{s.location || s.address || '—'}
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            onClick={() => openShelterModal(s)}
                            className="dm-btn"
                            style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:'7px', cursor:'pointer', color:'#475569', transition:'all 0.2s' }}
                          >
                            <Edit2 size={13}/>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type:'shelter', id:s._id, name:s.name })}
                            className="dm-btn"
                            style={{ background:'#fee2e2', border:'none', borderRadius:8, padding:'7px', cursor:'pointer', color:'#dc2626', transition:'all 0.2s' }}
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>

                      {/* Occupancy */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
                          <span>Occupancy</span>
                          <span style={{ fontWeight:700, color:barColor }}>{pct}% · {s.currentOccupancy||0}/{s.capacity||'?'}</span>
                        </div>
                        <div style={{ height:7, background:'#f1f5f9', borderRadius:8, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${barColor}80,${barColor})`, borderRadius:8, transition:'width 0.6s ease' }}/>
                        </div>
                      </div>

                      {/* Facilities */}
                      {parseFacilities(s.facilities).length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                          {parseFacilities(s.facilities).map(f => (
                            <span key={f} style={{ background:'#f1f5f9', color:'#475569', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500 }}>{f}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ background: s.isActive!==false?'#dcfce7':'#f1f5f9', color:s.isActive!==false?'#16a34a':'#94a3b8', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                          {s.isActive!==false ? 'Active':'Inactive'}
                        </span>
                        {s.contactNumber && (
                          <span style={{ fontSize:12, color:'#8B0000', fontWeight:600 }}>📞 {s.contactNumber}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/*  ALERT MODAL  */}
      {showAlertModal && (
        <Modal
          title={editingAlert ? 'Edit Alert' : 'Post New Alert'}
          subtitle={editingAlert ? 'Update alert details' : 'Notify citizens of a disaster situation'}
          icon={<Bell size={20} color="#D4AF37"/>}
          onClose={() => setShowAlertModal(false)}
        >
          <FormField label="Alert Title" required>
            <input value={alertForm.title} onChange={e => setAlertForm(f => ({...f, title:e.target.value}))} placeholder="e.g. Flash Flood Warning" style={inputStyle}/>
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <FormField label="Disaster Type" required>
              <select value={alertForm.disasterType} onChange={e => setAlertForm(f => ({...f, disasterType:e.target.value}))} style={inputStyle}>
                <option value="">Select type...</option>
                {['Flood','Fire','Cyclone','Earthquake','Landslide','Drought','Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Severity" required>
              <select value={alertForm.severity} onChange={e => setAlertForm(f => ({...f, severity:e.target.value}))} style={inputStyle}>
                {['Low','Medium','High','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Affected Area" required>
            <input value={alertForm.affectedArea} onChange={e => setAlertForm(f => ({...f, affectedArea:e.target.value}))} placeholder="e.g. Galle District, Southern Province" style={inputStyle}/>
          </FormField>
          <FormField label="Description" required>
            <textarea value={alertForm.description} onChange={e => setAlertForm(f => ({...f, description:e.target.value}))} placeholder="Detailed alert description..." rows={3} style={{...inputStyle, resize:'vertical'}}/>
          </FormField>
          <FormField label="Instructions">
            <textarea value={alertForm.instructions} onChange={e => setAlertForm(f => ({...f, instructions:e.target.value}))} placeholder="Safety instructions for citizens..." rows={2} style={{...inputStyle, resize:'vertical'}}/>
          </FormField>
          <FormField label="Status">
            <div style={{ display:'flex', gap:10 }}>
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setAlertForm(f => ({...f, isActive:v}))} style={{
                  flex:1, padding:'9px', border:`2px solid ${alertForm.isActive===v ? '#8B0000':'#e2e8f0'}`,
                  borderRadius:10, background:alertForm.isActive===v ? '#fde8e8':'#fff',
                  color:alertForm.isActive===v ? '#8B0000':'#64748b',
                  fontWeight:700, cursor:'pointer', fontSize:13,
                }}>
                  {v ? '✅ Active' : '⛔ Inactive'}
                </button>
              ))}
            </div>
          </FormField>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={() => setShowAlertModal(false)} style={{ flex:1, padding:'12px', border:'2px solid #e2e8f0', borderRadius:12, background:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
              Cancel
            </button>
            <button
              onClick={saveAlert}
              disabled={alertSaving || !alertForm.title || !alertForm.disasterType || !alertForm.affectedArea || !alertForm.description}
              style={{
                flex:2, padding:'12px',
                background: alertSaving ? '#94a3b8' : 'linear-gradient(135deg,#8B0000,#5c0000)',
                color:'#fff', border:'none', borderRadius:12,
                fontSize:14, fontWeight:800,
                cursor: alertSaving ? 'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: alertSaving ? 'none':'0 4px 14px rgba(128,0,0,0.3)',
              }}
            >
              {alertSaving ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> Saving...</> : <><Save size={15}/> {editingAlert ? 'Update Alert' : 'Post Alert'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/*  SHELTER MODAL  */}
      {showShelterModal && (
        <Modal
          title={editingShelter ? 'Edit Shelter' : 'Add New Shelter'}
          subtitle={editingShelter ? 'Update shelter information' : 'Register a new emergency shelter'}
          icon={<Home size={20} color="#D4AF37"/>}
          onClose={() => setShowShelterModal(false)}
        >
          <FormField label="Shelter Name" required>
            <input value={shelterForm.name} onChange={e => setShelterForm(f => ({...f, name:e.target.value}))} placeholder="e.g. Galle Central School" style={inputStyle}/>
          </FormField>
          <FormField label="Location / Address" required>
            <input value={shelterForm.location} onChange={e => setShelterForm(f => ({...f, location:e.target.value}))} placeholder="e.g. Main Street, Galle" style={inputStyle}/>
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <FormField label="Total Capacity">
              <input type="number" min={0} value={shelterForm.capacity} onChange={e => setShelterForm(f => ({...f, capacity:Number(e.target.value)}))} style={inputStyle}/>
            </FormField>
            <FormField label="Current Occupancy">
              <input type="number" min={0} value={shelterForm.currentOccupancy} onChange={e => setShelterForm(f => ({...f, currentOccupancy:Number(e.target.value)}))} style={inputStyle}/>
            </FormField>
          </div>
          <FormField label="Facilities (comma-separated)">
            <input value={facilitiesInput} onChange={e => setFacilitiesInput(e.target.value)} placeholder="e.g. Food, Water, Medical Aid, Electricity" style={inputStyle}/>
          </FormField>
          <FormField label="Contact Number">
            <input value={shelterForm.contactNumber} onChange={e => setShelterForm(f => ({...f, contactNumber:e.target.value}))} placeholder="e.g. 0712345678" style={inputStyle}/>
          </FormField>
          <FormField label="Status">
            <div style={{ display:'flex', gap:10 }}>
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setShelterForm(f => ({...f, isActive:v}))} style={{
                  flex:1, padding:'9px',
                  border:`2px solid ${shelterForm.isActive===v ? '#8B0000':'#e2e8f0'}`,
                  borderRadius:10, background:shelterForm.isActive===v ? '#fde8e8':'#fff',
                  color:shelterForm.isActive===v ? '#8B0000':'#64748b',
                  fontWeight:700, cursor:'pointer', fontSize:13,
                }}>
                  {v ? '✅ Active' : '⛔ Inactive'}
                </button>
              ))}
            </div>
          </FormField>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={() => setShowShelterModal(false)} style={{ flex:1, padding:'12px', border:'2px solid #e2e8f0', borderRadius:12, background:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
              Cancel
            </button>
            <button
              onClick={saveShelter}
              disabled={shelterSaving || !shelterForm.name || !shelterForm.location}
              style={{
                flex:2, padding:'12px',
                background: shelterSaving ? '#94a3b8':'linear-gradient(135deg,#8B0000,#5c0000)',
                color:'#fff', border:'none', borderRadius:12,
                fontSize:14, fontWeight:800,
                cursor: shelterSaving ? 'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow: shelterSaving ? 'none':'0 4px 14px rgba(128,0,0,0.3)',
              }}
            >
              {shelterSaving ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> Saving...</> : <><Save size={15}/> {editingShelter ? 'Update Shelter':'Add Shelter'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/*  DELETE CONFIRM MODAL  */}
      {deleteTarget && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.5)',
            backdropFilter:'blur(5px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:10000, padding:20,
          }}
        >
          <div style={{
            background:'#fff', borderRadius:20, padding:'28px',
            maxWidth:380, width:'100%',
            animation:'slideInModal 0.25s ease',
            boxShadow:'0 24px 64px rgba(0,0,0,0.25)',
            textAlign:'center',
          }}>
            <div style={{ width:58, height:58, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={26} color="#dc2626"/>
            </div>
            <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:800, color:'#1e293b' }}>Confirm Delete</h3>
            <p style={{ margin:'0 0 22px', fontSize:14, color:'#64748b' }}>
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex:1, padding:'11px', border:'2px solid #e2e8f0', borderRadius:11, background:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
                Cancel
              </button>
              <button
                onClick={() => deleteTarget.type === 'alert' ? deleteAlert(deleteTarget.id) : deleteShelter(deleteTarget.id)}
                style={{ flex:1, padding:'11px', border:'none', borderRadius:11, background:'linear-gradient(135deg,#dc2626,#991b1b)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 12px rgba(220,38,38,0.35)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
