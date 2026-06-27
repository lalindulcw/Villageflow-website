import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import * as Lucide from 'lucide-react';

function NoticePage() {
    const [notices, setNotices] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ 
        title: '', 
        desc_si: '', 
        desc_ta: '', 
        desc_en: '', 
        category: 'General' 
    });
    
    const user = JSON.parse(localStorage.getItem('user'));
    const isOfficer = user?.role === 'officer';

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`${API_BASE}/notices/all`);
            setNotices(res.data);
        } catch (err) {
            console.error("දත්ත ලබාගැනීම අසාර්ථකයි");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`${API_BASE}/notices/update/${isEditing}`, formData);
                alert("නිවේදනය යාවත්කාලීන කළා!");
            } else {
                await axios.post(`${API_BASE}/notices/add`, formData);
                alert("නව නිවේදනය පළ කළා!");
            }
            resetForm();
            fetchNotices();
        } catch (err) {
            alert("ක්‍රියාවලිය අසාර්ථකයි");
        }
    };

    const handleEdit = (notice) => {
        setFormData({
            title: notice.title,
            desc_si: notice.desc_si || notice.description,
            desc_ta: notice.desc_ta || '',
            desc_en: notice.desc_en || '',
            category: notice.category
        });
        setIsEditing(notice._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ title: '', desc_si: '', desc_ta: '', desc_en: '', category: 'General' });
        setIsEditing(null);
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("මෙම නිවේදනය මකා දැමීමට අවශ්‍යද?")) {
            await axios.delete(`${API_BASE}/notices/delete/${id}`);
            fetchNotices();
        }
    };

    return (
        <div className="notice-page" style={styles.container}>
            {/* Header Section */}
            <div className="header-bar" style={styles.headerBar}>
                <div>
                    <h2 className="title" style={styles.title}>
                        <Lucide.Megaphone color="#8B0000" size={32} /> 
                        <span style={{marginLeft: '10px'}}>නිවේදන පුවරුව | Notice Board</span>
                    </h2>
                </div>
                {isOfficer && (
                    <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="add-notice-btn" style={styles.addBtn}>
                        {showForm ? <Lucide.X size={18}/> : <Lucide.PlusCircle size={18}/>}
                        {showForm ? " වසන්න" : " නව නිවේදනයක්"}
                    </button>
                )}
            </div>

            {/* Form Section */}
            {isOfficer && showForm && (
                <div className="notice-form" style={styles.formCard}>
                    <h3 className="form-title" style={styles.formTitle}>
                        {isEditing ? "නිවේදනය සංස්කරණය කරන්න" : "නව නිවේදනයක් ඇතුළත් කරන්න"}
                    </h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div className="input-group" style={styles.inputGroup}>
                            <input className="input" placeholder="මාතෘකාව (Title)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.input} required />
                            <select className="select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={styles.select}>
                                <option value="General">General</option>
                                <option value="Welfare">Welfare</option>
                                <option value="Meeting">Meeting</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                    
                        <textarea className="textarea" placeholder="සිංහල විස්තරය" value={formData.desc_si} onChange={e => setFormData({...formData, desc_si: e.target.value})} style={styles.textarea} required />
                        <textarea className="textarea" placeholder="தமிழ் விளக்கம்" value={formData.desc_ta} onChange={e => setFormData({...formData, desc_ta: e.target.value})} style={styles.textarea} />
                        <textarea className="textarea" placeholder="English Description" value={formData.desc_en} onChange={e => setFormData({...formData, desc_en: e.target.value})} style={styles.textarea} />
                        
                        <div className="button-group" style={styles.buttonGroup}>
                            <button type="button" onClick={resetForm} className="cancel-btn" style={styles.cancelBtn}>අවලංගු කරන්න</button>
                            <button type="submit" className="submit-btn" style={styles.submitBtn}>
                                {isEditing ? "යාවත්කාලීන කරන්න" : "පළ කරන්න"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid Section */}
            <div className="notices-grid" style={styles.grid}>
                {notices.map(notice => (
                    <div key={notice._id} className="notice-card" style={{
                        ...styles.noticeCard, 
                        borderTopWidth: '5px',
                        borderTopStyle: 'solid',
                        borderTopColor: notice.category === 'Emergency' ? '#ef4444' : '#8B0000'
                    }}>
                        <div style={styles.cardHeader}>
                            <span style={{
                                ...styles.categoryBadge,
                                backgroundColor: notice.category === 'Emergency' ? '#fee2e2' : '#f3f4f6',
                                color: notice.category === 'Emergency' ? '#b91c1c' : '#4b5563'
                            }}>
                                <Lucide.Tag size={12} style={{marginRight: '4px'}} /> {notice.category}
                            </span>
                            {isOfficer && (
                                <div style={styles.actionButtons}>
                                    <button onClick={() => handleEdit(notice)} className="edit-btn" style={styles.editBtn} title="සංස්කරණය"><Lucide.Edit3 size={18} /></button>
                                    <button onClick={() => handleDelete(notice._id)} className="delete-btn" style={styles.deleteBtn} title="මකා දමන්න"><Lucide.Trash2 size={18} /></button>
                                </div>
                            )}
                        </div>
                        
                        <h3 className="notice-heading" style={styles.noticeHeading}>{notice.title}</h3>
                        
                        <div className="lang-section" style={styles.langSection}>
                            <div className="lang-item" style={styles.langItem}>
                                <span className="lang-label" style={styles.langLabel}>සිංහල</span>
                                <p className="desc" style={styles.desc}>{notice.desc_si || notice.description}</p>
                            </div>
                            {notice.desc_ta && (
                                <div className="lang-item" style={styles.langItem}>
                                    <span className="lang-label" style={styles.langLabel}>தமிழ்</span>
                                    <p className="desc" style={styles.desc}>{notice.desc_ta}</p>
                                </div>
                            )}
                            {notice.desc_en && (
                                <div className="lang-item" style={styles.langItem}>
                                    <span className="lang-label" style={styles.langLabel}>English</span>
                                    <p className="desc" style={styles.desc}>{notice.desc_en}</p>
                                </div>
                            )}
                        </div>

                        <div className="card-footer" style={styles.cardFooter}>
                            <span className="date" style={styles.date}><Lucide.Calendar size={14}/> {new Date(notice.postedDate).toLocaleDateString()}</span>
                            <span className="date" style={styles.date}><Lucide.Clock size={14}/> {new Date(notice.postedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Mobile Responsive CSS */}
            <style>
                {`
                    /* Mobile Responsive Styles */
                    @media (max-width: 768px) {
                        .notice-page .container {
                            padding: 20px 15px !important;
                        }
                        .notice-page .header-bar {
                            flex-direction: column !important;
                            gap: 15px !important;
                            text-align: center !important;
                            margin-bottom: 25px !important;
                        }
                        .notice-page .title {
                            font-size: 20px !important;
                            justify-content: center !important;
                        }
                        .notice-page .title svg {
                            width: 28px !important;
                            height: 28px !important;
                        }
                        .notice-page .add-notice-btn {
                            padding: 10px 16px !important;
                            font-size: 13px !important;
                            width: 100% !important;
                            justify-content: center !important;
                        }
                        .notice-page .notice-form {
                            padding: 20px !important;
                            margin-bottom: 25px !important;
                        }
                        .notice-page .form-title {
                            font-size: 18px !important;
                            margin-bottom: 15px !important;
                        }
                        .notice-page .input-group {
                            flex-direction: column !important;
                            gap: 10px !important;
                        }
                        .notice-page .input, .notice-page .select {
                            width: 100% !important;
                            padding: 10px !important;
                            font-size: 14px !important;
                        }
                        .notice-page .textarea {
                            padding: 10px !important;
                            font-size: 13px !important;
                            min-height: 60px !important;
                        }
                        .notice-page .button-group {
                            flex-direction: column !important;
                            gap: 10px !important;
                        }
                        .notice-page .submit-btn, .notice-page .cancel-btn {
                            width: 100% !important;
                            padding: 10px !important;
                            font-size: 14px !important;
                        }
                        .notice-page .notices-grid {
                            grid-template-columns: 1fr !important;
                            gap: 20px !important;
                        }
                        .notice-page .notice-card {
                            padding: 18px !important;
                        }
                        .notice-page .notice-heading {
                            font-size: 18px !important;
                            margin-bottom: 15px !important;
                        }
                        .notice-page .lang-section {
                            gap: 12px !important;
                        }
                        .notice-page .lang-item {
                            padding-left: 10px !important;
                        }
                        .notice-page .lang-label {
                            font-size: 10px !important;
                        }
                        .notice-page .desc {
                            font-size: 13px !important;
                        }
                        .notice-page .card-footer {
                            flex-wrap: wrap !important;
                            gap: 10px !important;
                        }
                        .notice-page .date {
                            font-size: 11px !important;
                        }
                        .notice-page .action-buttons {
                            gap: 6px !important;
                        }
                        .notice-page .edit-btn, .notice-page .delete-btn {
                            padding: 5px !important;
                        }
                        .notice-page .edit-btn svg, .notice-page .delete-btn svg {
                            width: 16px !important;
                            height: 16px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .notice-page .container {
                            padding: 15px 12px !important;
                        }
                        .notice-page .title {
                            font-size: 18px !important;
                        }
                        .notice-page .notice-form {
                            padding: 15px !important;
                        }
                        .notice-page .notice-card {
                            padding: 15px !important;
                        }
                        .notice-page .notice-heading {
                            font-size: 16px !important;
                        }
                        .notice-page .desc {
                            font-size: 12px !important;
                        }
                        .notice-page .category-badge {
                            font-size: 10px !important;
                            padding: 4px 8px !important;
                        }
                    }
                    
                    @media (min-width: 769px) {
                        .notice-page .notices-grid {
                            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
                        }
                        .notice-page .input-group {
                            flex-direction: row !important;
                        }
                        .notice-page .button-group {
                            flex-direction: row !important;
                            justify-content: flex-end !important;
                        }
                        .notice-page .submit-btn, .notice-page .cancel-btn {
                            width: auto !important;
                        }
                        .notice-page .add-notice-btn {
                            width: auto !important;
                        }
                    }
                    
                    /* Hover Effects */
                    .notice-page .add-notice-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(128,0,0,0.3);
                        transition: all 0.2s ease;
                    }
                    .notice-page .submit-btn:hover {
                        background-color: #0a5c2e !important;
                        transform: translateY(-2px);
                        transition: all 0.2s ease;
                    }
                    .notice-page .cancel-btn:hover {
                        background-color: #5a6268 !important;
                        transform: translateY(-2px);
                        transition: all 0.2s ease;
                    }
                    .notice-page .edit-btn:hover {
                        background-color: #dbeafe !important;
                        transform: scale(1.05);
                        transition: all 0.2s ease;
                    }
                    .notice-page .delete-btn:hover {
                        background-color: #fee2e2 !important;
                        transform: scale(1.05);
                        transition: all 0.2s ease;
                    }
                    .notice-page .notice-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        transition: all 0.2s ease;
                    }
                    .notice-page .input:focus, .notice-page .select:focus, .notice-page .textarea:focus {
                        border-color: #8B0000 !important;
                        outline: none !important;
                        box-shadow: 0 0 0 2px rgba(128,0,0,0.1) !important;
                    }
                `}
            </style>
        </div>
    );
}

const styles = {
    container: { padding: '40px 20px', maxWidth: '1200px', margin: 'auto', fontFamily: '"Inter", sans-serif', backgroundColor: '#fdfdfd' },
    headerBar: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px', 
        borderBottomWidth: '2px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#8B0000',
        paddingBottom: '20px' 
    },
    title: { display: 'flex', alignItems: 'center', margin: 0, color: '#333', fontSize: '24px', fontWeight: 'bold' },
    addBtn: { backgroundColor: '#8B0000', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s ease' },
    formCard: { background: '#ffffff', padding: '30px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 10px 25px rgba(128,0,0,0.1)', borderStyle: 'solid', borderWidth: '1px', borderColor: '#ffcccc' },
    formTitle: { marginTop: 0, color: '#8B0000', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ffcccc', paddingBottom: '10px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', gap: '15px' },
    input: { flex: 3, padding: '12px', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', borderColor: '#ddd', fontSize: '15px', transition: 'all 0.2s ease' },
    select: { flex: 1, padding: '12px', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', borderColor: '#ddd', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s ease' },
    textarea: { padding: '12px', borderRadius: '6px', borderStyle: 'solid', borderWidth: '1px', borderColor: '#ddd', minHeight: '80px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical', transition: 'all 0.2s ease' },
    submitBtn: { padding: '12px 25px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s ease' },
    cancelBtn: { padding: '12px 25px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' },
    buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' },
    noticeCard: { 
        background: 'white', 
        padding: '25px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: '#eeeeee',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: '#eeeeee',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#eeeeee',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease'
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
    categoryBadge: { fontSize: '11px', fontWeight: 'bold', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' },
    actionButtons: { display: 'flex', gap: '8px' },
    noticeHeading: { color: '#8B0000', margin: '0 0 20px 0', fontSize: '20px', lineHeight: '1.3' },
    langSection: { display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 },
    langItem: { borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: '#f3f4f6', paddingLeft: '12px' },
    langLabel: { fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    desc: { fontSize: '14px', margin: 0, color: '#374151', lineHeight: '1.6' },
    cardFooter: { marginTop: '20px', paddingTop: '15px', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#f3f4f6', display: 'flex', gap: '15px' },
    date: { fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' },
    editBtn: { background: '#eff6ff', border: 'none', color: '#2563eb', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' },
    deleteBtn: { background: '#fef2f2', border: 'none', color: '#dc2626', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }
};

export default NoticePage;