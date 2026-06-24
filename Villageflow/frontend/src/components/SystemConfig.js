import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Calendar, FileText, Plus, Trash2, Clock, User, Phone, MapPin, Briefcase, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadSystemConfig, updateSystemConfig } from '../services/configService';

function SystemConfig() {
    const [config, setConfig] = useState(null);
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [newHoliday, setNewHoliday] = useState('');
    const [newService, setNewService] = useState({ name: '', duration: 15 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const data = await loadSystemConfig();
            if (data) {
                setConfig({
                    ...data,
                    general: data.general || {},
                    appointment: data.appointment || {},
                    welfare: data.welfare || {},
                    holidays: data.holidays || [],
                    services: data.services || []
                });
                setError('');
            }
        } catch (err) {
            console.error(err);
            setError('සර්වර් සම්බන්ධතාවය බිඳ වැටී ඇත');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [field]: value }
        }));
    };

    const addHoliday = () => {
        if (!newHoliday) return;
        if (config?.holidays?.includes(newHoliday)) return alert('මෙම දිනය දැනටමත් ඇතුළත් කර ඇත');
        setConfig(prev => ({ ...prev, holidays: [...(prev.holidays || []), newHoliday] }));
        setNewHoliday('');
    };

    const removeHoliday = (date) => {
        setConfig(prev => ({ ...prev, holidays: prev.holidays.filter(h => h !== date) }));
    };

    const addService = () => {
        if (!newService.name) return;
        setConfig(prev => ({ ...prev, services: [...(prev.services || []), newService] }));
        setNewService({ name: '', duration: 15 });
    };

    const removeService = (index) => {
        setConfig(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const result = await updateSystemConfig(config);
            // Backend එකෙන් result.config ලෙස අලුත් දත්ත ලැබෙන නිසා එය state එකට දාන්න
            if (result && result.config) {
                setConfig({
                    ...result.config,
                    general: result.config.general || {},
                    appointment: result.config.appointment || {},
                    welfare: result.config.welfare || {},
                    holidays: result.config.holidays || [],
                    services: result.config.services || []
                });
                setMessage('✅ සැකසුම් සාර්ථකව සුරකින ලදී');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('✅ සාර්ථකව සුරකින ලදී');
                fetchConfig(); // Result එකේ කෙලින්ම config නැත්නම් නැවත refresh කරන්න
            }
        } catch (err) {
            console.error('Save Error:', err);
            setMessage('❌ සැකසුම් සුරැකීම අසාර්ථකයි');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>සැකසුම් පූරණය වෙමින්...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorMsg}>{error}</div>
                <button onClick={fetchConfig} style={styles.resetBtn}>නැවත උත්සාහ කරන්න</button>
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="system-config-page" style={styles.container}>
            <div className="system-config-header" style={styles.header}>
                <div style={styles.titleContainer}>
                    <button onClick={() => navigate('/gn-dashboard')} style={styles.backIcon}>←</button>
                    <div>
                        <h2 style={styles.title}><Settings size={28} /> පද්ධති සැකසුම්</h2>
                        <p style={styles.headerSubtitle}>පද්ධතියේ මූලික පරාමිතීන් සහ කාර්යාල තොරතුරු මෙහිදී පාලනය කළ හැක.</p>
                    </div>
                </div>
                <div className="system-config-actions" style={styles.actions}>
                    <button onClick={fetchConfig} style={styles.resetBtn}><RefreshCw size={16} /> Refresh</button>
                    <button onClick={handleSave} style={styles.saveBtn} disabled={saving}>
                        <Save size={16} /> {saving ? 'සුරකිමින්...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {message && <div style={message.includes('✅') ? styles.successMsg : styles.errorMsg}>{message}</div>}

            <div className="system-config-tabs" style={styles.tabs}>
                <button style={activeTab === 'general' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('general')}>
                    <Briefcase size={18}/> කාර්යාල තොරතුරු
                </button>
                <button style={activeTab === 'appointment' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('appointment')}>
                    <Calendar size={18}/> පත්වීම් & නිවාඩු
                </button>
                <button style={activeTab === 'welfare' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('welfare')}>
                    <ShieldCheck size={18}/> සුභසාධන පාලනය
                </button>
            </div>

            <div className="system-config-content" style={styles.content}>
                {activeTab === 'general' && (
                    <div style={styles.sectionFadeIn}>
                        <h3 style={styles.secTitle}><User size={20} color="#800000" /> මූලික කාර්යාලීය තොරතුරු</h3>
                        <div className="system-config-grid" style={styles.gridForm}>
                            <div style={styles.field}>
                                <label style={styles.label}>ග්‍රාම නිලධාරී නම</label>
                                <div style={styles.inputWrapper}><User size={16} style={styles.inputIcon}/><input type="text" style={styles.input} placeholder="උදා: ඒ.බී. පෙරේරා මිය" value={config.general?.gramaNiladhariName || ''} onChange={(e) => handleInputChange('general', 'gramaNiladhariName', e.target.value)} /></div>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>ග්‍රාම නිලධාරී කොට්ඨාසය</label>
                                <div style={styles.inputWrapper}><MapPin size={16} style={styles.inputIcon}/><input type="text" style={styles.input} placeholder="උදා: 582-සී, හෝමාගම" value={config.general?.gramaNiladhariDivision || ''} onChange={(e) => handleInputChange('general', 'gramaNiladhariDivision', e.target.value)} /></div>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>සම්බන්ධීකරණ අංකය</label>
                                <div style={styles.inputWrapper}><Phone size={16} style={styles.inputIcon}/><input type="text" style={styles.input} placeholder="0112XXXXXX" value={config.general?.contactNumber || ''} onChange={(e) => handleInputChange('general', 'contactNumber', e.target.value)} /></div>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>කාර්යාල වේලාවන්</label>
                                <div style={styles.inputWrapper}><Clock size={16} style={styles.inputIcon}/><input type="text" style={styles.input} placeholder="සතියේ දිනවල පෙ.ව 9.00 - ප.ව 4.00" value={config.general?.officeHours || ''} onChange={(e) => handleInputChange('general', 'officeHours', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appointment' && (
                    <div style={styles.sectionFadeIn}>
                        <h3 style={styles.secTitle}><Calendar size={20} color="#800000" /> පත්වීම් වෙන්කිරීමේ සීමාවන්</h3>
                        <div className="system-config-grid" style={styles.gridForm}>
                            <div style={styles.field}>
                                <label style={styles.label}>දිනකට උපරිම පත්වීම් සංඛ්‍යාව</label>
                                <input type="number" style={styles.input} value={config.appointment?.maxAppointmentsPerDay || 0} onChange={(e) => handleInputChange('appointment', 'maxAppointmentsPerDay', parseInt(e.target.value) || 0)} />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>කලින් වෙන් කළ හැකි දින ගණන (Advance Booking)</label>
                                <input type="number" style={styles.input} value={config.appointment?.advanceBookingDays || 0} onChange={(e) => handleInputChange('appointment', 'advanceBookingDays', parseInt(e.target.value) || 0)} />
                            </div>
                        </div>

                        <h3 style={styles.secTitle}><Clock size={20} color="#800000" /> සේවාවන් සහ ගතවන කාලය</h3>
                        <div className="system-config-add-row" style={styles.addItemRow}>
                            <input type="text" placeholder="සේවාවේ නම" value={newService.name} onChange={(e) => setNewService({...newService, name: e.target.value})} style={{...styles.input, flex: 2}} />
                            <input type="number" placeholder="මිනිත්තු" value={newService.duration} onChange={(e) => setNewService({...newService, duration: e.target.value})} style={{...styles.input, flex: 0.5}} />
                            <button onClick={addService} style={styles.addBtn}><Plus size={16} /> එක් කරන්න</button>
                        </div>
                        <div style={styles.list}>
                            {config.services?.map((s, i) => (
                                <div key={i} style={styles.listItem}>
                                    <span style={styles.listText}><Clock size={14} /> {s.name} <strong style={{marginLeft:'10px', color:'#800000'}}>{s.duration} mins</strong></span>
                                    <Trash2 size={18} onClick={() => removeService(i)} style={styles.deleteIcon} />
                                </div>
                            ))}
                        </div>

                        <h3 style={styles.secTitle}><Calendar size={20} color="#800000" /> විශේෂ නිවාඩු දින</h3>
                        <div className="system-config-add-row" style={styles.addItemRow}>
                            <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} style={{...styles.input, flex: 1}} />
                            <button onClick={addHoliday} style={styles.addBtn}><Plus size={16} /> නිවාඩු දිනයක් එක් කරන්න</button>
                        </div>
                        <div style={styles.chipContainer}>
                            {config.holidays?.map(h => (
                                <span key={h} style={styles.chip}>{h} <Trash2 size={14} onClick={() => removeHoliday(h)} style={{cursor:'pointer', marginLeft:'5px'}} /></span>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'welfare' && (
                    <div style={styles.sectionFadeIn}>
                        <h3 style={styles.secTitle}><FileText size={20} color="#800000" /> සුභසාධන අයදුම්පත් පාලනය</h3>
                        <div className="system-config-grid" style={styles.gridForm}>
                            <div style={styles.field}>
                                <label style={styles.label}>ආදායම් සහතික (Pay Slips) අනිවාර්යද?</label>
                                <select style={styles.select} value={config.welfare?.incomeVerificationRequired ? "true" : "false"} onChange={(e) => handleInputChange('welfare', 'incomeVerificationRequired', e.target.value === 'true')}>
                                    <option value="true">ඔව් (අනිවාර්යයි)</option>
                                    <option value="false">නැත (අත්‍යවශ්‍ය නොවේ)</option>
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>මසකට එක් පුද්ගලයෙකුට උපරිම අයදුම්පත්</label>
                                <input type="number" style={styles.input} value={config.welfare?.maxApplicationsPerMonth || 0} onChange={(e) => handleInputChange('welfare', 'maxApplicationsPerMonth', parseInt(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div style={styles.infoBox}>
                            <p style={styles.infoText}>💡 මෙම සැකසුම් වෙනස් කිරීමෙන් පසු, පරිශීලකයන්ට අදාළ නීති ස්වයංක්‍රීයව ක්‍රියාත්මක වේ.</p>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

// ... styles object remains exactly the same as you provided ...
const styles = {
    container: { padding: '40px', background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', maxWidth: '1100px', margin: '0 auto 35px auto' },
    titleContainer: { display: 'flex', alignItems: 'center', gap: '20px' },
    title: { color: '#1e293b', fontSize: '28px', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' },
    headerSubtitle: { color: '#64748b', fontSize: '14px', margin: '5px 0 0 0' },
    backIcon: { background: 'white', border: '1px solid #e2e8f0', color: '#800000', fontSize: '20px', cursor: 'pointer', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    actions: { display: 'flex', gap: '15px' },
    saveBtn: { padding: '12px 28px', background: 'linear-gradient(135deg, #800000 0%, #a00000 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '600', transition: '0.3s', boxShadow: '0 4px 12px rgba(128,0,0,0.2)' },
    resetBtn: { padding: '12px 24px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', transition: '0.3s' },
    tabs: { display: 'flex', gap: '12px', marginBottom: '25px', maxWidth: '1100px', margin: '0 auto 25px auto' },
    tab: { padding: '14px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', transition: '0.3s', fontWeight: '500', fontSize: '14px' },
    activeTab: { padding: '14px 24px', background: '#800000', border: '1px solid #800000', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '600', boxShadow: '0 4px 10px rgba(128,0,0,0.15)', fontSize: '14px' },
    content: { background: 'white', padding: '40px', borderRadius: '20px', border: '1px solid #e2e8f0', maxWidth: '1100px', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' },
    sectionFadeIn: { animation: 'fadeIn 0.5s ease-out' },
    secTitle: { fontSize: '18px', color: '#334155', marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' },
    gridForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' },
    field: { display: 'flex', flexDirection: 'column', gap: '10px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#475569' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '15px', color: '#94a3b8' },
    input: { width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: '0.2s', color: '#1e293b' },
    select: { padding: '14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', background: 'white', outline: 'none', cursor: 'pointer' },
    addItemRow: { display: 'flex', gap: '15px', marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '15px' },
    addBtn: { background: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', padding: '0 25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: '0.2s' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' },
    listItem: { background: 'white', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.2px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' },
    listText: { display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '15px' },
    deleteIcon: { color: '#ef4444', cursor: 'pointer', transition: '0.2s', opacity: 0.8 },
    chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
    chip: { background: '#fff1f1', color: '#c53030', padding: '8px 16px', borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #feb2b2', fontWeight: '500' },
    successMsg: { padding: '18px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px', marginBottom: '30px', fontWeight: '600', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '1100px', margin: '0 auto 30px auto' },
    errorMsg: { padding: '18px', background: '#fef2f2', color: '#991b1b', borderRadius: '12px', marginBottom: '30px', fontWeight: '600', border: '1px solid #fecaca', maxWidth: '1100px', margin: '0 auto 30px auto' },
    infoBox: { marginTop: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #e0f2fe' },
    infoText: { fontSize: '13px', color: '#0369a1', margin: 0 },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', background: '#f8fafc' },
    spinner: { width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #800000', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loadingText: { color: '#64748b', fontSize: '16px', fontWeight: '500' }
};

export default SystemConfig;