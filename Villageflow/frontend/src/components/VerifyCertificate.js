import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

function VerifyCertificate() {
    const { id } = useParams();
    const [certData, setCertData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await axios.get('https://villageflow.onrender.com/api/certificates/all');
                
                // 1. Backend එකෙන් එන data structure එක හරියටම ගන්න
                const certificates = Array.isArray(res.data) ? res.data : res.data.certificates;

                if (certificates) {
                    // 2. ID එක සසඳන විට trim() සහ String() භාවිතා කර ඉතාම නිවැරදිව පරීක්ෂා කිරීම
                    const found = certificates.find(app => 
                        String(app._id).trim() === String(id).trim()
                    );
                    setCertData(found);
                }
            } catch (err) {
                console.error("Verification Error", err);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [id]);

    if (loading) return (
        <div style={styles.center}>
            <Loader2 className="animate-spin" size={30} color="#800000" /> 
            <span>Verifying Document...</span>
        </div>
    );

    return (
        <div className="verify-certificate-page" style={styles.container}>
            <div className="verify-certificate-card" style={styles.card}>
                {/* 🛡️ මෙතනදී status එක 'Approved' ද කියලා අනිවාර්යයෙන් බලනවා */}
                {certData && certData.status === 'Approved' ? (
                    <>
                        <CheckCircle size={70} color="#27ae60" />
                        <h2 style={{color: '#27ae60', marginTop: '15px'}}>AUTHENTIC DOCUMENT</h2>
                        <p style={{fontSize: '13px', color: '#666'}}>This is a digitally verified official certificate.</p>
                        <hr style={styles.hr} />
                        
                        <div className="verify-certificate-info" style={styles.info}>
                            <p className="verify-certificate-row" style={styles.row}><b>Certificate ID:</b> <span style={styles.idText}>{certData._id}</span></p>
                            <p className="verify-certificate-row" style={styles.row}><b>Type:</b> <span>{certData.certificateType}</span></p>
                            <p className="verify-certificate-row" style={styles.row}><b>NIC:</b> <span>{certData.nic}</span></p>
                            {/* User details populate වෙලා නැතිනම් 'Verified Holder' ලෙස පෙන්වයි */}
                            <p className="verify-certificate-row" style={styles.row}><b>Issued To:</b> <span>{certData.memberName || certData.userId?.fullName || 'Official Holder'}</span></p>
                            <p className="verify-certificate-row" style={styles.row}><b>Issued Date:</b> <span>{new Date(certData.appliedDate).toLocaleDateString()}</span></p>
                        </div>

                        <div style={styles.verifiedBadge}>
                            <ShieldCheck size={18}/> VillageFlow Verified System
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle size={70} color="#e74c3c" />
                        <h2 style={{color: '#e74c3c', marginTop: '15px'}}>INVALID DOCUMENT</h2>
                        <p style={{color: '#555', fontSize: '14px', marginTop: '10px'}}>
                            The certificate ID provided does not match our records or has not been approved yet.
                        </p>
                        <div style={styles.errorBox}>
                            <small>Ref ID: {id}</small>
                        </div>
                        <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry Verification</button>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    card: { background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '480px', width: '100%' },
    info: { textAlign: 'left', marginTop: '20px', fontSize: '14px', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f1f1f1', paddingBottom: '5px' },
    hr: { margin: '20px 0', border: '0', borderTop: '1px solid #eee' },
    idText: { fontSize: '11px', color: '#888', fontFamily: 'monospace' },
    verifiedBadge: { marginTop: '25px', background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
    errorBox: { marginTop: '20px', padding: '10px', background: '#fff5f5', borderRadius: '5px', color: '#c0392b' },
    retryBtn: { marginTop: '20px', padding: '12px 25px', border: 'none', background: '#800000', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    center: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '18px', color: '#1e293b' }
};

export default VerifyCertificate;