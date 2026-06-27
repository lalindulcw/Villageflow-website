import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { 
    Plus, Edit, Trash2, Search, AlertTriangle, Activity, 
    CheckCircle2, PieChart as PieIcon, LayoutDashboard, X, Printer,
    Bell, Calendar, User as UserIcon, DollarSign, MapPin, CheckCircle,
    Clock, Eye, ThumbsUp, ThumbsDown, RefreshCw, Home, 
    TrendingUp, Truck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const originalWarn = console.warn;
console.warn = (...args) => {
    if (args[0]?.includes('width(-1) and height(-1)')) return;
    if (args[0]?.includes('should be greater than 0')) return;
    originalWarn(...args);
};

const API_URL = `${API_BASE}/assets`;

const TOAST_DURATION = 4000;
const CHART_HEIGHT = 240;
const CHART_MIN_WIDTH = 280;
const MAX_QUANTITY = 9999;
const MAX_PURCHASE_VALUE = 999999999;

const GOVERNMENT_ASSET_LIST = [
    "Office Desk - Wooden", "Office Chair - Ergonomic", "Steel Cupboard", "Computer Desktop Set", 
    "Laptop Computer", "Laser Printer", "Photocopy Machine", "Air Conditioner Unit", 
    "Ceiling Fan", "Water Dispenser", "Conference Table", "File Rack", 
    "Projector", "Scanner", "UPS Unit", "Telephone System", "Fire Extinguisher", 
    "Wall Clock", "First Aid Box", "Paper Shredder", "Motor Vehicle", "Office Van", 
    "Motorcycle", "Bicycle", "Office Sofa Set", "Whiteboard", "Notice Board", 
    "Calculators", "Fingerprint Machine", "CCTV Camera", "Network Router", "Server Rack",
    "Public Address System", "Water Tank", "Generator", "Grass Cutter", "Electric Kettle", 
    "Microphone Set", "Tool Kit", "Heavy Duty Stapler", "Library Cupboard", "Wooden Bench", 
    "Digital Camera", "Refrigerator", "Microwave Oven", "Handheld GPS", "Binoculars", 
    "Solar Panel System", "Extension Cord", "Emergency Lamp"
].sort();

const CATEGORIES = ['Office Equipment', 'Electronics', 'Vehicles', 'Furniture', 'Machinery', 'Safety Equipment', 'Other'];

const calculateHealth = (lastDate, condition) => {
    if (!lastDate) return 50;
    const lastService = new Date(lastDate);
    if (isNaN(lastService.getTime())) return 50;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastService) / (1000 * 60 * 60 * 24));
    
    let score = 100;
    if (diffDays > 730) score -= 60;
    else if (diffDays > 365) score -= 45;
    else if (diffDays > 180) score -= 30;
    else if (diffDays > 90) score -= 15;
    else if (diffDays > 30) score -= 5;
    
    if (condition === 'Damaged') score -= 50;
    else if (condition === 'Need Repair') score -= 35;
    
    return Math.max(0, Math.min(100, score));
};

const getHealthStatus = (health) => {
    if (health >= 80) return { text: 'Excellent', color: '#10b981' };
    if (health >= 60) return { text: 'Good', color: '#3b82f6' };
    if (health >= 40) return { text: 'Fair', color: '#f59e0b' };
    if (health >= 20) return { text: 'Poor', color: '#ef4444' };
    return { text: 'Critical', color: '#7f1d1d' };
};

const validateNic = (nic) => /^([0-9]{9}[vVxX]|[0-9]{12})$/.test(nic);
const formatCurrency = (value) => `LKR ${(value || 0).toLocaleString()}`;

function InventoryModal({ isOpen, onClose, title, children, width = '450px' }) {
    if (!isOpen) return null;

    return (
        <div
            className="inventory-modal-backdrop"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                // Must sit above sticky nav (z-index up to ~1200)
                zIndex: 6000,
                backdropFilter: 'blur(4px)',
                // Add extra top space so the modal header isn't hidden by sticky navbars
                padding: 'calc(max(16px, env(safe-area-inset-top)) + 72px) 16px 16px',
                overflowY: 'auto'
            }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="inventory-modal-surface"
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '24px',
                    maxWidth: 'min(92vw, 720px)',
                    maxHeight: 'calc(100dvh - 32px)',
                    overflow: 'auto',
                    width,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    margin: '0 auto'
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px',
                        borderBottom: '1px solid #e2e8f0'
                    }}
                >
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '8px'
                        }}
                        aria-label="Close dialog"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function scrollFieldIntoView(e) {
    try {
        e?.target?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    } catch (_) {
        // ignore
    }
}

function InventoryPage() {
    // Refs
    const chartContainerRef = useRef(null);
    const [isChartReady, setIsChartReady] = useState(false);
    
    // State Variables
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('inventory');
    const [isLoading, setIsLoading] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({ 
        itemName: '', quantity: '', condition: 'Good', 
        lastServiceDate: new Date().toISOString().split('T')[0],
        location: '', assignedTo: '', purchaseValue: '', 
        category: 'Office Equipment', notes: '', warrantyExpiry: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showAdvancedForm, setShowAdvancedForm] = useState(false);
    
    // Modal States
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [selectedAssetForBorrow, setSelectedAssetForBorrow] = useState(null);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [detailedStats, setDetailedStats] = useState(null);
    
    // Form Data States
    const [borrowForm, setBorrowForm] = useState({ 
        requestedBy: '', requestedByNic: '', expectedReturnDate: '', 
        purpose: '', quantityRequested: 1, notes: '' 
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [borrowErrors, setBorrowErrors] = useState({});
    const [borrowTouched, setBorrowTouched] = useState({});
    
    // UI States
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterValue, setFilterValue] = useState('');
    const [requestStats, setRequestStats] = useState({ pending: 0, approved: 0, rejected: 0, returned: 0, overdue: 0 });
    const [reminderStats, setReminderStats] = useState({ pending: 0, highPriority: 0, dueToday: 0 });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (chartContainerRef.current) {
                setIsChartReady(true);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [assets.length]);

    const showSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), TOAST_DURATION);
    }, []);

    const showError = useCallback((message) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(null), TOAST_DURATION);
    }, []);

    const resetForm = useCallback(() => {
        setFormData({ 
            itemName: '', quantity: '', condition: 'Good', 
            lastServiceDate: new Date().toISOString().split('T')[0],
            location: '', assignedTo: '', purchaseValue: '', 
            category: 'Office Equipment', notes: '', warrantyExpiry: '' 
        });
        setIsEditing(false);
        setEditId(null);
        setValidationErrors({});
        setShowAdvancedForm(false);
    }, []);

    const resetBorrowForm = useCallback(() => {
        setBorrowForm({ 
            requestedBy: '', requestedByNic: '', expectedReturnDate: '', 
            purpose: '', quantityRequested: 1, notes: '' 
        });
        setBorrowErrors({});
        setBorrowTouched({});
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};
        
        if (!formData.itemName) {
            errors.itemName = "Please select an item";
        } else if (!GOVERNMENT_ASSET_LIST.includes(formData.itemName)) {
            errors.itemName = "Please select a valid item from the list";
        }
        
        if (!formData.quantity && formData.quantity !== 0) {
            errors.quantity = "Quantity is required";
        } else {
            const quantityNum = parseFloat(formData.quantity);
            if (isNaN(quantityNum)) {
                errors.quantity = "Enter a valid number";
            } else if (!Number.isInteger(quantityNum)) {
                errors.quantity = "Quantity must be a whole number";
            } else if (quantityNum <= 0) {
                errors.quantity = "Quantity must be greater than 0";
            } else if (quantityNum > MAX_QUANTITY) {
                errors.quantity = `Quantity cannot exceed ${MAX_QUANTITY}`;
            }
        }
        
        if (!formData.lastServiceDate) {
            errors.lastServiceDate = "Last service date is required";
        } else {
            const selectedDate = new Date(formData.lastServiceDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (isNaN(selectedDate.getTime())) {
                errors.lastServiceDate = "Enter a valid date";
            } else if (selectedDate > today) {
                errors.lastServiceDate = "Last service date cannot be in the future";
            }
        }
        
        if (formData.purchaseValue) {
            const purchaseNum = parseFloat(formData.purchaseValue);
            if (isNaN(purchaseNum)) {
                errors.purchaseValue = "Enter a valid amount";
            } else if (purchaseNum < 0) {
                errors.purchaseValue = "Purchase value cannot be negative";
            } else if (purchaseNum > MAX_PURCHASE_VALUE) {
                errors.purchaseValue = "Purchase value is too large";
            }
        }
        
        if (formData.warrantyExpiry) {
            const warrantyDate = new Date(formData.warrantyExpiry);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (isNaN(warrantyDate.getTime())) {
                errors.warrantyExpiry = "Enter a valid date";
            } else if (warrantyDate < today) {
                errors.warrantyExpiry = "Warranty expiry date cannot be in the past";
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const validateBorrowField = useCallback((field, value) => {
        let error = '';
        
        switch(field) {
            case 'requestedBy':
                if (!value || value.trim() === '') {
                    error = "Officer name is required";
                } else if (value.length < 3) {
                    error = "Name must be at least 3 characters";
                } else if (value.length > 100) {
                    error = "Name is too long";
                }
                break;
                
            case 'requestedByNic':
                if (!value || value.trim() === '') {
                    error = "NIC number is required";
                } else if (!validateNic(value)) {
                    error = "Enter a valid NIC (e.g., 123456789V or 199912345678)";
                }
                break;
                
            case 'expectedReturnDate':
                if (!value) {
                    error = "Expected return date is required";
                } else {
                    const returnDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (isNaN(returnDate.getTime())) {
                        error = "Enter a valid date";
                    } else if (returnDate <= today) {
                        error = "Return date must be in the future";
                    }
                }
                break;
                
            case 'quantityRequested':
                const qty = parseInt(value, 10);
                if (isNaN(qty) || qty < 1) {
                    error = "Minimum 1 item required";
                } else if (selectedAssetForBorrow && qty > selectedAssetForBorrow.quantity) {
                    error = `Maximum available: ${selectedAssetForBorrow.quantity}`;
                }
                break;
                
            default:
                break;
        }
        
        return error;
    }, [selectedAssetForBorrow]);

    const validateBorrowFormComplete = useCallback(() => {
        const errors = {};
        const fields = ['requestedBy', 'requestedByNic', 'expectedReturnDate', 'quantityRequested'];
        
        fields.forEach(field => {
            const value = borrowForm[field];
            const error = validateBorrowField(field, value);
            if (error) {
                errors[field] = error;
            }
        });
        
        setBorrowErrors(errors);
        return Object.keys(errors).length === 0;
    }, [borrowForm, validateBorrowField]);

    const handleBorrowFieldChange = useCallback((field, value) => {
        // Keep typing smooth on mobile: update value only (validate onBlur / submit)
        setBorrowForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleBorrowFieldBlur = useCallback((field) => {
        setBorrowTouched(prev => ({ ...prev, [field]: true }));
        const value = borrowForm[field];
        const error = validateBorrowField(field, value);
        setBorrowErrors(prev => ({ ...prev, [field]: error }));
    }, [borrowForm, validateBorrowField]);

    // ========== API CALLS ==========
    const fetchAssets = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/all`);
            setAssets(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("Error fetching assets:", err);
            showError("Failed to load assets");
        }
    }, [showError]);

    const fetchRequests = useCallback(async () => {
        try {
            const [allRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/requests/all`),
                axios.get(`${API_URL}/requests/statistics`)
            ]);
            setRequests(Array.isArray(allRes.data) ? allRes.data : []);
            setRequestStats(statsRes.data || { pending: 0, approved: 0, rejected: 0, returned: 0, overdue: 0 });
        } catch (err) {
            console.error("Error fetching requests:", err);
            setRequests([]);
        }
    }, []);

    const fetchReminders = useCallback(async () => {
        try {
            const [pendingRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/reminders/pending`),
                axios.get(`${API_URL}/reminders/stats`)
            ]);
            setReminders(Array.isArray(pendingRes.data) ? pendingRes.data : []);
            setReminderStats(statsRes.data || { pending: 0, highPriority: 0, dueToday: 0 });
        } catch (err) {
            console.error("Error fetching reminders:", err);
            setReminders([]);
        }
    }, []);

    const fetchDetailedStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/statistics/detailed`);
            setDetailedStats(res.data);
            setShowStatsModal(true);
        } catch (err) {
            showError("Failed to load statistics");
        }
    }, [showError]);

    const checkReminders = useCallback(async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/reminders/check-all`);
            await fetchReminders();
            showSuccess("Reminders checked and updated");
        } catch (err) {
            showError("Failed to check reminders");
        } finally {
            setIsLoading(false);
        }
    }, [fetchReminders, showSuccess, showError]);

    const resolveReminder = useCallback(async (id) => {
        try {
            await axios.put(`${API_URL}/reminders/${id}/resolve`);
            await fetchReminders();
            showSuccess("Reminder resolved");
        } catch (err) {
            showError("Failed to resolve reminder");
        }
    }, [fetchReminders, showSuccess, showError]);

    const snoozeReminder = useCallback(async (id, days = 7) => {
        try {
            await axios.put(`${API_URL}/reminders/${id}/snooze`, { days });
            await fetchReminders();
            showSuccess(`Reminder snoozed for ${days} days`);
        } catch (err) {
            showError("Failed to snooze reminder");
        }
    }, [fetchReminders, showSuccess, showError]);

    const approveRequest = useCallback(async (id) => {
        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/requests/${id}/approve`, { approvedBy: "System Admin" });
            await Promise.all([fetchRequests(), fetchAssets()]);
            showSuccess("Request approved successfully");
        } catch (err) {
            showError(err.response?.data?.error || "Failed to approve request");
        } finally {
            setIsLoading(false);
        }
    }, [fetchRequests, fetchAssets, showSuccess, showError]);

    const rejectRequest = useCallback(async (id, reason = "") => {
        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/requests/${id}/reject`, { rejectedBy: "System Admin", rejectedReason: reason });
            await fetchRequests();
            showSuccess("Request rejected");
        } catch (err) {
            showError("Failed to reject request");
        } finally {
            setIsLoading(false);
        }
    }, [fetchRequests, showSuccess, showError]);

    const returnAsset = useCallback(async (id) => {
        setIsLoading(true);
        try {
            await axios.put(`${API_URL}/requests/${id}/return`);
            await Promise.all([fetchRequests(), fetchAssets()]);
            showSuccess("Asset returned successfully");
        } catch (err) {
            showError("Failed to return asset");
        } finally {
            setIsLoading(false);
        }
    }, [fetchRequests, fetchAssets, showSuccess, showError]);

    // ========== FORM HANDLERS ==========
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            const submitData = {
                ...formData,
                quantity: parseInt(formData.quantity, 10),
                purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : undefined
            };
            
            if (isEditing) {
                await axios.put(`${API_URL}/update/${editId}`, submitData);
                showSuccess("Asset updated successfully!");
            } else {
                await axios.post(`${API_URL}/add`, submitData);
                showSuccess("New asset added successfully!");
            }
            
            resetForm();
            await Promise.all([fetchAssets(), fetchReminders()]);
        } catch (err) { 
            showError(err.response?.data?.error || "Failed to save data");
        } finally {
            setIsLoading(false);
        }
    }, [formData, isEditing, editId, validateForm, resetForm, fetchAssets, fetchReminders, showSuccess, showError]);

    const handleBorrowRequest = useCallback(async (e) => {
        e.preventDefault();
        
        if (!validateBorrowFormComplete()) {
            setBorrowTouched({
                requestedBy: true,
                requestedByNic: true,
                expectedReturnDate: true,
                quantityRequested: true
            });
            return;
        }
        
        if (!selectedAssetForBorrow) {
            showError("No asset selected");
            return;
        }
        
        setIsLoading(true);
        
        try {
            const requestData = {
                assetId: selectedAssetForBorrow._id,
                assetName: selectedAssetForBorrow.itemName,
                requestedBy: borrowForm.requestedBy.trim(),
                requestedByNic: borrowForm.requestedByNic.trim().toUpperCase(),
                expectedReturnDate: borrowForm.expectedReturnDate,
                purpose: borrowForm.purpose?.trim() || '',
                quantityRequested: parseInt(borrowForm.quantityRequested, 10),
                notes: borrowForm.notes?.trim() || ''
            };
            
            const response = await axios.post(`${API_URL}/requests/create`, requestData);
            
            if (response.data?.success) {
                showSuccess("Borrow request submitted successfully!");
                setShowBorrowModal(false);
                resetBorrowForm();
                setSelectedAssetForBorrow(null);
                await Promise.all([fetchRequests(), fetchAssets()]);
            } else {
                showError(response.data?.error || 'Request failed');
            }
        } catch (err) {
            console.error('Request error:', err);
            if (err.response) {
                showError(err.response.data?.error || `Server error: ${err.response.status}`);
            } else if (err.request) {
                showError('No response from server. Check if backend is running on port 5000');
            } else {
                showError('Error: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [borrowForm, selectedAssetForBorrow, validateBorrowFormComplete, resetBorrowForm, fetchRequests, fetchAssets, showSuccess, showError]);

    const confirmDelete = useCallback(async () => {
        if (!deleteTargetId) return;
        setIsLoading(true);
        try {
            await axios.delete(`${API_URL}/delete/${deleteTargetId}`);
            showSuccess("Asset deleted successfully!");
            setShowConfirm(false);
            setDeleteTargetId(null);
            await Promise.all([fetchAssets(), fetchReminders()]);
        } catch(err) { 
            showError("Failed to delete asset");
        } finally {
            setIsLoading(false);
        }
    }, [deleteTargetId, fetchAssets, fetchReminders, showSuccess, showError]);

    const generatePDF = useCallback(() => {
        if (assets.length === 0) {
            showError("No data to generate report");
            return;
        }
        
        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const timestamp = new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' });
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("ASSET INVENTORY REPORT", 148.5, 15, { align: "center" });
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text("VillageFlow - Asset Management System", 148.5, 22, { align: "center" });
            doc.setFontSize(9);
            doc.text(`Generated: ${timestamp}`, 14, 35);
            doc.text(`Total Assets: ${assets.length}`, 14, 41);
            
            const good = assets.filter(a => a.condition === 'Good').length;
            const repair = assets.filter(a => a.condition === 'Need Repair').length;
            const damaged = assets.filter(a => a.condition === 'Damaged').length;
            doc.text(`Good: ${good} | Need Repair: ${repair} | Damaged: ${damaged}`, 14, 55);
            
            const tableColumn = ["#", "Asset Name", "Qty", "Condition", "Health", "Location", "Assigned To", "Last Service"];
            const tableRows = assets.map((asset, i) => [
                `${i+1}`, asset.itemName, asset.quantity.toString(), asset.condition,
                `${calculateHealth(asset.lastServiceDate, asset.condition)}%`,
                asset.location || 'N/A', asset.assignedTo || 'Not Assigned',
                asset.lastServiceDate ? new Date(asset.lastServiceDate).toLocaleDateString() : 'N/A'
            ]);
            
            autoTable(doc, { 
                head: [tableColumn], body: tableRows, startY: 65, theme: 'striped',
                headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontSize: 8 },
                styles: { fontSize: 7 }
            });
            
            doc.save(`Asset_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            showSuccess("PDF report generated successfully!");
        } catch (error) {
            showError("Failed to generate PDF");
        }
    }, [assets, showSuccess, showError]);

    const stats = useMemo(() => ({
        total: assets.length,
        good: assets.filter(a => a.condition === 'Good').length,
        repair: assets.filter(a => a.condition === 'Need Repair').length,
        damaged: assets.filter(a => a.condition === 'Damaged').length,
    }), [assets]);

    const chartData = useMemo(() => [
        { name: 'Good', value: stats.good, color: '#10b981' },
        { name: 'Need Repair', value: stats.repair, color: '#f59e0b' },
        { name: 'Damaged', value: stats.damaged, color: '#ef4444' },
    ], [stats]);

    const filteredAssets = useMemo(() => {
        let filtered = assets.filter(a => 
            a.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filterType === 'location' && filterValue) {
            filtered = filtered.filter(a => a.location?.toLowerCase().includes(filterValue.toLowerCase()));
        } else if (filterType === 'assignedTo' && filterValue) {
            filtered = filtered.filter(a => a.assignedTo?.toLowerCase().includes(filterValue.toLowerCase()));
        } else if (filterType === 'category' && filterValue) {
            filtered = filtered.filter(a => a.category === filterValue);
        } else if (filterType === 'condition' && filterValue) {
            filtered = filtered.filter(a => a.condition === filterValue);
        }
        
        return filtered;
    }, [assets, searchTerm, filterType, filterValue]);

    const totalAssetValue = useMemo(() => 
        assets.reduce((sum, a) => sum + (parseFloat(a.currentValue || a.purchaseValue) || 0), 0),
        [assets]
    );

    useEffect(() => {
        Promise.all([fetchAssets(), fetchRequests(), fetchReminders()]);
        checkReminders();
    }, [fetchAssets, fetchRequests, fetchReminders, checkReminders]);

    const StatusBadge = ({ status }) => {
        const stylesMap = {
            Pending: { bg: '#fef3c7', color: '#92400e', icon: <Clock size={12} /> },
            Approved: { bg: '#dcfce7', color: '#166534', icon: <ThumbsUp size={12} /> },
            Rejected: { bg: '#fee2e2', color: '#991b1b', icon: <ThumbsDown size={12} /> },
            Returned: { bg: '#e0e7ff', color: '#3730a3', icon: <CheckCircle size={12} /> },
            Overdue: { bg: '#fef2f2', color: '#dc2626', icon: <AlertTriangle size={12} /> }
        };
        const s = stylesMap[status] || stylesMap.Pending;
        
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                fontWeight: '600', backgroundColor: s.bg, color: s.color
            }}>
                {s.icon} {status}
            </span>
        );
    };

    const ConditionBadge = ({ condition }) => {
        const config = {
            Good: { color: '#065f46', bg: '#d1fae5', icon: '✓' },
            'Need Repair': { color: '#92400e', bg: '#fef3c7', icon: '⚙' },
            Damaged: { color: '#991b1b', bg: '#fee2e2', icon: '✗' }
        };
        const c = config[condition] || config.Good;
        
        return (
            <span style={{
                padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap',
                color: c.color, backgroundColor: c.bg
            }}>
                {c.icon} {condition}
            </span>
        );
    };

    const HealthBar = ({ health }) => {
        const status = getHealthStatus(health);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${health}%`, height: '100%', backgroundColor: status.color, transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: '500', color: status.color }}>
                    {health}% - {status.text}
                </span>
            </div>
        );
    };

    const Toast = ({ message, type, onClose }) => (
        <div className="inventory-page" style={{
            position: 'fixed', top: '16px', right: '16px',
            backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white', padding: '12px 20px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1300,
            width: 'min(420px, calc(100vw - 32px))', animation: 'slideInRight 0.3s ease'
        }}>
            {type === 'success' ? <CheckCircle2 size={20} color="#fff" /> : <AlertTriangle size={20} color="#fff" />}
            <span style={{ flex: 1, fontSize: '13px', fontWeight: '500' }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, padding: '4px' }}>
                <X size={16} />
            </button>
        </div>
    );

    return (
        <div style={{
            padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", position: 'relative'
        }}>
            {successMessage && <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}
            {errorMessage && <Toast message={errorMessage} type="error" onClose={() => setErrorMessage(null)} />}

            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '28px', flexWrap: 'wrap', gap: '15px'
            }}>
                <div>
                    <h2 style={{
                        margin: 0, display: 'flex', alignItems: 'center', gap: '12px',
                        color: '#0f172a', fontSize: '24px', fontWeight: '700'
                    }}>
                        <div style={{ backgroundColor: '#8B0000', padding: '8px', borderRadius: '12px', display: 'inline-flex' }}>
                            <Activity size={32} color="#fff" />
                        </div>
                        Asset Management System
                    </h2>
                    <p style={{ fontSize: '13px', color: '#475569', marginLeft: '52px', marginTop: '4px' }}>
                        සම්පත් කළමනාකරණය, ණයට ගැනීම් සහ නඩත්තු මතක් කිරීම්
                    </p>
                </div>
                <div className="inventory-header-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={checkReminders} disabled={isLoading} style={{
                        padding: '10px 20px', backgroundColor: '#334155', color: '#fff',
                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
                    }}>
                        <RefreshCw size={16} /> Check Reminders
                    </button>
                    <button onClick={fetchDetailedStats} style={{
                        padding: '10px 20px', backgroundColor: '#4f46e5', color: '#fff',
                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
                    }}>
                        <TrendingUp size={16} /> Statistics
                    </button>
                    <button onClick={generatePDF} style={{
                        padding: '10px 20px', backgroundColor: '#334155', color: '#fff',
                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
                    }}>
                        <Printer size={16} /> Report
                    </button>
                </div>
            </div>

            <div className="inventory-stats-row" style={{
                display: 'flex', backgroundColor: '#fff', padding: '24px',
                borderRadius: '20px', marginBottom: '28px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
                flexWrap: 'wrap', border: '1px solid #e2e8f0'
            }}>
                {[
                    { icon: <LayoutDashboard size={22} color="#4f46e5" />, bg: '#eef2ff', label: 'Total Assets', value: stats.total },
                    { icon: <CheckCircle2 size={22} color="#10b981" />, bg: '#dcfce7', label: 'Good Condition', value: stats.good },
                    { icon: <AlertTriangle size={22} color="#f59e0b" />, bg: '#fef3c7', label: 'Need Repair', value: stats.repair },
                    { icon: <Trash2 size={22} color="#ef4444" />, bg: '#fee2e2', label: 'Damaged', value: stats.damaged },
                    { icon: <Bell size={22} color="#9333ea" />, bg: '#f3e8ff', label: 'Pending Reminders', value: reminderStats.pending, valueColor: reminderStats.pending > 0 ? '#ef4444' : '#10b981' }
                ].map((stat, idx) => (
                    <div key={idx} style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '0 20px', minWidth: '160px',
                        borderRight: idx === 4 ? 'none' : '1px solid #e2e8f0'
                    }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: stat.bg }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.valueColor || '#0f172a' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="inventory-tabs-row" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                {[
                    { id: 'inventory', icon: <Home size={16} />, label: 'Inventory', count: assets.length },
                    { id: 'requests', icon: <Truck size={16} />, label: 'Requests', count: requestStats.pending },
                    { id: 'reminders', icon: <Bell size={16} />, label: 'Reminders', count: reminderStats.pending }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 24px', backgroundColor: activeTab === tab.id ? '#8B0000' : 'transparent',
                            border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px',
                            fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
                            color: activeTab === tab.id ? '#fff' : '#64748b',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {activeTab === 'inventory' && (
                <div className="inventory-main-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '28px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>
                            <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '10px', display: 'inline-flex' }}>
                                <Plus size={18} color="#8B0000" />
                            </div>
                            {isEditing ? "Edit Asset Details" : "Register New Asset"}
                        </h4>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Asset Name *</label>
                                <select 
                                    style={{
                                        padding: '10px 12px', borderRadius: '10px',
                                        border: `1px solid ${validationErrors.itemName ? '#ef4444' : '#e2e8f0'}`,
                                        outlineColor: '#8B0000', fontSize: '13px'
                                    }} 
                                    value={formData.itemName} 
                                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                                    required
                                >
                                    <option value="">-- Select Asset --</option>
                                    {GOVERNMENT_ASSET_LIST.map((item, idx) => (
                                        <option key={idx} value={item}>{item}</option>
                                    ))}
                                </select>
                                {validationErrors.itemName && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{validationErrors.itemName}</div>}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Quantity *</label>
                                <input 
                                    type="number" step="1"
                                    style={{
                                        padding: '10px 12px', borderRadius: '10px',
                                        border: `1px solid ${validationErrors.quantity ? '#ef4444' : '#e2e8f0'}`,
                                        outlineColor: '#8B0000', fontSize: '13px'
                                    }} 
                                    value={formData.quantity} 
                                    onChange={(e) => {
                                        setFormData({...formData, quantity: e.target.value});
                                        validateForm();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === '.' || e.key === '-' || e.key === 'e') e.preventDefault();
                                    }}
                                    required 
                                />
                                {validationErrors.quantity && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{validationErrors.quantity}</div>}
                            </div>
                            
                            <button type="button" onClick={() => setShowAdvancedForm(!showAdvancedForm)} style={{
                                padding: '10px 20px', backgroundColor: '#64748b', color: '#fff',
                                border: 'none', borderRadius: '12px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontWeight: '600', fontSize: '13px', width: '100%',
                                justifyContent: 'center'
                            }}>
                                {showAdvancedForm ? '− Hide Advanced Fields' : '+ Show Advanced Fields'}
                            </button>
                            
                            {showAdvancedForm && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}><MapPin size={14} /> Location</label>
                                        <input type="text" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outlineColor: '#8B0000', fontSize: '13px' }} placeholder="e.g., Main Office, Room 101" 
                                            value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}><UserIcon size={14} /> Assigned To</label>
                                        <input type="text" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outlineColor: '#8B0000', fontSize: '13px' }} placeholder="Assigned officer name" 
                                            value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}><DollarSign size={14} /> Purchase Value (LKR)</label>
                                        <input 
                                            type="number" step="0.01"
                                            style={{
                                                padding: '10px 12px', borderRadius: '10px',
                                                border: `1px solid ${validationErrors.purchaseValue ? '#ef4444' : '#e2e8f0'}`,
                                                outlineColor: '#8B0000', fontSize: '13px'
                                            }} 
                                            placeholder="Purchase value" 
                                            value={formData.purchaseValue} 
                                            onChange={(e) => {
                                                setFormData({...formData, purchaseValue: e.target.value});
                                                validateForm();
                                            }}
                                            onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                        />
                                        {validationErrors.purchaseValue && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{validationErrors.purchaseValue}</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Category</label>
                                        <select style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', outlineColor: '#8B0000' }} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                            {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}><Calendar size={14} /> Warranty Expiry</label>
                                        <input type="date" style={{
                                            padding: '10px 12px', borderRadius: '10px',
                                            border: `1px solid ${validationErrors.warrantyExpiry ? '#ef4444' : '#e2e8f0'}`,
                                            outlineColor: '#8B0000', fontSize: '13px'
                                        }} 
                                            value={formData.warrantyExpiry} onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})} />
                                        {validationErrors.warrantyExpiry && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{validationErrors.warrantyExpiry}</div>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Notes</label>
                                        <textarea style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outlineColor: '#8B0000', fontSize: '13px', minHeight: '60px' }} placeholder="Any notes or damage reports..." 
                                            value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                                    </div>
                                </>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Last Service Date *</label>
                                <input type="date" style={{
                                    padding: '10px 12px', borderRadius: '10px',
                                    border: `1px solid ${validationErrors.lastServiceDate ? '#ef4444' : '#e2e8f0'}`,
                                    outlineColor: '#8B0000', fontSize: '13px'
                                }} 
                                    value={formData.lastServiceDate} onChange={(e) => setFormData({...formData, lastServiceDate: e.target.value})} />
                                {validationErrors.lastServiceDate && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{validationErrors.lastServiceDate}</div>}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Condition</label>
                                <select style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', outlineColor: '#8B0000' }} value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                                    <option value="Good">✓ Good Condition</option>
                                    <option value="Need Repair">⚙ Needs Maintenance</option>
                                    <option value="Damaged">✗ Damaged</option>
                                </select>
                            </div>
                            
                            <button type="submit" style={{
                                marginTop: '8px', padding: '12px', backgroundColor: '#8B0000',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                fontWeight: '600', cursor: 'pointer', fontSize: '13px',
                                transition: 'all 0.2s'
                            }} disabled={isLoading}>
                                {isLoading ? "Processing..." : (isEditing ? "Update Database" : "Save to Inventory")}
                            </button>
                            {isEditing && <button type="button" onClick={resetForm} style={{
                                marginTop: '8px', padding: '12px', backgroundColor: '#64748b',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                            }}>Cancel</button>}
                        </form>
                    </div>

                    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>
                            <div style={{ backgroundColor: '#fef2f2', padding: '6px', borderRadius: '10px', display: 'inline-flex' }}>
                                <PieIcon size={18} color="#8B0000" />
                            </div>
                            Asset Condition Analysis
                        </h4>
                        <div ref={chartContainerRef} style={{ width: '100%', height: CHART_HEIGHT, minWidth: CHART_MIN_WIDTH }}>
                            {isChartReady && chartData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    {assets.length === 0 ? "No data to display" : "Loading chart..."}
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                                Total Asset Value: {formatCurrency(totalAssetValue)}
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fafafa', flexWrap: 'wrap' }}>
                            <Search size={18} color="#64748b" />
                            <input type="text" placeholder="Search by asset name..." style={{ border: 'none', outline: 'none', width: '200px', fontSize: '13px', background: 'transparent', padding: '8px' }} onChange={(e) => setSearchTerm(e.target.value)} />
                            <select style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', outlineColor: '#8B0000', width: 'auto', marginLeft: 'auto' }} value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}>
                                <option value="all">All Assets</option>
                                <option value="location">Filter by Location</option>
                                <option value="assignedTo">Filter by Officer</option>
                                <option value="category">Filter by Category</option>
                                <option value="condition">Filter by Condition</option>
                            </select>
                            {filterType !== 'all' && (
                                <input type="text" placeholder={`Enter ${filterType}...`} style={{ border: 'none', outline: 'none', width: '150px', fontSize: '13px', background: 'transparent', padding: '8px' }} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
                            )}
                        </div>
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Asset Info</th>
                                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Status</th>
                                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Health</th>
                                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Assignment</th>
                                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssets.length > 0 ? filteredAssets.map(asset => {
                                        const health = calculateHealth(asset.lastServiceDate, asset.condition);
                                        return (
                                            <tr key={asset._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{asset.itemName}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>Qty: {asset.quantity} | {asset.category || 'Uncategorized'}</div>
                                                    {asset.location && asset.location !== 'Not Specified' && asset.location !== '' && (<div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><MapPin size={10} /> {asset.location}</div>)}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                                    <ConditionBadge condition={asset.condition} />
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                                    <HealthBar health={health} />
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                                    {asset.assignedTo && asset.assignedTo !== 'Not Assigned' && asset.assignedTo !== '' ? (
                                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                                                            <UserIcon size={12} /> {asset.assignedTo}
                                                        </span>
                                                    ) : (
                                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#f1f5f9', color: '#64748b' }}>Not Assigned</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                                    <button onClick={() => { setIsEditing(true); setEditId(asset._id); setFormData({...asset, quantity: asset.quantity.toString(), lastServiceDate: asset.lastServiceDate ? new Date(asset.lastServiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], purchaseValue: asset.purchaseValue?.toString() || '', warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : ''}); setValidationErrors({}); window.scrollTo(0,0); }} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }} title="Edit Asset"><Edit size={16}/></button>
                                                    <button onClick={() => { setSelectedAssetForBorrow(asset); resetBorrowForm(); setShowBorrowModal(true); }} style={{ color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }} title="Borrow Asset"><Truck size={16}/></button>
                                                    <button onClick={() => { setDeleteTargetId(asset._id); setShowConfirm(true); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }} title="Delete Asset"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                                {searchTerm ? "No matching assets found" : "No assets registered yet"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fafafa', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={18} /> Asset Requests</h4>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#fef3c7', color: '#92400e' }}>Pending: {requestStats.pending}</span>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#dcfce7', color: '#166534' }}>Approved: {requestStats.approved}</span>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#fee2e2', color: '#991b1b' }}>Rejected: {requestStats.rejected}</span>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#e0e7ff', color: '#3730a3' }}>Returned: {requestStats.returned}</span>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Asset</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Requested By</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Qty</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Return Date</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length > 0 ? requests.map(req => (
                                    <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{req.assetName}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{req.purpose?.substring(0, 50)}...</div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                            <div>{req.requestedBy}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{req.requestedByNic}</div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>{req.quantityRequested}</td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                            {req.expectedReturnDate ? new Date(req.expectedReturnDate).toLocaleDateString() : 'N/A'}
                                            {req.status === 'Approved' && new Date(req.expectedReturnDate) < new Date() && (<div style={{ color: '#ef4444', fontSize: '10px' }}>Overdue!</div>)}
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                                            {req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => approveRequest(req._id)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px', borderRadius: '8px' }} title="Approve" disabled={isLoading}><ThumbsUp size={16}/></button>
                                                    <button onClick={() => { const reason = prompt("Enter rejection reason:"); if (reason !== null) rejectRequest(req._id, reason); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px', borderRadius: '8px' }} title="Reject" disabled={isLoading}><ThumbsDown size={16}/></button>
                                                </>
                                            )}
                                            {req.status === 'Approved' && (
                                                <button onClick={() => returnAsset(req._id)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '4px', padding: '6px', borderRadius: '8px' }} title="Mark as Returned" disabled={isLoading}><CheckCircle size={16}/></button>
                                            )}
                                            <button onClick={() => { setSelectedRequest(req); setShowRequestDetailsModal(true); }} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }} title="View Details"><Eye size={16}/></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>No requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reminders' && (
                <div style={{ backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fafafa', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} /> Maintenance Reminders</h4>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#fee2e2', color: '#dc2626' }}>High Priority: {reminderStats.highPriority}</span>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', whiteSpace: 'nowrap', backgroundColor: '#fef3c7', color: '#d97706' }}>Due Today: {reminderStats.dueToday}</span>
                        </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {reminders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                <CheckCircle2 size={48} style={{ marginBottom: '16px', color: '#10b981' }} />
                                <p>No pending reminders! All assets are up to date.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {reminders.map(rem => (
                                    <div key={rem._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', borderLeft: `4px solid ${rem.priority === 'high' ? '#ef4444' : '#f59e0b'}`, flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                                            <div style={{ padding: '8px', backgroundColor: rem.reminderType === 'Warranty Expiry' ? '#fef3c7' : '#e0e7ff', borderRadius: '10px' }}>
                                                {rem.reminderType === 'Warranty Expiry' ? <AlertTriangle size={20} color="#f59e0b" /> : <Calendar size={20} color="#3b82f6" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    {rem.assetName}
                                                    {rem.priority === 'high' && <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '20px' }}>URGENT</span>}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748b' }}>{rem.reminderType}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Due: {new Date(rem.reminderDate).toLocaleDateString()}</div>
                                                {rem.notes && <div style={{ fontSize: 11, color: '#475569', marginTop: 6, backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '8px' }}>{rem.notes}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => snoozeReminder(rem._id, 7)} style={{ padding: '6px 12px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>Snooze 7d</button>
                                            <button onClick={() => resolveReminder(rem._id)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>Resolve</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Borrow Request Modal */}
            <InventoryModal isOpen={showBorrowModal} onClose={() => { setShowBorrowModal(false); setSelectedAssetForBorrow(null); resetBorrowForm(); }} title={`Borrow Asset: ${selectedAssetForBorrow?.itemName || ''}`} width="500px">
                <form onSubmit={handleBorrowRequest}>
                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Officer Name *</label>
                        <input 
                            type="text" 
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${borrowErrors.requestedBy && borrowTouched.requestedBy ? '#ef4444' : '#e2e8f0'}`,
                                outlineColor: '#8B0000', fontSize: '13px',
                                boxSizing: 'border-box'
                            }} 
                            value={borrowForm.requestedBy}
                            autoComplete="off"
                            onChange={(e) => handleBorrowFieldChange('requestedBy', e.target.value)}
                            onBlur={() => handleBorrowFieldBlur('requestedBy')}
                            onFocus={scrollFieldIntoView}
                            placeholder="Enter officer's full name" 
                        />
                        {borrowErrors.requestedBy && borrowTouched.requestedBy && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{borrowErrors.requestedBy}</div>
                        )}
                    </div>
                    
                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>NIC Number *</label>
                        <input 
                            type="text" 
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${borrowErrors.requestedByNic && borrowTouched.requestedByNic ? '#ef4444' : '#e2e8f0'}`,
                                outlineColor: '#8B0000', fontSize: '13px',
                                boxSizing: 'border-box'
                            }} 
                            placeholder="e.g., 123456789V or 199912345678" 
                            value={borrowForm.requestedByNic}
                            autoComplete="off"
                            onChange={(e) => handleBorrowFieldChange('requestedByNic', e.target.value)}
                            onBlur={() => handleBorrowFieldBlur('requestedByNic')}
                            onFocus={scrollFieldIntoView}
                        />
                        {borrowErrors.requestedByNic && borrowTouched.requestedByNic && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{borrowErrors.requestedByNic}</div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Expected Return Date *</label>
                        <input 
                            type="date" 
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${borrowErrors.expectedReturnDate && borrowTouched.expectedReturnDate ? '#ef4444' : '#e2e8f0'}`,
                                outlineColor: '#8B0000', fontSize: '13px',
                                boxSizing: 'border-box'
                            }} 
                            value={borrowForm.expectedReturnDate}
                            onChange={(e) => handleBorrowFieldChange('expectedReturnDate', e.target.value)}
                            onBlur={() => handleBorrowFieldBlur('expectedReturnDate')}
                            onFocus={scrollFieldIntoView}
                        />
                        {borrowErrors.expectedReturnDate && borrowTouched.expectedReturnDate && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{borrowErrors.expectedReturnDate}</div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Purpose</label>
                        <textarea 
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outlineColor: '#8B0000', fontSize: '13px', minHeight: '60px', boxSizing: 'border-box' }} 
                            placeholder="Why do you need this asset? (Optional)" 
                            value={borrowForm.purpose}
                            onChange={(e) => setBorrowForm(prev => ({ ...prev, purpose: e.target.value }))}
                        />
                    </div>

                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Quantity (Max: {selectedAssetForBorrow?.quantity || 0}) *</label>
                        <input 
                            type="number" 
                            min="1" 
                            max={selectedAssetForBorrow?.quantity || 1} 
                            step="1" 
                            style={{
                                width: '100%', padding: '10px 12px', borderRadius: '10px',
                                border: `1px solid ${borrowErrors.quantityRequested && borrowTouched.quantityRequested ? '#ef4444' : '#e2e8f0'}`,
                                outlineColor: '#8B0000', fontSize: '13px',
                                boxSizing: 'border-box'
                            }} 
                            value={borrowForm.quantityRequested}
                            onChange={(e) => handleBorrowFieldChange('quantityRequested', e.target.value)}
                            onBlur={() => handleBorrowFieldBlur('quantityRequested')}
                            onFocus={scrollFieldIntoView}
                        />
                        {borrowErrors.quantityRequested && borrowTouched.quantityRequested && (
                            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{borrowErrors.quantityRequested}</div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>Additional Notes</label>
                        <textarea 
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outlineColor: '#8B0000', fontSize: '13px', minHeight: '50px', boxSizing: 'border-box' }} 
                            placeholder="Any special requirements... (Optional)" 
                            value={borrowForm.notes}
                            onChange={(e) => setBorrowForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={() => { setShowBorrowModal(false); setSelectedAssetForBorrow(null); resetBorrowForm(); }} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', fontWeight: '500' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', backgroundColor: '#8B0000', color: '#fff', cursor: 'pointer', fontWeight: '500' }} disabled={isLoading}>{isLoading ? "Submitting..." : "Submit Request"}</button>
                    </div>
                </form>
            </InventoryModal>

            <InventoryModal isOpen={showRequestDetailsModal} onClose={() => setShowRequestDetailsModal(false)} title="Request Details" width="500px">
                <div style={{ padding: '20px' }}>
                    <p><strong>Asset:</strong> {selectedRequest?.assetName}</p>
                    <p><strong>Requested By:</strong> {selectedRequest?.requestedBy} ({selectedRequest?.requestedByNic})</p>
                    <p><strong>Quantity:</strong> {selectedRequest?.quantityRequested}</p>
                    <p><strong>Request Date:</strong> {selectedRequest?.requestDate ? new Date(selectedRequest.requestDate).toLocaleString() : 'N/A'}</p>
                    <p><strong>Expected Return:</strong> {selectedRequest?.expectedReturnDate ? new Date(selectedRequest.expectedReturnDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Purpose:</strong> {selectedRequest?.purpose || 'Not specified'}</p>
                    <p><strong>Notes:</strong> {selectedRequest?.notes || 'None'}</p>
                    <p><strong>Status:</strong> {selectedRequest?.status}</p>
                    {selectedRequest?.approvedBy && <p><strong>Approved By:</strong> {selectedRequest.approvedBy} on {selectedRequest.approvedDate ? new Date(selectedRequest.approvedDate).toLocaleString() : 'N/A'}</p>}
                    {selectedRequest?.rejectedReason && <p><strong>Rejection Reason:</strong> {selectedRequest.rejectedReason}</p>}
                </div>
            </InventoryModal>

            <InventoryModal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Asset Statistics" width="550px">
                <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>Summary</h4>
                        <p><strong>Total Assets:</strong> {detailedStats?.totalAssets}</p>
                        <p><strong>Total Purchase Value:</strong> {formatCurrency(detailedStats?.totalPurchaseValue)}</p>
                        <p><strong>Current Total Value:</strong> {formatCurrency(detailedStats?.totalValue)}</p>
                        <p><strong>Depreciation:</strong> {formatCurrency(detailedStats?.depreciation)}</p>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>By Condition</h4>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-around' }}>
                            <div><span style={{ color: '#10b981' }}>● Good:</span> {detailedStats?.byCondition?.Good || 0}</div>
                            <div><span style={{ color: '#f59e0b' }}>● Need Repair:</span> {detailedStats?.byCondition?.NeedRepair || 0}</div>
                            <div><span style={{ color: '#ef4444' }}>● Damaged:</span> {detailedStats?.byCondition?.Damaged || 0}</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>By Category</h4>
                        {Object.entries(detailedStats?.categoryStats || {}).map(([cat, data]) => (
                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                                <span>{cat}</span>
                                <span>{data.count} items ({formatCurrency(data.value)})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </InventoryModal>

            <InventoryModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Deletion" width="400px">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <p style={{ marginBottom: '24px', color: '#475569' }}>Are you sure you want to delete this asset? This action cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', fontWeight: '500' }}>Cancel</button>
                        <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '12px', backgroundColor: '#8B0000', color: '#fff', cursor: 'pointer', fontWeight: '500' }} disabled={isLoading}>Delete Asset</button>
                    </div>
                </div>
            </InventoryModal>
        </div>
    );
}

// Add CSS animation to document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes slideInRight { 
        from { opacity: 0; transform: translateX(100px); } 
        to { opacity: 1; transform: translateX(0); } 
    }
    @keyframes fadeIn { 
        from { opacity: 0; transform: translateY(-5px); } 
        to { opacity: 1; transform: translateY(0); } 
    }
    .error-message { animation: fadeIn 0.3s ease; }
    button:hover { transform: translateY(-1px); opacity: 0.95; }
    button:active { transform: translateY(0); }
    tr:hover { background-color: #fafafa; }
`;
document.head.appendChild(styleSheet);

export default InventoryPage;