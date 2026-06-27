import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';
import { XCircle, Landmark, ShieldCheck, User } from 'lucide-react';

function VerifyProfile() {
    const { id } = useParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Backend එකෙන් user ගේ විස්තර ගන්නවා
                const res = await axios.get(`${API_BASE}/auth/user/${id}`);
                setUserData(res.data);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) return <div style={styles.loader}>සත්‍යාපනය කරමින්...</div>;

    return (
        <div className="verify-profile-page" style={styles.container}>
            <div className="verify-profile-card" style={styles.card}>
                <div style={styles.govHeader}>
                    <Landmark size={40} color="#D4AF37" />
                    <h2 style={{margin: '10px 0 0 0', fontSize: '18px'}}>DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</h2>
                </div>

                {error || !userData ? (
                    <div style={styles.errorBox}>
                        <XCircle size={50} color="#e74c3c" />
                        <h3>අවලංගු හැඳුනුම්පතකි</h3>
                        <p>Invalid or Expired Digital Identity</p>
                    </div>
                ) : (
                    <div style={styles.infoBox}>
                        <div style={styles.statusBadge}>
                            <ShieldCheck size={20} /> VERIFIED CITIZEN
                        </div>
                        
                        <div style={styles.avatarCircle}>
                            <User size={60} color="#8B0000" />
                        </div>

                        <h2 style={styles.userName}>{userData.fullName}</h2>
                        <p style={styles.nicText}>NIC: {userData.nic}</p>
                        
                        <div className="verify-profile-details-grid" style={styles.detailsGrid}>
                            <div className="verify-profile-detail-item" style={styles.detailItem}>
                                <span>Status:</span>
                                <strong style={{color: '#27ae60'}}>Active</strong>
                            </div>
                            <div className="verify-profile-detail-item" style={styles.detailItem}>
                                <span>Division:</span>
                                <strong>{userData.gnDivision || 'Not Set'}</strong>
                            </div>
                            <div className="verify-profile-detail-item" style={styles.detailItem}>
                                <span>Role:</span>
                                <strong>{userData.role}</strong>
                            </div>
                        </div>

                        <div style={styles.footer}>
                            <p>© VillageFlow Official Verification System</p>
                            <small>{new Date().toLocaleString()}</small>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f5f6fa', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    card: { width: '100%', maxWidth: '400px', background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '2px solid #8B0000' },
    govHeader: { background: '#002980', color: 'white', padding: '20px', textAlign: 'center' },
    infoBox: { padding: '20px', textAlign: 'center' },
    statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eafaf1', color: '#27ae60', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px' },
    avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', background: '#f8f9fa', border: '3px solid #D4AF37', margin: '0 auto 15px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    userName: { margin: '0', fontSize: '22px', color: '#2c3e50' },
    nicText: { color: '#7f8c8d', fontSize: '16px', marginTop: '5px' },
    detailsGrid: { textAlign: 'left', background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginTop: '20px' },
    detailItem: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' },
    footer: { marginTop: '25px', color: '#bdc3c7', fontSize: '11px' },
    errorBox: { padding: '40px 20px', textAlign: 'center' },
    loader: { textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }
};

export default VerifyProfile;