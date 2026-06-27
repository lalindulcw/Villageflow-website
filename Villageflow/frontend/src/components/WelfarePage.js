import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE, BASE_URL } from '../config';
import { 
    UserPlus, ShieldCheck, Edit, Trash2, Search, FileDown, 
    AlertCircle, Loader, RefreshCw, CheckCircle, XCircle, Eye, 
    FileText, Printer, DollarSign, Home, User, FileImage,
    ChevronLeft, ChevronRight, X, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function WelfarePage() {
    // State Management
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ 
        fullName: '', nic: '', householdNo: '', type: 'Aswasuma', amount: '', income: '' 
    });
    const [maxIncome, setMaxIncome] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [errors, setErrors] = useState({});
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedWelfare, setSelectedWelfare] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPaySlipModal, setShowPaySlipModal] = useState(false);
    const [selectedPaySlip, setSelectedPaySlip] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        totalAmount: 0
    });

    // Fetch beneficiaries with loading state
    const fetchBeneficiaries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/welfare/all`);
            setBeneficiaries(res.data);
            setFilteredBeneficiaries(res.data);
            calculateStats(res.data);
            setStatusMessage({ type: 'success', message: 'දත්ත සාර්ථකව පූරණය කළා' });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 2000);
        } catch (err) { 
            console.error("Error fetching beneficiaries:", err);
            setStatusMessage({ type: 'error', message: 'දත්ත ලබාගැනීම අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න.' });
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate statistics
    const calculateStats = (data) => {
        const active = data.filter(w => w.status === 'Active').length;
        const suspended = data.filter(w => w.status === 'Suspended').length;
        const pending = data.filter(w => w.status === 'Pending').length;
        const totalAmount = data.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
        
        setStats({
            total: data.length,
            active,
            suspended,
            pending,
            totalAmount
        });
    };

    useEffect(() => {
        fetchBeneficiaries();
    }, [fetchBeneficiaries]);

    // Filter and Search functionality
    useEffect(() => {
        let filtered = [...beneficiaries];
        
        if (searchTerm) {
            filtered = filtered.filter(w => 
                w.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.nic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                w.householdNo?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(w => w.status === statusFilter);
        }
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(w => w.type === typeFilter);
        }
        
        if (maxIncome) {
            filtered = filtered.filter(w => (w.income || 0) <= parseFloat(maxIncome));
        }
        
        setFilteredBeneficiaries(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter, maxIncome, beneficiaries]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBeneficiaries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBeneficiaries.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Validation functions
    const validateNIC = (value) => {
        if (!value) return false;
        const oldNic = /^[0-9]{9}[vVxX]$/;
        const newNic = /^[0-9]{12}$/;
        return oldNic.test(value) || newNic.test(value);
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullName?.trim()) {
            newErrors.fullName = 'සම්පූර්ණ නම අවශ්‍යයි';
        } else if (formData.fullName.length < 3) {
            newErrors.fullName = 'නම අවම වශයෙන් අකුරු 3ක් විය යුතුය';
        }
        
        if (!formData.nic) {
            newErrors.nic = 'NIC අංකය අවශ්‍යයි';
        } else if (!validateNIC(formData.nic)) {
            newErrors.nic = 'නිවැරදි NIC අංකයක් ඇතුළත් කරන්න';
        }
        
        if (!formData.householdNo?.trim()) {
            newErrors.householdNo = 'නිවාස අංකය අවශ්‍යයි';
        }
        
        if (!formData.amount) {
            newErrors.amount = 'දීමනා මුදල අවශ්‍යයි';
        } else if (parseFloat(formData.amount) < 0) {
            newErrors.amount = 'දීමනා මුදල ධන අගයක් විය යුතුය';
        }
        
        if (!formData.income) {
            newErrors.income = 'මාසික ආදායම අවශ්‍යයි';
        } else if (parseFloat(formData.income) < 0) {
            newErrors.income = 'මාසික ආදායම ධන අගයක් විය යුතුය';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setStatusMessage({ type: 'error', message: 'කරුණාකර පෝරමය නිවැරදිව පුරවන්න' });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
            return;
        }

        setSubmitting(true);
        
        try {
            if (isEditing) {
                await axios.put(`${API_BASE}/welfare/update/${isEditing}`, formData);
                setStatusMessage({ type: 'success', message: 'සාර්ථකව යාවත්කාලීන කළා' });
            } else {
                await axios.post(`${API_BASE}/welfare/add`, formData);
                setStatusMessage({ type: 'success', message: 'සාර්ථකව එකතු කළා' });
            }
            resetForm();
            fetchBeneficiaries();
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
        } catch (err) { 
            console.error("Submit error:", err);
            const errorMsg = err.response?.data?.error || 'දෝෂයක් ඇති විය';
            setStatusMessage({ type: 'error', message: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("මෙම දත්ත ඉවත් කිරීමට ඔබට විශ්වාසද?\n\n⚠️ මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.")) {
            return;
        }
        
        setSubmitting(true);
        try {
            await axios.delete(`${API_BASE}/welfare/delete/${id}`);
            fetchBeneficiaries();
            setStatusMessage({ type: 'success', message: 'සාර්ථකව ඉවත් කළා' });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
        } catch (err) { 
            console.error("Delete error:", err);
            setStatusMessage({ type: 'error', message: 'ඉවත් කිරීම අසාර්ථකයි' });
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        const actionText = newStatus === 'Active' ? 'අනුමත' : 'අත්හිටුවන';
        
        if (!window.confirm(`ඔබට මෙම සහනාධාරය ${actionText} කිරීමට විශ්වාසද?`)) {
            return;
        }
        
        setSubmitting(true);
        try {
            await axios.put(`${API_BASE}/welfare/approve/${id}`, { status: newStatus });
            fetchBeneficiaries();
            setStatusMessage({ type: 'success', message: `තත්ත්වය ${newStatus === 'Active' ? 'අනුමත කළා' : 'අත්හිටුවා ඇත'}` });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
        } catch (err) { 
            console.error("Status toggle error:", err);
            setStatusMessage({ type: 'error', message: 'තත්ත්වය වෙනස් කිරීම අසාර්ථකයි' });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsEditing(null);
        setFormData({ fullName: '', nic: '', householdNo: '', type: 'Aswasuma', amount: '', income: '' });
        setErrors({});
    };

    const viewDetails = (welfare) => {
        setSelectedWelfare(welfare);
        setShowDetailsModal(true);
    };

    // View Pay Slip Function
    const viewPaySlip = (paySlipPath, fullName) => {
        if (!paySlipPath) {
            setStatusMessage({ type: 'error', message: 'මෙම අයදුම්පත සඳහා ආදායම් සාක්ෂියක් උඩුගත කර නොමැත' });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
            return;
        }
        
        // Extract filename from path
        const filename = paySlipPath.split('/').pop();
        const fileUrl = `${API_BASE}/welfare/pay-slip/${filename}`;
        
        setSelectedPaySlip({ url: fileUrl, name: fullName });
        setShowPaySlipModal(true);
    };

    // Download Pay Slip Function
    const downloadPaySlip = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `pay_slip_${filename.replace(/\s/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            setStatusMessage({ type: 'error', message: 'ගොනුව බාගත කිරීම අසාර්ථකයි' });
            setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFillColor(128, 0, 0);
        doc.rect(0, 0, 297, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("VillageFlow - Welfare Beneficiaries Report", 14, 25);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`, 14, 50);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Beneficiaries: ${stats.total}`, 14, 65);
        doc.text(`Active: ${stats.active} | Suspended: ${stats.suspended} | Pending: ${stats.pending}`, 14, 75);
        doc.text(`Total Welfare Amount: Rs. ${stats.totalAmount.toLocaleString()}`, 14, 85);
        
        const tableColumn = ["Full Name", "NIC", "House No", "Type", "Income (Rs.)", "Amount (Rs.)", "Status", "Applied Date"];
        const tableRows = filteredBeneficiaries.map(person => [
            person.fullName || 'N/A',
            person.nic || 'N/A',
            person.householdNo || 'N/A',
            person.type || 'N/A',
            (person.income || 0).toLocaleString(),
            (person.amount || 0).toLocaleString(),
            person.status || 'N/A',
            new Date(person.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 95,
            theme: 'striped',
            headStyles: { fillColor: [128, 0, 0], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 },
            fontSize: 9
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
        
        doc.save(`Welfare_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const printReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Welfare Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #8B0000; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #8B0000; color: white; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .stats { margin: 20px 0; padding: 10px; background: #f5f5f5; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>VillageFlow - Welfare Beneficiaries Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="stats">
                        <p><strong>Total Beneficiaries:</strong> ${stats.total} | 
                           <strong>Active:</strong> ${stats.active} | 
                           <strong>Suspended:</strong> ${stats.suspended} | 
                           <strong>Pending:</strong> ${stats.pending}</p>
                        <p><strong>Total Amount:</strong> Rs. ${stats.totalAmount.toLocaleString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Name</th><th>NIC</th><th>Type</th><th>Income</th><th>Amount</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${filteredBeneficiaries.map(person => `
                                <tr>
                                    <td>${person.fullName || 'N/A'}</td>
                                    <td>${person.nic || 'N/A'}</td>
                                    <td>${person.type || 'N/A'}</td>
                                    <td>Rs. ${(person.income || 0).toLocaleString()}</td>
                                    <td>Rs. ${(person.amount || 0).toLocaleString()}</td>
                                    <td>${person.status || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTypeFilter('all');
        setMaxIncome('');
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Active': return { bg: '#dcfce7', color: '#10c577', icon: <CheckCircle size={12} /> };
            case 'Suspended': return { bg: '#fee2e2', color: '#991b1b', icon: <XCircle size={12} /> };
            default: return { bg: '#fff3cd', color: '#856404', icon: <AlertCircle size={12} /> };
        }
    };

    return (
        <div className="welfare-page" style={styles.container}>
            {/* Header Section */}
            <div className="welfare-header-section" style={styles.headerSection}>
                <div>
                    <h1 style={styles.mainTitle}>සහනාධාර කළමනාකරණ පද්ධතිය</h1>
                    <p style={styles.subtitle}>ප්‍රතිලාභීන්ගේ තොරතුරු කළමනාකරණය කරන්න</p>
                </div>
                <button onClick={fetchBeneficiaries} style={styles.refreshBtn} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} /> 
                    {loading ? 'පූරණය වෙමින්...' : 'නැවුම් කරන්න'}
                </button>
            </div>

            {/* Statistics Cards */}
            <div style={styles.statsGrid}>
                <div style={{...styles.statCard, borderTop: '4px solid #8B0000'}}>
                    <div><FileText size={24} color="#8B0000" /></div>
                    <div style={styles.statNumber}>{stats.total}</div>
                    <div style={styles.statLabel}>මුළු ප්‍රතිලාභීන්</div>
                </div>
                <div style={{...styles.statCard, borderTop: '4px solid #10b981'}}>
                    <div><CheckCircle size={24} color="#10b981" /></div>
                    <div style={styles.statNumber}>{stats.active}</div>
                    <div style={styles.statLabel}>ක්‍රියාකාරී</div>
                </div>
                <div style={{...styles.statCard, borderTop: '4px solid #ef4444'}}>
                    <div><XCircle size={24} color="#ef4444" /></div>
                    <div style={styles.statNumber}>{stats.suspended}</div>
                    <div style={styles.statLabel}>අත්හිටුවා ඇත</div>
                </div>
                <div style={{...styles.statCard, borderTop: '4px solid #f59e0b'}}>
                    <div><AlertCircle size={24} color="#f59e0b" /></div>
                    <div style={styles.statNumber}>{stats.pending}</div>
                    <div style={styles.statLabel}>බලාපොරොත්තුවෙන්</div>
                </div>
                <div style={{...styles.statCard, borderTop: '4px solid #3b82f6'}}>
                    <div><DollarSign size={24} color="#3b82f6" /></div>
                    <div style={styles.statNumber}>රු. {stats.totalAmount.toLocaleString()}</div>
                    <div style={styles.statLabel}>මුළු වියදම</div>
                </div>
            </div>

            {/* Status Message */}
            {statusMessage.message && (
                <div style={{
                    ...styles.statusMsg,
                    backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
                    borderLeft: `4px solid ${statusMessage.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                    {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {statusMessage.message}
                </div>
            )}

            {/* Filters Bar */}
            <div className="welfare-filters-bar" style={styles.filtersBar}>
                <div style={styles.searchBox}>
                    <Search size={18} color="#64748b" />
                    <input 
                        type="text" 
                        placeholder="නම, NIC හෝ නිවාස අංකයෙන් සොයන්න..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
                
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
                    <option value="all">සියලුම තත්ත්වයන්</option>
                    <option value="Active">ක්‍රියාකාරී</option>
                    <option value="Suspended">අත්හිටුවා ඇත</option>
                    <option value="Pending">බලාපොරොත්තුවෙන්</option>
                </select>
                
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.filterSelect}>
                    <option value="all">සියලුම වර්ග</option>
                    <option value="Aswasuma">අස්වැසුම</option>
                    <option value="Samurdhi">සමෘද්ධි</option>
                    <option value="Elderly Allowance">වැඩිහිටි දීමනාව</option>
                </select>
                
                <div style={styles.incomeFilter}>
                    <DollarSign size={16} color="#64748b" />
                    <input 
                        type="number" 
                        placeholder="උපරිම ආදායම" 
                        value={maxIncome} 
                        onChange={(e) => setMaxIncome(e.target.value)} 
                        style={styles.incomeInput}
                    />
                </div>
                
                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || maxIncome) && (
                    <button onClick={clearFilters} style={styles.clearBtn}>
                        <X size={14} /> පැහැදිලි කරන්න
                    </button>
                )}
                
                <div className="welfare-report-btns" style={styles.reportBtns}>
                    <button onClick={downloadPDF} style={styles.pdfBtn}>
                        <FileDown size={16} /> PDF
                    </button>
                    <button onClick={printReport} style={styles.printBtn}>
                        <Printer size={16} /> මුද්‍රණය
                    </button>
                </div>
            </div>

            {/* Form Card */}
            <div style={styles.card}>
                <h4 style={styles.cardTitle}>
                    {isEditing ? <Edit size={20} /> : <UserPlus size={20} />} 
                    {isEditing ? "ප්‍රතිලාභී තොරතුරු සංස්කරණය" : "නව ප්‍රතිලාභියෙකු ලියාපදිංචි කරන්න"}
                </h4>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div className="welfare-form-row" style={styles.formRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><User size={14} /> සම්පූර්ණ නම *</label>
                            <input 
                                name="fullName" 
                                type="text" 
                                placeholder="උදා: ජයසිංහ ඒ.එම්. සුනිල්" 
                                value={formData.fullName} 
                                onChange={handleInputChange} 
                                style={{...styles.input, borderColor: errors.fullName ? '#ef4444' : '#e2e8f0'}}
                            />
                            {errors.fullName && <span style={styles.errorText}>{errors.fullName}</span>}
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>NIC අංකය *</label>
                            <input 
                                name="nic" 
                                type="text" 
                                placeholder="උදා: 991234567V හෝ 199912345678" 
                                value={formData.nic} 
                                onChange={handleInputChange} 
                                style={{...styles.input, borderColor: errors.nic ? '#ef4444' : '#e2e8f0'}}
                            />
                            {errors.nic && <span style={styles.errorText}>{errors.nic}</span>}
                        </div>
                    </div>

                    <div className="welfare-form-row" style={styles.formRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><Home size={14} /> නිවාස අංකය *</label>
                            <input 
                                name="householdNo" 
                                type="text" 
                                placeholder="උදා: 123/A, මරදාන" 
                                value={formData.householdNo} 
                                onChange={handleInputChange} 
                                style={{...styles.input, borderColor: errors.householdNo ? '#ef4444' : '#e2e8f0'}}
                            />
                            {errors.householdNo && <span style={styles.errorText}>{errors.householdNo}</span>}
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>සහනාධාර වර්ගය *</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} style={styles.select}>
                                <option value="Aswasuma">🏠 අස්වැසුම</option>
                                <option value="Samurdhi">🤝 සමෘද්ධි</option>
                                <option value="Elderly Allowance">👴 වැඩිහිටි දීමනාව</option>
                            </select>
                        </div>
                    </div>

                    <div className="welfare-form-row" style={styles.formRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><DollarSign size={14} /> දීමනා මුදල (රු.) *</label>
                            <input 
                                name="amount" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.amount} 
                                onChange={handleInputChange} 
                                style={{...styles.input, borderColor: errors.amount ? '#ef4444' : '#e2e8f0'}}
                            />
                            {errors.amount && <span style={styles.errorText}>{errors.amount}</span>}
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><DollarSign size={14} /> මාසික ආදායම (රු.) *</label>
                            <input 
                                name="income" 
                                type="number" 
                                placeholder="0.00" 
                                value={formData.income} 
                                onChange={handleInputChange} 
                                style={{...styles.input, borderColor: errors.income ? '#ef4444' : '#e2e8f0'}}
                            />
                            {errors.income && <span style={styles.errorText}>{errors.income}</span>}
                        </div>
                    </div>

                    <div className="welfare-form-actions" style={styles.formActions}>
                        <button 
                            type="submit" 
                            disabled={submitting || loading} 
                            style={{...styles.submitBtn, opacity: (submitting || loading) ? 0.6 : 1}}
                        >
                            {submitting ? <Loader size={18} className="spin" /> : (isEditing ? <Edit size={18} /> : <UserPlus size={18} />)}
                            {submitting ? 'සැකසෙමින්...' : (isEditing ? "යාවත්කාලීන කරන්න" : "ලියාපදිංචි කරන්න")}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={styles.cancelBtn}>
                                <X size={18} /> අවලංගු කරන්න
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Table Section */}
            <div style={styles.tableWrapper}>
                <div style={styles.tableHeader}>
                    <h3 style={styles.tableTitle}>ප්‍රතිලාභීන් ලැයිස්තුව</h3>
                    <span style={styles.tableCount}>ප්‍රතිඵල: {filteredBeneficiaries.length}</span>
                </div>
                
                {loading ? (
                    <div style={styles.loadingContainer}>
                        <Loader size={40} className="spin" color="#8B0000" />
                        <p>දත්ත පූරණය වෙමින්...</p>
                    </div>
                ) : (
                    <>
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>#</th>
                                        <th style={styles.th}>නම</th>
                                        <th style={styles.th}>NIC</th>
                                        <th style={styles.th}>නිවාස අංකය</th>
                                        <th style={styles.th}>වර්ගය</th>
                                        <th style={styles.th}>ආදායම</th>
                                        <th style={styles.th}>මුදල</th>
                                        <th style={styles.th}>තත්ත්වය</th>
                                        <th style={styles.th}>ආදායම් සාක්ෂිය</th>
                                        <th style={styles.th}>ක්‍රියා</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" style={styles.noData}>
                                                <AlertCircle size={24} color="#cbd5e1" />
                                                <p>ප්‍රතිලාභීන් හමු නොවීය</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((person, index) => {
                                            const statusStyle = getStatusColor(person.status);
                                            return (
                                                <tr key={person._id} style={styles.tableRow}>
                                                    <td style={styles.td}>{indexOfFirstItem + index + 1}</td>
                                                    <td style={styles.td}>
                                                        <strong>{person.fullName}</strong>
                                                    </td>
                                                    <td style={styles.td}>{person.nic}</td>
                                                    <td style={styles.td}>{person.householdNo}</td>
                                                    <td style={styles.td}>
                                                        <span style={styles.typeBadge}>
                                                            {person.type === 'Aswasuma' && '🏠 අස්වැසුම'}
                                                            {person.type === 'Samurdhi' && '🤝 සමෘද්ධි'}
                                                            {person.type === 'Elderly Allowance' && '👴 වැඩිහිටි'}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>රු. {person.income?.toLocaleString()}</td>
                                                    <td style={styles.td}>රු. {person.amount?.toLocaleString()}</td>
                                                    <td style={styles.td}>
                                                        <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.color}}>
                                                            {statusStyle.icon} {person.status === 'Active' ? 'ක්‍රියාකාරී' : (person.status === 'Suspended' ? 'අත්හිටුවා ඇත' : 'බලාපොරොත්තුවෙන්')}
                                                        </span>
                                                    </td>
                                                    <td style={styles.td}>
                                                        {person.paySlip ? (
                                                            <button 
                                                                onClick={() => viewPaySlip(person.paySlip, person.fullName)}
                                                                style={styles.viewFileBtn}
                                                                title="ආදායම් සාක්ෂිය බලන්න"
                                                            >
                                                                <FileImage size={16} /> බලන්න
                                                            </button>
                                                        ) : (
                                                            <span style={styles.noFileText}>
                                                                <XCircle size={12} /> උඩුගත කර නැත
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.actionGroup}>
                                                            <button 
                                                                onClick={() => viewDetails(person)} 
                                                                style={styles.viewBtn}
                                                                title="විස්තර බලන්න"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => { setIsEditing(person._id); setFormData(person); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                                                                style={styles.editBtn}
                                                                title="සංස්කරණය"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => toggleStatus(person._id, person.status)} 
                                                                style={person.status === 'Active' ? styles.suspendBtn : styles.activateBtn}
                                                                title={person.status === 'Active' ? 'අත්හිටුවන්න' : 'සක්‍රිය කරන්න'}
                                                            >
                                                                <ShieldCheck size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(person._id)} 
                                                                style={styles.deleteBtn}
                                                                title="මකන්න"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {totalPages > 1 && (
                            <div style={styles.pagination}>
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    disabled={currentPage === 1}
                                    style={styles.pageBtn}
                                >
                                    <ChevronLeft size={16} /> පෙර
                                </button>
                                <span style={styles.pageInfo}>
                                    පිටුව {currentPage} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    disabled={currentPage === totalPages}
                                    style={styles.pageBtn}
                                >
                                    ඊළඟ <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedWelfare && (
                <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>ප්‍රතිලාභී විස්තර</h3>
                            <button onClick={() => setShowDetailsModal(false)} style={styles.modalClose}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>සම්පූර්ණ නම:</span>
                                <span>{selectedWelfare.fullName}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>NIC අංකය:</span>
                                <span>{selectedWelfare.nic}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>නිවාස අංකය:</span>
                                <span>{selectedWelfare.householdNo}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>සහනාධාර වර්ගය:</span>
                                <span>{selectedWelfare.type}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>මාසික ආදායම:</span>
                                <span>රු. {selectedWelfare.income?.toLocaleString()}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>දීමනා මුදල:</span>
                                <span>රු. {selectedWelfare.amount?.toLocaleString()}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>තත්ත්වය:</span>
                                <span style={{...styles.statusBadge, backgroundColor: getStatusColor(selectedWelfare.status).bg, color: getStatusColor(selectedWelfare.status).color}}>
                                    {selectedWelfare.status}
                                </span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>අයදුම් කළ දිනය:</span>
                                <span>{new Date(selectedWelfare.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>අවසන් වෙනස් කිරීම:</span>
                                <span>{new Date(selectedWelfare.updatedAt).toLocaleString()}</span>
                            </div>
                            {selectedWelfare.paySlip && (
                                <div style={styles.detailRow}>
                                    <span style={styles.detailLabel}>ආදායම් සාක්ෂිය:</span>
                                    <button 
                                        onClick={() => viewPaySlip(selectedWelfare.paySlip, selectedWelfare.fullName)}
                                        style={styles.modalViewFileBtn}
                                    >
                                        <FileImage size={14} /> බලන්න
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={() => setShowDetailsModal(false)} style={styles.modalCloseBtn}>වසන්න</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Slip Modal */}
            {showPaySlipModal && selectedPaySlip && (
                <div style={styles.modalOverlay} onClick={() => setShowPaySlipModal(false)}>
                    <div style={styles.paySlipModal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>ආදායම් සාක්ෂිය - {selectedPaySlip.name}</h3>
                            <button onClick={() => setShowPaySlipModal(false)} style={styles.modalClose}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={styles.paySlipBody}>
                            {selectedPaySlip.url.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                <img 
                                    src={selectedPaySlip.url} 
                                    alt="Pay Slip" 
                                    style={styles.paySlipImage}
                                />
                            ) : (
                                <iframe 
                                    src={selectedPaySlip.url} 
                                    title="Pay Slip"
                                    style={styles.paySlipIframe}
                                />
                            )}
                        </div>
                        <div style={styles.modalFooter}>
                            <button 
                                onClick={() => downloadPaySlip(selectedPaySlip.url, selectedPaySlip.name)}
                                style={styles.downloadFileBtn}
                            >
                                <Download size={16} /> බාගත කරන්න
                            </button>
                            <button onClick={() => setShowPaySlipModal(false)} style={styles.modalCloseBtn}>වසන්න</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '1400px', margin: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
    headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
    mainTitle: { fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 },
    subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
    refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#64748b', transition: 'all 0.2s' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' },
    statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginTop: '8px' },
    statLabel: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
    statusMsg: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' },
    filtersBar: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white' },
    searchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '14px' },
    filterSelect: { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' },
    incomeFilter: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' },
    incomeInput: { border: 'none', outline: 'none', width: '120px', fontSize: '14px' },
    clearBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#64748b' },
    reportBtns: { display: 'flex', gap: '8px', marginLeft: 'auto' },
    pdfBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#8B0000', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    printBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    card: { backgroundColor: 'white', padding: '28px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' },
    cardTitle: { margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#334155', fontSize: '18px', fontWeight: '600' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '200px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
    input: { padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'all 0.2s' },
    select: { padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: 'white' },
    errorText: { color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' },
    formActions: { display: 'flex', gap: '12px', marginTop: '10px' },
    submitBtn: { padding: '14px 28px', backgroundColor: '#8B0000', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' },
    cancelBtn: { padding: '14px 28px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    tableWrapper: { backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' },
    tableTitle: { fontSize: '16px', fontWeight: '600', color: '#334155', margin: 0 },
    tableCount: { fontSize: '13px', color: '#64748b' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
    tableRow: { transition: 'background 0.2s' },
    noData: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px' },
    statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
    typeBadge: { fontSize: '12px', fontWeight: '500' },
    actionGroup: { display: 'flex', gap: '6px' },
    viewBtn: { padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#3b82f6' },
    editBtn: { padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#64748b' },
    suspendBtn: { padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#ef4444' },
    activateBtn: { padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#10b981' },
    deleteBtn: { padding: '6px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', color: '#ef4444' },
    viewFileBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' },
    noFileText: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '20px', borderTop: '1px solid #e2e8f0' },
    pageBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' },
    pageInfo: { fontSize: '13px', color: '#64748b' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' },
    paySlipModal: { backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' },
    modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
    modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
    paySlipBody: { flex: 1, padding: '20px', overflow: 'auto', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    paySlipImage: { maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' },
    paySlipIframe: { width: '100%', height: '60vh', border: 'none' },
    detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
    detailLabel: { fontWeight: '600', color: '#64748b' },
    modalFooter: { padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCloseBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer' },
    modalViewFileBtn: { padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
    downloadFileBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};

export default WelfarePage;