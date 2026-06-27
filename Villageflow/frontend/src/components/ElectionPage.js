import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE as API } from '../config';
import {
    Vote, Search, Bell, Users, MapPin, Calendar,
    CheckCircle, Clock, RefreshCw, X, ChevronRight,
    BookOpen, AlertCircle, Phone
} from 'lucide-react';

const STYLES_ID = 'election-page-styles';
const CSS = `
@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes spinEl { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
@keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
.ep-card { animation: fadeInUp 0.35s ease both; }
.ep-spin { animation: spinEl 1s linear infinite; }
.ep-tab-btn:hover { background: rgba(128,0,0,0.06) !important; }
.ep-contact-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(128,0,0,0.15) !important; }
.ep-candidate-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
.ep-notice-card:hover { border-color: #8B0000 !important; }
.ep-check-input:focus { border-color: #8B0000 !important; box-shadow: 0 0 0 3px rgba(128,0,0,0.1) !important; }
.ep-skeleton { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:400px 100%; animation: shimmer 1.4s infinite; border-radius:10px; }
`;

const electionTypeColors = {
    Presidential:     { color: '#7c3aed', bg: '#ede9fe' },
    Parliamentary:    { color: '#2563eb', bg: '#dbeafe' },
    Provincial:       { color: '#0891b2', bg: '#cffafe' },
    'Local Government': { color: '#16a34a', bg: '#dcfce7' },
    Referendum:       { color: '#db2777', bg: '#fce7f3' },
    Other:            { color: '#64748b', bg: '#f1f5f9' }
};

const voterGuide = [
    { icon: '🗳️', q: 'Who can vote?', a: 'Sri Lankan citizens aged 18 and above who are registered in the electoral roll of their GN Division can vote.' },
    { icon: '🪪', q: 'What ID to bring?', a: 'Your National Identity Card (NIC), valid Passport, or Driving License as valid photo identification.' },
    { icon: '⏰', q: 'Polling station hours?', a: 'Polling stations are open from 7:00 AM to 4:00 PM on Election Day. Arrive early to avoid queues.' },
    { icon: '✅', q: 'How to mark ballot?', a: 'Make one clear mark (✓ or X) next to your chosen candidate. Fold the ballot and place in the box.' },
    { icon: '🏠', q: 'Changed address?', a: 'Update your address in the electoral roll before the registration deadline. Contact your GN Officer.' },
    { icon: '📬', q: 'What is a postal vote?', a: 'If you cannot attend in person, apply for a postal vote before the election date. Contact the Elections Commission.' },
];

function ElectionPage() {
    const [lang] = useLanguage();
    const t = translations[lang] || translations.si;
    const [activeTab, setActiveTab] = useState('notices');
    const [notices, setNotices] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [checkNIC, setCheckNIC] = useState('');
    const [voterResult, setVoterResult] = useState(null);
    const [checkLoading, setCheckLoading] = useState(false);

    useEffect(() => {
        if (!document.getElementById(STYLES_ID)) {
            const el = document.createElement('style');
            el.id = STYLES_ID; el.textContent = CSS;
            document.head.appendChild(el);
        }
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [nRes, cRes] = await Promise.all([
                axios.get(`${API}/election/notices`),
                axios.get(`${API}/election/candidates`)
            ]);
            setNotices(nRes.data.data || []);
            setCandidates(cRes.data.data || []);
        } catch {
            setError('Could not load data. Ensure the backend server is running with the new election routes.');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleVoterCheck = async (e) => {
        e.preventDefault();
        if (!checkNIC.trim()) return;
        setCheckLoading(true); setVoterResult(null);
        try {
            const res = await axios.get(`${API}/election/voters/check/${checkNIC.trim()}`);
            setVoterResult(res.data);
        } catch {
            setVoterResult({ error: true });
        }
        setCheckLoading(false);
    };

    const tabs = [
        { id: 'notices',    icon: <Bell size={15}/>,     label: t.election.announcements,    badge: notices.length },
        { id: 'candidates', icon: <Users size={15}/>,    label: 'Candidates', badge: candidates.length },
        { id: 'check',      icon: <Search size={15}/>,   label: t.election.checkReg, badge: null },
        { id: 'info',       icon: <BookOpen size={15}/>, label: 'Voter Guide', badge: null }
    ];

    return (
        <div style={S.page}>
            {/* ── Header ── */}
            <div style={S.header}>
                <div style={S.headerGlow} />
                <div style={S.headerInner}>
                    <div style={S.headerIconBox}><Vote size={28} color="white" /></div>
                    <div>
                        <h1 style={S.headerTitle}>{t.election.title}</h1>
                        <p style={S.headerSub}>Voter registration · Election notices · Candidates · Polling info</p>
                    </div>
                    <button style={S.refreshBtn} onClick={fetchAll} title="Refresh">
                        <RefreshCw size={15} className={loading ? 'ep-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div style={S.errorBanner}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button style={S.errorClose} onClick={() => setError('')}><X size={14}/></button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={S.tabsWrapper}>
                <div style={S.tabsBar}>
                    {tabs.map(t => (
                        <button key={t.id} className="ep-tab-btn"
                            style={{ ...S.tabBtn, ...(activeTab === t.id ? S.tabBtnActive : {}) }}
                            onClick={() => setActiveTab(t.id)}>
                            {t.icon} {t.label}
                            {t.badge !== null && (
                                <span style={activeTab === t.id ? S.badgeActive : S.badge}>{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div style={S.content}>

                {/* ──── NOTICES ──── */}
                {activeTab === 'notices' && (
                    <div>
                        {loading ? <SkeletonList /> : notices.length === 0 ? (
                            <EmptyState icon={<Bell size={44} color="#cbd5e1"/>} title="No Election Notices" sub="GN Officer will post notices before an election." />
                        ) : notices.map((n, i) => {
                            const tc = electionTypeColors[n.electionType] || electionTypeColors.Other;
                            return (
                                <div key={n._id} className="ep-card ep-notice-card" style={{ ...S.noticeCard, animationDelay: `${i*60}ms` }}>
                                    <div style={S.noticeTop}>
                                        <div style={{ flex: 1 }}>
                                            <div style={S.noticeTypeLine}>
                                                <span style={{ ...S.typeChip, background: tc.bg, color: tc.color }}>
                                                    🗳️ {n.electionType}
                                                </span>
                                            </div>
                                            <h3 style={S.noticeTitle}>{n.title}</h3>
                                        </div>
                                        <div style={S.noticeDateBox}>
                                            <Clock size={12}/>
                                            {new Date(n.createdAt).toLocaleDateString('en-LK', {day:'numeric',month:'short',year:'numeric'})}
                                        </div>
                                    </div>
                                    <p style={S.noticeDesc}>{n.description}</p>
                                    {(n.electionDate || n.deadline) && (
                                        <div style={S.noticeDates}>
                                            {n.electionDate && (
                                                <span style={S.dateChip}>
                                                    <Calendar size={12}/> Election: <strong>{new Date(n.electionDate).toLocaleDateString('en-LK')}</strong>
                                                </span>
                                            )}
                                            {n.deadline && (
                                                <span style={{ ...S.dateChip, background:'#fff7ed', color:'#c2410c', borderColor:'#fed7aa' }}>
                                                    <Clock size={12}/> Deadline: <strong>{new Date(n.deadline).toLocaleDateString('en-LK')}</strong>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ──── CANDIDATES ──── */}
                {activeTab === 'candidates' && (
                    <div>
                        {loading ? <SkeletonGrid /> : candidates.length === 0 ? (
                            <EmptyState icon={<Users size={44} color="#cbd5e1"/>} title="No Candidates Listed" sub="GN Officer will register candidates before the election." />
                        ) : (
                            <div style={S.candidateGrid}>
                                {candidates.map((c, i) => {
                                    const tc = electionTypeColors[c.electionType] || electionTypeColors.Other;
                                    return (
                                        <div key={c._id} className="ep-card ep-candidate-card" style={{ ...S.candidateCard, animationDelay:`${i*60}ms`, transition:'all 0.25s ease' }}>
                                            <div style={S.candidateAvatar}>
                                                {c.photoUrl
                                                    ? <img src={c.photoUrl} alt={c.fullName} style={{ width:80,height:80,borderRadius:'50%',objectFit:'cover' }}/>
                                                    : <div style={S.candidateInitial}>{c.fullName.charAt(0)}</div>
                                                }
                                            </div>
                                            <h3 style={S.candidateName}>{c.fullName}</h3>
                                            <div style={S.partyBadge}>{c.party}{c.partyShort ? ` · ${c.partyShort}` : ''}</div>
                                            <span style={{ ...S.typeChip, background:tc.bg, color:tc.color, marginTop:8 }}>{c.electionType}</span>
                                            {c.gnDivision && <p style={S.candidateMeta}><MapPin size={11}/> {c.gnDivision}</p>}
                                            {c.manifesto && <p style={S.manifestoBox}>"{c.manifesto}"</p>}
                                            {c.contactNumber && <p style={S.candidateMeta}><Phone size={11}/> {c.contactNumber}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ──── VOTER CHECK ──── */}
                {activeTab === 'check' && (
                    <div style={S.checkWrapper}>
                        <div style={S.checkCard} className="ep-card">
                            <div style={S.checkIconBg}><Vote size={34} color="#8B0000"/></div>
                            <h2 style={S.checkTitle}>Voter Registration Check</h2>
                            <p style={S.checkSub}>Enter your NIC number to verify your electoral roll status</p>
                            <form onSubmit={handleVoterCheck} style={{ width:'100%' }}>
                                <div style={S.checkRow}>
                                    <input className="ep-check-input" style={S.checkInput}
                                        placeholder="NIC number (e.g. 199012345678 or 901234567V)"
                                        value={checkNIC}
                                        onChange={e => { setCheckNIC(e.target.value); setVoterResult(null); }}
                                        required
                                    />
                                    <button type="submit" style={S.checkBtn} disabled={checkLoading}>
                                        {checkLoading
                                            ? <RefreshCw size={16} className="ep-spin" />
                                            : <><Search size={16}/> Check</>
                                        }
                                    </button>
                                </div>
                            </form>

                            {voterResult && (
                                <div style={{ width:'100%', marginTop:20 }} className="ep-card">
                                    {voterResult.error ? (
                                        <div style={S.resultBox('#fee2e2','#991b1b','#fca5a5')}>
                                            <X size={20} color="#dc2626"/> <span>Server error. Please try again.</span>
                                        </div>
                                    ) : voterResult.registered ? (
                                        <div style={S.resultSuccess}>
                                            <div style={S.resultSuccessTop}>
                                                <CheckCircle size={24} color="#16a34a"/>
                                                <strong style={{ color:'#166534', fontSize:17 }}>✅ You are Registered!</strong>
                                            </div>
                                            <div style={S.voterGrid}>
                                                {[
                                                    ['Full Name', voterResult.data.fullName],
                                                    ['NIC', voterResult.data.nic],
                                                    ['GN Division', voterResult.data.gnDivision],
                                                    ['Status', voterResult.data.registrationStatus],
                                                    voterResult.data.pollingStation && ['Polling Station', voterResult.data.pollingStation],
                                                    voterResult.data.pollingStationAddress && ['Station Address', voterResult.data.pollingStationAddress],
                                                ].filter(Boolean).map(([k,v]) => (
                                                    <div key={k} style={S.voterRow}>
                                                        <span style={S.voterKey}>{k}</span>
                                                        <span style={S.voterVal}>{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={S.resultBox('#fee2e2','#991b1b','#fca5a5')}>
                                            <X size={20} color="#dc2626"/>
                                            <div>
                                                <strong style={{ color:'#991b1b' }}>Not Registered</strong>
                                                <p style={{ color:'#b91c1c', fontSize:13, margin:'4px 0 0' }}>
                                                    Your NIC is not in the electoral roll. Contact your GN Officer to register.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={S.checkNote}>
                                <Bell size={14} color="#d97706"/>
                                <span>Not registered? Visit your GN Officer or Divisional Secretariat before the registration deadline.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── VOTER GUIDE ──── */}
                {activeTab === 'info' && (
                    <div>
                        <div style={S.guideHero} className="ep-card">
                            <div style={{ fontSize:52, marginBottom:10 }}>🗳️</div>
                            <h2 style={{ margin:'0 0 6px', fontSize:22, color:'#1e293b', fontWeight:800 }}>Sri Lanka Voter Guide</h2>
                            <p style={{ margin:0, color:'#64748b', fontSize:14 }}>Everything you need to know about voting in Sri Lanka</p>
                        </div>
                        <div style={S.faqGrid}>
                            {voterGuide.map((item, i) => (
                                <div key={i} className="ep-card" style={{ ...S.faqCard, animationDelay:`${i*50}ms` }}>
                                    <div style={S.faqIconBox}>{item.icon}</div>
                                    <div>
                                        <strong style={{ color:'#1e293b', fontSize:15 }}>{item.q}</strong>
                                        <p style={{ color:'#475569', fontSize:13, lineHeight:1.7, margin:'6px 0 0' }}>{item.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={S.commissionBox}>
                            <div style={{ fontSize:28, marginBottom:6 }}>📞</div>
                            <strong style={{ fontSize:16 }}>Elections Commission of Sri Lanka</strong>
                            <p style={{ margin:'6px 0 0', opacity:0.9 }}>Hotline: <strong style={{ fontSize:20 }}>1980</strong></p>
                            <p style={{ margin:'3px 0 0', opacity:0.8, fontSize:13 }}>www.elections.gov.lk</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SkeletonList() {
    return [1,2,3].map(i => (
        <div key={i} style={{ background:'white',borderRadius:14,padding:20,marginBottom:14 }}>
            <div className="ep-skeleton" style={{ height:16,width:'60%',marginBottom:10 }}/>
            <div className="ep-skeleton" style={{ height:12,width:'90%',marginBottom:6 }}/>
            <div className="ep-skeleton" style={{ height:12,width:'75%' }}/>
        </div>
    ));
}
function SkeletonGrid() {
    return (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16 }}>
            {[1,2,3,4].map(i => (
                <div key={i} style={{ background:'white',borderRadius:16,padding:24,display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}>
                    <div className="ep-skeleton" style={{ width:80,height:80,borderRadius:'50%' }}/>
                    <div className="ep-skeleton" style={{ width:'70%',height:14 }}/>
                    <div className="ep-skeleton" style={{ width:'50%',height:12 }}/>
                </div>
            ))}
        </div>
    );
}
function EmptyState({ icon, title, sub }) {
    return (
        <div style={{ textAlign:'center',padding:'64px 20px',background:'white',borderRadius:16,boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }} className="ep-card">
            <div style={{ marginBottom:14, opacity:0.5 }}>{icon}</div>
            <h3 style={{ color:'#475569',margin:'0 0 6px',fontSize:18 }}>{title}</h3>
            <p style={{ color:'#94a3b8',margin:0,fontSize:14 }}>{sub}</p>
        </div>
    );
}

const S = {
    page:{ minHeight:'100vh', background:'#f4f7f6', paddingBottom:48, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
    header:{ background:'linear-gradient(135deg,#8B0000 0%,#6b0000 50%,#500000 100%)', position:'relative', overflow:'hidden' },
    headerGlow:{ position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(251,197,49,0.12)',pointerEvents:'none' },
    headerInner:{ display:'flex',alignItems:'center',gap:18,padding:'28px 36px',position:'relative' },
    headerIconBox:{ width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(255,255,255,0.2)' },
    headerTitle:{ margin:0,fontSize:24,fontWeight:800,color:'white',letterSpacing:'-0.3px' },
    headerSub:{ margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,0.75)' },
    refreshBtn:{ marginLeft:'auto',background:'rgba(255,255,255,0.12)',color:'white',border:'1px solid rgba(255,255,255,0.25)',borderRadius:10,padding:'9px 12px',cursor:'pointer',display:'flex',alignItems:'center',backdropFilter:'blur(8px)' },
    errorBanner:{ display:'flex',alignItems:'center',gap:10,padding:'12px 24px',background:'#fef2f2',borderBottom:'1px solid #fecaca',color:'#b91c1c',fontSize:14 },
    errorClose:{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#b91c1c',padding:2 },
    tabsWrapper:{ background:'white',borderBottom:'1px solid #e2e8f0',position:'sticky',top:0,zIndex:10 },
    tabsBar:{ display:'flex',padding:'0 24px',overflowX:'auto',gap:2 },
    tabBtn:{ display:'flex',alignItems:'center',gap:7,padding:'14px 18px',background:'transparent',border:'none',borderBottom:'3px solid transparent',color:'#64748b',cursor:'pointer',fontWeight:600,fontSize:14,whiteSpace:'nowrap',transition:'all 0.2s',borderRadius:'8px 8px 0 0' },
    tabBtnActive:{ borderBottom:'3px solid #8B0000',color:'#8B0000' },
    badge:{ background:'#e2e8f0',color:'#475569',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,marginLeft:2 },
    badgeActive:{ background:'#8B0000',color:'white',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700,marginLeft:2 },
    content:{ padding:'28px 36px',maxWidth:920,margin:'0 auto' },
    noticeCard:{ background:'white',borderRadius:16,padding:'22px 26px',marginBottom:16,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',transition:'border-color 0.2s' },
    noticeTop:{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 },
    noticeTypeLine:{ marginBottom:8 },
    typeChip:{ fontSize:12,fontWeight:700,borderRadius:20,padding:'4px 13px',display:'inline-flex',alignItems:'center',gap:4 },
    noticeTitle:{ margin:0,fontSize:18,color:'#1e293b',fontWeight:700 },
    noticeDate:{ fontSize:13,color:'#94a3b8' },
    noticeDesc:{ color:'#475569',fontSize:14,lineHeight:1.75,margin:'10px 0' },
    noticeDates:{ display:'flex',gap:10,flexWrap:'wrap',marginTop:10 },
    noticeDate2: { fontSize:13,color:'#94a3b8',display:'flex',alignItems:'center',gap:4 },
    noticeDate2Wrap: { display:'flex',alignItems:'center',gap:4 },
    dateChip:{ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:20,fontSize:12,fontWeight:600 },
    noticeTypeLine2: { display:'flex',gap:6,marginBottom:8,flexWrap:'wrap' },
    noticeDate3: {display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#94a3b8',whiteSpace:'nowrap',marginLeft:12,flexShrink:0},
    candidateGrid:{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:18 },
    candidateCard:{ background:'white',borderRadius:18,padding:'28px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.07)',border:'1px solid #f1f5f9',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:5 },
    candidateAvatar:{ marginBottom:10 },
    candidateInitial:{ width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#8B0000,#a00000)',color:'white',fontSize:32,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:'3px solid rgba(128,0,0,0.1)' },
    candidateName:{ margin:0,fontSize:17,color:'#1e293b',fontWeight:700 },
    partyBadge:{ background:'#f8fafc',color:'#475569',borderRadius:20,padding:'5px 16px',fontSize:13,fontWeight:600,border:'1px solid #e2e8f0' },
    candidateMeta:{ color:'#94a3b8',fontSize:12,margin:'4px 0',display:'flex',alignItems:'center',gap:4,justifyContent:'center' },
    manifestoBox:{ color:'#64748b',fontSize:13,fontStyle:'italic',padding:'8px 14px',background:'#f8fafc',borderRadius:10,margin:'6px 0',lineHeight:1.6,borderLeft:'3px solid #e2e8f0' },
    checkWrapper:{ display:'flex',justifyContent:'center' },
    checkCard:{ background:'white',borderRadius:20,padding:'44px 40px',boxShadow:'0 4px 24px rgba(0,0,0,0.1)',maxWidth:540,width:'100%',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',border:'1px solid #f1f5f9' },
    checkIconBg:{ width:76,height:76,borderRadius:'50%',background:'linear-gradient(135deg,#fef9c3,#fef3c7)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,boxShadow:'0 4px 16px rgba(251,197,49,0.3)' },
    checkTitle:{ margin:'0 0 8px',fontSize:22,color:'#1e293b',fontWeight:800 },
    checkSub:{ color:'#64748b',fontSize:14,lineHeight:1.6,margin:'0 0 24px' },
    checkRow:{ display:'flex',gap:10,width:'100%' },
    checkInput:{ flex:1,border:'2px solid #e2e8f0',borderRadius:12,padding:'13px 16px',fontSize:15,color:'#1e293b',outline:'none',transition:'all 0.2s' },
    checkBtn:{ display:'flex',alignItems:'center',gap:7,background:'#8B0000',color:'white',border:'none',borderRadius:12,padding:'13px 22px',fontWeight:700,cursor:'pointer',fontSize:15,flexShrink:0,whiteSpace:'nowrap' },
    resultSuccess:{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:14,padding:20,textAlign:'left',width:'100%' },
    resultSuccessTop:{ display:'flex',alignItems:'center',gap:10,marginBottom:14 },
    resultBox: (bg,c,bc) => ({ display:'flex',gap:12,alignItems:'flex-start',padding:16,background:bg,border:`1px solid ${bc}`,borderRadius:12,textAlign:'left',width:'100%' }),
    voterGrid:{ display:'flex',flexDirection:'column',gap:8 },
    voterRow:{ display:'flex',gap:12,fontSize:14 },
    voterKey:{ color:'#64748b',minWidth:130,flexShrink:0 },
    voterVal:{ color:'#1e293b',fontWeight:600 },
    checkNote:{ display:'flex',gap:8,alignItems:'flex-start',marginTop:20,padding:'12px 16px',background:'#fef9c3',borderRadius:10,fontSize:13,color:'#92400e',textAlign:'left',width:'100%' },
    guideHero:{ textAlign:'center',padding:'36px 20px',background:'white',borderRadius:18,marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
    faqGrid:{ display:'flex',flexDirection:'column',gap:12 },
    faqCard:{ background:'white',borderRadius:14,padding:'18px 22px',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',border:'1px solid #f1f5f9',display:'flex',gap:16,alignItems:'flex-start' },
    faqIconBox:{ fontSize:26,flexShrink:0,marginTop:2 },
    commissionBox:{ marginTop:20,padding:'24px',background:'linear-gradient(135deg,#8B0000,#6b0000)',borderRadius:16,color:'white',textAlign:'center' },
    noticeDate: { display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#94a3b8' },
    noticeDate2: {},
    noticeDate3: {},
    noticeDate2Wrap: {},
    noticeTypeLine2: {},
};

export default ElectionPage;
