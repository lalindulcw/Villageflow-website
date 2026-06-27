import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE } from '../config';
import {
  AlertTriangle, Bell, Home, Phone, Send, Shield, MapPin, Users,
  ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader,
  AlertCircle, Zap, Flame, Wind, Droplets, Activity, Plus,
  PhoneCall, Info, Navigation, X, FileText, TrendingUp
} from 'lucide-react';


const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const getUserData = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

//  Keyframes Injector 
const STYLES = `
  @keyframes pulse-sos {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); transform: scale(1); }
    50% { box-shadow: 0 0 0 14px rgba(220,38,38,0); transform: scale(1.05); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.5); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInModal {
    from { opacity: 0; transform: scale(0.92) translateY(-20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position: 800px 0; }
  }
  @keyframes tabUnderline {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

//  Skeleton 
const Skeleton = ({ h = 80, mb = 12 }) => (
  <div style={{
    height: h, borderRadius: 12, marginBottom: mb,
    background: 'linear-gradient(90deg,#e8eceb 25%,#f4f7f6 50%,#e8eceb 75%)',
    backgroundSize: '800px 100%',
    animation: 'shimmer 1.4s infinite linear'
  }} />
);

//  Severity Config 
const SEVERITY = {
  Low:      { color: '#16a34a', bg: '#dcfce7', border: '#16a34a', label: 'Low' },
  Medium:   { color: '#d97706', bg: '#fef3c7', border: '#d97706', label: 'Medium' },
  High:     { color: '#ea580c', bg: '#ffedd5', border: '#ea580c', label: 'High' },
  Critical: { color: '#dc2626', bg: '#fee2e2', border: '#dc2626', label: 'CRITICAL' },
};

const TYPE_ICONS = {
  Flood:     <Droplets size={18} />,
  Fire:      <Flame size={18} />,
  Cyclone:   <Wind size={18} />,
  Earthquake:<Activity size={18} />,
  Landslide: <TrendingUp size={18} />,
  Default:   <AlertTriangle size={18} />,
};

const getTypeIcon = (type) => TYPE_ICONS[type] || TYPE_ICONS.Default;

const parseFacilities = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') return val.split(',').map(f => f.trim()).filter(Boolean);
  return [];
};

//  Status Config 
const SOS_STATUS = {
  Pending:     { color: '#d97706', bg: '#fef3c7', icon: <Clock size={14}/> },
  'In Progress':{ color: '#2563eb', bg: '#dbeafe', icon: <Loader size={14}/> },
  Resolved:    { color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={14}/> },
};

//  Main Component 
export default function DisasterPage() {
  const [lang] = useLanguage();
  const t = translations[lang] || translations.si;
  const [activeTab, setActiveTab]     = useState('alerts');
  const [alerts, setAlerts]           = useState([]);
  const [shelters, setShelters]       = useState([]);
  const [mySOSList, setMySOSList]     = useState([]);
  const [contacts, setContacts]       = useState([]);
  const [loading, setLoading]         = useState({ alerts: true, shelters: true, sos: true, contacts: true });
  const [error, setError]             = useState({});
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [showSOSModal, setShowSOSModal]   = useState(false);
  const [sosForm, setSosForm]         = useState({ helpType: '', location: '', description: '', personsAffected: 1 });
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess]   = useState(false);
  const user = getUserData();

  // Inject styles
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(l => ({ ...l, alerts: true }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/alerts`, { headers: getAuthHeaders() });
      setAlerts(Array.isArray(data) ? data : data.data || data.alerts || []);
    } catch (e) {
      setError(er => ({ ...er, alerts: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally {
      setLoading(l => ({ ...l, alerts: false }));
    }
  }, []);

  const fetchShelters = useCallback(async () => {
    setLoading(l => ({ ...l, shelters: true }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/shelters`, { headers: getAuthHeaders() });
      setShelters(Array.isArray(data) ? data : data.data || data.shelters || []);
    } catch (e) {
      setError(er => ({ ...er, shelters: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally {
      setLoading(l => ({ ...l, shelters: false }));
    }
  }, []);

  const fetchMySOSList = useCallback(async () => {
    setLoading(l => ({ ...l, sos: true }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/sos`, { headers: getAuthHeaders() });
      setMySOSList(Array.isArray(data) ? data : data.data || data.requests || []);
    } catch (e) {
      setError(er => ({ ...er, sos: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
    } finally {
      setLoading(l => ({ ...l, sos: false }));
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(l => ({ ...l, contacts: true }));
    try {
      const { data } = await axios.get(`${API_BASE}/disaster/emergency-contacts`, { headers: getAuthHeaders() });
      setContacts(Array.isArray(data) ? data : data.data || data.contacts || []);
    } catch (e) {
      setError(er => ({ ...er, contacts: e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.' }));
      // Provide fallback contacts
      setContacts([
        { _id: '1', name: 'Police', number: '119', category: 'Law Enforcement', emoji: '🚔' },
        { _id: '2', name: 'Fire & Rescue', number: '110', category: 'Emergency', emoji: '🚒' },
        { _id: '3', name: 'Ambulance', number: '1990', category: 'Medical', emoji: '🚑' },
        { _id: '4', name: 'Disaster Management', number: '117', category: 'Disaster', emoji: '🆘' },
        { _id: '5', name: 'Electricity Emergency', number: '1987', category: 'Utility', emoji: '⚡' },
      ]);
    } finally {
      setLoading(l => ({ ...l, contacts: false }));
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchShelters();
    fetchMySOSList();
    fetchContacts();
  }, [fetchAlerts, fetchShelters, fetchMySOSList, fetchContacts]);

  const submitSOS = async () => {
    if (!sosForm.helpType || !sosForm.location) return;
    setSosSubmitting(true);
    try {
      await axios.post(`${API_BASE}/disaster/sos`, sosForm, { headers: getAuthHeaders() });
      setSosSuccess(true);
      setTimeout(() => {
        setShowSOSModal(false);
        setSosSuccess(false);
        setSosForm({ helpType: '', location: '', description: '', personsAffected: 1 });
        fetchMySOSList();
      }, 1800);
    } catch (e) {
      alert(e.response ? e.message : 'Backend not yet deployed. Please run the backend server locally.');
    } finally {
      setSosSubmitting(false);
    }
  };

  //  TABS 
  const TABS = [
    { id: 'alerts',   label: t.disaster.alerts,            icon: <Bell size={16}/> },
    { id: 'shelters', label: t.disaster.shelters,           icon: <Home size={16}/> },
    { id: 'mysos',    label: t.disaster.mySos,             icon: <Send size={16}/> },
    { id: 'contacts', label: t.disaster.contacts,          icon: <Phone size={16}/> },
  ];

  //  RENDER 
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/*  HEADER  */}
      <div style={{
        background: 'linear-gradient(135deg, #8B0000 0%, #5c0000 50%, #3a0000 100%)',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative blobs */}
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'rgba(251,197,49,0.08)' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

        <div style={{ position:'relative', padding:'32px 28px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{
                width:56, height:56, borderRadius:16,
                background:'rgba(251,197,49,0.18)',
                border:'2px solid rgba(251,197,49,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <AlertTriangle size={28} color="#D4AF37" />
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>
                  {t.disaster.title}
                </h1>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                  Real-time alerts · Shelter info · Emergency help
                </p>
              </div>
            </div>

            {/* SOS BUTTON */}
            <button
              onClick={() => setShowSOSModal(true)}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                letterSpacing: 1,
                animation: 'pulse-sos 2s ease-in-out infinite',
              }}
            >
              <Zap size={18} fill="currentColor" />
              {t.disaster.sendSos}
            </button>
          </div>

          {/* Status bar */}
          <div style={{
            marginTop: 20,
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Active Alerts', value: alerts.filter(a => a.isActive !== false).length, color: '#D4AF37' },
              { label: 'Open Shelters', value: shelters.length, color: '#86efac' },
              { label: 'My Pending SOS', value: mySOSList.filter(s => s.status === 'Pending').length, color: '#fca5a5' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.2 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/*  TAB NAV  */}
        <div style={{
          display: 'flex',
          padding: '0 28px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.15)',
          overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                whiteSpace: 'nowrap',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, #D4AF37, #f59e0b)',
                  borderRadius: '3px 3px 0 0',
                  animation: 'tabUnderline 0.25s ease',
                }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/*  CONTENT  */}
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

        {/*  ALERTS TAB  */}
        {activeTab === 'alerts' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            {loading.alerts ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} h={110} mb={14} />)
            ) : error.alerts ? (
              <ErrorCard message={error.alerts} onRetry={fetchAlerts} />
            ) : alerts.length === 0 ? (
              <EmptyState icon={<Bell size={48} color="#cbd5e1"/>} title="No active alerts" sub="You're all clear! No disaster alerts in your area right now." />
            ) : (
              alerts.map((alert, idx) => {
                const sev = SEVERITY[alert.severity] || SEVERITY.Medium;
                const isExp = expandedAlert === alert._id;
                return (
                  <div
                    key={alert._id || idx}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      marginBottom: 14,
                      borderLeft: `5px solid ${sev.border}`,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      overflow: 'hidden',
                      animation: 'fadeInUp 0.35s ease',
                      animationDelay: `${idx * 0.05}s`,
                      animationFillMode: 'both',
                    }}
                  >
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:14, flex:1 }}>
                          {/* Type icon bubble */}
                          <div style={{
                            width:42, height:42, borderRadius:12,
                            background: sev.bg,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color: sev.color,
                            flexShrink:0,
                          }}>
                            {getTypeIcon(alert.disasterType)}
                          </div>

                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                              <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#1e293b' }}>
                                {alert.title || alert.disasterType || 'Alert'}
                              </h3>
                              {/* Severity badge */}
                              <span style={{
                                background: sev.bg,
                                color: sev.color,
                                padding:'2px 10px',
                                borderRadius:20,
                                fontSize:11,
                                fontWeight:700,
                                display:'flex', alignItems:'center', gap:5,
                                border: `1px solid ${sev.color}30`,
                              }}>
                                {alert.severity === 'Critical' && (
                                  <span style={{
                                    width:7, height:7, borderRadius:'50%',
                                    background: sev.color,
                                    display:'inline-block',
                                    animation:'pulse-dot 1s ease-in-out infinite'
                                  }}/>
                                )}
                                {sev.label}
                              </span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, color:'#64748b', fontSize:13 }}>
                              <MapPin size={13}/> {alert.affectedArea || 'Area not specified'}
                              <span style={{ margin:'0 4px' }}>·</span>
                              <Clock size={13}/> {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Recently'}
                            </div>
                            {alert.message && (
                              <p style={{ margin:'8px 0 0', fontSize:14, color:'#475569', lineHeight:1.6 }}>
                                {alert.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        {alert.instructions && (
                          <button
                            onClick={() => setExpandedAlert(isExp ? null : alert._id)}
                            style={{
                              background:'#f1f5f9', border:'none', borderRadius:8,
                              padding:'6px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                              fontSize:12, color:'#64748b', fontWeight:600, flexShrink:0,
                            }}
                          >
                            Instructions {isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                          </button>
                        )}
                      </div>

                      {/* Collapsible Instructions */}
                      {isExp && alert.instructions && (
                        <div style={{
                          marginTop:14, padding:'14px 16px',
                          background: sev.bg,
                          borderRadius:10,
                          borderLeft:`3px solid ${sev.color}`,
                        }}>
                          <p style={{ margin:0, fontSize:13, color:'#1e293b', lineHeight:1.7 }}>
                            <strong>Instructions: </strong>{alert.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/*  SHELTERS TAB  */}
        {activeTab === 'shelters' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            {loading.shelters ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                {Array(4).fill(0).map((_,i) => <Skeleton key={i} h={200} mb={0}/>)}
              </div>
            ) : error.shelters ? (
              <ErrorCard message={error.shelters} onRetry={fetchShelters} />
            ) : shelters.length === 0 ? (
              <EmptyState icon={<Home size={48} color="#cbd5e1"/>} title="No shelters listed" sub="Shelter information will appear here during emergencies." />
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:16 }}>
                {shelters.map((s, idx) => {
                  const pct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
                  const barColor = pct < 50 ? '#16a34a' : pct < 80 ? '#d97706' : '#dc2626';
                  return (
                    <div
                      key={s._id || idx}
                      style={{
                        background:'#fff',
                        borderRadius:16,
                        padding:'20px',
                        boxShadow:'0 4px 16px rgba(0,0,0,0.07)',
                        border:'1px solid #f1f5f9',
                        animation:'fadeInUp 0.35s ease',
                        animationDelay:`${idx*0.07}s`,
                        animationFillMode:'both',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                        <div>
                          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:'#1e293b' }}>{s.name}</h3>
                          <div style={{ display:'flex', alignItems:'center', gap:5, color:'#64748b', fontSize:13, marginTop:4 }}>
                            <MapPin size={13}/> {s.location || s.address || 'Location TBD'}
                          </div>
                        </div>
                        <span style={{
                          background: pct >= 100 ? '#fee2e2' : '#dcfce7',
                          color: pct >= 100 ? '#dc2626' : '#16a34a',
                          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                        }}>
                          {pct >= 100 ? 'FULL' : 'OPEN'}
                        </span>
                      </div>

                      {/* Capacity bar */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
                          <span>Occupancy</span>
                          <span style={{ fontWeight:700, color: barColor }}>{pct}% ({s.currentOccupancy || 0}/{s.capacity || '?'})</span>
                        </div>
                        <div style={{ height:8, background:'#f1f5f9', borderRadius:8, overflow:'hidden' }}>
                          <div style={{
                            height:'100%',
                            width:`${Math.min(pct,100)}%`,
                            background:`linear-gradient(90deg,${barColor}99,${barColor})`,
                            borderRadius:8,
                            transition:'width 0.6s ease',
                          }}/>
                        </div>
                      </div>

                      {/* Facilities */}
                      {parseFacilities(s.facilities).length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {parseFacilities(s.facilities).map(f => (
                            <span key={f} style={{
                              background:'#f1f5f9',
                              color:'#475569',
                              padding:'3px 10px',
                              borderRadius:20,
                              fontSize:12,
                              fontWeight:500,
                            }}>{f}</span>
                          ))}
                        </div>
                      )}

                      {s.contactNumber && (
                        <a href={`tel:${s.contactNumber}`} style={{
                          display:'flex', alignItems:'center', gap:6,
                          marginTop:12, fontSize:13, color:'#8B0000', fontWeight:600,
                          textDecoration:'none',
                        }}>
                          <Phone size={14}/> {s.contactNumber}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/*  MY SOS TAB  */}
        {activeTab === 'mysos' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1e293b' }}>
                My SOS Requests
              </h2>
              <button
                onClick={() => setShowSOSModal(true)}
                style={{
                  background:'linear-gradient(135deg,#8B0000,#5c0000)',
                  color:'#fff', border:'none', borderRadius:10,
                  padding:'10px 18px', fontSize:13, fontWeight:700,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                  boxShadow:'0 4px 14px rgba(128,0,0,0.3)',
                }}
              >
                <Plus size={15}/> New SOS Request
              </button>
            </div>

            {loading.sos ? (
              Array(3).fill(0).map((_,i) => <Skeleton key={i} h={90} mb={12}/>)
            ) : error.sos ? (
              <ErrorCard message={error.sos} onRetry={fetchMySOSList} />
            ) : mySOSList.length === 0 ? (
              <EmptyState
                icon={<Send size={48} color="#cbd5e1"/>}
                title="No SOS requests yet"
                sub="Press 'SOS - Send Help' or 'New SOS Request' to alert responders."
              />
            ) : (
              <div style={{ position:'relative', paddingLeft:28 }}>
                {/* Timeline line */}
                <div style={{
                  position:'absolute', left:11, top:24, bottom:24,
                  width:2, background:'linear-gradient(180deg,#8B0000,#D4AF37)',
                  borderRadius:2,
                }}/>

                {mySOSList.map((req, idx) => {
                  const st = SOS_STATUS[req.status] || SOS_STATUS['Pending'];
                  return (
                    <div key={req._id || idx} style={{ position:'relative', marginBottom:16, animation:'fadeInUp 0.35s ease', animationDelay:`${idx*0.06}s`, animationFillMode:'both' }}>
                      {/* Timeline dot */}
                      <div style={{
                        position:'absolute', left:-22, top:18,
                        width:16, height:16, borderRadius:'50%',
                        background: st.color,
                        border:'3px solid #f4f7f6',
                        boxShadow:`0 0 0 2px ${st.color}40`,
                      }}/>

                      <div style={{
                        background:'#fff',
                        borderRadius:14,
                        padding:'16px 18px',
                        boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
                        border:'1px solid #f1f5f9',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                              <h4 style={{ margin:0, fontSize:14, fontWeight:700, color:'#1e293b' }}>
                                {req.disasterType || 'Emergency'} — {req.location}
                              </h4>
                              <span style={{
                                background:st.bg, color:st.color,
                                padding:'2px 10px', borderRadius:20,
                                fontSize:11, fontWeight:700,
                                display:'flex', alignItems:'center', gap:4,
                              }}>
                                {st.icon} {req.status}
                              </span>
                            </div>
                            {req.description && (
                              <p style={{ margin:0, fontSize:13, color:'#64748b' }}>{req.description}</p>
                            )}
                            {req.resolutionNote && (
                              <p style={{ margin:'6px 0 0', fontSize:12, color:'#16a34a', fontWeight:600 }}>
                                ✓ {req.resolutionNote}
                              </p>
                            )}
                          </div>
                          <span style={{ fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>
                            {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/*  EMERGENCY CONTACTS TAB  */}
        {activeTab === 'contacts' && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            {loading.contacts ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {Array(5).fill(0).map((_,i) => <Skeleton key={i} h={110} mb={0}/>)}
              </div>
            ) : (
              <>
                {error.contacts && (
                  <div style={{
                    background:'#fff8e1', border:'1px solid #D4AF37', borderRadius:10,
                    padding:'12px 16px', marginBottom:16, fontSize:13, color:'#92400e',
                    display:'flex', gap:8, alignItems:'flex-start',
                  }}>
                    <Info size={15} style={{ flexShrink:0, marginTop:1 }}/>
                    {error.contacts} Showing default emergency contacts.
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                  {contacts.map((c, idx) => (
                    <div
                      key={c._id || idx}
                      style={{
                        background:'#fff',
                        borderRadius:16,
                        padding:'20px',
                        boxShadow:'0 4px 14px rgba(0,0,0,0.07)',
                        border:'1px solid #f1f5f9',
                        animation:'fadeInUp 0.35s ease',
                        animationDelay:`${idx*0.06}s`,
                        animationFillMode:'both',
                        display:'flex',
                        flexDirection:'column',
                        gap:10,
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:48, height:48, borderRadius:14,
                          background:'linear-gradient(135deg,#fff8e1,#fef3c7)',
                          border:'2px solid #D4AF3730',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:22,
                        }}>
                          {c.emoji || '📞'}
                        </div>
                        <div>
                          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#1e293b' }}>{c.name}</h3>
                          {c.category && <p style={{ margin:'2px 0 0', fontSize:12, color:'#94a3b8' }}>{c.category}</p>}
                        </div>
                      </div>

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:22, fontWeight:800, color:'#8B0000', letterSpacing:1 }}>
                          {c.number || c.phone}
                        </span>
                        <a
                          href={`tel:${c.number || c.phone}`}
                          style={{
                            background:'linear-gradient(135deg,#8B0000,#5c0000)',
                            color:'#fff',
                            textDecoration:'none',
                            padding:'8px 16px',
                            borderRadius:10,
                            fontSize:12,
                            fontWeight:700,
                            display:'flex', alignItems:'center', gap:6,
                            boxShadow:'0 3px 10px rgba(128,0,0,0.25)',
                          }}
                        >
                          <PhoneCall size={13}/> Call Now
                        </a>
                      </div>
                      {c.description && (
                        <p style={{ margin:0, fontSize:12, color:'#64748b', lineHeight:1.5 }}>{c.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/*  SOS MODAL  */}
      {showSOSModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowSOSModal(false); }}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.6)',
            backdropFilter:'blur(6px)',
            display:'flex',
            alignItems:'flex-start',
            justifyContent:'center',
            zIndex:9999,
            padding:'20px 20px 40px',
            overflowY:'auto',
          }}
        >
          <div style={{
            background:'#fff',
            borderRadius:22,
            width:'100%', maxWidth:480,
            animation:'slideInModal 0.3s ease',
            boxShadow:'0 30px 80px rgba(0,0,0,0.3)',
            position:'relative',
            marginTop:'auto',
            marginBottom:'auto',
            flexShrink:0,
          }}>
            {/* Sticky Modal header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'22px 24px 18px',
              borderBottom:'1px solid #f1f5f9',
              position:'sticky', top:0,
              background:'#fff',
              borderRadius:'22px 22px 0 0',
              zIndex:10,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:12,
                  background:'#fee2e2',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <AlertTriangle size={22} color="#dc2626"/>
                </div>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b' }}>Send SOS Alert</h2>
                  <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>Emergency responders will be notified</p>
                </div>
              </div>
              <button
                onClick={() => setShowSOSModal(false)}
                style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:8, cursor:'pointer', flexShrink:0 }}
              >
                <X size={18} color="#64748b"/>
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ padding:'22px 24px 24px' }}>
              {sosSuccess ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>✅</div>
                  <h3 style={{ margin:0, color:'#16a34a', fontWeight:800 }}>SOS Sent!</h3>
                  <p style={{ color:'#64748b', fontSize:14 }}>Emergency responders have been notified. Stay safe.</p>
                </div>
              ) : (
                <>
                  {/* Form fields */}
                  {[
                    { label:'Request Type *', key:'helpType', type:'select', opts:['Rescue','Food','Shelter','Medical','Other'] },
                    { label:'Your Location *', key:'location', type:'text', placeholder:'Village, area, or landmark' },
                    { label:'Description', key:'description', type:'textarea', placeholder:'Describe the situation...' },
                    { label:'Persons Affected', key:'personsAffected', type:'number', placeholder:'1' },
                  ].map(field => (
                    <div key={field.key} style={{ marginBottom:16 }}>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={sosForm[field.key]}
                          onChange={e => setSosForm(f => ({ ...f, [field.key]: e.target.value }))}
                          style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'2px solid #e2e8f0', fontSize:14, outline:'none', background:'#f8fafc', boxSizing:'border-box', color:'#1e293b' }}
                        >
                          <option value="">Select...</option>
                          {field.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={sosForm[field.key]}
                          onChange={e => setSosForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'2px solid #e2e8f0', fontSize:14, outline:'none', background:'#f8fafc', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box', color:'#1e293b' }}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          min={field.type === 'number' ? 1 : undefined}
                          value={sosForm[field.key]}
                          onChange={e => setSosForm(f => ({ ...f, [field.key]: field.type === 'number' ? Math.max(1, Number(e.target.value) || 1) : e.target.value }))}
                          placeholder={field.placeholder}
                          style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'2px solid #e2e8f0', fontSize:14, outline:'none', background:'#f8fafc', boxSizing:'border-box', color:'#1e293b' }}
                        />
                      )}
                    </div>
                  ))}

                  <div style={{ display:'flex', gap:12, marginTop:8 }}>
                    <button
                      onClick={() => setShowSOSModal(false)}
                      style={{ flex:1, padding:'12px', border:'2px solid #e2e8f0', borderRadius:12, background:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitSOS}
                      disabled={sosSubmitting || !sosForm.helpType || !sosForm.location}
                      style={{
                        flex:2, padding:'12px',
                        background: sosSubmitting ? '#94a3b8' : 'linear-gradient(135deg,#dc2626,#991b1b)',
                        color:'#fff', border:'none', borderRadius:12,
                        fontSize:14, fontWeight:800,
                        cursor: sosSubmitting ? 'not-allowed' : 'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        boxShadow: sosSubmitting ? 'none' : '0 4px 14px rgba(220,38,38,0.4)',
                      }}
                    >
                      {sosSubmitting ? (
                        <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> Sending...</>
                      ) : (
                        <><Zap size={16} fill="currentColor"/> Send SOS Now</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

//  Helper Components 
function ErrorCard({ message, onRetry }) {
  return (
    <div style={{
      background:'#fff',
      border:'1px solid #fee2e2',
      borderRadius:16,
      padding:'28px',
      textAlign:'center',
      boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{ width:56, height:56, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
        <XCircle size={28} color="#dc2626"/>
      </div>
      <h3 style={{ margin:'0 0 6px', fontSize:16, fontWeight:700, color:'#1e293b' }}>Unable to Load Data</h3>
      <p style={{ margin:'0 0 16px', fontSize:13, color:'#64748b', maxWidth:400, marginLeft:'auto', marginRight:'auto' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          background:'linear-gradient(135deg,#8B0000,#5c0000)',
          color:'#fff', border:'none', borderRadius:10,
          padding:'10px 22px', fontSize:13, fontWeight:700,
          cursor:'pointer', boxShadow:'0 4px 12px rgba(128,0,0,0.25)',
        }}>
          Try Again
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{
      textAlign:'center', padding:'56px 24px',
      background:'#fff', borderRadius:16,
      boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
      border:'1px solid #f1f5f9',
    }}>
      <div style={{ marginBottom:16, opacity:0.5 }}>{icon}</div>
      <h3 style={{ margin:'0 0 8px', fontSize:17, fontWeight:700, color:'#1e293b' }}>{title}</h3>
      <p style={{ margin:0, fontSize:13, color:'#94a3b8', maxWidth:320, marginLeft:'auto', marginRight:'auto' }}>{sub}</p>
    </div>
  );
}
