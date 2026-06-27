import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage, translations } from '../services/languageService';
import axios from 'axios';
import { API_BASE as API } from '../config';
import {
    Vote, Plus, Edit2, Trash2, Users, Bell, Search,
    RefreshCw, X, Save, Calendar, AlertCircle, CheckCircle
} from 'lucide-react';

const STYLES_ID = 'em-styles';
const CSS = `
@keyframes fadeInUpEm{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spinEm{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes shimmerEm{0%{background-position:-400px 0}100%{background-position:400px 0}}
.em-card{animation:fadeInUpEm 0.3s ease both}
.em-spin{animation:spinEm 1s linear infinite}
.em-skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmerEm 1.4s infinite;border-radius:8px}
.em-tab:hover{background:rgba(128,0,0,0.05)!important}
.em-tr:hover{background:#fafafa!important}
.em-row-btn:hover{opacity:0.85}
.em-modal-overlay{backdrop-filter:blur(4px)}
.em-candidate-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.12)!important}
`;

const electionTypes = ['Presidential','Parliamentary','Provincial','Local Government','Referendum','Other'];

function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#d97706';
    return (
        <div style={{ position:'fixed',top:24,right:24,zIndex:99999,background:bg,color:'white',padding:'14px 20px',borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:10,fontSize:14,fontWeight:600,maxWidth:360,animation:'fadeInUpEm 0.3s ease' }}>
            {type==='success'?<CheckCircle size={17}/>:type==='error'?<X size={17}/>:<AlertCircle size={17}/>}
            {msg}
            <button style={{ background:'none',border:'none',color:'white',cursor:'pointer',marginLeft:'auto',opacity:0.8 }} onClick={onClose}><X size={14}/></button>
        </div>
    );
}

function ElectionManagement() {
    const [lang] = useLanguage();
    const t = translations[lang] || translations.si;
    const [activeTab, setActiveTab] = useState('overview');
    const [notices, setNotices] = useState([]);
    const [voters, setVoters] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    const [showNoticeForm, setShowNoticeForm] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [showVoterForm, setShowVoterForm] = useState(false);
    const [editingVoter, setEditingVoter] = useState(null);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        notice: { title:'', description:'', electionType:'Local Government', electionDate:'', deadline:'', isActive:true },
        voter: { fullName:'', nic:'', gender:'Male', dateOfBirth:'', address:'', gnDivision: user.gnDivision||'', pollingStation:'', pollingStationAddress:'', registrationStatus:'Active' },
        candidate: { fullName:'', party:'', partyShort:'', gnDivision: user.gnDivision||'', electionType:'Local Government', manifesto:'', contactNumber:'', isActive:true }
    };

    const [noticeForm, setNoticeForm] = useState(blank.notice);
    const [voterForm, setVoterForm] = useState(blank.voter);
    const [candidateForm, setCandidateForm] = useState(blank.candidate);

    const showToast = (msg, type='success') => setToast({ msg, type });

    useEffect(() => {
        if (!document.getElementById(STYLES_ID)) {
            const el = document.createElement('style');
            el.id = STYLES_ID; el.textContent = CSS;
            document.head.appendChild(el);
        }
    }, []);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [nR,vR,cR,sR] = await Promise.all([
                axios.get(`${API}/election/notices/all`, { headers }),
                axios.get(`${API}/election/voters`, { headers }),
                axios.get(`${API}/election/candidates/all`, { headers }),
                axios.get(`${API}/election/stats`, { headers })
            ]);
            setNotices(nR.data.data||[]);
            setVoters(vR.data.data||[]);
            setCandidates(cR.data.data||[]);
            setStats(sR.data.data||{});
        } catch(err) {
            showToast('Failed to load data. Make sure backend is running with new election routes.', 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    //  NOTICE CRUD 
    const saveNotice = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingNotice) {
                await axios.put(`${API}/election/notices/${editingNotice}`, noticeForm, { headers });
                showToast('Notice updated successfully');
            } else {
                await axios.post(`${API}/election/notices`, noticeForm, { headers });
                showToast('Election notice posted');
            }
            setShowNoticeForm(false); setEditingNotice(null); setNoticeForm(blank.notice); fetchAll();
        } catch(err) { showToast(err.response?.data?.message || 'Error saving notice', 'error'); }
        setSaving(false);
    };
    const deleteNotice = async (id) => {
        if (!window.confirm('Delete this notice?')) return;
        try { await axios.delete(`${API}/election/notices/${id}`, { headers }); fetchAll(); showToast('Notice deleted'); }
        catch { showToast('Delete failed', 'error'); }
    };

    //  VOTER CRUD 
    const saveVoter = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingVoter) {
                await axios.put(`${API}/election/voters/${editingVoter}`, voterForm, { headers });
                showToast('Voter record updated');
            } else {
                await axios.post(`${API}/election/voters`, voterForm, { headers });
                showToast('Voter added to electoral roll');
            }
            setShowVoterForm(false); setEditingVoter(null); setVoterForm(blank.voter); fetchAll();
        } catch(err) { showToast(err.response?.data?.message || 'Error saving voter', 'error'); }
        setSaving(false);
    };
    const deleteVoter = async (id) => {
        if (!window.confirm('Remove this voter from the electoral roll?')) return;
        try { await axios.delete(`${API}/election/voters/${id}`, { headers }); fetchAll(); showToast('Voter removed'); }
        catch { showToast('Delete failed', 'error'); }
    };

    //  CANDIDATE CRUD 
    const saveCandidate = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingCandidate) {
                await axios.put(`${API}/election/candidates/${editingCandidate}`, candidateForm, { headers });
                showToast('Candidate updated');
            } else {
                await axios.post(`${API}/election/candidates`, candidateForm, { headers });
                showToast('Candidate registered');
            }
            setShowCandidateForm(false); setEditingCandidate(null); setCandidateForm(blank.candidate); fetchAll();
        } catch(err) { showToast(err.response?.data?.message || 'Error saving candidate', 'error'); }
        setSaving(false);
    };
    const deleteCandidate = async (id) => {
        if (!window.confirm('Remove this candidate?')) return;
        try { await axios.delete(`${API}/election/candidates/${id}`, { headers }); fetchAll(); showToast('Candidate removed'); }
        catch { showToast('Delete failed', 'error'); }
    };

    const filteredVoters = voters.filter(v =>
        v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.nic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statCards = [
        { label:'Total Voters', value: stats.totalVoters||0, emoji:'🗳️', color:'#8B0000', bg:'#fef2f2' },
        { label:'Active Voters', value: stats.activeVoters||0, emoji:'✅', color:'#16a34a', bg:'#f0fdf4' },
        { label:'Candidates', value: stats.totalCandidates||0, emoji:'👤', color:'#2563eb', bg:'#eff6ff' },
        { label:'Active Notices', value: stats.totalNotices||0, emoji:'📢', color:'#d97706', bg:'#fefce8' }
    ];

    const tabs = [
        { id:'overview', label:`📊 ${t.election.overview}` },
        { id:'voters', label:`🗳️ ${t.election.voterRegistry} (${voters.length})` },
        { id:'candidates', label:`👤 Candidates (${candidates.length})` },
        { id:'notices', label:`📢 ${t.election.announcements} (${notices.length})` }
    ];

    return (
        <div style={S.page}>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div style={S.header}>
                <div style={S.headerGlow}/>
                <div style={S.headerInner}>
                    <div style={S.headerIconBox}><Vote size={28} color="white"/></div>
                    <div>
                        <h1 style={S.headerTitle}>{t.election.officerTitle}</h1>
                        <p style={S.headerSub}>Electoral roll · Candidates · Election notices</p>
                    </div>
                    <button style={S.refreshBtn} onClick={fetchAll} title="Refresh">
                        <RefreshCw size={15} className={loading ? 'em-spin':''} />
                    </button>
                </div>
            </div>

            <div style={S.tabsWrapper}>
                <div style={S.tabsBar}>
                    {tabs.map(t => (
                        <button key={t.id} className="em-tab"
                            style={{ ...S.tabBtn, ...(activeTab===t.id ? S.tabBtnActive : {}) }}
                            onClick={() => setActiveTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={S.content}>

                {/*  OVERVIEW  */}
                {activeTab === 'overview' && (
                    <div>
                        <div style={S.statsGrid}>
                            {statCards.map((s,i) => (
                                <div key={i} className="em-card" style={{ ...S.statCard, background:s.bg, borderTop:`4px solid ${s.color}`, animationDelay:`${i*60}ms` }}>
                                    <div style={{ fontSize:30, marginBottom:6 }}>{s.emoji}</div>
                                    <div style={{ fontSize:30,fontWeight:800,color:s.color }}>{s.value}</div>
                                    <div style={{ fontSize:13,color:'#64748b',marginTop:3,fontWeight:500 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={S.overviewGrid}>
                            <Section title="📢 Recent Notices" action={{ label:'+ Add', onClick:() => { setNoticeForm(blank.notice); setEditingNotice(null); setShowNoticeForm(true); } }}>
                                {notices.slice(0,5).map(n => (
                                    <div key={n._id} style={S.listRow}>
                                        <div>
                                            <strong style={{ color:'#1e293b',fontSize:14 }}>{n.title}</strong>
                                            <p style={{ color:'#94a3b8',fontSize:12,margin:'2px 0 0' }}>{n.electionType}</p>
                                        </div>
                                        <StatusChip active={n.isActive} />
                                    </div>
                                ))}
                                {!notices.length && <EmptyRow text="No notices posted yet"/>}
                            </Section>
                            <Section title="🗳️ Recent Voters" action={{ label:'+ Add', onClick:() => { setVoterForm(blank.voter); setEditingVoter(null); setShowVoterForm(true); } }}>
                                {voters.slice(0,5).map(v => (
                                    <div key={v._id} style={S.listRow}>
                                        <div>
                                            <strong style={{ color:'#1e293b',fontSize:14 }}>{v.fullName}</strong>
                                            <p style={{ color:'#94a3b8',fontSize:12,margin:'2px 0 0' }}>NIC: {v.nic}</p>
                                        </div>
                                        <span style={{ ...S.statusTag, background: v.registrationStatus==='Active'?'#f0fdf4':'#fefce8', color: v.registrationStatus==='Active'?'#166534':'#d97706' }}>{v.registrationStatus}</span>
                                    </div>
                                ))}
                                {!voters.length && <EmptyRow text="No voters in roll yet"/>}
                            </Section>
                        </div>
                    </div>
                )}

                {/* ── ELECTORAL ROLL ── */}
                {activeTab === 'voters' && (
                    <div>
                        <div style={S.topBar}>
                            <div style={S.searchBox}>
                                <Search size={15} color="#94a3b8"/>
                                <input style={S.searchInput} placeholder="Search by name or NIC..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <button style={S.addBtn} onClick={() => { setVoterForm(blank.voter); setEditingVoter(null); setShowVoterForm(true); }}>
                                <Plus size={15}/> Add Voter
                            </button>
                        </div>
                        <div style={S.tableCard} className="em-card">
                            <table style={{ width:'100%',borderCollapse:'collapse' }}>
                                <thead>
                                    <tr style={{ background:'#f8fafc' }}>
                                        {['#','Full Name','NIC','Gender','GN Division','Polling Station','Status','Actions'].map(h => (
                                            <th key={h} style={S.th}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVoters.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign:'center',padding:32,color:'#94a3b8' }}>No voters found</td></tr>
                                    ) : filteredVoters.map((v,i) => (
                                        <tr key={v._id} className="em-tr" style={{ borderTop:'1px solid #f1f5f9' }}>
                                            <td style={S.td}><span style={{ color:'#94a3b8',fontSize:12 }}>{i+1}</span></td>
                                            <td style={S.td}><strong style={{ color:'#1e293b' }}>{v.fullName}</strong></td>
                                            <td style={{ ...S.td, fontFamily:'monospace',fontSize:13 }}>{v.nic}</td>
                                            <td style={S.td}>{v.gender}</td>
                                            <td style={S.td}>{v.gnDivision}</td>
                                            <td style={S.td}>{v.pollingStation||<span style={{ color:'#cbd5e1' }}>—</span>}</td>
                                            <td style={S.td}>
                                                <span style={{ ...S.statusTag, background: v.registrationStatus==='Active'?'#f0fdf4':'#fefce8', color: v.registrationStatus==='Active'?'#166534':'#d97706' }}>
                                                    {v.registrationStatus}
                                                </span>
                                            </td>
                                            <td style={S.td}>
                                                <div style={{ display:'flex',gap:6 }}>
                                                    <IconBtn onClick={() => { setVoterForm(v); setEditingVoter(v._id); setShowVoterForm(true); }} icon={<Edit2 size={13}/>} />
                                                    <IconBtn onClick={() => deleteVoter(v._id)} icon={<Trash2 size={13}/>} danger />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ padding:'12px 16px',borderTop:'1px solid #f1f5f9',fontSize:13,color:'#94a3b8' }}>
                                {filteredVoters.length} voter(s) found
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CANDIDATES ── */}
                {activeTab === 'candidates' && (
                    <div>
                        <button style={S.addBtn} onClick={() => { setCandidateForm(blank.candidate); setEditingCandidate(null); setShowCandidateForm(true); }}>
                            <Plus size={15}/> Register Candidate
                        </button>
                        {candidates.length === 0 ? (
                            <div style={S.emptyBox} className="em-card">
                                <span style={{ fontSize:44, opacity:0.4 }}>👤</span>
                                <p style={{ color:'#94a3b8' }}>No candidates registered yet</p>
                            </div>
                        ) : (
                            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18,marginTop:16 }}>
                                {candidates.map((c,i) => (
                                    <div key={c._id} className="em-card em-candidate-card" style={{ ...S.candidateCard, animationDelay:`${i*60}ms`,transition:'all 0.25s ease' }}>
                                        <div style={S.candidateAvatar}>{c.fullName.charAt(0)}</div>
                                        <strong style={{ color:'#1e293b',fontSize:15 }}>{c.fullName}</strong>
                                        <p style={{ color:'#64748b',fontSize:13,margin:'3px 0' }}>{c.party}{c.partyShort?` (${c.partyShort})`:''}</p>
                                        <span style={{ ...S.typeTag }}>{c.electionType}</span>
                                        <p style={{ color:'#94a3b8',fontSize:12,margin:'4px 0' }}>📍 {c.gnDivision}</p>
                                        {c.manifesto && <p style={{ color:'#64748b',fontSize:12,fontStyle:'italic',margin:'6px 0',lineHeight:1.5 }}>"{c.manifesto}"</p>}
                                        <StatusChip active={c.isActive} label={c.isActive?'Active':'Inactive'} />
                                        <div style={{ display:'flex',gap:8,marginTop:10 }}>
                                            <button style={S.editSmBtn} onClick={() => { setCandidateForm(c); setEditingCandidate(c._id); setShowCandidateForm(true); }}><Edit2 size={12}/> Edit</button>
                                            <button style={{ ...S.editSmBtn,background:'#fee2e2',color:'#dc2626' }} onClick={() => deleteCandidate(c._id)}><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── NOTICES ── */}
                {activeTab === 'notices' && (
                    <div>
                        <button style={S.addBtn} onClick={() => { setNoticeForm(blank.notice); setEditingNotice(null); setShowNoticeForm(true); }}>
                            <Plus size={15}/> Post Election Notice
                        </button>
                        {notices.length === 0 ? (
                            <div style={S.emptyBox} className="em-card"><span style={{ fontSize:44,opacity:0.4 }}>📢</span><p style={{ color:'#94a3b8' }}>No election notices posted yet</p></div>
                        ) : notices.map((n,i) => (
                            <div key={n._id} className="em-card" style={{ ...S.noticeCard, animationDelay:`${i*50}ms` }}>
                                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                                    <div>
                                        <strong style={{ fontSize:16,color:'#1e293b' }}>{n.title}</strong>
                                        <div style={{ display:'flex',gap:8,marginTop:8,flexWrap:'wrap' }}>
                                            <span style={S.typeTag}>{n.electionType}</span>
                                            <StatusChip active={n.isActive} />
                                        </div>
                                    </div>
                                    <div style={{ display:'flex',gap:6 }}>
                                        <IconBtn onClick={() => { setNoticeForm(n); setEditingNotice(n._id); setShowNoticeForm(true); }} icon={<Edit2 size={14}/>} />
                                        <IconBtn onClick={() => deleteNotice(n._id)} icon={<Trash2 size={14}/>} danger />
                                    </div>
                                </div>
                                <p style={{ color:'#475569',fontSize:14,lineHeight:1.7,margin:'12px 0 10px' }}>{n.description}</p>
                                <div style={{ display:'flex',gap:16,fontSize:12,color:'#94a3b8',flexWrap:'wrap' }}>
                                    {n.electionDate && <span>📅 Election: {new Date(n.electionDate).toLocaleDateString('en-LK')}</span>}
                                    {n.deadline && <span>⏰ Deadline: {new Date(n.deadline).toLocaleDateString('en-LK')}</span>}
                                    <span>🕐 Posted: {new Date(n.createdAt).toLocaleDateString('en-LK')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── NOTICE MODAL ── */}
            <Modal show={showNoticeForm} onClose={() => setShowNoticeForm(false)} title={editingNotice ? 'Edit Notice' : 'Post Election Notice'}>
                <form onSubmit={saveNotice}>
                    <FG label="Notice Title *"><input style={S.input} value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm,title:e.target.value})} required /></FG>
                    <div style={S.formRow}>
                        <FG label="Election Type"><select style={S.input} value={noticeForm.electionType} onChange={e => setNoticeForm({...noticeForm,electionType:e.target.value})}>{electionTypes.map(t=><option key={t}>{t}</option>)}</select></FG>
                        <FG label="Status"><select style={S.input} value={String(noticeForm.isActive)} onChange={e => setNoticeForm({...noticeForm,isActive:e.target.value==='true'})}><option value="true">Active</option><option value="false">Inactive</option></select></FG>
                    </div>
                    <div style={S.formRow}>
                        <FG label="Election Date"><input type="date" style={S.input} value={noticeForm.electionDate?noticeForm.electionDate.split('T')[0]:''} onChange={e => setNoticeForm({...noticeForm,electionDate:e.target.value})}/></FG>
                        <FG label="Registration Deadline"><input type="date" style={S.input} value={noticeForm.deadline?noticeForm.deadline.split('T')[0]:''} onChange={e => setNoticeForm({...noticeForm,deadline:e.target.value})}/></FG>
                    </div>
                    <FG label="Description *"><textarea rows={4} style={{ ...S.input,resize:'vertical' }} value={noticeForm.description} onChange={e => setNoticeForm({...noticeForm,description:e.target.value})} required /></FG>
                    <ModalActions saving={saving} onCancel={() => setShowNoticeForm(false)} label={editingNotice?'Update Notice':'Post Notice'} />
                </form>
            </Modal>

            {/* ── VOTER MODAL ── */}
            <Modal show={showVoterForm} onClose={() => setShowVoterForm(false)} title={editingVoter ? 'Edit Voter' : 'Add to Electoral Roll'}>
                <form onSubmit={saveVoter}>
                    <div style={S.formRow}>
                        <FG label="Full Name *"><input style={S.input} value={voterForm.fullName} onChange={e => setVoterForm({...voterForm,fullName:e.target.value})} required /></FG>
                        <FG label="NIC *"><input style={S.input} value={voterForm.nic} onChange={e => setVoterForm({...voterForm,nic:e.target.value})} required /></FG>
                    </div>
                    <div style={S.formRow}>
                        <FG label="Gender"><select style={S.input} value={voterForm.gender} onChange={e => setVoterForm({...voterForm,gender:e.target.value})}>{['Male','Female','Other'].map(g=><option key={g}>{g}</option>)}</select></FG>
                        <FG label="Date of Birth"><input type="date" style={S.input} value={voterForm.dateOfBirth?voterForm.dateOfBirth.split('T')[0]:''} onChange={e => setVoterForm({...voterForm,dateOfBirth:e.target.value})}/></FG>
                    </div>
                    <FG label="Address *"><input style={S.input} value={voterForm.address} onChange={e => setVoterForm({...voterForm,address:e.target.value})} required /></FG>
                    <div style={S.formRow}>
                        <FG label="GN Division *"><input style={S.input} value={voterForm.gnDivision} onChange={e => setVoterForm({...voterForm,gnDivision:e.target.value})} required /></FG>
                        <FG label="Status"><select style={S.input} value={voterForm.registrationStatus} onChange={e => setVoterForm({...voterForm,registrationStatus:e.target.value})}>{['Active','Pending','Inactive'].map(s=><option key={s}>{s}</option>)}</select></FG>
                    </div>
                    <div style={S.formRow}>
                        <FG label="Polling Station"><input style={S.input} value={voterForm.pollingStation} onChange={e => setVoterForm({...voterForm,pollingStation:e.target.value})} placeholder="e.g. Polgolla Primary School"/></FG>
                    </div>
                    <FG label="Polling Station Address"><input style={S.input} value={voterForm.pollingStationAddress} onChange={e => setVoterForm({...voterForm,pollingStationAddress:e.target.value})} /></FG>
                    <ModalActions saving={saving} onCancel={() => setShowVoterForm(false)} label={editingVoter?'Update Voter':'Add to Roll'} />
                </form>
            </Modal>

            {/* ── CANDIDATE MODAL ── */}
            <Modal show={showCandidateForm} onClose={() => setShowCandidateForm(false)} title={editingCandidate ? 'Edit Candidate' : 'Register Candidate'}>
                <form onSubmit={saveCandidate}>
                    <FG label="Full Name *"><input style={S.input} value={candidateForm.fullName} onChange={e => setCandidateForm({...candidateForm,fullName:e.target.value})} required /></FG>
                    <div style={S.formRow}>
                        <FG label="Party Name *"><input style={S.input} value={candidateForm.party} onChange={e => setCandidateForm({...candidateForm,party:e.target.value})} required /></FG>
                        <FG label="Short (e.g. SLPP)"><input style={S.input} value={candidateForm.partyShort} onChange={e => setCandidateForm({...candidateForm,partyShort:e.target.value})} /></FG>
                    </div>
                    <div style={S.formRow}>
                        <FG label="Election Type *"><select style={S.input} value={candidateForm.electionType} onChange={e => setCandidateForm({...candidateForm,electionType:e.target.value})}>{electionTypes.map(t=><option key={t}>{t}</option>)}</select></FG>
                        <FG label="GN Division *"><input style={S.input} value={candidateForm.gnDivision} onChange={e => setCandidateForm({...candidateForm,gnDivision:e.target.value})} required /></FG>
                    </div>
                    <FG label="Contact Number"><input style={S.input} value={candidateForm.contactNumber} onChange={e => setCandidateForm({...candidateForm,contactNumber:e.target.value})} /></FG>
                    <FG label="Manifesto / Key Points"><textarea rows={3} style={{ ...S.input,resize:'vertical' }} value={candidateForm.manifesto} onChange={e => setCandidateForm({...candidateForm,manifesto:e.target.value})} placeholder="Brief campaign points..." /></FG>
                    <FG label="Status"><select style={S.input} value={String(candidateForm.isActive)} onChange={e => setCandidateForm({...candidateForm,isActive:e.target.value==='true'})}><option value="true">Active</option><option value="false">Inactive</option></select></FG>
                    <ModalActions saving={saving} onCancel={() => setShowCandidateForm(false)} label={editingCandidate?'Update':'Register Candidate'} />
                </form>
            </Modal>
        </div>
    );
}

//  Reusable sub-components 
function Modal({ show, onClose, title, children }) {
    if (!show) return null;
    return (
        <div className="em-modal-overlay" style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20 }}>
            <div style={{ background:'white',borderRadius:20,width:'100%',maxWidth:560,boxShadow:'0 24px 64px rgba(0,0,0,0.25)',maxHeight:'90vh',overflowY:'auto',animation:'fadeInUpEm 0.25s ease' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1px solid #f1f5f9' }}>
                    <h2 style={{ margin:0,fontSize:18,color:'#1e293b',fontWeight:700 }}>{title}</h2>
                    <button style={{ background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:4 }} onClick={onClose}><X size={20}/></button>
                </div>
                <div style={{ padding:'20px 24px 24px' }}>{children}</div>
            </div>
        </div>
    );
}
function FG({ label, children }) {
    return <div style={{ display:'flex',flexDirection:'column',marginBottom:14,flex:1 }}><label style={{ fontSize:12,fontWeight:600,color:'#64748b',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px' }}>{label}</label>{children}</div>;
}
function ModalActions({ saving, onCancel, label }) {
    return (
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:6 }}>
            <button type="button" onClick={onCancel} style={{ padding:'10px 20px',borderRadius:10,border:'1px solid #e2e8f0',background:'white',color:'#64748b',cursor:'pointer',fontWeight:600,fontSize:14 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'10px 24px',borderRadius:10,border:'none',background:'#8B0000',color:'white',cursor:'pointer',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:8,opacity:saving?0.7:1 }}>
                <Save size={15}/> {saving ? 'Saving...' : label}
            </button>
        </div>
    );
}
function IconBtn({ onClick, icon, danger }) {
    return <button className="em-row-btn" onClick={onClick} style={{ background: danger?'#fee2e2':'#f1f5f9',border:'none',borderRadius:7,padding:'6px',cursor:'pointer',color: danger?'#dc2626':'#475569',display:'flex',alignItems:'center' }}>{icon}</button>;
}
function StatusChip({ active, label }) {
    return <span style={{ fontSize:11,fontWeight:700,borderRadius:20,padding:'3px 10px',background: active?'#f0fdf4':'#f1f5f9',color: active?'#166534':'#64748b' }}>{label ?? (active?'Active':'Inactive')}</span>;
}
function Section({ title, action, children }) {
    return (
        <div style={{ background:'white',borderRadius:14,padding:20,boxShadow:'0 2px 10px rgba(0,0,0,0.05)',border:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
                <h3 style={{ margin:0,fontSize:15,color:'#1e293b',fontWeight:700 }}>{title}</h3>
                {action && <button onClick={action.onClick} style={{ background:'#8B0000',color:'white',border:'none',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:600,cursor:'pointer' }}>{action.label}</button>}
            </div>
            {children}
        </div>
    );
}
function EmptyRow({ text }) {
    return <p style={{ textAlign:'center',color:'#94a3b8',padding:'16px 0',margin:0,fontSize:14 }}>{text}</p>;
}

const S = {
    page:{ minHeight:'100vh',background:'#f4f7f6',paddingBottom:48,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
    header:{ background:'linear-gradient(135deg,#8B0000 0%,#6b0000 50%,#500000 100%)',position:'relative',overflow:'hidden' },
    headerGlow:{ position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(251,197,49,0.1)',pointerEvents:'none' },
    headerInner:{ display:'flex',alignItems:'center',gap:18,padding:'26px 36px',position:'relative' },
    headerIconBox:{ width:54,height:54,borderRadius:'50%',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(255,255,255,0.2)' },
    headerTitle:{ margin:0,fontSize:22,fontWeight:800,color:'white',letterSpacing:'-0.3px' },
    headerSub:{ margin:'3px 0 0',fontSize:13,color:'rgba(255,255,255,0.75)' },
    refreshBtn:{ marginLeft:'auto',background:'rgba(255,255,255,0.12)',color:'white',border:'1px solid rgba(255,255,255,0.25)',borderRadius:10,padding:'9px 12px',cursor:'pointer',display:'flex',alignItems:'center' },
    tabsWrapper:{ background:'white',borderBottom:'1px solid #e2e8f0',position:'sticky',top:0,zIndex:10 },
    tabsBar:{ display:'flex',padding:'0 28px',overflowX:'auto',gap:2 },
    tabBtn:{ padding:'13px 18px',background:'transparent',border:'none',borderBottom:'3px solid transparent',color:'#64748b',cursor:'pointer',fontWeight:600,fontSize:14,whiteSpace:'nowrap',transition:'all 0.2s',borderRadius:'8px 8px 0 0' },
    tabBtnActive:{ borderBottom:'3px solid #8B0000',color:'#8B0000' },
    content:{ padding:'28px 36px',maxWidth:1000,margin:'0 auto' },
    statsGrid:{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:24 },
    statCard:{ borderRadius:14,padding:'20px 16px',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',border:'1px solid rgba(0,0,0,0.04)' },
    overviewGrid:{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 },
    listRow:{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:'1px solid #f8fafc' },
    statusTag:{ fontSize:11,fontWeight:700,borderRadius:20,padding:'3px 10px' },
    typeTag:{ fontSize:11,fontWeight:700,borderRadius:20,padding:'3px 10px',background:'#dbeafe',color:'#1e40af' },
    topBar:{ display:'flex',gap:12,marginBottom:18,alignItems:'center',flexWrap:'wrap' },
    searchBox:{ display:'flex',alignItems:'center',gap:10,background:'white',borderRadius:10,padding:'9px 14px',border:'1px solid #e2e8f0',flex:1,minWidth:180 },
    searchInput:{ border:'none',outline:'none',fontSize:14,color:'#1e293b',width:'100%',background:'transparent' },
    addBtn:{ display:'flex',alignItems:'center',gap:7,background:'#8B0000',color:'white',border:'none',borderRadius:10,padding:'10px 20px',fontWeight:700,cursor:'pointer',fontSize:14,whiteSpace:'nowrap' },
    tableCard:{ background:'white',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',overflowX:'auto' },
    th:{ padding:'12px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#64748b',whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'0.5px' },
    td:{ padding:'12px 14px',fontSize:13,color:'#1e293b',verticalAlign:'middle' },
    candidateCard:{ background:'white',borderRadius:16,padding:'24px 18px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:5,border:'1px solid #f1f5f9' },
    candidateAvatar:{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#8B0000,#a00000)',color:'white',fontSize:24,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8 },
    editSmBtn:{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',background:'#f1f5f9',color:'#475569',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600 },
    noticeCard:{ background:'white',borderRadius:14,padding:'20px 22px',marginBottom:14,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9' },
    emptyBox:{ textAlign:'center',padding:'50px 20px',background:'white',borderRadius:16,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginTop:20 },
    formRow:{ display:'flex',gap:14 },
    input:{ border:'1.5px solid #e2e8f0',borderRadius:10,padding:'10px 14px',fontSize:14,color:'#1e293b',outline:'none',width:'100%',transition:'border-color 0.2s' },
};

export default ElectionManagement;
