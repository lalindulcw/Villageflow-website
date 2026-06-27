import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../services/languageService';
import axios from 'axios';
import { API_BASE } from '../config';
import * as Lucide from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { getPublicConfig, getAdvanceDays } from '../services/configService';

function AppointmentPage() {
    const [appointments, setAppointments] = useState([]);
    const [formData, setFormData] = useState({ nic: '', reason: '', date: '', time: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [maxDays, setMaxDays] = useState(14);
    


    const [updateMode, setUpdateMode] = useState(false);
    const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
    const [updateFormData, setUpdateFormData] = useState({ nic: '', reason: '', date: '', time: '' });
    const [updateFieldErrors, setUpdateFieldErrors] = useState({});

    
    
    // Language state
    const [lang, setLang] = useLanguage();
    const language = lang === 'en' ? 'english' : lang === 'ta' ? 'tamil' : 'sinhala';
    
    const user = JSON.parse(localStorage.getItem('user'));
    const isOfficer = user?.role === 'officer';

    // Translations
    const translations = {
        sinhala: {
            appTitle: "ස්මාර්ට් පත්වීම් කළමනාකරණය",
            downloadReport: "වාර්තාව බාගන්න",
            appointmentOverview: "පත්වීම් දළ විශ්ලේෂණය",
            searchPlaceholder: "නම හෝ NIC අංකයෙන් සොයන්න...",
            noAppointments: "කිසිදු පත්වීමක් හමු නොවීය",
            noSearchResults: "ඔබ සෙවූ පත්වීම් කිසිවක් හමු නොවීය",
            newAppointment: "නව පත්වීමක් වෙන් කරවා ගන්න",
            updateAppointment: "පත්වීම යාවත්කාලීන කරන්න",
            nicPlaceholder: "NIC (උදා: 123456789V හෝ 200012345678)",
            reasonPlaceholder: "හේතුව (අවම වශයෙන් අකුරු 3ක්)",
            selectTime: "-- වේලාව තෝරන්න --",
            selectedDate: "තෝරාගත් දිනය",
            notSelected: "දිනයක් තෝරා නැත",
            submitRequest: "ඉල්ලීම යොමු කරන්න",
            update: "යාවත්කාලීන කරන්න",
            cancel: "අවලංගු කරන්න",
            pending: "අනුමත කිරීමට බලා සිටී",
            approved: "අනුමත කරන ලදී",
            rejected: "ප්‍රතික්ෂේප කරන ලදී",
            fetchError: "දත්ත ලබා ගැනීමේ දෝෂයකි",
            updateSuccess: "පත්වීම සාර්ථකව යාවත්කාලීන කරන ලදී!",
            updateFailed: "යාවත්කාලීන කිරීම අසාර්ථකයි",
            noDataForReport: "වාර්තාවක් ජනනය කිරීමට ප්‍රමාණවත් දත්ත නොමැත",
            pdfGenerated: "PDF වාර්තාව සාර්ථකව ජනනය කරන ලදී!",
            pdfError: "PDF සෑදීමේ දෝෂයකි",
            bookingSuccess: "ඉල්ලීම සාර්ථකයි!",
            bookingFailed: "වෙන් කිරීම අසාර්ථකයි",
            statusUpdated: (status) => `පත්වීම ${status === 'Approved' ? 'අනුමත කරන ලදී' : 'ප්‍රතික්ෂේප කරන ලදී'}!`,
            statusError: "තත්වය යාවත්කාලීන කිරීමේ දෝෂයකි",
            deleteConfirm: "මෙම පත්වීම මකා දැමීමට ඔබට සහතිකද?",
            deleteSuccess: "පත්වීම සාර්ථකව මකා දමන ලදී!",
            deleteError: "මකා දැමීම අසාර්ථකයි",
            nicInvalid: "නිවැරදි NIC අංකයක් ඇතුළත් කරන්න",
            duplicateBooking: "ඔබට මෙම දිනය සඳහා දැනටමත් පවතින ඉල්ලීමක් ඇත",
            reasonRequired: "කරුණාකර හේතුව ඇතුළත් කරන්න",
            reasonMinLength: "හේතුව අවම වශයෙන් අකුරු 3ක් විය යුතුය",
            reasonMaxLength: "හේතුව අකුරු 500කට වඩා වැඩි විය නොහැක",
            dateRequired: "කරුණාකර දිනයක් තෝරන්න",
            datePast: "අදට පෙර දිනයක් තෝරා ගත නොහැක",
            dateMax: (days) => `ඉදිරි දින ${days}ක් සඳහා පමණක් වෙන් කළ හැක`,
            timeRequired: "කරුණාකර වේලාවක් තෝරන්න",
            timeUnavailable: "මෙම වේලාව දැනටමත් වෙන් කර ඇත",
        },
        english: {
            appTitle: "Smart Appointment Management",
            downloadReport: "Download Report",
            appointmentOverview: "Appointment Overview",
            searchPlaceholder: "Search by name or NIC...",
            noAppointments: "No appointments found",
            noSearchResults: "No appointments match your search",
            newAppointment: "Book New Appointment",
            updateAppointment: "Update Appointment",
            nicPlaceholder: "NIC (e.g., 123456789V or 200012345678)",
            reasonPlaceholder: "Reason (minimum 3 characters)",
            selectTime: "-- Select Time --",
            selectedDate: "Selected Date",
            notSelected: "No date selected",
            submitRequest: "Submit Request",
            update: "Update",
            cancel: "Cancel",
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            fetchError: "Error fetching data",
            updateSuccess: "Appointment updated successfully!",
            updateFailed: "Update failed",
            noDataForReport: "Insufficient data to generate report",
            pdfGenerated: "PDF report generated successfully!",
            pdfError: "Error generating PDF",
            bookingSuccess: "Request successful!",
            bookingFailed: "Booking failed",
            statusUpdated: (status) => `Appointment ${status === 'Approved' ? 'approved' : 'rejected'}!`,
            statusError: "Error updating status",
            deleteConfirm: "Are you sure you want to delete this appointment?",
            deleteSuccess: "Appointment deleted successfully!",
            deleteError: "Delete failed",
            nicInvalid: "Enter a valid NIC number",
            duplicateBooking: "You already have a pending request for this date",
            reasonRequired: "Please enter a reason",
            reasonMinLength: "Reason must be at least 3 characters",
            reasonMaxLength: "Reason cannot exceed 500 characters",
            dateRequired: "Please select a date",
            datePast: "Cannot select a date before today",
            dateMax: (days) => `Bookings allowed only for the next ${days} days`,
            timeRequired: "Please select a time",
            timeUnavailable: "This time slot is already booked",
        },
        tamil: {
            appTitle: "ஸ்மார்ட் சந்திப்பு மேலாண்மை",
            downloadReport: "அறிக்கையைப் பதிவிறக்குக",
            appointmentOverview: "சந்திப்பு கண்ணோட்டம்",
            searchPlaceholder: "பெயர் அல்லது NIC மூலம் தேடுக...",
            noAppointments: "சந்திப்புகள் எதுவும் கிடைக்கவில்லை",
            noSearchResults: "உங்கள் தேடலுடன் பொருந்தக்கூடிய சந்திப்புகள் இல்லை",
            newAppointment: "புதிய சந்திப்பை முன்பதிவு செய்க",
            updateAppointment: "சந்திப்பைப் புதுப்பிக்கவும்",
            nicPlaceholder: "NIC (எ.கா: 123456789V அல்லது 200012345678)",
            reasonPlaceholder: "காரணம் (குறைந்தது 3 எழுத்துக்கள்)",
            selectTime: "-- நேரத்தைத் தேர்ந்தெடுக்கவும் --",
            selectedDate: "தேர்ந்தெடுக்கப்பட்ட தேதி",
            notSelected: "தேதி எதுவும் தேர்ந்தெடுக்கப்படவில்லை",
            submitRequest: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
            update: "புதுப்பிக்கவும்",
            cancel: "ரத்து செய்க",
            pending: "நிலுவையில்",
            approved: "அங்கீகரிக்கப்பட்டது",
            rejected: "நிராகரிக்கப்பட்டது",
            fetchError: "தரவைப் பெறுவதில் பிழை",
            updateSuccess: "சந்திப்பு வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
            updateFailed: "புதுப்பிப்பு தோல்வியடைந்தது",
            noDataForReport: "அறிக்கையை உருவாக்க போதுமான தரவு இல்லை",
            pdfGenerated: "PDF அறிக்கை வெற்றிகரமாக உருவாக்கப்பட்டது!",
            pdfError: "PDF உருவாக்குவதில் பிழை",
            bookingSuccess: "விண்ணப்பம் வெற்றிகரமானது!",
            bookingFailed: "முன்பதிவு தோல்வியடைந்தது",
            statusUpdated: (status) => `சந்திப்பு ${status === 'Approved' ? 'அங்கீகரிக்கப்பட்டது' : 'நிராகரிக்கப்பட்டது'}!`,
            statusError: "நிலையைப் புதுப்பிப்பதில் பிழை",
            deleteConfirm: "இந்த சந்திப்பை நீக்குவதை உறுதிசெய்கிறீர்களா?",
            deleteSuccess: "சந்திப்பு வெற்றிகரமாக நீக்கப்பட்டது!",
            deleteError: "நீக்குதல் தோல்வியடைந்தது",
            nicInvalid: "சரியான NIC எண்ணை உள்ளிடுக",
            duplicateBooking: "இந்த தேதிக்கு உங்களிடம் ஏற்கனவே நிலுவையில் உள்ள விண்ணப்பம் உள்ளது",
            reasonRequired: "தயவுசெய்து ஒரு காரணத்தை உள்ளிடுக",
            reasonMinLength: "காரணம் குறைந்தது 3 எழுத்துக்கள் இருக்க வேண்டும்",
            reasonMaxLength: "காரணம் 500 எழுத்துக்களைத் தாண்டக்கூடாது",
            dateRequired: "தயவுசெய்து ஒரு தேதியைத் தேர்ந்தெடுக்கவும்",
            datePast: "இன்றைய தேதிக்கு முந்தைய தேதியைத் தேர்ந்தெடுக்க முடியாது",
            dateMax: (days) => `அடுத்த ${days} நாட்களுக்கு மட்டுமே முன்பதிவு செய்ய முடியும்`,
            timeRequired: "தயவுசெய்து ஒரு நேரத்தைத் தேர்ந்தெடுக்கவும்",
            timeUnavailable: "இந்த நேர இடைவெளி ஏற்கனவே முன்பதிவு செய்யப்பட்டுள்ளது",
        }
    };

    const t = translations[language];

    const fetchAppointments = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/appointments/all`);
            setAppointments(res.data);
        } catch (err) { 
            setError(t.fetchError);
        }
    }, [t.fetchError]);

    useEffect(() => { 
        loadConfig();
        fetchAppointments(); 
    }, [fetchAppointments]);

    const loadConfig = async () => {
        try {
            const publicConfig = getPublicConfig();
            if (publicConfig && publicConfig.appointment) {
                setAvailableSlots(publicConfig.appointment.availableTimeSlots || []);
            } else {
                const days = await getAdvanceDays();
                setMaxDays(days);
                const slotsRes = await axios.get(`${API_BASE}/appointments/available-slots`);
                if (Array.isArray(slotsRes.data)) {
                    setAvailableSlots(slotsRes.data);
                } else {
                    setAvailableSlots(['9.00 AM - 10.00 AM', '10.00 AM - 11.00 AM', '11.00 AM - 12.00 PM', '1.00 PM - 2.00 PM', '2.00 PM - 3.00 PM']);
                }
            }
            const days = await getAdvanceDays();
            setMaxDays(days);
        } catch (err) {
            console.error('Error loading config:', err);
            setAvailableSlots(['9.00 AM - 10.00 AM', '10.00 AM - 11.00 AM', '11.00 AM - 12.00 PM', '1.00 PM - 2.00 PM', '2.00 PM - 3.00 PM']);
            setMaxDays(14);
        }
    };

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => { setSuccessMessage(''); setError(''); setFieldErrors({}); setUpdateFieldErrors({}); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error]);

    const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const validateNIC = (nic) => {
        if (!nic || nic.trim() === '') return false;
        return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
    };

    const validateReason = (reason) => {
        if (!reason || reason.trim() === '') return false;
        if (reason.trim().length < 3) return false;
        if (reason.trim().length > 500) return false;
        return true;
    };

    const validateTimeSlot = (time) => {
        if (!time || time === '') return false;
        return availableSlots.includes(time);
    };

    const validateDate = (date) => {
        if (!date) return false;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = getMaxDate();
        maxDate.setHours(0, 0, 0, 0);
        
        if (isNaN(selectedDate.getTime())) return false;
        if (selectedDate < today) return false;
        if (selectedDate > maxDate) return false;
        return true;
    };

    const isSlotAvailable = (date, time, excludeAppointmentId = null) => {
        const existing = appointments.find(app => 
            app.date === date && 
            app.time === time && 
            app.status === 'Approved' &&
            (excludeAppointmentId ? app._id !== excludeAppointmentId : true)
        );
        return !existing;
    };

    const hasDuplicateBooking = (nic, date, excludeAppointmentId = null) => {
        const existing = appointments.find(app => 
            app.nic === nic && 
            app.date === date && 
            app.status === 'Pending' &&
            (excludeAppointmentId ? app._id !== excludeAppointmentId : true)
        );
        return !!existing;
    };

    const validateForm = (data, isUpdate = false, appointmentId = null) => {
        const errors = {};
        
        if (!validateNIC(data.nic)) {
            errors.nic = t.nicInvalid;
        } else if (!isUpdate && hasDuplicateBooking(data.nic, data.date)) {
            errors.nic = t.duplicateBooking;
        }
        
        if (!validateReason(data.reason)) {
            if (!data.reason || data.reason.trim() === '') {
                errors.reason = t.reasonRequired;
            } else if (data.reason.trim().length < 3) {
                errors.reason = t.reasonMinLength;
            } else if (data.reason.trim().length > 500) {
                errors.reason = t.reasonMaxLength;
            }
        }
        
        if (!validateDate(data.date)) {
            if (!data.date) {
                errors.date = t.dateRequired;
            } else {
                const selectedDate = new Date(data.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    errors.date = t.datePast;
                } else {
                    errors.date = t.dateMax(maxDays);
                }
            }
        }
        
        if (!validateTimeSlot(data.time)) {
            errors.time = t.timeRequired;
        } else if (validateDate(data.date) && !isSlotAvailable(data.date, data.time, isUpdate ? appointmentId : null)) {
            errors.time = t.timeUnavailable;
        }
        
        return errors;
    };

    const handleNicChange = (e, isUpdate = false) => {
        const value = e.target.value.toUpperCase();
        if (isUpdate) {
            setUpdateFormData({...updateFormData, nic: value});
            if (updateFieldErrors.nic) {
                setUpdateFieldErrors({...updateFieldErrors, nic: null});
            }
        } else {
            setFormData({...formData, nic: value});
            if (fieldErrors.nic) {
                setFieldErrors({...fieldErrors, nic: null});
            }
        }
    };

    const handleReasonChange = (e, isUpdate = false) => {
        const value = e.target.value;
        if (isUpdate) {
            setUpdateFormData({...updateFormData, reason: value});
            if (updateFieldErrors.reason) {
                setUpdateFieldErrors({...updateFieldErrors, reason: null});
            }
        } else {
            setFormData({...formData, reason: value});
            if (fieldErrors.reason) {
                setFieldErrors({...fieldErrors, reason: null});
            }
        }
    };

    const handleTimeChange = (e, isUpdate = false) => {
        const value = e.target.value;
        if (isUpdate) {
            setUpdateFormData({...updateFormData, time: value});
            if (updateFieldErrors.time) {
                setUpdateFieldErrors({...updateFieldErrors, time: null});
            }
        } else {
            setFormData({...formData, time: value});
            if (fieldErrors.time) {
                setFieldErrors({...fieldErrors, time: null});
            }
        }
    };

    const renderTileContent = ({ date, view }) => {
        if (view === 'month') {
            const formattedDate = formatLocalDate(date);
            const hasApproved = appointments.some(app => 
                app.date === formattedDate && 
                app.status === 'Approved' && 
                (isOfficer ? true : app.userId === (user?.id || user?._id))
            );

            if (hasApproved) {
                return (
                    <div className="approved-indicator-container">
                        <div className="approved-dot"></div>
                    </div>
                );
            }
        }
        return null;
    };

    const onDateChange = (date) => {
        setSelectedCalendarDate(date);
        const formattedDate = formatLocalDate(date);
        if (updateMode) {
            setUpdateFormData({ ...updateFormData, date: formattedDate });
            if (updateFieldErrors.date) {
                setUpdateFieldErrors({...updateFieldErrors, date: null});
            }
            if (updateFieldErrors.time) {
                setUpdateFieldErrors({...updateFieldErrors, time: null});
            }
        } else {
            setFormData({ ...formData, date: formattedDate });
            if (fieldErrors.date) {
                setFieldErrors({...fieldErrors, date: null});
            }
            if (fieldErrors.time) {
                setFieldErrors({...fieldErrors, time: null});
            }
        }
    };

    const handleEditClick = (app) => {
        setUpdateMode(true);
        setCurrentAppointmentId(app._id);
        setUpdateFormData({
            nic: app.nic || '',
            reason: app.reason || '',
            date: app.date || '',
            time: app.time || ''
        });
        setUpdateFieldErrors({});
        if (app.date) setSelectedCalendarDate(new Date(app.date));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateForm(updateFormData, true, currentAppointmentId);
        if (Object.keys(errors).length > 0) {
            setUpdateFieldErrors(errors);
            setTimeout(() => {
                const firstError = document.querySelector('.update-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        
        try {
            await axios.put(`${API_BASE}/appointments/update/${currentAppointmentId}`, updateFormData);
            setSuccessMessage(t.updateSuccess);
            setUpdateMode(false);
            setUpdateFieldErrors({});
            fetchAppointments();
        } catch (err) {
            setError(err.response?.data?.message || t.updateFailed);
        }
    };

    const cancelUpdate = () => {
        setUpdateMode(false);
        setUpdateFormData({ nic: '', reason: '', date: '', time: '' });
        setUpdateFieldErrors({});
    };

    const downloadPDF = () => {
        if (filteredAppointments.length === 0) {
            setError(t.noDataForReport);
            return;
        }
        
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setTextColor(128, 0, 0); 
            doc.text("Smart Appointment System - Official Report", 14, 15);
            const tableColumn = ["User Name", "NIC", "Reason", "Date", "Time", "Status"];
            const tableRows = filteredAppointments.map(app => [
                app.userName || "Unknown User", app.nic || "N/A", app.reason || "N/A", app.date || "N/A", app.time || "N/A", app.status || "Pending"
            ]);
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: 35, theme: 'striped', headStyles: { fillColor: [128, 0, 0] } });
            doc.save(`Appointments_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            setSuccessMessage(t.pdfGenerated);
        } catch (err) { 
            setError(t.pdfError); 
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setTimeout(() => {
                const firstError = document.querySelector('.form-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        
        try {
            const bookingData = { 
                ...formData, 
                userId: user?.id || user?._id, 
                userName: user?.name || user?.username || user?.fullName || "Guest User", 
                userEmail: user?.email 
            };
            await axios.post(`${API_BASE}/appointments/book`, bookingData);
            setSuccessMessage(t.bookingSuccess);
            setFormData({ nic: '', reason: '', date: '', time: '' });
            setFieldErrors({});
            fetchAppointments();
        } catch (err) { 
            setError(err.response?.data?.message || t.bookingFailed); 
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.put(`${API_BASE}/appointments/status/${id}`, { status: newStatus });
            setSuccessMessage(t.statusUpdated(newStatus));
            fetchAppointments();
        } catch (err) { 
            setError(t.statusError); 
        }
    };

    const deleteAppointment = async (id) => {
        if (window.confirm(t.deleteConfirm)) {
            try {
                await axios.delete(`${API_BASE}/appointments/${id}`);
                setSuccessMessage(t.deleteSuccess);
                fetchAppointments();
            } catch (err) { 
                setError(t.deleteError); 
            }
        }
    };

    const filteredAppointments = appointments
        .filter(app => isOfficer ? true : app.userId === (user?.id || user?._id))
        .filter(app => (app.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) || (app.nic || "").includes(searchQuery));

    const chartData = [
        { name: t.pending, count: appointments.filter(a => a.status === 'Pending').length, color: '#f59e0b' },
        { name: t.approved, count: appointments.filter(a => a.status === 'Approved').length, color: '#22c55e' },
        { name: t.rejected, count: appointments.filter(a => a.status === 'Rejected').length, color: '#ef4444' },
    ];

    const getMaxDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + maxDays);
        return date;
    };

    const getStatusText = (status) => {
        if (status === 'Pending') return t.pending;
        if (status === 'Approved') return t.approved;
        if (status === 'Rejected') return t.rejected;
        return status;
    };

    const getStatusIcon = (status) => {
        if (status === 'Approved') return '✓';
        if (status === 'Rejected') return '✗';
        return '⏳';
    };

    return (
        <div className="appointment-page" style={styles.container}>

            {successMessage && <div style={styles.successMessage}><Lucide.CheckCircle size={18} /><span>{successMessage}</span></div>}
            {error && <div style={styles.errorMessage}><Lucide.AlertCircle size={18} /><span>{error}</span></div>}

            <div className="header-row" style={styles.headerRow}>
                <h2 className="main-title" style={styles.mainTitle}><Lucide.CalendarCheck color="#8B0000" size={28} /> {t.appTitle}</h2>
                <button className="pdf-btn" onClick={downloadPDF} style={styles.pdfBtn}><Lucide.FileText size={18} /> {t.downloadReport}</button>
            </div>

            {isOfficer && (
                <div className="chart-section" style={styles.chartSection}>
                    <h3 style={{fontSize: '16px', marginBottom: '15px'}}>{t.appointmentOverview}</h3>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {!isOfficer && (
                <div className="form-section" style={styles.formSection}>
                    <h3>{updateMode ? t.updateAppointment : t.newAppointment}</h3>
                    <div className="flex-container" style={styles.flexContainer}>
                        <div className="calendar-wrapper" style={styles.calendarWrapper}>
                            <Calendar 
                                onChange={onDateChange} 
                                value={selectedCalendarDate} 
                                minDate={new Date()} 
                                maxDate={getMaxDate()}
                                tileContent={renderTileContent} 
                                className="custom-calendar"
                            />
                        </div>

                        <div style={{flex: 1}}>
                            <form onSubmit={updateMode ? handleUpdateSubmit : handleBook} className="form" style={styles.form}>
                                <div>
                                    <input className="input" type="text" placeholder={t.nicPlaceholder} value={updateMode ? updateFormData.nic : formData.nic} onChange={(e) => handleNicChange(e, updateMode)} style={{...styles.input, borderColor: (updateMode ? updateFieldErrors.nic : fieldErrors.nic) ? '#ef4444' : '#ddd'}} required />
                                    {(updateMode ? updateFieldErrors.nic : fieldErrors.nic) && (<div className="form-error update-error" style={styles.fieldError}>{updateMode ? updateFieldErrors.nic : fieldErrors.nic}</div>)}
                                </div>
                                <div>
                                    <input className="input" type="text" placeholder={t.reasonPlaceholder} value={updateMode ? updateFormData.reason : formData.reason} onChange={(e) => handleReasonChange(e, updateMode)} style={{...styles.input, borderColor: (updateMode ? updateFieldErrors.reason : fieldErrors.reason) ? '#ef4444' : '#ddd'}} required />
                                    {(updateMode ? updateFieldErrors.reason : fieldErrors.reason) && (<div className="form-error update-error" style={styles.fieldError}>{updateMode ? updateFieldErrors.reason : fieldErrors.reason}</div>)}
                                </div>
                                <div>
                                    <select className="select" value={updateMode ? updateFormData.time : formData.time} onChange={(e) => handleTimeChange(e, updateMode)} style={{...styles.input, borderColor: (updateMode ? updateFieldErrors.time : fieldErrors.time) ? '#ef4444' : '#ddd'}} required>
                                        <option value="">{t.selectTime}</option>
                                        {availableSlots.map((slot, index) => <option key={index} value={slot}>{slot}</option>)}
                                    </select>
                                    {(updateMode ? updateFieldErrors.time : fieldErrors.time) && (<div className="form-error update-error" style={styles.fieldError}>{updateMode ? updateFieldErrors.time : fieldErrors.time}</div>)}
                                </div>
                                <div>
                                    <p style={{fontSize: '12px', color: '#64748b', marginTop: '5px'}}>{t.selectedDate}: <b>{updateMode ? updateFormData.date : formData.date || t.notSelected}</b></p>
                                    {(updateMode ? updateFieldErrors.date : fieldErrors.date) && (<div className="form-error update-error" style={styles.fieldError}>{updateMode ? updateFieldErrors.date : fieldErrors.date}</div>)}
                                </div>
                                <div style={styles.row}>
                                    <button className={updateMode ? 'update-btn' : 'book-btn'} type="submit" style={updateMode ? styles.updateBtn : styles.bookBtn}>{updateMode ? t.update : t.submitRequest}</button>
                                    {updateMode && (<button className="cancel-btn" type="button" onClick={cancelUpdate} style={styles.cancelBtn}>{t.cancel}</button>)}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="search-bar" style={styles.searchBar}>
                <Lucide.Search size={18} color="#999" />
                <input className="search-input" type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={styles.searchInput} />
            </div>

            <div style={styles.grid}>
                {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
                    <div key={app._id} className="app-card" style={styles.appCard}>
                        <div className="card-info" style={styles.cardInfo}>
                            <strong>{app.userName || "User"} <small>({app.nic})</small></strong>
                            <p className="p-tag" style={styles.pTag}><Lucide.Info size={14} /> {app.reason}</p>
                            <p className="p-tag" style={styles.pTag}><Lucide.Clock size={14} /> {app.date} | {app.time}</p>
                        </div>
                        <div className="status-section" style={styles.statusSection}>
                            <span className="badge" style={{...styles.badge, backgroundColor: app.status === 'Approved' ? '#22c55e' : app.status === 'Rejected' ? '#ef4444' : '#f59e0b'}}>
                                {getStatusIcon(app.status)} {getStatusText(app.status)}
                            </span>
                            <div className="actions" style={styles.actions}>
                                {isOfficer && app.status === 'Pending' && (
                                    <>
                                        <button className="approve-btn" onClick={() => updateStatus(app._id, 'Approved')} style={styles.approveBtn} title={t.approved}><Lucide.Check size={16}/></button>
                                        <button className="reject-btn" onClick={() => updateStatus(app._id, 'Rejected')} style={styles.rejectBtn} title={t.rejected}><Lucide.X size={16}/></button>
                                    </>
                                )}
                                {!isOfficer && app.status === 'Pending' && (
                                    <button className="edit-btn" onClick={() => handleEditClick(app)} style={styles.editBtn} title={t.update}><Lucide.Edit size={16}/></button>
                                )}
                                <button className="delete-btn" onClick={() => deleteAppointment(app._id)} style={styles.deleteBtn} title={t.cancel}><Lucide.Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>{searchQuery ? t.noSearchResults : t.noAppointments}</div>
                )}
            </div>

            {/* Responsive CSS Styles */}
            <style>
                {`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    
                    .custom-calendar { border: none !important; width: 100% !important; font-family: sans-serif; }
                    .react-calendar__tile--active { background: #8B0000 !important; color: white !important; border-radius: 6px; }
                    .react-calendar__tile--now { background: #ffffcc !important; border-radius: 6px; }
                    .react-calendar__month-view__days__day { color: #333 !important; }
                    .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; font-weight: bold; color: #8B0000; }
                    .react-calendar__tile:disabled { background: #f5f5f5 !important; color: #ccc !important; cursor: not-allowed; }
                    .approved-indicator-container { display: flex; justify-content: center; margin-top: 2px; }
                    .approved-dot { width: 6px; height: 6px; background-color: #22c55e; border-radius: 50%; }
                    
                    button:hover { transform: translateY(-1px); opacity: 0.9; }
                    button:active { transform: translateY(0); }
                    input:focus, select:focus { border-color: #8B0000 !important; box-shadow: 0 0 0 2px rgba(128,0,0,0.1); outline: none; }
                    
                    /* Mobile Responsive Styles */
                    @media (max-width: 768px) {
                        .appointment-page .container {
                            padding: 15px !important;
                        }
                        .appointment-page .language-selector {
                            gap: 5px !important;
                            margin-bottom: 15px !important;
                        }
                        .appointment-page .lang-btn {
                            padding: 5px 10px !important;
                            font-size: 11px !important;
                        }
                        .appointment-page .header-row {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            margin-bottom: 15px !important;
                        }
                        .appointment-page .main-title {
                            font-size: 20px !important;
                        }
                        .appointment-page .main-title svg {
                            width: 22px !important;
                            height: 22px !important;
                        }
                        .appointment-page .pdf-btn {
                            padding: 8px 12px !important;
                            font-size: 12px !important;
                        }
                        .appointment-page .chart-section {
                            padding: 15px !important;
                            margin-bottom: 20px !important;
                        }
                        .appointment-page .form-section {
                            padding: 20px !important;
                            margin-bottom: 20px !important;
                        }
                        .appointment-page .flex-container {
                            flex-direction: column !important;
                            gap: 20px !important;
                        }
                        .appointment-page .calendar-wrapper {
                            flex: 0 0 auto !important;
                            width: 100% !important;
                        }
                        .appointment-page .calendar-wrapper .custom-calendar {
                            width: 100% !important;
                            font-size: 12px !important;
                        }
                        .appointment-page .form {
                            gap: 12px !important;
                        }
                        .appointment-page .input {
                            padding: 10px !important;
                            font-size: 16px !important;
                        }
                        .appointment-page .select {
                            padding: 10px !important;
                            font-size: 16px !important;
                        }
                        .appointment-page .book-btn, .appointment-page .update-btn, .appointment-page .cancel-btn {
                            padding: 10px !important;
                            font-size: 14px !important;
                        }
                        .appointment-page .search-bar {
                            padding: 8px 12px !important;
                            margin-bottom: 15px !important;
                        }
                        .appointment-page .search-input {
                            font-size: 14px !important;
                        }
                        .appointment-page .app-card {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            padding: 12px !important;
                        }
                        .appointment-page .card-info {
                            margin-bottom: 10px !important;
                            width: 100% !important;
                        }
                        .appointment-page .p-tag {
                            font-size: 12px !important;
                        }
                        .appointment-page .status-section {
                            flex-direction: row !important;
                            align-items: center !important;
                            justify-content: space-between !important;
                            width: 100% !important;
                            gap: 8px !important;
                        }
                        .appointment-page .badge {
                            font-size: 10px !important;
                            padding: 3px 8px !important;
                        }
                        .appointment-page .actions {
                            gap: 6px !important;
                        }
                        .appointment-page .approve-btn, .appointment-page .reject-btn, .appointment-page .edit-btn, .appointment-page .delete-btn {
                            padding: 6px !important;
                        }
                        .appointment-page .approve-btn svg, .appointment-page .reject-btn svg, .appointment-page .edit-btn svg, .appointment-page .delete-btn svg {
                            width: 14px !important;
                            height: 14px !important;
                        }
                        .appointment-page .success-message, .appointment-page .error-message {
                            padding: 10px !important;
                            font-size: 12px !important;
                        }
                        .appointment-page .field-error {
                            font-size: 10px !important;
                            padding: 3px 6px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .appointment-page .container {
                            padding: 10px !important;
                        }
                        .appointment-page .form-section {
                            padding: 15px !important;
                        }
                        .appointment-page .form-section h3 {
                            font-size: 16px !important;
                            margin-bottom: 15px !important;
                        }
                        .appointment-page .chart-section h3 {
                            font-size: 14px !important;
                        }
                        .appointment-page .react-calendar__tile {
                            padding: 8px 4px !important;
                            font-size: 11px !important;
                        }
                        .appointment-page .status-section {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                        }
                        .appointment-page .actions {
                            width: 100% !important;
                            justify-content: flex-start !important;
                        }
                    }
                    
                    @media (min-width: 769px) {
                        .appointment-page .flex-container {
                            flex-direction: row !important;
                        }
                        .appointment-page .calendar-wrapper {
                            flex: 0 0 350px !important;
                        }
                        .appointment-page .app-card {
                            flex-direction: row !important;
                            align-items: center !important;
                        }
                    }
                    
                    .appointment-page .app-card:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        transform: translateY(-2px);
                        transition: all 0.2s ease;
                    }
                `}
            </style>
        </div>
    );
}

const styles = {
    container: { padding: '30px 20px', maxWidth: '1000px', margin: 'auto', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' },
    languageSelector: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' },
    langBtn: { padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s', fontSize: '12px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
    mainTitle: { display: 'flex', alignItems: 'center', gap: '10px', color: '#8B0000', fontSize: '24px', margin: 0 },
    pdfBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' },
    chartSection: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '25px' },
    formSection: { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '30px' },
    flexContainer: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
    calendarWrapper: { flex: '0 0 350px', background: '#fff', borderRadius: '10px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    row: { display: 'flex', gap: '10px' },
    input: { padding: '12px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', transition: 'all 0.2s', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
    searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' },
    searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    bookBtn: { padding: '12px', backgroundColor: '#8B0000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', transition: 'all 0.2s' },
    updateBtn: { padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, transition: 'all 0.2s' },
    cancelBtn: { padding: '12px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1, transition: 'all 0.2s' },
    grid: { display: 'flex', flexDirection: 'column', gap: '10px' },
    appCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#fff', borderRadius: '10px', marginBottom: '10px', border: '1px solid #eee', transition: 'all 0.2s' },
    cardInfo: { flex: 1 },
    pTag: { display: 'flex', alignItems: 'center', gap: '5px', margin: '4px 0', fontSize: '13px', color: '#555' },
    statusSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' },
    badge: { padding: '4px 10px', borderRadius: '15px', color: 'white', fontSize: '11px', fontWeight: 'bold' },
    actions: { display: 'flex', gap: '8px' },
    approveBtn: { background: '#2245c5', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' },
    rejectBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' },
    editBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' },
    deleteBtn: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' },
    successMessage: { backgroundColor: '#22c55e', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    errorMessage: { backgroundColor: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    fieldError: { fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500', padding: '4px 8px', backgroundColor: '#fef2f2', borderRadius: '4px', borderLeft: '3px solid #ef4444' }
};

export default AppointmentPage;