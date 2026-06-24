import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, User, CreditCard, Home, ListFilter, AlertCircle, CheckCircle2, Upload, DollarSign, ShieldCheck, Edit, Trash2, Clock, FileText, XCircle } from 'lucide-react';
import { getPublicConfig, loadWelfareSettings } from '../services/configService';

// --- භාෂා තුනටම Translations ---
const translations = {
    en: {
        title: "Welfare Application Form",
        subtitle: "Apply for Aswasuma, Samurdhi and Elderly Allowance",
        successMsg: "✅ Application submitted successfully! Grama Niladhari will review it.",
        errorMsg: "❌ Application failed. Please try again.",
        alreadyApplied: "❌ You have already applied for this welfare type.",
        fullName: "Full Name",
        nic: "NIC Number",
        welfareType: "Welfare Type",
        householdNo: "House Number",
        monthlyIncome: "Monthly Income (Rs.)",
        uploadPaySlip: "Upload Pay Slip",
        verificationStatus: "Verification Status",
        verified: "✓ Verified",
        pending: "⏳ Pending Verification",
        submit: "Submit Application",
        myApplications: "My Applications",
        noApplications: "No applications found",
        appliedOn: "Applied on",
        edit: "Edit",
        delete: "Delete",
        update: "Update",
        cancel: "Cancel",
        editApplication: "Edit Application",
        deleteConfirm: "Are you sure you want to delete this application?",
        editSuccess: "✅ Application updated successfully!",
        deleteSuccess: "✅ Application deleted successfully!",
        editError: "❌ Failed to update application",
        deleteError: "❌ Failed to delete application",
        loading: "Loading...",
        placeholders: {
            name: "Enter your full name",
            nic: "e.g: 991234567V",
            income: "Enter monthly income",
            household: "Enter house number"
        },
        welfareTypes: {
            aswasuma: "Aswasuma",
            samurdhi: "Samurdhi",
            elderly: "Elderly Allowance"
        },
        invalidNic: "Please enter a valid NIC number",
        nicMismatch: "❌ NIC number does not match your profile NIC. Please enter your correct NIC number.",
        nicMatchSuccess: "✓ NIC number matches your profile",
        incomeRequired: "Monthly income is required",
        incomeVerificationRequired: "Income verification document is required for this welfare type",
        maxIncomeExceeded: "Monthly income exceeds the maximum limit of Rs. {maxIncome} for this welfare type",
        ageRestriction: "You must be at least {minAge} years old to apply for this welfare type",
        serverIncomeVerificationRequired: "Income verification is required by the system. Please upload your pay slip.",
        nameRequired: "Full name is required",
        householdRequired: "House number is required"
    },
    si: {
        title: "සහනාධාර අයදුම්පත්‍රය",
        subtitle: "අස්වැසුම, සමෘද්ධි සහ වැඩිහිටි දීමනා සඳහා අයදුම් කරන්න",
        successMsg: "✅ අයදුම්පත සාර්ථකව යොමු කළා! ග්‍රාම නිලධාරී විසින් එය පරීක්ෂා කරනු ඇත.",
        errorMsg: "❌ අයදුම් කිරීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.",
        alreadyApplied: "❌ ඔබ දැනටමත් මෙම සහනාධාර වර්ගයට අයදුම් කර ඇත.",
        fullName: "සම්පූර්ණ නම",
        nic: "NIC අංකය",
        welfareType: "සහනාධාර වර්ගය",
        householdNo: "නිවාස අංකය",
        monthlyIncome: "මාසික ආදායම (රු.)",
        uploadPaySlip: "ආදායම් සාක්ෂිය උඩුගත කරන්න",
        verificationStatus: "සත්‍යාපන තත්ත්වය",
        verified: "✓ සත්‍යාපිතයි",
        pending: "⏳ සත්‍යාපනය බලාපොරොත්තුවෙන්",
        submit: "අයදුම්පත යොමු කරන්න",
        myApplications: "මගේ අයදුම්පත්",
        noApplications: "අයදුම්පත් හමු නොවීය",
        appliedOn: "අයදුම් කළ දිනය",
        edit: "සංස්කරණය",
        delete: "මකන්න",
        update: "යාවත්කාලීන කරන්න",
        cancel: "අවලංගු කරන්න",
        editApplication: "අයදුම්පත සංස්කරණය",
        deleteConfirm: "ඔබට මෙම අයදුම්පත මකා දැමීමට විශ්වාසද?",
        editSuccess: "✅ අයදුම්පත සාර්ථකව යාවත්කාලීන කළා!",
        deleteSuccess: "✅ අයදුම්පත සාර්ථකව මකා දමන ලදී!",
        editError: "❌ අයදුම්පත යාවත්කාලීන කිරීම අසාර්ථකයි",
        deleteError: "❌ අයදුම්පත මකා දැමීම අසාර්ථකයි",
        loading: "පූරණය වෙමින්...",
        placeholders: {
            name: "ඔබේ නම ඇතුළත් කරන්න",
            nic: "උදා: 991234567V",
            income: "මාසික ආදායම ඇතුළත් කරන්න",
            household: "ඔබේ නිවාස අංකය"
        },
        welfareTypes: {
            aswasuma: "අස්වැසුම",
            samurdhi: "සමෘද්ධි",
            elderly: "වැඩිහිටි දීමනාව"
        },
        invalidNic: "නිවැරදි NIC අංකයක් ඇතුළත් කරන්න",
        nicMismatch: "❌ NIC අංකය ඔබගේ පැතිකඩෙහි NIC අංකයට නොගැලපේ. කරුණාකර ඔබගේ නිවැරදි NIC අංකය ඇතුළත් කරන්න.",
        nicMatchSuccess: "✓ NIC අංකය ඔබගේ පැතිකඩට ගැලපේ",
        incomeRequired: "මාසික ආදායම ඇතුළත් කිරීම අවශ්‍යයි",
        incomeVerificationRequired: "මෙම සහනාධාර වර්ගය සඳහා ආදායම් සාක්ෂිය අනිවාර්යයි",
        maxIncomeExceeded: "මෙම සහනාධාර වර්ගය සඳහා උපරිම ආදායම රු. {maxIncome} ඉක්මවා ඇත",
        ageRestriction: "මෙම සහනාධාර වර්ගය සඳහා අවම වයස අවුරුදු {minAge} විය යුතුය",
        serverIncomeVerificationRequired: "පද්ධතියට ආදායම් සාක්ෂිය අවශ්‍ය වේ. කරුණාකර ඔබේ ආදායම් සාක්ෂිය උඩුගත කරන්න.",
        nameRequired: "සම්පූර්ණ නම ඇතුළත් කිරීම අවශ්‍යයි",
        householdRequired: "නිවාස අංකය ඇතුළත් කිරීම අවශ්‍යයි"
    },
    ta: {
        title: "நலன்புரி விண்ணப்ப படிவம்",
        subtitle: "அஸ்வசும, சமுர்த்தி மற்றும் முதியோர் கொடுப்பனவுக்கு விண்ணப்பிக்கவும்",
        successMsg: "✅ விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! கிராம நிலதாரி அதை பரிசீலிப்பார்.",
        errorMsg: "❌ விண்ணப்பிப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
        alreadyApplied: "❌ நீங்கள் ஏற்கனவே இந்த நலன்புரி வகைக்கு விண்ணப்பித்துள்ளீர்கள்.",
        fullName: "முழு பெயர்",
        nic: "NIC எண்",
        welfareType: "நலன்புரி வகை",
        householdNo: "வீட்டு எண்",
        monthlyIncome: "மாத வருமானம் (ரூ.)",
        uploadPaySlip: "சம்பள சீட்டை பதிவேற்றவும்",
        verificationStatus: "சரிபார்ப்பு நிலை",
        verified: "✓ சரிபார்க்கப்பட்டது",
        pending: "⏳ சரிபார்ப்பு நிலுவையில்",
        submit: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
        myApplications: "எனது விண்ணப்பங்கள்",
        noApplications: "விண்ணப்பங்கள் எதுவும் இல்லை",
        appliedOn: "விண்ணப்பித்த தேதி",
        edit: "திருத்து",
        delete: "நீக்கு",
        update: "புதுப்பி",
        cancel: "ரத்து செய்",
        editApplication: "விண்ணப்பத்தை திருத்தவும்",
        deleteConfirm: "இந்த விண்ணப்பத்தை நீக்குவதில் உறுதியாக உள்ளீர்களா?",
        editSuccess: "✅ விண்ணப்பம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
        deleteSuccess: "✅ விண்ணப்பம் வெற்றிகரமாக நீக்கப்பட்டது!",
        editError: "❌ விண்ணப்பத்தை புதுப்பிக்க முடியவில்லை",
        deleteError: "❌ விண்ணப்பத்தை நீக்க முடியவில்லை",
        loading: "ஏற்றப்படுகிறது...",
        placeholders: {
            name: "உங்கள் முழு பெயரை உள்ளிடவும்",
            nic: "எ.கா: 991234567V",
            income: "மாத வருமானத்தை உள்ளிடவும்",
            household: "வீட்டு எண்ணை உள்ளிடவும்"
        },
        welfareTypes: {
            aswasuma: "அஸ்வசும",
            samurdhi: "சமுர்த்தி",
            elderly: "முதியோர் கொடுப்பனவு"
        },
        invalidNic: "சரியான NIC எண்ணை உள்ளிடவும்",
        nicMismatch: "❌ NIC எண் உங்கள் சுயவிவர NIC உடன் பொருந்தவில்லை. உங்கள் சரியான NIC எண்ணை உள்ளிடவும்.",
        nicMatchSuccess: "✓ NIC எண் உங்கள் சுயவிவரத்துடன் பொருந்துகிறது",
        incomeRequired: "மாத வருமானம் தேவை",
        incomeVerificationRequired: "இந்த நலன்புரி வகைக்கு வருமான சரிபார்ப்பு தேவை",
        maxIncomeExceeded: "இந்த நலன்புரி வகைக்கான அதிகபட்ச வருமானம் ரூ. {maxIncome} ஐ விட அதிகமாக உள்ளது",
        ageRestriction: "இந்த நலன்புரி வகைக்கு குறைந்தபட்ச வயது {minAge} ஆக இருக்க வேண்டும்",
        serverIncomeVerificationRequired: "கணினிக்கு வருமான சரிபார்ப்பு தேவை. உங்கள் சம்பள சீட்டை பதிவேற்றவும்.",
        nameRequired: "முழு பெயர் தேவை",
        householdRequired: "வீட்டு எண் தேவை"
    }
};

function ApplyWelfare() {
    const [lang, setLang] = useState('si');
    const t = translations[lang];
    
    // Form Data State 
    const [applyData, setApplyData] = useState({
        fullName: '', 
        nic: '', 
        householdNo: '', 
        type: 'Aswasuma',
        monthlyIncome: '',
        paySlip: null
    });
    
    // NIC validation state
    const [nicValidation, setNicValidation] = useState({
        isValid: false,
        message: '',
        isMatch: false
    });
    
    // User Applications State
    const [userApplications, setUserApplications] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        householdNo: '',
        monthlyIncome: '',
        newPaySlip: null
    });
    const [editFileName, setEditFileName] = useState('');
    
    // UI State 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fileName, setFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    
    // System Config state
    const [welfareSettings, setWelfareSettings] = useState({
        incomeVerificationRequired: true,
        maxIncomeLimits: {
            Aswasuma: 20000,
            Samurdhi: 15000,
            'Elderly Allowance': 10000
        },
        ageRestrictions: {
            Aswasuma: null,
            Samurdhi: null,
            'Elderly Allowance': 60
        },
        requiredDocuments: {
            Aswasuma: ['paySlip', 'nic'],
            Samurdhi: ['paySlip', 'nic'],
            'Elderly Allowance': ['nic', 'ageProof']
        }
    });

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // Calculate age from NIC
    const calculateAge = (nic) => {
        if (!nic) return null;
        
        let year;
        if (nic.length === 10) {
            year = parseInt(nic.substring(0, 2));
            year = 1900 + year;
        } else if (nic.length === 12) {
            year = parseInt(nic.substring(0, 4));
        } else {
            return null;
        }
        
        const birthDate = new Date(year, 0, 1);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    // Validate income based on welfare type
    const validateIncome = (income, type) => {
        const maxLimit = welfareSettings.maxIncomeLimits[type];
        const incomeNum = parseFloat(income);
        const maxLimitNum = parseFloat(maxLimit);
        
        if (maxLimitNum && !isNaN(incomeNum) && incomeNum > maxLimitNum) {
            return t.maxIncomeExceeded.replace('{maxIncome}', maxLimitNum);
        }
        return null;
    };

    // Validate age based on welfare type
    const validateAge = (nic, type) => {
        const minAge = welfareSettings.ageRestrictions[type];
        if (minAge) {
            const age = calculateAge(nic);
            if (age && age < minAge) {
                return t.ageRestriction.replace('{minAge}', minAge);
            }
        }
        return null;
    };

    // Validate NIC against user profile
    const validateNicAgainstProfile = (nic) => {
        if (!user || !user.nic) {
            return { isValid: false, message: '', isMatch: false };
        }
        
        // Normalize both NICs for comparison (remove spaces, convert to uppercase)
        const inputNic = nic.trim().toUpperCase();
        const profileNic = user.nic.trim().toUpperCase();
        
        if (inputNic === profileNic) {
            return { isValid: true, message: t.nicMatchSuccess, isMatch: true };
        } else {
            return { isValid: false, message: t.nicMismatch, isMatch: false };
        }
    };

    // Handle NIC change with real-time validation
    const handleNicChange = (e) => {
        const nicValue = e.target.value;
        setApplyData({...applyData, nic: nicValue});
        
        // Validate NIC format first
        if (validateNIC(nicValue)) {
            // If format is valid, check against profile
            const validation = validateNicAgainstProfile(nicValue);
            setNicValidation(validation);
        } else if (nicValue.length > 0) {
            setNicValidation({ isValid: false, message: t.invalidNic, isMatch: false });
        } else {
            setNicValidation({ isValid: false, message: '', isMatch: false });
        }
    };

    // Load system config
    const loadConfig = useCallback(async () => {
        try {
            const welfareConfig = await loadWelfareSettings();
            if (welfareConfig) {
                setWelfareSettings({
                    incomeVerificationRequired: welfareConfig.incomeVerificationRequired !== undefined ? 
                        welfareConfig.incomeVerificationRequired : true,
                    maxIncomeLimits: welfareConfig.maxIncomeLimits || {
                        Aswasuma: 20000,
                        Samurdhi: 15000,
                        'Elderly Allowance': 10000
                    },
                    ageRestrictions: welfareConfig.ageRestrictions || {
                        Aswasuma: null,
                        Samurdhi: null,
                        'Elderly Allowance': 60
                    },
                    requiredDocuments: welfareConfig.requiredDocuments || {
                        Aswasuma: ['paySlip', 'nic'],
                        Samurdhi: ['paySlip', 'nic'],
                        'Elderly Allowance': ['nic', 'ageProof']
                    }
                });
            } else {
                const publicConfig = getPublicConfig();
                if (publicConfig && publicConfig.welfare) {
                    setWelfareSettings({
                        incomeVerificationRequired: publicConfig.welfare.incomeVerificationRequired || true,
                        maxIncomeLimits: publicConfig.welfare.maxIncomeLimits || {
                            Aswasuma: 20000,
                            Samurdhi: 15000,
                            'Elderly Allowance': 10000
                        },
                        ageRestrictions: publicConfig.welfare.ageRestrictions || {
                            aswasuma: null,
                            samurdhi: null,
                            'Elderly Allowance': 60
                        },
                        requiredDocuments: publicConfig.welfare.requiredDocuments || {
                            Aswasuma: ['paySlip', 'nic'],
                            Samurdhi: ['paySlip', 'nic'],
                            'Elderly Allowance': ['nic', 'ageProof']
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading welfare settings:', error);
        }
    }, []);

    // Load config on component mount
    useEffect(() => {
        loadConfig();
        
        const intervalId = setInterval(() => {
            loadConfig();
        }, 30000);
        
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loadConfig]);

    // Load user applications function
    const loadUserApplications = useCallback(async () => {
        if (!user || !user._id) return;
        
        setLoading(true);
        try {
            const response = await axios.get(`https://villageflow.onrender.com/api/welfare/user-applications/${user._id}`);
            setUserApplications(response.data);
        } catch (err) {
            console.error('Error loading applications:', err);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [user]);

    // Load applications on component mount
    useEffect(() => {
        loadUserApplications();
    }, [loadUserApplications]);

    // NIC Validation Function 
    const validateNIC = (nic) => {
        const oldNicPattern = /^[0-9]{9}[vVxX]$/;
        const newNicPattern = /^[0-9]{12}$/;
        return oldNicPattern.test(nic) || newNicPattern.test(nic);
    };

    // Handle income change
    const handleIncomeChange = (e, isEdit = false) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) {
            if (isEdit) {
                setEditFormData({...editFormData, monthlyIncome: value});
            } else {
                setApplyData({...applyData, monthlyIncome: value});
            }
        }
    };

    // File Upload Handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("File size should be less than 5MB");
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setError("Please upload a valid file (JPEG, PNG, or PDF)");
                return;
            }
            
            setApplyData({...applyData, paySlip: file});
            setFileName(file.name);
        } else {
            setApplyData({...applyData, paySlip: null});
            setFileName('');
        }
    };

    // Edit File Change Handler
    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("File size should be less than 5MB");
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setError("Please upload a valid file (JPEG, PNG, or PDF)");
                return;
            }
            
            setEditFormData({...editFormData, newPaySlip: file});
            setEditFileName(file.name);
        }
    };

    // Form Submit Handler with NIC validation
    const handleApply = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setError('');
        setSuccess('');
        
        // Check if name is provided
        if (!applyData.fullName.trim()) {
            setError(t.nameRequired);
            return;
        }
        
        // Check if household number is provided
        if (!applyData.householdNo.trim()) {
            setError(t.householdRequired);
            return;
        }
        
        // NIC validation
        if (!validateNIC(applyData.nic)) {
            setError(t.invalidNic);
            return;
        }
        
        // Check NIC against profile
        const nicValidationResult = validateNicAgainstProfile(applyData.nic);
        if (!nicValidationResult.isMatch) {
            setError(t.nicMismatch);
            return;
        }
        
        // Age validation based on welfare type
        const ageError = validateAge(applyData.nic, applyData.type);
        if (ageError) {
            setError(ageError);
            return;
        }
        
        // Income validation
        if (!applyData.monthlyIncome) {
            setError(t.incomeRequired);
            return;
        }
        
        const incomeError = validateIncome(applyData.monthlyIncome, applyData.type);
        if (incomeError) {
            setError(incomeError);
            return;
        }
        
        // Check if pay slip is required based on both Welfare Type and System Global Settings
        const isPaySlipNeededForType = welfareSettings.requiredDocuments[applyData.type]?.includes('paySlip') || false;
        const isGlobalVerificationRequired = welfareSettings.incomeVerificationRequired;
        
        if (isGlobalVerificationRequired && isPaySlipNeededForType && !applyData.paySlip) {
            setError(t.incomeVerificationRequired);
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('fullName', applyData.fullName);
        formData.append('nic', applyData.nic);
        formData.append('householdNo', applyData.householdNo);
        formData.append('type', applyData.type);
        formData.append('monthlyIncome', parseFloat(applyData.monthlyIncome));
        formData.append('userId', user._id);
        
        if (applyData.paySlip) {
            formData.append('paySlip', applyData.paySlip);
        }

        try {
            await axios.post('https://villageflow.onrender.com/api/welfare/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setSuccess(t.successMsg);
            
            setApplyData({ 
                fullName: '', 
                nic: '', 
                householdNo: '', 
                type: 'Aswasuma',
                monthlyIncome: '',
                paySlip: null 
            });
            setFileName('');
            setNicValidation({ isValid: false, message: '', isMatch: false });
            
            await loadUserApplications();
            
        } catch (err) {
            console.error('Application error:', err.response?.data || err.message);
            
            if (err.response?.data?.error) {
                const serverError = err.response.data.error;
                
                if (serverError.includes('already applied')) {
                    setError(t.alreadyApplied);
                } else if (serverError.includes('ආදායම් සාක්ෂි') || serverError.includes('income verification')) {
                    setError(t.serverIncomeVerificationRequired);
                } else {
                    setError(serverError);
                }
            } else {
                setError(t.errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Start Editing 
    const startEditing = (app) => {
        setEditingId(app._id);
        setEditFormData({
            fullName: app.fullName,
            householdNo: app.householdNo,
            monthlyIncome: app.income.toString(),
            newPaySlip: null
        });
        setEditFileName('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel Editing 
    const cancelEditing = () => {
        setEditingId(null);
        setEditFormData({
            fullName: '',
            householdNo: '',
            monthlyIncome: '',
            newPaySlip: null
        });
        setEditFileName('');
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        setError('');
        setSuccess('');
        
        if (!editFormData.fullName.trim()) {
            setError(t.nameRequired);
            return;
        }
        
        if (!editFormData.householdNo.trim()) {
            setError(t.householdRequired);
            return;
        }
        
        const appToEdit = userApplications.find(app => app._id === editingId);
        
        if (appToEdit) {
            const incomeError = validateIncome(editFormData.monthlyIncome, appToEdit.type);
            if (incomeError) {
                setError(incomeError);
                return;
            }
        }

        const formData = new FormData();
        formData.append('fullName', editFormData.fullName);
        formData.append('householdNo', editFormData.householdNo);
        formData.append('monthlyIncome', parseFloat(editFormData.monthlyIncome));
        formData.append('userId', user._id);
        
        if (editFormData.newPaySlip) {
            formData.append('paySlip', editFormData.newPaySlip);
        }

        try {
            await axios.put(`https://villageflow.onrender.com/api/welfare/user-edit/${editingId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setSuccess(t.editSuccess);
            cancelEditing();
            await loadUserApplications();
            
        } catch (err) {
            console.error('Edit error:', err.response?.data || err.message);
            setError(err.response?.data?.error || t.editError);
        }
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm(t.deleteConfirm)) return;
        
        try {
            await axios.delete(`https://villageflow.onrender.com/api/welfare/user-delete/${id}`, {
                data: { userId: user._id }
            });
            
            setSuccess(t.deleteSuccess);
            await loadUserApplications();
            
        } catch (err) {
            console.error('Delete error:', err.response?.data || err.message);
            setError(err.response?.data?.error || t.deleteError);
        }
    };

    // Get Status Badge Style 
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Pending':
                return { bg: '#fff3cd', color: '#856404' };
            case 'Active':
                return { bg: '#d4edda', color: '#155724' };
            case 'Suspended':
                return { bg: '#f8d7da', color: '#721c24' };
            default:
                return { bg: '#e2e3e5', color: '#383d41' };
        }
    };

    // Check if pay slip is required for selected welfare type AND global setting
    const isPaySlipRequired = () => {
        const requiredDocs = welfareSettings.requiredDocuments[applyData.type];
        return welfareSettings.incomeVerificationRequired && requiredDocs && requiredDocs.includes('paySlip');
    };

    // Get max income limit display text
    const getMaxIncomeDisplay = () => {
        const maxLimit = welfareSettings.maxIncomeLimits[applyData.type];
        if (maxLimit) {
            return ` (Max: Rs. ${maxLimit})`;
        }
        return '';
    };

    // Get age restriction display text
    const getAgeRestrictionDisplay = () => {
        const minAge = welfareSettings.ageRestrictions[applyData.type];
        if (minAge) {
            return ` (Minimum Age: ${minAge} years)`;
        }
        return '';
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                {/* Language Selector */}
                <div style={styles.langBar}>
                    <span onClick={() => setLang('en')} style={lang === 'en' ? styles.langActive : styles.langBtn}>EN</span>
                    <span style={styles.separator}>|</span>
                    <span onClick={() => setLang('si')} style={lang === 'si' ? styles.langActive : styles.langBtn}>සිං</span>
                    <span style={styles.separator}>|</span>
                    <span onClick={() => setLang('ta')} style={lang === 'ta' ? styles.langActive : styles.langBtn}>தமிழ்</span>
                </div>

                {/* Main Form Card */}
                <div style={styles.card}>
                    <h2 style={styles.title}>{editingId ? t.editApplication : t.title}</h2>
                    <p style={styles.subtitle}>{t.subtitle}</p>

                    {/* Success Message */}
                    {success && (
                        <div style={styles.successMsg}>
                            <CheckCircle2 size={18} /> {success}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div style={styles.errorMsg}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {/* Application Form */}
                    <form onSubmit={editingId ? handleEditSubmit : handleApply} style={styles.form}>
                        {/* Full Name Field */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><User size={14} /> {t.fullName}</label>
                            <input 
                                type="text" 
                                placeholder={t.placeholders.name} 
                                style={styles.input} 
                                value={editingId ? editFormData.fullName : applyData.fullName} 
                                onChange={e => editingId 
                                    ? setEditFormData({...editFormData, fullName: e.target.value})
                                    : setApplyData({...applyData, fullName: e.target.value})
                                } 
                                required 
                            />
                        </div>

                        {/* NIC Field - Only show in new application */}
                        {!editingId && (
                            <div style={styles.inputGroup}>
                                <label style={styles.label}><CreditCard size={14} /> {t.nic}</label>
                                <input 
                                    type="text" 
                                    placeholder={t.placeholders.nic} 
                                    style={{
                                        ...styles.input,
                                        borderColor: nicValidation.isMatch ? '#10b981' : (nicValidation.message && !nicValidation.isMatch ? '#ef4444' : '#e2e8f0'),
                                        backgroundColor: nicValidation.isMatch ? '#f0fdf4' : (nicValidation.message && !nicValidation.isMatch ? '#fef2f2' : 'white')
                                    }}
                                    value={applyData.nic} 
                                    onChange={handleNicChange}
                                    required 
                                />
                                {nicValidation.message && (
                                    <small style={{
                                        color: nicValidation.isMatch ? '#10b981' : '#ef4444',
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {nicValidation.isMatch ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {nicValidation.message}
                                    </small>
                                )}
                                {applyData.nic && welfareSettings.ageRestrictions[applyData.type] && nicValidation.isMatch && (
                                    <small style={styles.hintText}>
                                        {getAgeRestrictionDisplay()}
                                    </small>
                                )}
                            </div>
                        )}

                        {/* Welfare Type Dropdown - Only show in new application */}
                        {!editingId && (
                            <div style={styles.inputGroup}>
                                <label style={styles.label}><ListFilter size={14} /> {t.welfareType}</label>
                                <select 
                                    style={styles.select} 
                                    value={applyData.type} 
                                    onChange={e => setApplyData({...applyData, type: e.target.value})}
                                    required
                                >
                                    <option value="Aswasuma">{t.welfareTypes.aswasuma}</option>
                                    <option value="Samurdhi">{t.welfareTypes.samurdhi}</option>
                                    <option value="Elderly Allowance">{t.welfareTypes.elderly}</option>
                                </select>
                                <small style={styles.hintText}>
                                    {getMaxIncomeDisplay()}{getAgeRestrictionDisplay()}
                                </small>
                            </div>
                        )}

                        {/* House Number Field */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><Home size={14} /> {t.householdNo}</label>
                            <input 
                                type="text" 
                                placeholder={t.placeholders.household} 
                                style={styles.input} 
                                value={editingId ? editFormData.householdNo : applyData.householdNo} 
                                onChange={e => editingId
                                    ? setEditFormData({...editFormData, householdNo: e.target.value})
                                    : setApplyData({...applyData, householdNo: e.target.value})
                                } 
                                required 
                            />
                        </div>

                        {/* Monthly Income Field */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><DollarSign size={14} /> {t.monthlyIncome}{getMaxIncomeDisplay()}</label>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                pattern="\d*"
                                placeholder={t.placeholders.income} 
                                style={styles.input} 
                                value={editingId ? editFormData.monthlyIncome : applyData.monthlyIncome} 
                                onChange={(e) => editingId ? handleIncomeChange(e, true) : handleIncomeChange(e, false)}
                                required 
                            />
                            {welfareSettings.maxIncomeLimits[applyData.type] && (
                                <small style={styles.hintText}>
                                    Maximum allowed: Rs. {welfareSettings.maxIncomeLimits[applyData.type]}
                                </small>
                            )}
                        </div>

                        {/* Pay Slip Upload - Only shown if global setting allows it */}
                        {welfareSettings.incomeVerificationRequired && (
                            <div style={styles.inputGroup}>
                                <label style={styles.label}><Upload size={14} /> {t.uploadPaySlip}</label>
                                <div style={styles.uploadArea}>
                                    <Upload size={20} color="#800000" />
                                    <span style={styles.uploadText}>
                                        {editingId 
                                            ? (editFileName || t.uploadPaySlip)
                                            : (fileName || t.uploadPaySlip)
                                        }
                                    </span>
                                    <input 
                                        type="file" 
                                        accept="image/*,.pdf"
                                        onChange={editingId ? handleEditFileChange : handleFileChange} 
                                        style={styles.fileInput} 
                                        required={!editingId && isPaySlipRequired()}
                                    />
                                </div>
                                <small style={styles.optionalNote}>
                                    {isPaySlipRequired() 
                                        ? '📄 PDF හෝ ඡායාරූපයක් - අනිවාර්යයි (උපරිම 5MB)' 
                                        : '📄 PDF හෝ ඡායාරූපයක් - අවශ්‍ය නම් පමණක් (උපරිම 5MB)'}
                                </small>
                            </div>
                        )}

                        {/* Verification Status Display */}
                        {!editingId && (
                            <div style={styles.verifyBox}>
                                <ShieldCheck size={18} color="#800000" />
                                <span style={styles.verifyText}>
                                    <strong>{t.verificationStatus}:</strong> {t.pending}
                                </span>
                            </div>
                        )}

                        {/* Form Buttons */}
                        <div style={styles.buttonGroup}>
                            <button 
                                type="submit" 
                                style={{
                                    ...styles.btn,
                                    opacity: isSubmitting ? 0.7 : 1,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    flex: editingId ? 1 : 'none',
                                    width: editingId ? 'auto' : '100%'
                                }}
                                disabled={isSubmitting || (!editingId && !nicValidation.isMatch && applyData.nic.length > 0)}
                            >
                                <Send size={18} /> 
                                {isSubmitting 
                                    ? 'Submitting...' 
                                    : (editingId ? t.update : t.submit)
                                }
                            </button>
                            
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={cancelEditing}
                                    style={styles.cancelBtn}
                                >
                                    {t.cancel}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* My Applications Section */}
                <div style={styles.applicationsCard}>
                    <h3 style={styles.sectionTitle}>
                        <FileText size={20} color="#800000" /> {t.myApplications}
                    </h3>
                    
                    {loading && initialLoad ? (
                        <div style={styles.loadingContainer}>
                            <div style={styles.spinner}></div>
                            <p style={styles.loadingText}>{t.loading}</p>
                        </div>
                    ) : userApplications.length === 0 ? (
                        <div style={styles.noData}>
                            <p>{t.noApplications}</p>
                        </div>
                    ) : (
                        <div style={styles.applicationsList}>
                            {userApplications.map(app => (
                                <div key={app._id} style={styles.applicationItem}>
                                    <div style={styles.applicationHeader}>
                                        <div>
                                            <h4 style={styles.appName}>{app.fullName}</h4>
                                            <p style={styles.appType}>{app.type}</p>
                                        </div>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: getStatusStyle(app.status).bg,
                                            color: getStatusStyle(app.status).color
                                        }}>
                                            {app.status}
                                        </span>
                                    </div>
                                    
                                    <div style={styles.applicationDetails}>
                                        <p style={styles.detailItem}>
                                            <Clock size={14} style={styles.detailIcon} /> 
                                            {t.appliedOn}: {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                        <p style={styles.detailItem}>
                                            <DollarSign size={14} style={styles.detailIcon} /> 
                                            {t.monthlyIncome}: Rs. {app.income}
                                        </p>
                                        <p style={styles.detailItem}>
                                            <Home size={14} style={styles.detailIcon} /> 
                                            {t.householdNo}: {app.householdNo}
                                        </p>
                                    </div>
                                    
                                    {/* Only show edit/delete for Pending applications */}
                                    {app.status === 'Pending' && (
                                        <div style={styles.applicationActions}>
                                            <button 
                                                onClick={() => startEditing(app)}
                                                style={styles.editBtn}
                                                title={t.edit}
                                            >
                                                <Edit size={16} /> {t.edit}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(app._id)}
                                                style={styles.deleteBtn}
                                                title={t.delete}
                                            >
                                                <Trash2 size={16} /> {t.delete}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
    
            {/* Responsive CSS Styles */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* Mobile Responsive Styles */
                    @media (max-width: 768px) {
                        .welfare-page-wrapper {
                            padding: 15px !important;
                        }
                        
                        .welfare-container {
                            max-width: 100% !important;
                        }
                        
                        .welfare-card {
                            padding: 25px 20px !important;
                        }
                        
                        .welfare-card h2 {
                            font-size: 22px !important;
                        }
                        
                        .welfare-card .subtitle {
                            font-size: 12px !important;
                        }
                        
                        .welfare-form {
                            gap: 15px !important;
                        }
                        
                        .form-field {
                            margin-bottom: 5px !important;
                        }
                        
                        .welfare-input, .welfare-select {
                            padding: 12px !important;
                            font-size: 16px !important;
                        }
                        
                        .upload-area {
                            padding: 10px 12px !important;
                        }
                        
                        .upload-text {
                            font-size: 12px !important;
                        }
                        
                        .submit-btn, .cancel-btn {
                            padding: 12px !important;
                            font-size: 14px !important;
                        }
                        
                        .applications-card {
                            padding: 20px !important;
                        }
                        
                        .applications-list {
                            gap: 12px !important;
                        }
                        
                        .application-item {
                            padding: 15px !important;
                        }
                        
                        .application-header {
                            flex-direction: column !important;
                            gap: 10px !important;
                        }
                        
                        .app-name {
                            font-size: 15px !important;
                        }
                        
                        .status-badge {
                            align-self: flex-start !important;
                        }
                        
                        .application-details {
                            gap: 6px !important;
                        }
                        
                        .detail-item {
                            font-size: 12px !important;
                        }
                        
                        .application-actions {
                            flex-direction: row !important;
                            gap: 8px !important;
                        }
                        
                        .edit-btn, .delete-btn {
                            padding: 6px 12px !important;
                            font-size: 12px !important;
                        }
                        
                        .welfare-lang-bar {
                            padding: 6px 12px !important;
                            margin-bottom: 12px !important;
                        }
                        
                        .welfare-lang-bar span {
                            font-size: 11px !important;
                            padding: 3px 6px !important;
                        }
                        
                        .verify-box {
                            padding: 12px !important;
                        }
                        
                        .verify-text {
                            font-size: 12px !important;
                        }
                        
                        .success-msg, .error-msg {
                            padding: 12px !important;
                            font-size: 12px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .welfare-card {
                            padding: 20px 15px !important;
                        }
                        
                        .welfare-card h2 {
                            font-size: 18px !important;
                        }
                        
                        .section-title {
                            font-size: 16px !important;
                        }
                        
                        .welfare-input, .welfare-select {
                            padding: 10px !important;
                            font-size: 14px !important;
                        }
                        
                        .submit-btn, .cancel-btn {
                            padding: 10px !important;
                            font-size: 13px !important;
                        }
                        
                        .application-item {
                            padding: 12px !important;
                        }
                        
                        .app-name {
                            font-size: 14px !important;
                        }
                        
                        .app-type {
                            font-size: 11px !important;
                        }
                        
                        .edit-btn, .delete-btn {
                            padding: 5px 10px !important;
                            font-size: 11px !important;
                        }
                        
                        .edit-btn svg, .delete-btn svg {
                            width: 12px !important;
                            height: 12px !important;
                        }
                    }
                    
                    /* Desktop - keep original styles */
                    @media (min-width: 769px) {
                        .welfare-container {
                            max-width: 600px !important;
                            margin: 0 auto !important;
                        }
                        
                        .welfare-card {
                            padding: 40px !important;
                        }
                        
                        .applications-card {
                            padding: 30px !important;
                        }
                    }
                    
                    /* Hover Effects */
                    .submit-btn:hover {
                        transform: translateY(-2px) !important;
                        box-shadow: 0 10px 25px rgba(128,0,0,0.3) !important;
                    }
                    
                    .cancel-btn:hover {
                        background-color: #e2e8f0 !important;
                    }
                    
                    .edit-btn:hover {
                        background-color: #2563eb !important;
                    }
                    
                    .delete-btn:hover {
                        background-color: #dc2626 !important;
                    }
                    
                    .upload-area:hover {
                        background-color: #f0fdf4 !important;
                        border-color: #a00000 !important;
                    }
                    
                    .welfare-lang-bar span:not(.separator):hover {
                        color: #800000 !important;
                        opacity: 1 !important;
                    }
                    
                    /* Focus Effects */
                    .welfare-input:focus, .welfare-select:focus {
                        border-color: #800000 !important;
                        outline: none !important;
                        box-shadow: 0 0 0 3px rgba(128,0,0,0.1) !important;
                    }
                `}
            </style>
        </div>
    );
}

// --- Styles Object ---
const styles = {
    pageBackground: { 
        backgroundColor: '#f1f5f9', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px' 
    },
    container: { 
        width: '100%', 
        maxWidth: '600px' 
    },
    langBar: { 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '5px', 
        marginBottom: '15px',
        backgroundColor: 'white',
        padding: '8px 15px',
        borderRadius: '30px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    },
    langBtn: { 
        padding: '4px 8px', 
        cursor: 'pointer', 
        fontSize: '13px', 
        fontWeight: '600', 
        color: '#64748b',
        opacity: 0.7,
        transition: 'opacity 0.2s'
    },
    langActive: { 
        padding: '4px 8px', 
        cursor: 'pointer', 
        color: '#800000',
        fontSize: '13px', 
        fontWeight: '800' 
    },
    separator: {
        color: '#cbd5e1'
    },
    card: { 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 40px rgba(128,0,0,0.1)',
        border: '1px solid #f1f5f9',
        marginBottom: '20px'
    },
    applicationsCard: {
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 40px rgba(128,0,0,0.1)',
        border: '1px solid #f1f5f9'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '18px',
        color: '#334155',
        marginBottom: '20px'
    },
    title: { 
        textAlign: 'center', 
        fontSize: '26px', 
        fontWeight: 'bold', 
        color: '#800000', 
        marginBottom: '10px' 
    },
    subtitle: { 
        textAlign: 'center', 
        fontSize: '13px', 
        color: '#64748b', 
        marginBottom: '30px' 
    },
    form: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px' 
    },
    inputGroup: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px' 
    },
    label: { 
        fontSize: '14px', 
        fontWeight: '600', 
        color: '#334155', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' 
    },
    input: { 
        padding: '14px', 
        borderRadius: '12px', 
        border: '1.5px solid #e2e8f0', 
        outline: 'none', 
        transition: 'all 0.3s ease',
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box'
    },
    select: { 
        padding: '14px', 
        borderRadius: '12px', 
        border: '1.5px solid #e2e8f0', 
        outline: 'none', 
        backgroundColor: 'white',
        fontSize: '14px',
        width: '100%',
        boxSizing: 'border-box'
    },
    uploadArea: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 15px',
        border: '1.5px dashed #800000',
        borderRadius: '12px',
        backgroundColor: '#fff5f5',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    uploadText: {
        fontSize: '13px',
        color: '#64748b',
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    fileInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer'
    },
    optionalNote: {
        fontSize: '11px',
        color: '#94a3b8',
        marginTop: '2px'
    },
    hintText: {
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '2px'
    },
    verifyBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '15px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1.5px solid #e2e8f0'
    },
    verifyText: {
        fontSize: '14px',
        color: '#334155'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
        marginTop: '10px'
    },
    btn: { 
        padding: '16px', 
        background: 'linear-gradient(135deg, #800000 0%, #a00000 100%)',
        color: 'white', 
        border: 'none', 
        borderRadius: '14px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '10px', 
        boxShadow: '0 8px 20px rgba(128,0,0,0.2)',
        transition: 'transform 0.2s, opacity 0.2s',
    },
    cancelBtn: {
        padding: '16px 25px',
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        border: 'none',
        borderRadius: '14px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        transition: 'background 0.2s',
    },
    successMsg: { 
        padding: '15px', 
        backgroundColor: '#dcfce7', 
        color: '#15803d', 
        borderRadius: '12px', 
        fontSize: '13px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        border: '1px solid #bbf7d0'
    },
    errorMsg: { 
        padding: '15px', 
        backgroundColor: '#fee2e2', 
        color: '#b91c1c', 
        borderRadius: '12px', 
        fontSize: '13px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        border: '1px solid #fecaca'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #800000',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '15px'
    },
    loadingText: {
        color: '#64748b',
        fontSize: '14px',
        margin: 0
    },
    noData: {
        textAlign: 'center',
        padding: '40px',
        color: '#94a3b8',
        backgroundColor: '#f8fafc',
        borderRadius: '12px'
    },
    applicationsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    applicationItem: {
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    applicationHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '15px'
    },
    appName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#334155',
        margin: '0 0 5px 0'
    },
    appType: {
        fontSize: '13px',
        color: '#64748b',
        margin: 0
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
    },
    applicationDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '15px',
        fontSize: '13px',
        color: '#64748b'
    },
    detailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0,
        color: '#64748b'
    },
    detailIcon: {
        color: '#800000',
        opacity: 0.7
    },
    applicationActions: {
        display: 'flex',
        gap: '10px',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '15px'
    },
    editBtn: {
        padding: '8px 15px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '13px',
        transition: 'opacity 0.2s',
    },
    deleteBtn: {
        padding: '8px 15px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '13px',
        transition: 'opacity 0.2s',
    }
};

export default ApplyWelfare;