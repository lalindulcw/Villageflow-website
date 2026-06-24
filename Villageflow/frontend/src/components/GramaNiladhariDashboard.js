import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    Check, X, Eye, Clock, FileText, 
    History, Download, Package, Heart,
    UserPlus, Printer, Filter, Zap, CheckCircle2, Users, AlertCircle, Search, Calendar,
    TrendingUp, BarChart3, FilterX, ChevronDown, ChevronUp, Archive, Flag, Award,
    CreditCard, DollarSign, Receipt
} from 'lucide-react'; 
import { QRCodeSVG } from 'qrcode.react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InventoryPage from './InventoryPage'; 
import WelfarePage from './WelfarePage';

function GramaNiladhariDashboard() {
    const [activeTab, setActiveTab] = useState('certificates'); 
    const [activeSubTab, setActiveSubTab] = useState('auto'); 
    const [applications, setApplications] = useState([]);
    const [payments, setPayments] = useState({});
    const [auditLogs, setAuditLogs] = useState([]);
    const [citizens, setCitizens] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        certificateTypes: [],
        ageRange: { min: '', max: '' },
        priority: 'all',
        region: ''
    });
    const [sortBy, setSortBy] = useState('latest');
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [stats, setStats] = useState({
        totalThisWeek: 0,
        averageProcessingTime: 0,
        mostRequestedType: '',
        approvalRate: 0,
        totalCollected: 0
    });

    const [proxyData, setProxyData] = useState({ 
        fullName: '', 
        nic: '', 
        password: '',
        gender: '',
        age: '',
        address: '',
        householdNo: '',
        mobileNumber: '',
        dateOfBirth: '',
        relationship: 'Relative',
        village: '',
        city: '',
        occupation: '',
        emergencyContact: ''
    });
    const [isRegSuccess, setIsRegSuccess] = useState(false);
    const [regLoading, setRegLoading] = useState(false);
    const [regErrors, setRegErrors] = useState({});

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Check screen size for mobile only
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const triggerNotice = (msg, type = 'success') => {
        setNotification({ show: true, message: msg, type: type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    // Fetch payment for a certificate
    const fetchPaymentForCertificate = useCallback(async (certificateId) => {
        try {
            const res = await axios.get(`https://villageflow.onrender.com/api/certificates/payment/${certificateId}`);
            if (res.data && res.data.exists !== false) {
                return res.data;
            }
            return null;
        } catch (err) {
            console.error("Payment fetch failed:", err);
            return null;
        }
    }, []);

    const fetchApplications = useCallback(async () => {
        try {
            const res = await axios.get('https://villageflow.onrender.com/api/certificates/all');
            const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setApplications(sortedData);
            
            const paymentMap = {};
            for (const app of sortedData) {
                const payment = await fetchPaymentForCertificate(app._id);
                if (payment && payment.exists !== false) {
                    paymentMap[app._id] = payment;
                }
            }
            setPayments(paymentMap);
            
            calculateStats(sortedData, paymentMap);
            setLoading(false);
        } catch (err) {
            console.error("දත්ත ලබාගැනීම අසාර්ථකයි");
            setLoading(false);
        }
    }, [fetchPaymentForCertificate]);

    const calculateStats = (apps, paymentMap) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekApps = apps.filter(app => new Date(app.createdAt) > oneWeekAgo);
        
        const approvedApps = apps.filter(app => app.status === 'Approved' && app.createdAt && app.updatedAt);
        const avgTime = approvedApps.reduce((sum, app) => {
            const created = new Date(app.createdAt);
            const updated = new Date(app.updatedAt);
            return sum + (updated - created);
        }, 0) / (approvedApps.length || 1);
        
        const typeCount = {};
        apps.forEach(app => {
            typeCount[app.certificateType] = (typeCount[app.certificateType] || 0) + 1;
        });
        const mostRequested = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, '');
        
        const approved = apps.filter(app => app.status === 'Approved').length;
        const approvalRate = apps.length ? (approved / apps.length) * 100 : 0;
        
        let totalCollected = 0;
        Object.values(paymentMap).forEach(payment => {
            if (payment.status === 'completed' && payment.amount) {
                totalCollected += payment.amount;
            }
        });
        
        setStats({
            totalThisWeek: thisWeekApps.length,
            averageProcessingTime: Math.floor(avgTime / (1000 * 60 * 60 * 24)),
            mostRequestedType: mostRequested,
            approvalRate: Math.round(approvalRate),
            totalCollected: totalCollected
        });
    };

    const fetchAuditLogs = useCallback(async () => {
        try {
            const res = await axios.get('https://villageflow.onrender.com/api/certificates/audit-logs');
            setAuditLogs(res.data);
        } catch (err) { console.log("Audit logs fetch failed"); }
    }, []);

    const fetchCitizens = useCallback(async () => {
        try {
            const res = await axios.get('https://villageflow.onrender.com/api/auth/citizens');
            setCitizens(res.data);
        } catch (err) { console.log("Citizens fetch failed"); }
    }, []);

    useEffect(() => {
        fetchApplications();
        fetchAuditLogs();
        fetchCitizens();
    }, [fetchApplications, fetchAuditLogs, fetchCitizens]);

    const validateNIC = (nic) => {
        const oldNic = /^[0-9]{9}[vVxX]$/;
        const newNic = /^[0-9]{12}$/;
        return oldNic.test((nic || '').trim()) || newNic.test((nic || '').trim());
    };

    const validatePhone = (phone) => {
        return /^(\+94|0)?[0-9]{9,10}$/.test((phone || '').trim());
    };

    const calculateAge = (dateOfBirth) => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const handleElderlyRegister = async (e) => {
        e.preventDefault();
        setRegErrors({});
        setIsRegSuccess(false);

        const validationErrors = {};
        if (!proxyData.fullName.trim()) validationErrors.fullName = 'සම්පූර්ණ නම අවශ්‍යයි.';
        if (!proxyData.nic.trim()) validationErrors.nic = 'NIC අංකය අවශ්‍යයි.';
        else if (!validateNIC(proxyData.nic)) validationErrors.nic = 'NIC අංකය වලංගු නැත.';
        if (!proxyData.password || proxyData.password.length < 4) validationErrors.password = 'මුරපදය අවම අක්ෂර 4 ක් විය යුතුයි.';
        if (!proxyData.mobileNumber.trim()) validationErrors.mobileNumber = 'ජංගම දුරකථන අංකය අවශ්‍යයි.';
        else if (!validatePhone(proxyData.mobileNumber)) validationErrors.mobileNumber = 'දුරකථන අංකය වලංගු නැත.';
        if (!proxyData.dateOfBirth) validationErrors.dateOfBirth = 'උපන් දිනය අවශ්‍යයි.';

        const computedAge = proxyData.dateOfBirth ? calculateAge(proxyData.dateOfBirth) : null;
        if (computedAge !== null && computedAge < 18) validationErrors.dateOfBirth = 'අවම වයස අවුරුදු 18 ක් විය යුතුයි.';

        if (Object.keys(validationErrors).length > 0) {
            setRegErrors(validationErrors);
            return;
        }

        setRegLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = {
                fullName: proxyData.fullName.trim(),
                nic: proxyData.nic.trim().toUpperCase(),
                password: proxyData.password,
                relationship: proxyData.relationship || 'Relative',
                age: computedAge || proxyData.age || undefined,
                address: proxyData.address?.trim() || '',
                householdNo: proxyData.householdNo?.trim() || '',
                gender: proxyData.gender || '',
                mobileNumber: proxyData.mobileNumber.trim(),
                dateOfBirth: proxyData.dateOfBirth,
                village: proxyData.village?.trim() || '',
                city: proxyData.city?.trim() || '',
                occupation: proxyData.occupation?.trim() || '',
                emergencyContact: proxyData.emergencyContact?.trim() || '',
                district: user?.district || 'Monaragala',
                divisionalSecretariat: user?.divisionalSecretariat || 'Bibile',
                gnDivision: user?.gnDivision || 'Kotagama',
                officerId: user._id || user.id,
                role: 'citizen'
            };

            await axios.post('https://villageflow.onrender.com/api/auth/proxy-register', payload);
            setIsRegSuccess(true);
            triggerNotice("ලියාපදිංචිය සාර්ථකයි!");
            setProxyData({
                fullName: '',
                nic: '',
                password: '',
                gender: '',
                age: '',
                address: '',
                householdNo: '',
                mobileNumber: '',
                dateOfBirth: '',
                relationship: 'Relative',
                village: '',
                city: '',
                occupation: '',
                emergencyContact: ''
            });
            fetchCitizens(); 
        } catch (err) {
            const apiErrors = err.response?.data?.errors;
            if (apiErrors && typeof apiErrors === 'object') {
                setRegErrors(apiErrors);
                triggerNotice("ලියාපදිංචිය අසාර්ථකයි. දත්ත පරීක්ෂා කරන්න.", "error");
            } else {
                triggerNotice(err.response?.data?.msg || "ලියාපදිංචිය අසාර්ථකයි. NIC එක පරීක්ෂා කරන්න.", "error");
            }
        } finally {
            setRegLoading(false);
        }
    };

    const printQRCard = () => {
        const qrSvg = document.getElementById("printable-qr");
        if (!qrSvg) return;
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                <body style="display:flex; flex-direction:column; align-items:center; font-family:sans-serif; padding:50px;">
                    <div style="border:2px solid #800000; padding:20px; border-radius:15px; text-align:center; width:300px;">
                        <h2 style="color:#800000; margin-bottom:5px;">VillageFlow ID</h2>
                        <img src="${canvas.toDataURL("image/png")}" style="width:180px; margin:15px;"/>
                        <h3 style="margin:5px 0;">${proxyData.fullName}</h3>
                        <p style="margin:2px;">NIC: ${proxyData.nic}</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
                </html>
            `);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const downloadCitizenReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("VillageFlow: Registered Citizens List", 14, 15);
        const tableColumn = ["NIC No", "Full Name", "Gender", "Age", "Household No"];
        const tableRows = citizens.map(c => [c.nic, c.fullName, c.gender || '-', c.age || '-', c.householdNo || '-']);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 25, theme: 'grid', headStyles: { fillColor: [128, 0, 0] } });
        doc.save("All_Citizens_Report.pdf");
    };

    const downloadPendingCertificatesReport = () => {
        const doc = new jsPDF();
        const pendingApps = applications.filter(a => a.status === 'Pending');
        doc.setFontSize(16);
        doc.setTextColor(128, 0, 0);
        doc.text("VillageFlow: Pending Certificate Applications", 14, 15);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 22);
        const tableColumn = ["Applicant", "NIC", "Type", "Date", "Payment Status"];
        const tableRows = pendingApps.map(app => [
            app.userId?.fullName || "N/A",
            app.nic,
            app.certificateType,
            app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-",
            payments[app._id]?.status || 'Pending'
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30, theme: 'grid', headStyles: { fillColor: [128, 0, 0] } });
        doc.save("Pending_Certificates.pdf");
    };

    const downloadAdvancedReport = () => {
        const doc = new jsPDF();
        const filteredData = getFilteredApplications();
        
        doc.setFontSize(18);
        doc.setTextColor(128, 0, 0);
        doc.text("VillageFlow: Advanced Certificate Report", 14, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
        doc.text(`Total Applications: ${filteredData.length}`, 14, 29);
        doc.text(`Approval Rate: ${stats.approvalRate}%`, 14, 36);
        doc.text(`Total Collected: Rs. ${stats.totalCollected}/=`, 14, 43);
        
        const tableColumn = ["Applicant", "NIC", "Type", "Status", "Payment", "Amount", "Date"];
        const tableRows = filteredData.map(app => {
            const payment = payments[app._id];
            return [
                app.userId?.fullName || "N/A",
                app.nic,
                app.certificateType,
                app.status,
                payment?.status?.replace('_', ' ') || 'N/A',
                payment?.amount ? `Rs. ${payment.amount}` : '-',
                new Date(app.createdAt).toLocaleDateString()
            ];
        });
        
        autoTable(doc, { 
            head: [tableColumn], 
            body: tableRows, 
            startY: 50, 
            theme: 'grid', 
            headStyles: { fillColor: [128, 0, 0] },
            styles: { fontSize: 8 }
        });
        
        doc.save("Advanced_Certificate_Report.pdf");
    };

    // NEW FUNCTION: Download Audit Report
    const downloadAuditReport = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(128, 0, 0);
        doc.text("VillageFlow: System Audit Report", 14, 20);
        
        // Subheader with metadata
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Audit Events: ${auditLogs.length}`, 14, 37);
        doc.text(`Generated By: Grama Niladhari Officer`, 14, 44);
        
        // Add a summary section
        const actionCounts = {};
        auditLogs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });
        
        let yPos = 55;
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text("Summary by Action Type:", 14, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        Object.entries(actionCounts).forEach(([action, count]) => {
            doc.text(`• ${action}: ${count} time(s)`, 20, yPos);
            yPos += 5;
        });
        
        yPos += 5;
        
        // Audit Logs Table
        const tableColumn = ["Timestamp", "Action", "Officer Name", "Target NIC"];
        const tableRows = auditLogs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.action,
            log.officerName || "System",
            log.targetNic || "-"
        ]);
        
        autoTable(doc, { 
            head: [tableColumn], 
            body: tableRows, 
            startY: yPos + 5, 
            theme: 'striped',
            headStyles: { 
                fillColor: [128, 0, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { fontSize: 9, cellPadding: 3 }
        });
        
        // Add footer with page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
        
        doc.save("Audit_Report.pdf");
        triggerNotice("Audit report downloaded successfully!");
    };

    const handleUpdateStatus = async (id, status) => {
        if (status === 'Rejected') { 
            setSelectedAppId(id); 
            setShowRejectModal(true); 
            return; 
        }
        try {
            await axios.put(`https://villageflow.onrender.com/api/certificates/update/${id}`, {
                status: status, 
                rejectReason: "", 
                officerName: "Admin_Grama_Niladhari"
            });
            triggerNotice("අයදුම්පත අනුමත කළා.");
            fetchApplications();
        } catch (err) { 
            triggerNotice("තත්ත්වය වෙනස් කිරීම අසාර්ථකයි", "error"); 
        }
    };

    const submitRejection = async () => {
        try {
            await axios.put(`https://villageflow.onrender.com/api/certificates/update/${selectedAppId}`, {
                status: 'Rejected', 
                rejectReason: rejectReason, 
                officerName: "Admin_Grama_Niladhari"
            });
            triggerNotice("අයදුම්පත ප්‍රතික්ෂේප කළා.");
            setShowRejectModal(false); 
            setRejectReason('');
            fetchApplications();
        } catch (err) { 
            triggerNotice("ප්‍රතික්ෂේප කිරීමේ දෝෂයකි.", "error"); 
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedApplications.length === 0) {
            triggerNotice("කරුණාකර අයදුම්පත් තෝරන්න.", "error");
            return;
        }
        
        try {
            for (const appId of selectedApplications) {
                if (action === 'approve') {
                    await axios.put(`https://villageflow.onrender.com/api/certificates/update/${appId}`, {
                        status: 'Approved',
                        officerName: "Admin_Grama_Niladhari"
                    });
                } else if (action === 'archive') {
                    await axios.put(`https://villageflow.onrender.com/api/certificates/update/${appId}`, {
                        isArchived: true,
                        officerName: "Admin_Grama_Niladhari"
                    });
                }
            }
            triggerNotice(`${selectedApplications.length} අයදුම්පත් ${action === 'approve' ? 'අනුමත කරන ලදී' : 'සංරක්ෂණය කරන ලදී'}.`);
            setSelectedApplications([]);
            setShowBulkActions(false);
            fetchApplications();
        } catch (err) {
            triggerNotice("තෝරාගත් ක්‍රියාව අසාර්ථකයි.", "error");
        }
    };

    const getFilteredApplications = () => {
        let filtered = applications.filter(app => {
            const isManual = app.isManual === "true" || (app.relationship && app.relationship !== "Self");
            const matchesSearch = app.nic.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (app.userId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            let subtabMatch = true;
            if (activeSubTab === 'auto') subtabMatch = !isManual;
            else if (activeSubTab === 'manual') subtabMatch = isManual;
            else if (activeSubTab === 'pending') subtabMatch = app.status === 'Pending';
            
            let dateMatch = true;
            if (filters.dateFrom) {
                const appDate = new Date(app.createdAt);
                dateMatch = appDate >= new Date(filters.dateFrom);
            }
            if (filters.dateTo && dateMatch) {
                const appDate = new Date(app.createdAt);
                dateMatch = appDate <= new Date(filters.dateTo);
            }
            
            let typeMatch = true;
            if (filters.certificateTypes.length > 0) {
                typeMatch = filters.certificateTypes.includes(app.certificateType);
            }
            
            let priorityMatch = true;
            if (filters.priority !== 'all') {
                const daysOld = (new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24);
                if (filters.priority === 'urgent') priorityMatch = daysOld > 7 && app.status === 'Pending';
                else if (filters.priority === 'normal') priorityMatch = daysOld <= 7;
            }
            
            return matchesSearch && subtabMatch && dateMatch && typeMatch && priorityMatch;
        });
        
        if (sortBy === 'latest') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'priority') {
            filtered.sort((a, b) => {
                const aDays = (new Date() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24);
                const bDays = (new Date() - new Date(b.createdAt)) / (1000 * 60 * 60 * 24);
                return bDays - aDays;
            });
        }
        
        return filtered;
    };

    const toggleApplicationSelection = (appId) => {
        setSelectedApplications(prev => 
            prev.includes(appId) 
                ? prev.filter(id => id !== appId)
                : [...prev, appId]
        );
    };

    const selectAllApplications = () => {
        const currentApps = getFilteredApplications();
        if (selectedApplications.length === currentApps.length) {
            setSelectedApplications([]);
        } else {
            setSelectedApplications(currentApps.map(app => app._id));
        }
    };

    const getPaymentStatusStyle = (status) => {
        switch(status) {
            case 'completed':
                return { backgroundColor: '#dcfce7', color: '#15803d', icon: <CheckCircle2 size={12} /> };
            case 'pending_verification':
                return { backgroundColor: '#fef9c3', color: '#854d0e', icon: <Clock size={12} /> };
            case 'refunded':
                return { backgroundColor: '#fee2e2', color: '#b91c1c', icon: <X size={12} /> };
            default:
                return { backgroundColor: '#f1f5f9', color: '#64748b', icon: <AlertCircle size={12} /> };
        }
    };

    const PaymentDetailsModal = ({ payment, onClose }) => {
        if (!payment) return null;
        const paymentStyle = getPaymentStatusStyle(payment.status);
        
        return (
            <div style={styles.modalOverlay}>
                <div style={{...styles.modalContent, maxWidth: '450px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px'}}>
                        <h3 style={{color: '#800000', margin: 0}}><Receipt size={20} /> Payment Details</h3>
                        <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}>×</button>
                    </div>
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                            <span><DollarSign size={16} /> Amount:</span>
                            <strong>Rs. {payment.amount}/=</strong>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                            <span><CreditCard size={16} /> Payment Method:</span>
                            <strong>{payment.paymentMethod?.toUpperCase() || 'N/A'}</strong>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                            <span><FileText size={16} /> Transaction ID:</span>
                            <strong>{payment.transactionId || 'N/A'}</strong>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9'}}>
                            <span><Clock size={16} /> Payment Status:</span>
                            <span style={{...getPaymentStatusStyle(payment.status), padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                                {paymentStyle.icon} {payment.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
                            <span><Calendar size={16} /> Date:</span>
                            <strong>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}</strong>
                        </div>
                    </div>
                    <button onClick={onClose} style={{width: '100%', padding: '12px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '20px'}}>Close</button>
                </div>
            </div>
        );
    };

    const filteredApps = getFilteredApplications();
    const autoCount = applications.filter(app => !(app.isManual === "true" || (app.relationship && app.relationship !== "Self"))).length;
    const manualCount = applications.filter(app => app.isManual === "true" || (app.relationship && app.relationship !== "Self")).length;
    const pendingCount = applications.filter(app => app.status === 'Pending').length;

    if (loading) return <div style={styles.loader}><Clock className="animate-spin" /> දත්ත පරීක්ෂා කරමින්...</div>;

    // Mobile Bottom Navigation Items
    const mobileNavItems = [
        { id: 'certificates', label: 'සහතික', icon: <FileText size={20} /> },
        { id: 'elderly-reg', label: 'ලියාපදිංචිය', icon: <UserPlus size={20} /> },
        { id: 'citizen-list', label: 'වැසියන්', icon: <Users size={20} /> },
        { id: 'welfare', label: 'සහනාධාර', icon: <Heart size={20} /> },
        { id: 'inventory', label: 'වත්කම්', icon: <Package size={20} /> },
        { id: 'audit', label: 'වාර්තා', icon: <History size={20} /> }
    ];

    return (
        <div className="gn-dashboard" style={styles.dashboardWrapper}>
            {/* Desktop Sidebar - Only visible on desktop */}
            {!isMobile && (
                <div className="gn-sidebar" style={styles.sidebar}>
                    <div style={styles.logo}>Village<span>Flow</span></div>
                    <nav style={styles.nav}>
                        <div onClick={() => setActiveTab('certificates')} style={{...styles.navItem, color: activeTab === 'certificates' ? '#800000' : '#64748b', backgroundColor: activeTab === 'certificates' ? '#fff1f1' : 'transparent'}}>
                            <FileText size={20} /> සහතික පත්‍ර
                        </div>
                        <div onClick={() => setActiveTab('elderly-reg')} style={{...styles.navItem, color: activeTab === 'elderly-reg' ? '#800000' : '#64748b', backgroundColor: activeTab === 'elderly-reg' ? '#fff1f1' : 'transparent'}}>
                            <UserPlus size={20} /> නව ලියාපදිංචිය
                        </div>
                        <div onClick={() => setActiveTab('citizen-list')} style={{...styles.navItem, color: activeTab === 'citizen-list' ? '#800000' : '#64748b', backgroundColor: activeTab === 'citizen-list' ? '#fff1f1' : 'transparent'}}>
                            <Users size={20} /> වැසියන්ගේ ලැයිස්තුව
                        </div>
                        <div onClick={() => setActiveTab('welfare')} style={{...styles.navItem, color: activeTab === 'welfare' ? '#800000' : '#64748b', backgroundColor: activeTab === 'welfare' ? '#fff1f1' : 'transparent'}}>
                            <Heart size={20} /> සහනාධාර
                        </div>
                        <div onClick={() => setActiveTab('inventory')} style={{...styles.navItem, color: activeTab === 'inventory' ? '#800000' : '#64748b', backgroundColor: activeTab === 'inventory' ? '#fff1f1' : 'transparent'}}>
                            <Package size={20} /> ග්‍රාමීය වත්කම් 
                        </div>
                        <div onClick={() => setActiveTab('audit')} style={{...styles.navItem, color: activeTab === 'audit' ? '#800000' : '#64748b', backgroundColor: activeTab === 'audit' ? '#fff1f1' : 'transparent'}}>
                            <History size={20} /> Audit වාර්තා
                        </div>
                    </nav>
                </div>
            )}

            {/* Mobile Bottom Navigation - Left aligned */}
            {isMobile && (
                <div className="mobile-bottom-nav" style={styles.mobileBottomNav}>
                    {mobileNavItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={activeTab === item.id ? 'active' : ''}
                            style={styles.mobileNavBtn}
                        >
                            {item.icon}
                            <span style={styles.mobileNavText}>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="main-content" style={{...styles.mainContent, paddingBottom: isMobile ? '70px' : '0'}}>
                {notification.show && (
                    <div style={{
                        ...styles.notificationBox, 
                        backgroundColor: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
                        color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                        borderColor: notification.type === 'error' ? '#ef4444' : '#22c55e'
                    }}>
                        <CheckCircle2 size={18} /> {notification.message}
                    </div>
                )}

                {activeTab === 'certificates' && (
                    <div className="container" style={styles.container}>
                        <div className="stats-row" style={styles.statsRow}>
                            <div style={styles.statCard}>
                                <div style={{...styles.iconCircle, backgroundColor: '#f0f9ff'}}><Zap size={20} color="#0284c7" /></div>
                                <div><span style={styles.statLabel}>Auto</span><h3 style={styles.statValue}>{autoCount}</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{...styles.iconCircle, backgroundColor: '#fef2f2'}}><Filter size={20} color="#dc2626" /></div>
                                <div><span style={styles.statLabel}>Manual</span><h3 style={styles.statValue}>{manualCount}</h3></div>
                            </div>
                            <div style={{...styles.statCard, borderBottom: '4px solid #facc15'}}>
                                <div style={{...styles.iconCircle, backgroundColor: '#fefce8'}}><Clock size={20} color="#ca8a04" /></div>
                                <div><span style={styles.statLabel}>Pending</span><h3 style={styles.statValue}>{pendingCount}</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{...styles.iconCircle, backgroundColor: '#e0f2fe'}}><TrendingUp size={20} color="#0369a1" /></div>
                                <div><span style={styles.statLabel}>Approval Rate</span><h3 style={styles.statValue}>{stats.approvalRate}%</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{...styles.iconCircle, backgroundColor: '#f3e8ff'}}><Award size={20} color="#7e22ce" /></div>
                                <div><span style={styles.statLabel}>Most Requested</span><h3 style={{...styles.statValue, fontSize: '16px'}}>{stats.mostRequestedType || 'N/A'}</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{...styles.iconCircle, backgroundColor: '#dcfce7'}}><DollarSign size={20} color="#15803d" /></div>
                                <div><span style={styles.statLabel}>Total Collected</span><h3 style={styles.statValue}>Rs. {stats.totalCollected}</h3></div>
                            </div>
                        </div>

                        <div style={styles.headerContainer}>
                            <div className="header-left-group" style={{display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap'}}>
                                <h2 style={styles.header}><FileText color="#800000" /> අයදුම්පත් කළමනාකරණය</h2>
                                <div style={styles.searchBox}>
                                    <Search size={18} color="#94a3b8" />
                                    <input type="text" placeholder="නම හෝ NIC මගින් සොයන්න..." style={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={styles.filterToggleBtn}>
                                    <BarChart3 size={16} /> {showAdvancedFilters ? 'Simple Filters' : 'Advanced Filters'}
                                    {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                            <div className="header-right-group" style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                {selectedApplications.length > 0 && (
                                    <button onClick={() => setShowBulkActions(true)} style={styles.bulkActionBtn}>
                                        <CheckCircle2 size={16} /> Bulk ({selectedApplications.length})
                                    </button>
                                )}
                                <button onClick={downloadAdvancedReport} style={styles.reportBtn}>
                                    <Download size={16} /> Advanced Report
                                </button>
                                <button onClick={downloadPendingCertificatesReport} style={styles.reportBtn}>
                                    <FileText size={16} /> Pending Report
                                </button>
                            </div>
                        </div>

                        {showAdvancedFilters && (
                            <div style={styles.advancedFiltersPanel}>
                                <div style={styles.filterHeader}>
                                    <h4><Filter size={16} /> Advanced Filters</h4>
                                    <button onClick={() => {
                                        setFilters({
                                            dateFrom: '',
                                            dateTo: '',
                                            certificateTypes: [],
                                            ageRange: { min: '', max: '' },
                                            priority: 'all',
                                            region: ''
                                        });
                                        setSortBy('latest');
                                    }} style={styles.clearFiltersBtn}>
                                        <FilterX size={14} /> Clear All
                                    </button>
                                </div>
                                <div style={styles.filterGrid}>
                                    <div style={styles.filterGroup}>
                                        <label>Date Range</label>
                                        <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} style={styles.filterInput} />
                                        <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} style={styles.filterInput} />
                                    </div>
                                    <div style={styles.filterGroup}>
                                        <label>Certificate Type</label>
                                        <select multiple value={filters.certificateTypes} onChange={e => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setFilters({...filters, certificateTypes: values});
                                        }} style={styles.filterSelect}>
                                            <option value="Residency Certificate">Residency Certificate</option>
                                            <option value="Character Certificate">Character Certificate</option>
                                            <option value="Income Certificate">Income Certificate</option>
                                            <option value="Birth Certificate Copy">Birth Certificate Copy</option>
                                        </select>
                                    </div>
                                    <div style={styles.filterGroup}>
                                        <label>Priority Level</label>
                                        <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} style={styles.filterInput}>
                                            <option value="all">All Applications</option>
                                            <option value="urgent">Urgent (7+ days pending)</option>
                                            <option value="normal">Normal (Under 7 days)</option>
                                        </select>
                                    </div>
                                    <div style={styles.filterGroup}>
                                        <label>Sort By</label>
                                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.filterInput}>
                                            <option value="latest">Latest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="priority">Priority (Urgent first)</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={styles.filterStats}>
                                    <span>🎯 Showing {filteredApps.length} of {applications.length} applications</span>
                                    {filteredApps.length > 0 && (
                                        <button onClick={selectAllApplications} style={styles.selectAllBtn}>
                                            {selectedApplications.length === filteredApps.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={styles.subTabContainer}>
                            <button onClick={() => setActiveSubTab('auto')} style={activeSubTab === 'auto' ? styles.subTabActive : styles.subTabInactive}>
                                <Zap size={16} /> Auto Applied ({autoCount})
                            </button>
                            <button onClick={() => setActiveSubTab('manual')} style={activeSubTab === 'manual' ? styles.subTabActive : styles.subTabInactive}>
                                <Filter size={16} /> Manual Applied ({manualCount})
                            </button>
                            <button onClick={() => setActiveSubTab('pending')} style={activeSubTab === 'pending' ? styles.subTabActive : styles.subTabInactive}>
                                <AlertCircle size={16} /> All Pending ({pendingCount})
                            </button>
                        </div>
                        
                        {!isMobile ? (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        {filteredApps.length > 0 && <th style={{...styles.th, width: '40px'}}><input type="checkbox" onChange={selectAllApplications} checked={selectedApplications.length === filteredApps.length && filteredApps.length > 0} /></th>}
                                        <th style={styles.th}>දිනය</th>
                                        <th style={styles.th}>අයදුම්කරු</th>
                                        <th style={styles.th}>සහතික වර්ගය</th>
                                        <th style={styles.th}>ගෙවීම්</th>
                                        <th style={styles.th}>තත්ත්වය</th>
                                        <th style={styles.th}>ක්‍රියා</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApps.length > 0 ? filteredApps.map(app => {
                                        const daysOld = Math.floor((new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24));
                                        const isUrgent = daysOld > 7 && app.status === 'Pending';
                                        const payment = payments[app._id];
                                        const paymentStyle = payment ? getPaymentStatusStyle(payment.status) : getPaymentStatusStyle('pending');
                                        
                                        return (
                                            <tr key={app._id} style={{...styles.tr, backgroundColor: isUrgent ? '#fef2f2' : 'white'}}>
                                                {filteredApps.length > 0 && (
                                                    <td style={styles.td}>
                                                        <input type="checkbox" checked={selectedApplications.includes(app._id)} onChange={() => toggleApplicationSelection(app._id)} />
                                                    </td>
                                                )}
                                                <td style={styles.td}>
                                                    <div style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#64748b'}}>
                                                        <Calendar size={12}/> {new Date(app.createdAt).toLocaleDateString()}
                                                    </div>
                                                    {isUrgent && <div style={{display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', color:'#dc2626', marginTop:'4px'}}><Flag size={10}/> Urgent ({daysOld} days)</div>}
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={{fontWeight:'600'}}>{app.userId?.fullName || "නම නැත"}</div>
                                                    <div style={{fontSize:'12px', color:'#64748b'}}>{app.nic}</div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.typeBadge}>{app.certificateType}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    {payment ? (
                                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                                                            <span style={{...styles.paymentBadge, ...paymentStyle}}>
                                                                {paymentStyle.icon} Rs. {payment.amount}
                                                            </span>
                                                            <button onClick={() => setSelectedPayment(payment)} style={styles.viewPaymentBtn} title="View Receipt">
                                                                <Receipt size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{...styles.paymentBadge, backgroundColor: '#f1f5f9', color: '#64748b'}}>
                                                            <AlertCircle size={12} /> No Payment
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{...styles.badge, ...getStatusBadgeStyle(app.status)}}>
                                                        {app.status === 'Pending' ? 'පොරොත්තු' : app.status === 'Approved' ? 'අනුමත' : 'ප්‍රතික්ෂේපිත'}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={styles.actions}>
                                                        <button onClick={() => {
                                                            const path = app.utilityBill;
                                                            if(path) {
                                                                const fullUrl = path.startsWith('http') ? path : `https://villageflow.onrender.com/${path}`;
                                                                window.open(fullUrl, '_blank');
                                                            } else {
                                                                triggerNotice("ලිපිගොනු සොයාගත නොහැක", "error");
                                                            }
                                                        }} style={styles.viewBtn} title="ලේඛන පරීක්ෂා කරන්න">
                                                            <Eye size={14}/> View
                                                        </button>
                                                        {app.status === 'Pending' && (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(app._id, 'Approved')} style={styles.approveBtn} title="Approve"><Check size={14}/></button>
                                                                <button onClick={() => handleUpdateStatus(app._id, 'Rejected')} style={styles.rejectBtn} title="Reject"><X size={14}/></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="7" style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>අයදුම්පත් කිසිවක් සොයාගත නොහැක.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        ) : (
                        <div style={styles.mobileCardsList}>
                            {filteredApps.length > 0 ? filteredApps.map(app => {
                                const daysOld = Math.floor((new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24));
                                const isUrgent = daysOld > 7 && app.status === 'Pending';
                                const payment = payments[app._id];
                                const paymentStyle = payment ? getPaymentStatusStyle(payment.status) : getPaymentStatusStyle('pending');

                                return (
                                    <div key={app._id} style={{...styles.mobileDataCard, borderColor: isUrgent ? '#fecaca' : '#e2e8f0'}}>
                                        <div style={styles.mobileDataTitle}>{app.userId?.fullName || "නම නැත"}</div>
                                        <div style={styles.mobileDataRow}><strong>NIC:</strong> {app.nic}</div>
                                        <div style={styles.mobileDataRow}><strong>වර්ගය:</strong> {app.certificateType}</div>
                                        <div style={styles.mobileDataRow}><strong>දිනය:</strong> {new Date(app.createdAt).toLocaleString()}</div>
                                        {isUrgent && <div style={{...styles.mobileDataRow, color: '#dc2626'}}><strong>Priority:</strong> Urgent ({daysOld} days)</div>}
                                        <div style={styles.mobileDataRow}>
                                            <strong>ගෙවීම්:</strong>{' '}
                                            {payment ? (
                                                <span style={{...styles.paymentBadge, ...paymentStyle}}>
                                                    {paymentStyle.icon} Rs. {payment.amount}
                                                </span>
                                            ) : (
                                                <span style={{...styles.paymentBadge, backgroundColor: '#f1f5f9', color: '#64748b'}}>
                                                    <AlertCircle size={12} /> No Payment
                                                </span>
                                            )}
                                        </div>
                                        <div style={styles.mobileDataRow}>
                                            <strong>තත්ත්වය:</strong>{' '}
                                            <span style={{...styles.badge, ...getStatusBadgeStyle(app.status)}}>
                                                {app.status === 'Pending' ? 'පොරොත්තු' : app.status === 'Approved' ? 'අනුමත' : 'ප්‍රතික්ෂේපිත'}
                                            </span>
                                        </div>
                                        <div style={styles.mobileCardActions}>
                                            <button onClick={() => {
                                                const path = app.utilityBill;
                                                if(path) {
                                                    const fullUrl = path.startsWith('http') ? path : `https://villageflow.onrender.com/${path}`;
                                                    window.open(fullUrl, '_blank');
                                                } else {
                                                    triggerNotice("ලිපිගොනු සොයාගත නොහැක", "error");
                                                }
                                            }} style={styles.viewBtn}>
                                                <Eye size={14}/> View
                                            </button>
                                            {payment && (
                                                <button onClick={() => setSelectedPayment(payment)} style={styles.viewPaymentBtn}>
                                                    <Receipt size={14} /> Receipt
                                                </button>
                                            )}
                                            {app.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(app._id, 'Approved')} style={styles.approveBtn}><Check size={14}/> Approve</button>
                                                    <button onClick={() => handleUpdateStatus(app._id, 'Rejected')} style={styles.rejectBtn}><X size={14}/> Reject</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={styles.mobileEmpty}>අයදුම්පත් කිසිවක් සොයාගත නොහැක.</div>
                            )}
                        </div>
                        )}
                    </div>
                )}

                {activeTab === 'elderly-reg' && (
                    <div className="container" style={styles.container}>
                        <h2 style={styles.header}><UserPlus color="#800000" /> නව වැසියකු ලියාපදිංචි කිරීම</h2>
                        <div style={styles.formSection}>
                            <form onSubmit={handleElderlyRegister} style={styles.regForm}>
                                <div className="reg-grid" style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'15px'}}>
                                    <input placeholder="සම්පූර්ණ නම" style={styles.regInput} value={proxyData.fullName} onChange={e => setProxyData({...proxyData, fullName: e.target.value})} required />
                                    {regErrors.fullName && <small style={styles.formError}>{regErrors.fullName}</small>}
                                    <input placeholder="NIC අංකය" style={styles.regInput} value={proxyData.nic} onChange={e => setProxyData({...proxyData, nic: e.target.value})} required />
                                    {regErrors.nic && <small style={styles.formError}>{regErrors.nic}</small>}
                                    <select style={styles.regInput} value={proxyData.gender} onChange={e => setProxyData({...proxyData, gender: e.target.value})} required>
                                        <option value="">ස්ත්‍රී/පුරුෂ</option>
                                        <option value="Male">පුරුෂ</option>
                                        <option value="Female">ස්ත්‍රී</option>
                                    </select>
                                    <input type="date" placeholder="උපන් දිනය" style={styles.regInput} value={proxyData.dateOfBirth} onChange={e => setProxyData({...proxyData, dateOfBirth: e.target.value})} required />
                                    {regErrors.dateOfBirth && <small style={styles.formError}>{regErrors.dateOfBirth}</small>}
                                    <input placeholder="ගෘහ මූලික අංකය" style={styles.regInput} value={proxyData.householdNo} onChange={e => setProxyData({...proxyData, householdNo: e.target.value})} />
                                    <input type="password" placeholder="තාවකාලික මුරපදය" style={styles.regInput} value={proxyData.password} onChange={e => setProxyData({...proxyData, password: e.target.value})} required />
                                    {regErrors.password && <small style={styles.formError}>{regErrors.password}</small>}
                                    <input placeholder="ජංගම දුරකථන අංකය" style={styles.regInput} value={proxyData.mobileNumber} onChange={e => setProxyData({...proxyData, mobileNumber: e.target.value})} required />
                                    {regErrors.mobileNumber && <small style={styles.formError}>{regErrors.mobileNumber}</small>}
                                    <input placeholder="ගම/වීදිය" style={styles.regInput} value={proxyData.village} onChange={e => setProxyData({...proxyData, village: e.target.value})} />
                                    <input placeholder="නගරය" style={styles.regInput} value={proxyData.city} onChange={e => setProxyData({...proxyData, city: e.target.value})} />
                                    <input placeholder="රැකියාව" style={styles.regInput} value={proxyData.occupation} onChange={e => setProxyData({...proxyData, occupation: e.target.value})} />
                                    <input placeholder="හදිසි දුරකථන අංකය" style={styles.regInput} value={proxyData.emergencyContact} onChange={e => setProxyData({...proxyData, emergencyContact: e.target.value})} />
                                </div>
                                <input placeholder="ලිපිනය" style={styles.regInput} value={proxyData.address} onChange={e => setProxyData({...proxyData, address: e.target.value})} />
                                {regErrors.general && <small style={{...styles.formError, display: 'block'}}>{regErrors.general}</small>}
                                <button type="submit" style={styles.regSubmitBtn}>
                                    {regLoading ? "සුරකිමින්..." : "ලියාපදිංචි කර QR පත සාදන්න"}
                                </button>
                            </form>
                            {isRegSuccess && (
                                <div style={styles.qrResult}>
                                    <QRCodeSVG id="printable-qr" value={proxyData.nic} size={150} />
                                    <p style={{marginTop: '10px', fontWeight: 'bold'}}>{proxyData.fullName}</p>
                                    <button onClick={printQRCard} style={styles.printBtn}><Printer size={16} /> ID පත Print කරන්න</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'citizen-list' && (
                    <div className="container" style={styles.container}>
                        <div style={styles.headerContainer}>
                            <h2 style={styles.header}><Users color="#800000" /> ලියාපදිංචි වැසියන්ගේ නාමලේඛනය</h2>
                            <button onClick={downloadCitizenReport} style={styles.reportBtn}>
                                <Download size={16} /> සම්පූර්ණ ලැයිස්තුව (PDF)
                            </button>
                        </div>
                        {!isMobile ? (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>NIC No</th>
                                        <th style={styles.th}>නම</th>
                                        <th style={styles.th}>ස්ත්‍රී/පුරුෂ</th>
                                        <th style={styles.th}>වයස</th>
                                        <th style={styles.th}>ගෘහ මූලික අංකය</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {citizens.map(c => (
                                        <tr key={c._id} style={styles.tr}>
                                            <td style={styles.td}><b>{c.nic}</b></td>
                                            <td style={styles.td}>{c.fullName}</td>
                                            <td style={styles.td}>{c.gender || '-'}</td>
                                            <td style={styles.td}>{c.age || '-'}</td>
                                            <td style={styles.td}>{c.householdNo || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        ) : (
                        <div style={styles.mobileCardsList}>
                            {citizens.length > 0 ? citizens.map(c => (
                                <div key={c._id} style={styles.mobileDataCard}>
                                    <div style={styles.mobileDataTitle}>{c.fullName}</div>
                                    <div style={styles.mobileDataRow}><strong>NIC:</strong> {c.nic}</div>
                                    <div style={styles.mobileDataRow}><strong>ස්ත්‍රී/පුරුෂ:</strong> {c.gender || '-'}</div>
                                    <div style={styles.mobileDataRow}><strong>වයස:</strong> {c.age || '-'}</div>
                                    <div style={styles.mobileDataRow}><strong>ගෘහ අංකය:</strong> {c.householdNo || '-'}</div>
                                </div>
                            )) : <div style={styles.mobileEmpty}>දත්ත නොමැත.</div>}
                        </div>
                        )}
                    </div>
                )}

                {activeTab === 'welfare' && <WelfarePage />}
                {activeTab === 'inventory' && <InventoryPage />}
                
                {activeTab === 'audit' && (
                    <div className="container" style={styles.container}>
                        <div style={styles.headerContainer}>
                            <h2 style={styles.header}><History color="#800000" /> පද්ධති Audit වාර්තා</h2>
                            <button onClick={downloadAuditReport} style={styles.reportBtn}>
                                <Download size={16} /> Download Audit Report (PDF)
                            </button>
                        </div>
                        {!isMobile ? (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>සිදුවීම</th>
                                        <th style={styles.th}>නිලධාරියා</th>
                                        <th style={styles.th}>අදාළ NIC</th>
                                        <th style={styles.th}>දිනය හා වේලාව</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log._id} style={styles.tr}>
                                            <td style={styles.td}>{log.action}</td>
                                            <td style={styles.td}>{log.officerName}</td>
                                            <td style={styles.td}>{log.targetNic}</td>
                                            <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        ) : (
                        <div style={styles.mobileCardsList}>
                            {auditLogs.length > 0 ? auditLogs.map(log => (
                                <div key={log._id} style={styles.mobileDataCard}>
                                    <div style={styles.mobileDataTitle}>{log.action}</div>
                                    <div style={styles.mobileDataRow}><strong>නිලධාරියා:</strong> {log.officerName}</div>
                                    <div style={styles.mobileDataRow}><strong>NIC:</strong> {log.targetNic}</div>
                                    <div style={styles.mobileDataRow}><strong>දිනය:</strong> {new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            )) : <div style={styles.mobileEmpty}>Audit දත්ත නොමැත.</div>}
                        </div>
                        )}
                    </div>
                )}

                {showRejectModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3 style={{color: '#800000', marginBottom:'15px'}}>ප්‍රතික්ෂේප කිරීමට හේතුව</h3>
                            <textarea style={styles.textArea} rows="4" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="ප්‍රතික්ෂේප කිරීමට හේතුව මෙහි සඳහන් කරන්න..."></textarea>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap'}}>
                                <button onClick={() => setShowRejectModal(false)} style={styles.cancelBtn}>අවලංගු කරන්න</button>
                                <button onClick={submitRejection} style={styles.confirmRejectBtn}>තහවුරු කරන්න</button>
                            </div>
                        </div>
                    </div>
                )}

                {showBulkActions && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3 style={{color: '#800000', marginBottom:'15px'}}>Bulk Actions ({selectedApplications.length} applications)</h3>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                <button onClick={() => handleBulkAction('approve')} style={styles.bulkApproveBtn}>
                                    <Check size={16} /> Approve All Selected
                                </button>
                                <button onClick={() => handleBulkAction('archive')} style={styles.bulkArchiveBtn}>
                                    <Archive size={16} /> Archive Selected
                                </button>
                                <button onClick={() => setShowBulkActions(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedPayment && (
                    <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
                )}
            </div>

            {/* Global Styles */}
            <style>
                {`
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* Desktop - Normal styles */
                    @media (min-width: 769px) {
                        .gn-dashboard .gn-sidebar {
                            position: sticky !important;
                            top: 0 !important;
                            width: 260px !important;
                            height: 100vh !important;
                            display: block !important;
                        }
                        .gn-dashboard .mobile-bottom-nav {
                            display: none !important;
                        }
                    }
                    
                    /* Mobile - Bottom Navigation - LEFT ALIGNED */
                    @media (max-width: 768px) {
                        .gn-dashboard .gn-sidebar {
                            display: none !important;
                        }
                        .gn-dashboard .mobile-bottom-nav {
                            position: fixed !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            background: #800000 !important;
                            display: flex !important;
                            justify-content: flex-start !important;
                            align-items: center !important;
                            padding: 8px 12px !important;
                            z-index: 1000 !important;
                            gap: 8px !important;
                            overflow-x: auto !important;
                            white-space: nowrap !important;
                            flex-wrap: nowrap !important;
                            -webkit-overflow-scrolling: touch !important;
                        }
                        .gn-dashboard .mobile-bottom-nav::-webkit-scrollbar {
                            display: none !important;
                        }
                        .gn-dashboard .stats-row {
                            display: grid !important;
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 12px !important;
                        }
                        .gn-dashboard .statCard {
                            padding: 12px !important;
                        }
                        .gn-dashboard .statValue {
                            font-size: 18px !important;
                        }
                        .gn-dashboard .statLabel {
                            font-size: 10px !important;
                        }
                        .gn-dashboard .iconCircle {
                            width: 35px !important;
                            height: 35px !important;
                        }
                        .gn-dashboard .headerContainer {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                        }
                        .gn-dashboard .searchBox {
                            width: 100% !important;
                        }
                        .gn-dashboard .filterGrid {
                            grid-template-columns: 1fr !important;
                        }
                        .gn-dashboard .subTabContainer {
                            flex-wrap: wrap !important;
                            width: 100% !important;
                        }
                        .gn-dashboard .subTabActive, .gn-dashboard .subTabInactive {
                            flex: 1 !important;
                            justify-content: center !important;
                            font-size: 11px !important;
                            padding: 8px 12px !important;
                        }
                        .gn-dashboard .tableWrapper {
                            overflow-x: auto !important;
                        }
                        .gn-dashboard .table {
                            min-width: 700px !important;
                        }
                        .gn-dashboard .th, .gn-dashboard .td {
                            padding: 10px 12px !important;
                            font-size: 12px !important;
                        }
                        .gn-dashboard .actions {
                            flex-wrap: wrap !important;
                        }
                        .gn-dashboard .formSection {
                            flex-direction: column !important;
                        }
                        .gn-dashboard .qrResult {
                            border-left: none !important;
                            padding-left: 0 !important;
                            margin-top: 20px !important;
                        }
                        .gn-dashboard .regForm div {
                            grid-template-columns: 1fr !important;
                        }
                        .gn-dashboard .container {
                            padding: 15px !important;
                        }
                        .gn-dashboard .header h2 {
                            font-size: 18px !important;
                        }
                        .gn-dashboard .reportBtn, .gn-dashboard .bulkActionBtn, .gn-dashboard .filterToggleBtn {
                            padding: 8px 12px !important;
                            font-size: 12px !important;
                        }
                        .gn-dashboard .modalContent {
                            width: 95% !important;
                            padding: 20px !important;
                            margin: 10px !important;
                        }
                        .gn-dashboard .filterStats {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                        }
                        .gn-dashboard .headerContainer > div:last-child {
                            width: 100% !important;
                        }
                        .gn-dashboard .headerContainer > div:last-child button {
                            flex: 1 !important;
                            justify-content: center !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .gn-dashboard .stats-row {
                            grid-template-columns: 1fr !important;
                        }
                        .gn-dashboard .container {
                            padding: 12px !important;
                        }
                        .gn-dashboard .statCard {
                            padding: 10px !important;
                        }
                        .gn-dashboard .statValue {
                            font-size: 16px !important;
                        }
                        .gn-dashboard .subTabActive, .gn-dashboard .subTabInactive {
                            font-size: 10px !important;
                            padding: 6px 10px !important;
                        }
                        .gn-dashboard .header h2 {
                            font-size: 16px !important;
                        }
                        .gn-dashboard .reportBtn, .gn-dashboard .bulkActionBtn, .gn-dashboard .filterToggleBtn {
                            padding: 6px 10px !important;
                            font-size: 11px !important;
                        }
                        .gn-dashboard .regInput {
                            padding: 10px 12px !important;
                            font-size: 13px !important;
                        }
                        .gn-dashboard .regSubmitBtn {
                            padding: 12px !important;
                            font-size: 13px !important;
                        }
                        .gn-dashboard .mobile-bottom-nav button {
                            padding: 5px 8px !important;
                            min-width: 50px !important;
                        }
                        .gn-dashboard .mobile-bottom-nav span {
                            font-size: 9px !important;
                        }
                        .gn-dashboard .mobile-bottom-nav svg {
                            width: 16px !important;
                            height: 16px !important;
                        }
                    }
                    
                    button {
                        transition: all 0.2s ease;
                        cursor: pointer;
                    }
                    button:hover {
                        opacity: 0.85;
                        transform: translateY(-1px);
                    }
                    .mobile-bottom-nav button.active {
                        color: #fbc531 !important;
                        background: rgba(251, 197, 49, 0.15) !important;
                        border-radius: 8px !important;
                    }
                `}
            </style>
        </div>
    );
}

const getStatusBadgeStyle = (status) => {
    if (status === 'Approved') return { backgroundColor: '#dcfce7', color: '#15803d' };
    if (status === 'Rejected') return { backgroundColor: '#fee2e2', color: '#b91c1c' };
    return { backgroundColor: '#fef9c3', color: '#854d0e' };
};

const styles = {
    dashboardWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Segoe UI', Roboto, sans-serif", position: 'relative' },
    notificationBox: { position: 'fixed', top: '20px', right: '20px', padding: '12px 20px', borderRadius: '10px', borderLeft: '5px solid', zIndex: 5000, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
    sidebar: { width: '260px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', padding: '20px', height: '100vh', transition: 'transform 0.3s ease' },
    logo: { fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '40px', textAlign: 'center' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer', borderRadius: '10px', transition: '0.3s', fontWeight: '500' },
    mainContent: { flex: 1, overflowX: 'auto', minWidth: 0 },
    container: { padding: '25px 30px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { backgroundColor: 'white', padding: '18px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9' },
    iconCircle: { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    statValue: { fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#1e293b' },
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
    header: { fontSize: '20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
    searchBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '280px' },
    searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%' },
    filterToggleBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' },
    reportBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' },
    bulkActionBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    advancedFiltersPanel: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' },
    filterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
    clearFiltersBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    filterInput: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' },
    filterSelect: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', minHeight: '80px' },
    filterStats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b', flexWrap: 'wrap', gap: '10px' },
    selectAllBtn: { padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    subTabContainer: { display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' },
    subTabActive: { border: 'none', backgroundColor: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#800000', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' },
    subTabInactive: { border: 'none', backgroundColor: 'transparent', padding: '10px 20px', cursor: 'pointer', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
    tableWrapper: { backgroundColor: 'white', borderRadius: '16px', overflowX: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
    thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '15px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
    td: { padding: '15px 16px', fontSize: '13px', color: '#334155' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', minWidth: '70px', textAlign: 'center', display: 'inline-block' },
    typeBadge: { padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' },
    paymentBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' },
    viewPaymentBtn: { padding: '5px 8px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569', transition: '0.2s' },
    actions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    viewBtn: { padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#64748b', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:'600' },
    approveBtn: { padding: '6px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    rejectBtn: { padding: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    loader: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '15px', color: '#800000', fontWeight: 'bold' },
    formSection: { display: 'flex', gap: '30px', backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap' },
    regForm: { display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: '280px' },
    regInput: { padding: '12px 15px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' },
    formError: { color: '#dc2626', fontSize: '12px', marginTop: '-8px' },
    regSubmitBtn: { padding: '14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' },
    qrResult: { flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #f1f5f9', paddingLeft: '30px', minWidth: '220px' },
    printBtn: { marginTop: '20px', display: 'flex', gap: '8px', padding: '10px 20px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 6000, backdropFilter: 'blur(4px)' },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    textArea: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '15px', fontSize: '14px', resize: 'vertical', outline: 'none' },
    cancelBtn: { padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
    confirmRejectBtn: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    bulkApproveBtn: { padding: '12px 20px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
    bulkArchiveBtn: { padding: '12px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
    mobileBottomNav: { display: 'none' },
    mobileNavBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '11px', fontWeight: '500', transition: 'all 0.2s ease', minWidth: '60px', borderRadius: '8px' },
    mobileNavText: { fontSize: '10px', fontWeight: '500' },
    mobileCardsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    mobileDataCard: { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' },
    mobileDataTitle: { fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    mobileDataRow: { fontSize: '12px', color: '#334155', marginBottom: '6px' },
    mobileCardActions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
    mobileEmpty: { textAlign: 'center', padding: '20px', color: '#64748b' }
};

export default GramaNiladhariDashboard;