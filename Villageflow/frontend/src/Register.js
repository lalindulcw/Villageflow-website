import React, { useState } from 'react';
import { useLanguage } from './services/languageService';
import axios from 'axios';
import { API_BASE } from './config';
import { Landmark, ArrowRight, CheckCircle, Eye, EyeOff, Phone, Calendar, MapPin, Home, Briefcase, UserCheck, Settings, ShieldCheck, Info, X, AlertCircle, Lock } from 'lucide-react';

const translations = {
    en: {
        title: "Create Account", 
        gov: "Government Digital Access Portal", 
        sub: "Join VillageFlow - Bibile",
        name: "Full Name", 
        nic: "NIC Number", 
        email: "Email Address", 
        pass: "Password",
        role: "Role", 
        gender: "Gender", 
        male: "Male", 
        female: "Female",
        district: "District", 
        ds: "Divisional Secretariat",
        gn: "GN Division", 
        secKey: "Officer Key", 
        btn: "Register Account",
        err_key: "Invalid Key!", 
        success: "Registration Successful!",
        age: "Age", 
        address: "Permanent Address", 
        household: "Household Number",
        mobile: "Mobile Number", 
        dob: "Date of Birth", 
        occupation: "Occupation",
        emergency: "Emergency Contact", 
        terms: "I agree to the Terms & Conditions",
        village: "Village/Street", 
        city: "City", 
        confirmPass: "Confirm Password",
        passMismatch: "Passwords do not match!", 
        requiredField: "This field is required",
        personalInfo: "Personal Information", 
        addressInfo: "Address Information",
        accountInfo: "Account Information", 
        next: "Next", 
        previous: "Previous",
        tab1: "Basic Info", 
        tab2: "Address", 
        tab3: "Account",
        tagline: "Official Digital Platform for Rural Administrative Services",
        officialAccess: "Official Access Secured",
        infoProtected: "Your information is protected through secure authentication.",
        auditText: "This is an authorized government digital platform. Unauthorized access is prohibited. User activity may be monitored for security and auditing purposes.",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service"
    },
    si: {
        title: "ගිණුමක් සාදන්න", 
        gov: "රාජ්‍ය ඩිජිටල් පිවිසුම් ද්වාරය", 
        sub: "VillageFlow සමඟ එක්වන්න - බිබිලේ",
        name: "සම්පූර්ණ නම", 
        nic: "NIC අංකය", 
        email: "විද්‍යුත් තැපෑල", 
        pass: "මුරපදය",
        role: "භූමිකාව", 
        gender: "ස්ත්‍රී/පුරුෂ භාවය", 
        male: "පුරුෂ", 
        female: "ස්ත්‍රී",
        district: "දිස්ත්‍රික්කය", 
        ds: "ප්‍රාදේශීය ලේකම් කාර්යාලය",
        gn: "ග්‍රාම නිලධාරී වසම", 
        secKey: "නිලධාරී කේතය", 
        btn: "ලියාපදිංචි වන්න",
        err_key: "වැරදි කේතයකි!", 
        success: "ලියාපදිංචිය සාර්ථකයි!",
        age: "වයස", 
        address: "ස්ථිර ලිපිනය", 
        household: "ගෘහ මූලික අංකය",
        mobile: "ජංගම දුරකථන අංකය", 
        dob: "උපන් දිනය", 
        occupation: "රැකියාව",
        emergency: "හදිසි අවස්ථා සඳහා සම්බන්ධ කරගත යුතු අංකය", 
        terms: "මම නියමයන් සහ කොන්දේසි වලට එකඟ වෙමි",
        village: "ගම/වීදිය", 
        city: "නගරය", 
        confirmPass: "මුරපදය තහවුරු කරන්න",
        passMismatch: "මුරපද ගැලපෙන්නේ නැත!", 
        requiredField: "මෙම ක්ෂේත්‍රය අවශ්‍ය වේ",
        personalInfo: "පුද්ගලික තොරතුරු", 
        addressInfo: "ලිපින තොරතුරු",
        accountInfo: "ගිණුම් තොරතුරු", 
        next: "ඊළඟ", 
        previous: "පෙර",
        tab1: "මූලික තොරතුරු", 
        tab2: "ලිපිනය", 
        tab3: "ගිණුම",
        tagline: "ග්‍රාමීය පරිපාලන සේවා සඳහා වන නිල ඩිජිටල් වේදිකාව",
        officialAccess: "නිල පිවිසුම සුරක්ෂිත කර ඇත",
        infoProtected: "ආරක්ෂිත සත්‍යාපනය මඟින් ඔබගේ තොරතුරු සුරක්ෂිත කර ඇත.",
        auditText: "මෙය බලයලත් රාජ්‍ය ඩිජිටල් වේදිකාවකි. අනවසරයෙන් පිවිසීම තහනම්ය. ආරක්ෂාව සහ විගණන කටයුතු සඳහා පරිශීලක ක්‍රියාකාරකම් නිරීක්ෂණය කළ හැක.",
        privacyPolicy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
        termsOfService: "සේවා කොන්දේසි"
    },
    ta: {
        title: "கணக்கை உருவாக்கு", 
        gov: "அரசாங்க டிஜிட்டல் அணுகல் போர்டல்", 
        sub: "VillageFlow இல் இணையுங்கள் - பிபிலே",
        name: "முழு பெயர்", 
        nic: "NIC எண்", 
        email: "மின்னஞ்சல்", 
        pass: "கடவுச்சொல்",
        role: "பங்கு", 
        gender: "பாலினம்", 
        male: "ஆண்", 
        female: "பெண்",
        district: "மாவட்டம்", 
        ds: "பிரதேச செயலகம்",
        gn: "கிராம அலுவலர் பிரிவு", 
        secKey: "அதிகாரி குறியீடு", 
        btn: "பதிவு செய்க",
        err_key: "தவறான குறியீடு!", 
        success: "பதிவு வெற்றிகரமாக முடிந்தது!",
        age: "வயது", 
        address: "நிரந்தர முகவரி", 
        household: "வீட்டு எண்",
        mobile: "கைபேசி எண்", 
        dob: "பிறந்த தேதி", 
        occupation: "தொழில்",
        emergency: "அவசர தொடர்பு", 
        terms: "நான் விதிமுறைகள் மற்றும் நிபந்தனைகளை ஏற்கிறேன்",
        village: "கிராமம்/தெரு", 
        city: "நகரம்", 
        confirmPass: "கடவுச்சொல்லை உறுதி செய்க",
        passMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை!", 
        requiredField: "இந்த புலம் தேவை",
        personalInfo: "தனிப்பட்ட தகவல்கள்", 
        addressInfo: "முகவரி தகவல்கள்",
        accountInfo: "கணக்கு தகவல்கள்", 
        next: "அடுத்து", 
        previous: "முந்தைய",
        tab1: "அடிப்படை", 
        tab2: "முகவரி", 
        tab3: "கணக்கு",
        tagline: "கிராமப்புற நிர்வாக சேவைகளுக்கான அதிகாரப்பூர்வ டிஜிட்டல் தளம்",
        officialAccess: "அதிகாரப்பூர்வ அணுகல் பாதுகாப்பானது",
        infoProtected: "பாதுகாப்பான அங்கீகாரம் மூலம் உங்கள் தகவல் பாதுகாக்கப்படுகிறது.",
        auditText: "இது அங்கீகரிக்கப்பட்ட அரசாங்க டிஜிட்டல் தளமாகும். அங்கீகரிக்கப்படாத அணுகல் தடைசெய்யப்பட்டுள்ளது. பாதுகாப்பு மற்றும் தணிக்கை நோக்கங்களுக்காக பயனர் செயல்பாடு கண்காணிக்கப்படலாம்.",
        privacyPolicy: "தனியுரிமைக் கொள்கை",
        termsOfService: "சேவை விதிமுறைகள்"
    }
};

function Register({ onSwitchToLogin }) {
    const [lang, setLang] = useLanguage();
    const [activeTab, setActiveTab] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        nic: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobileNumber: '',
        dateOfBirth: '',
        role: 'citizen',
        gender: 'Male',
        district: 'Monaragala',
        divisionalSecretariat: 'Bibile',
        gnDivision: 'Kotagama',
        village: '',
        city: '',
        householdNo: '',
        occupation: '',
        emergencyContact: '',
        address: '',
        age: '',
        agreeToTerms: false
    });
    const [securityKey, setSecurityKey] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const OFFICIAL_KEY = "SL-GOV-2026";
    const t = translations[lang];

    const validateSriLankanNIC = (nic) => {
        if (!nic || nic.trim() === '') return false;
        const cleaned = nic.trim().toUpperCase();
        const oldNicPattern = /^[0-9]{9}[VX]$/;
        const newNicPattern = /^[0-9]{12}$/;
        if (oldNicPattern.test(cleaned)) return true;
        if (newNicPattern.test(cleaned)) return true;
        return false;
    };

    const getNICDetails = (nic) => {
        if (!nic) return null;
        const cleaned = nic.trim().toUpperCase();
        let year, days, gender;
        if (cleaned.length === 10) {
            year = 1900 + parseInt(cleaned.substring(0, 2));
            days = parseInt(cleaned.substring(2, 5));
            gender = days > 500 ? 'Female' : 'Male';
            if (days > 500) days -= 500;
        } else if (cleaned.length === 12) {
            year = parseInt(cleaned.substring(0, 4));
            days = parseInt(cleaned.substring(4, 7));
            gender = days > 500 ? 'Female' : 'Male';
            if (days > 500) days -= 500;
        } else {
            return null;
        }
        if (days < 1 || days > 366) return null;
        return { year, days, gender };
    };

    const validateSriLankanMobile = (mobile) => {
        if (!mobile || mobile.trim() === '') return false;
        const cleaned = mobile.trim().replace(/\s/g, '');
        const mobilePattern = /^(?:(?:\+94|0094|0)(7[0-9]{8}))$/;
        const simplePattern = /^0[0-9]{9}$/;
        if (mobilePattern.test(cleaned)) return true;
        if (simplePattern.test(cleaned) && cleaned.startsWith('07')) return true;
        return false;
    };

    const formatSriLankanMobile = (mobile) => {
        if (!mobile) return '';
        let cleaned = mobile.trim().replace(/\s/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '+94' + cleaned.substring(1);
        } else if (cleaned.startsWith('0094')) {
            cleaned = '+' + cleaned.substring(2);
        } else if (!cleaned.startsWith('+94')) {
            cleaned = '+94' + cleaned;
        }
        return cleaned;
    };

    const calculateAgeFromNIC = (nic) => {
        const details = getNICDetails(nic);
        if (!details) return null;
        const currentYear = new Date().getFullYear();
        let age = currentYear - details.year;
        const currentDayOfYear = Math.floor((new Date() - new Date(currentYear, 0, 0)) / 86400000);
        if (details.days > currentDayOfYear) {
            age--;
        }
        return age;
    };

    const calculateAgeFromDOB = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validateSriLankanAddress = (address) => {
        if (!address || address.trim() === '') return false;
        return address.trim().length >= 5;
    };

    const validateHouseholdNumber = (householdNo, gnDivision) => {
        if (!householdNo || householdNo.trim() === '') return false;
        const pattern = /^[A-Za-z0-9-]{3,20}$/;
        if (!pattern.test(householdNo)) return false;
        return true;
    };

    const validateEmergencyContact = (contact) => {
        if (!contact || contact.trim() === '') return true;
        return validateSriLankanMobile(contact);
    };

    const validateOccupation = (occupation) => {
        if (!occupation || occupation.trim() === '') return false;
        return occupation.trim().length >= 2;
    };

    const validateSriLankanLocation = (location) => {
        if (!location || location.trim() === '') return false;
        return location.trim().length >= 2;
    };

    const validateSriLankanName = (name) => {
        if (!name || name.trim() === '') return false;
        const namePattern = /^[A-Za-z\u0D80-\u0DFF\u0B80-\u0BFF\s.]{3,100}$/;
        return namePattern.test(name.trim()) && name.trim().split(/\s+/).length >= 2;
    };

    const validateEmail = (email) => {
        if (!email || email.trim() === '') return false;
        const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return emailPattern.test(email.trim());
    };

    const validateCurrentTab = () => {
        const errors = {};

        if (activeTab === 1) {
            if (!formData.fullName.trim()) {
                errors.fullName = t.requiredField;
            } else if (!validateSriLankanName(formData.fullName)) {
                errors.fullName = "Please enter a valid full name (minimum 3 characters, first and last name)";
            }

            if (!formData.nic.trim()) {
                errors.nic = t.requiredField;
            } else if (!validateSriLankanNIC(formData.nic)) {
                errors.nic = "Invalid NIC! Use old format (9 digits + V/X) or new format (12 digits)";
            } else {
                const nicDetails = getNICDetails(formData.nic);
                if (nicDetails && !formData.gender) {
                    setFormData(prev => ({ ...prev, gender: nicDetails.gender }));
                }
                const ageFromNIC = calculateAgeFromNIC(formData.nic);
                if (ageFromNIC !== null && ageFromNIC < 18) {
                    errors.nic = "You must be at least 18 years old (based on NIC)";
                }
            }

            if (!formData.mobileNumber.trim()) {
                errors.mobileNumber = t.requiredField;
            } else if (!validateSriLankanMobile(formData.mobileNumber)) {
                errors.mobileNumber = "Invalid mobile number! Use format: 07XXXXXXXX or +947XXXXXXXX";
            } else {
                const formatted = formatSriLankanMobile(formData.mobileNumber);
                if (formatted !== formData.mobileNumber) {
                    setFormData(prev => ({ ...prev, mobileNumber: formatted }));
                }
            }

            if (!formData.dateOfBirth) {
                errors.dateOfBirth = t.requiredField;
            } else {
                const age = calculateAgeFromDOB(formData.dateOfBirth);
                if (age < 18) {
                    errors.dateOfBirth = "You must be at least 18 years old!";
                } else if (age > 120) {
                    errors.dateOfBirth = "Please enter a valid date of birth";
                }
            }
        }

        if (activeTab === 2 && formData.role === 'citizen') {
            if (!formData.village.trim()) {
                errors.village = t.requiredField;
            } else if (!validateSriLankanLocation(formData.village)) {
                errors.village = "Please enter a valid village/street name";
            }

            if (!formData.city.trim()) {
                errors.city = t.requiredField;
            } else if (!validateSriLankanLocation(formData.city)) {
                errors.city = "Please enter a valid city/town name";
            }

            if (!formData.householdNo.trim()) {
                errors.householdNo = t.requiredField;
            } else if (!validateHouseholdNumber(formData.householdNo, formData.gnDivision)) {
                errors.householdNo = "Invalid household number (3-20 characters: letters, numbers, hyphens)";
            }

            if (!formData.occupation.trim()) {
                errors.occupation = t.requiredField;
            } else if (!validateOccupation(formData.occupation)) {
                errors.occupation = "Please enter a valid occupation";
            }

            if (formData.address && formData.address.trim() !== "") {
                if (!validateSriLankanAddress(formData.address)) {
                    errors.address = "Address must be at least 5 characters";
                }
            }

            if (formData.emergencyContact && formData.emergencyContact.trim() !== "") {
                if (!validateEmergencyContact(formData.emergencyContact)) {
                    errors.emergencyContact = "Invalid emergency contact number (Sri Lankan format)";
                }
            }
        }

        if (activeTab === 2 && formData.role === 'officer') {
            if (formData.address && formData.address.trim() !== "") {
                if (!validateSriLankanAddress(formData.address)) {
                    errors.address = "Address must be at least 5 characters";
                }
            }
        }

        if (activeTab === 3) {
            if (!formData.email.trim()) {
                errors.email = t.requiredField;
            } else if (!validateEmail(formData.email)) {
                errors.email = "Invalid email format (e.g., name@example.com)";
            }

            if (!formData.password) {
                errors.password = t.requiredField;
            } else if (formData.password.length < 8) {
                errors.password = "Password must be at least 8 characters";
            }

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = t.passMismatch;
            }

            if (!formData.agreeToTerms) {
                errors.agreeToTerms = "You must agree to the terms!";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNICChange = (nic) => {
        setFormData({ ...formData, nic });
        if (validateSriLankanNIC(nic)) {
            const details = getNICDetails(nic);
            if (details) {
                setFormData(prev => ({ ...prev, gender: details.gender }));
                const age = calculateAgeFromNIC(nic);
                if (age !== null) {
                    setFormData(prev => ({ ...prev, age: age.toString() }));
                }
            }
        }
    };

    const handleDOBChange = (dob) => {
        setFormData({ ...formData, dateOfBirth: dob });
        const age = calculateAgeFromDOB(dob);
        if (age !== null) {
            setFormData(prev => ({ ...prev, age: age.toString() }));
        }
    };

    const handleNext = () => {
        if (validateCurrentTab()) {
            setActiveTab(activeTab + 1);
            setFormErrors({});
        }
    };

    const handlePrevious = () => {
        setActiveTab(activeTab - 1);
        setFormErrors({});
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validateCurrentTab()) return;

        if (formData.role === 'officer' && securityKey !== OFFICIAL_KEY) {
            setFormErrors({ securityKey: t.err_key });
            return;
        }

        setLoading(true);
        try {
            const finalData = {
                ...formData,
                securityKey,
                age: formData.age || calculateAgeFromDOB(formData.dateOfBirth) || calculateAgeFromNIC(formData.nic),
                mobileNumber: formatSriLankanMobile(formData.mobileNumber)
            };
            delete finalData.confirmPassword;

            await axios.post(`${API_BASE}/auth/register`, finalData);

            setSuccessMsg(t.success);

            setTimeout(() => {
                onSwitchToLogin();
            }, 2500);

        } catch (err) {
            if (err.response && err.response.data.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                setFormErrors({ general: err.response?.data?.msg || "Registration Failed!" });
            }
        } finally {
            setLoading(false);
        }
    };

    const isNicValid = formData.nic && validateSriLankanNIC(formData.nic);
    const isNicInvalid = formData.nic && !validateSriLankanNIC(formData.nic);

    return (
        <div className="register-page-wrapper" style={styles.pageWrapper}>
            <div className="register-main-card" style={styles.mainCard}>
                
                {/* Left Panel — Government Brand Identity */}
                <div className="register-left-panel" style={styles.leftPanel}>
                    <div className="register-left-pattern"></div>
                    <div className="register-left-glow"></div>
                    <div style={styles.overlay}>
                        <div style={styles.emblemContainer}>
                            <div className="emblem-ring-outer" style={styles.emblemRingOuter}></div>
                            <div style={styles.emblemRingInner}>
                                <Landmark size={36} color="#D4AF37" strokeWidth={1.5} />
                            </div>
                        </div>
                        
                        <h1 className="register-portal-name" style={styles.portalName}>VillageFlow</h1>
                        
                        <p className="register-tagline" style={styles.tagline}>
                            {t.tagline}
                        </p>

                        <div style={styles.leftSecureBadge}>
                            <ShieldCheck size={20} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={styles.leftSecureBadgeTitle}>{t.officialAccess}</span>
                                <span style={styles.leftSecureBadgeDesc}>{t.infoProtected}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel — Registration Form */}
                <div className="register-right-panel" style={styles.rightPanel}>
                    <div className="register-form-container" style={styles.formContainer}>
                        
                        {/* Language Selector */}
                        <div className="register-lang-bar" style={styles.langBar} role="tablist" aria-label="Language Selector">
                            {['en', 'si', 'ta'].map((l) => (
                                <button 
                                    key={l}
                                    type="button"
                                    role="tab"
                                    aria-selected={lang === l}
                                    onClick={() => {
                                        setLang(l);
                                        setFormErrors({});
                                    }} 
                                    style={lang === l ? styles.activeLangPill : styles.langPill}
                                    className={lang === l ? "register-active-lang" : "register-lang-btn"}
                                >
                                    {l === 'en' ? 'ENGLISH' : l === 'si' ? 'සිංහල' : 'தமிழ்'}
                                </button>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="register-form-header" style={styles.formHeader}>
                            <h2 className="register-title-style" style={styles.titleStyle}>
                                {t.title}
                            </h2>
                            <p style={styles.subtitleStyle}>{t.sub}</p>
                            
                            <div className="register-secure-badge" style={styles.secureBadge}>
                                <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
                                <span style={styles.secureBadgeText}>{t.officialAccess}</span>
                            </div>
                        </div>

                        {/* Tab Headers */}
                        <div className="register-tabs" style={styles.tabContainer} role="tablist" aria-label="Registration Steps">
                            <button 
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 1}
                                style={styles.tab(activeTab === 1)} 
                                onClick={() => setActiveTab(1)}
                                className={activeTab === 1 ? "register-tab active-tab" : "register-tab"}
                            >
                                <UserCheck size={14} /><span>{t.tab1}</span>
                            </button>
                            <button 
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 2}
                                style={styles.tab(activeTab === 2)} 
                                onClick={() => setActiveTab(2)}
                                className={activeTab === 2 ? "register-tab active-tab" : "register-tab"}
                            >
                                <MapPin size={14} /><span>{t.tab2}</span>
                            </button>
                            <button 
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 3}
                                style={styles.tab(activeTab === 3)} 
                                onClick={() => setActiveTab(3)}
                                className={activeTab === 3 ? "register-tab active-tab" : "register-tab"}
                            >
                                <Settings size={14} /><span>{t.tab3}</span>
                            </button>
                        </div>

                        {/* Error and Success Banners */}
                        {successMsg && (
                            <div className="register-success-box" style={styles.successBox}>
                                <CheckCircle size={18} style={{flexShrink: 0}} />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {formErrors.general && (
                            <div className="register-error-box" style={styles.errorBox}>
                                <AlertCircle size={18} style={{flexShrink: 0}} />
                                <span>{formErrors.general}</span>
                            </div>
                        )}

                        {/* Tab Forms */}
                        <form onSubmit={handleRegister} className="register-form" style={styles.formGrid}>
                            
                            {activeTab === 1 && (
                                <div style={styles.tabContent}>
                                    
                                    {/* Name Field */}
                                    <div className="register-field-container" style={styles.fullWidth}>
                                        <label style={styles.label}>{t.name}</label>
                                        <div style={styles.inputGroup('fullName', focusedInput, false, !!formErrors.fullName)}>
                                            <input 
                                                style={styles.inputStyle} 
                                                className="register-input-style"
                                                value={formData.fullName} 
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                                                onFocus={() => setFocusedInput('fullName')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="e.g., M D Perera" 
                                            />
                                        </div>
                                        {formErrors.fullName && <span style={styles.errorText}>{formErrors.fullName}</span>}
                                    </div>

                                    {/* NIC Field */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.nic}</label>
                                        <div style={styles.inputGroup('nic', focusedInput, isNicValid, !!formErrors.nic)}>
                                            <input 
                                                style={styles.inputStyle} 
                                                className="register-input-style"
                                                value={formData.nic} 
                                                onChange={e => handleNICChange(e.target.value)} 
                                                onFocus={() => setFocusedInput('nic')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="123456789V" 
                                            />
                                            {isNicValid && <CheckCircle size={16} style={styles.validIcon} color="#16A34A" />}
                                        </div>
                                        {formErrors.nic && <span style={styles.errorText}>{formErrors.nic}</span>}
                                    </div>

                                    {/* Mobile Number */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.mobile}</label>
                                        <div style={styles.inputGroup('mobileNumber', focusedInput, false, !!formErrors.mobileNumber)}>
                                            <Phone size={16} style={styles.inputIcon} />
                                            <input 
                                                style={styles.inputWithIcon} 
                                                className="register-input-style"
                                                value={formData.mobileNumber} 
                                                onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} 
                                                onFocus={() => setFocusedInput('mobileNumber')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="07X XXX XXXX" 
                                            />
                                        </div>
                                        {formErrors.mobileNumber && <span style={styles.errorText}>{formErrors.mobileNumber}</span>}
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.dob}</label>
                                        <div style={styles.inputGroup('dateOfBirth', focusedInput, false, !!formErrors.dateOfBirth)}>
                                            <Calendar size={16} style={styles.inputIcon} />
                                            <input 
                                                type="date" 
                                                style={styles.inputWithIcon} 
                                                className="register-input-style"
                                                value={formData.dateOfBirth} 
                                                onChange={e => handleDOBChange(e.target.value)} 
                                                onFocus={() => setFocusedInput('dateOfBirth')}
                                                onBlur={() => setFocusedInput(null)}
                                            />
                                        </div>
                                        {formErrors.dateOfBirth && <span style={styles.errorText}>{formErrors.dateOfBirth}</span>}
                                    </div>

                                    {/* Role Selector */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.role}</label>
                                        <div style={styles.inputGroup('role', focusedInput, false, false)}>
                                            <select 
                                                style={styles.selectStyle} 
                                                className="register-input-style"
                                                value={formData.role} 
                                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                onFocus={() => setFocusedInput('role')}
                                                onBlur={() => setFocusedInput(null)}
                                            >
                                                <option value="citizen">Citizen</option>
                                                <option value="officer">Officer</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Gender Selector */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.gender}</label>
                                        <div style={styles.inputGroup('gender', focusedInput, false, false)}>
                                            <select 
                                                style={styles.selectStyle} 
                                                className="register-input-style"
                                                value={formData.gender} 
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                onFocus={() => setFocusedInput('gender')}
                                                onBlur={() => setFocusedInput(null)}
                                            >
                                                <option value="Male">{t.male}</option>
                                                <option value="Female">{t.female}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Officer Security Key */}
                                    {formData.role === 'officer' && (
                                        <div className="register-field-container" style={styles.fullWidth}>
                                            <label style={{ ...styles.label, color: '#D4AF37' }}>{t.secKey}</label>
                                            <div style={styles.inputGroup('securityKey', focusedInput, false, !!formErrors.securityKey)}>
                                                <input 
                                                    type="password" 
                                                    style={styles.inputStyle} 
                                                    className="register-input-style"
                                                    onChange={e => setSecurityKey(e.target.value)} 
                                                    onFocus={() => setFocusedInput('securityKey')}
                                                    onBlur={() => setFocusedInput(null)}
                                                />
                                            </div>
                                            {formErrors.securityKey && <span style={styles.errorText}>{formErrors.securityKey}</span>}
                                        </div>
                                    )}

                                </div>
                            )}

                            {activeTab === 2 && (
                                <div style={styles.tabContent}>
                                    
                                    {formData.role === 'citizen' ? (
                                        <>
                                            {/* Village / Street */}
                                            <div className="register-field-container" style={styles.fullWidth}>
                                                <label style={styles.label}>{t.village}</label>
                                                <div style={styles.inputGroup('village', focusedInput, false, !!formErrors.village)}>
                                                    <MapPin size={16} style={styles.inputIcon} />
                                                    <input 
                                                        style={styles.inputWithIcon} 
                                                        className="register-input-style"
                                                        value={formData.village} 
                                                        onChange={e => setFormData({ ...formData, village: e.target.value })} 
                                                        onFocus={() => setFocusedInput('village')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="e.g., Kotagama" 
                                                    />
                                                </div>
                                                {formErrors.village && <span style={styles.errorText}>{formErrors.village}</span>}
                                            </div>

                                            {/* City */}
                                            <div className="register-field-container" style={styles.halfWidth}>
                                                <label style={styles.label}>{t.city}</label>
                                                <div style={styles.inputGroup('city', focusedInput, false, !!formErrors.city)}>
                                                    <input 
                                                        style={styles.inputStyle} 
                                                        className="register-input-style"
                                                        value={formData.city} 
                                                        onChange={e => setFormData({ ...formData, city: e.target.value })} 
                                                        onFocus={() => setFocusedInput('city')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="e.g., Bibile" 
                                                    />
                                                </div>
                                                {formErrors.city && <span style={styles.errorText}>{formErrors.city}</span>}
                                            </div>

                                            {/* Household Number */}
                                            <div className="register-field-container" style={styles.halfWidth}>
                                                <label style={styles.label}>{t.household}</label>
                                                <div style={styles.inputGroup('householdNo', focusedInput, false, !!formErrors.householdNo)}>
                                                    <Home size={16} style={styles.inputIcon} />
                                                    <input 
                                                        style={styles.inputWithIcon} 
                                                        className="register-input-style"
                                                        value={formData.householdNo} 
                                                        onChange={e => setFormData({ ...formData, householdNo: e.target.value })} 
                                                        onFocus={() => setFocusedInput('householdNo')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="GN-KTG-001" 
                                                    />
                                                </div>
                                                {formErrors.householdNo && <span style={styles.errorText}>{formErrors.householdNo}</span>}
                                            </div>

                                            {/* Occupation */}
                                            <div className="register-field-container" style={styles.halfWidth}>
                                                <label style={styles.label}>{t.occupation}</label>
                                                <div style={styles.inputGroup('occupation', focusedInput, false, !!formErrors.occupation)}>
                                                    <Briefcase size={16} style={styles.inputIcon} />
                                                    <input 
                                                        style={styles.inputWithIcon} 
                                                        className="register-input-style"
                                                        value={formData.occupation} 
                                                        onChange={e => setFormData({ ...formData, occupation: e.target.value })} 
                                                        onFocus={() => setFocusedInput('occupation')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="e.g., Farmer, Teacher" 
                                                    />
                                                </div>
                                                {formErrors.occupation && <span style={styles.errorText}>{formErrors.occupation}</span>}
                                            </div>

                                            {/* Emergency Contact */}
                                            <div className="register-field-container" style={styles.halfWidth}>
                                                <label style={styles.label}>{t.emergency}</label>
                                                <div style={styles.inputGroup('emergencyContact', focusedInput, false, !!formErrors.emergencyContact)}>
                                                    <input 
                                                        style={styles.inputStyle} 
                                                        className="register-input-style"
                                                        value={formData.emergencyContact} 
                                                        onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} 
                                                        onFocus={() => setFocusedInput('emergencyContact')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="Optional - 07XXXXXXXX" 
                                                    />
                                                </div>
                                                {formErrors.emergencyContact && <span style={styles.errorText}>{formErrors.emergencyContact}</span>}
                                            </div>

                                            {/* Permanent Address */}
                                            <div className="register-field-container" style={styles.fullWidth}>
                                                <label style={styles.label}>{t.address}</label>
                                                <div style={{ ...styles.inputGroup('address', focusedInput, false, !!formErrors.address), height: 'auto' }}>
                                                    <textarea 
                                                        style={styles.textareaStyle} 
                                                        className="register-input-style"
                                                        value={formData.address} 
                                                        onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                                        onFocus={() => setFocusedInput('address')}
                                                        onBlur={() => setFocusedInput(null)}
                                                        placeholder="Full address (optional)" 
                                                    />
                                                </div>
                                                {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="register-field-container" style={styles.fullWidth}>
                                            <label style={styles.label}>{t.address}</label>
                                            <div style={{ ...styles.inputGroup('address', focusedInput, false, !!formErrors.address), height: 'auto' }}>
                                                <textarea 
                                                    style={styles.textareaStyle} 
                                                    className="register-input-style"
                                                    value={formData.address} 
                                                    onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                                    onFocus={() => setFocusedInput('address')}
                                                    onBlur={() => setFocusedInput(null)}
                                                    placeholder="Office address" 
                                                />
                                            </div>
                                            {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
                                        </div>
                                    )}

                                    {/* Locked Fields */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.district}</label>
                                        <div style={styles.lockedInputGroup}>
                                            <input style={styles.lockedInputStyle} value={formData.district} readOnly />
                                        </div>
                                    </div>
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.ds}</label>
                                        <div style={styles.lockedInputGroup}>
                                            <input style={styles.lockedInputStyle} value={formData.divisionalSecretariat} readOnly />
                                        </div>
                                    </div>
                                    <div className="register-field-container" style={styles.fullWidth}>
                                        <label style={styles.label}>{t.gn}</label>
                                        <div style={styles.lockedInputGroup}>
                                            <input style={styles.lockedInputStyle} value={formData.gnDivision} readOnly />
                                        </div>
                                    </div>

                                </div>
                            )}

                            {activeTab === 3 && (
                                <div style={styles.tabContent}>
                                    
                                    {/* Email */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.email}</label>
                                        <div style={styles.inputGroup('email', focusedInput, false, !!formErrors.email)}>
                                            <input 
                                                type="email"
                                                style={styles.inputStyle} 
                                                className="register-input-style"
                                                value={formData.email} 
                                                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                                onFocus={() => setFocusedInput('email')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="name@example.com" 
                                            />
                                        </div>
                                        {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
                                    </div>

                                    {/* Password */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.pass}</label>
                                        <div style={styles.inputGroup('password', focusedInput, false, !!formErrors.password)}>
                                            <Lock size={16} style={styles.inputIcon} />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                style={{...styles.inputWithIcon, paddingRight: '48px'}} 
                                                className="register-input-style"
                                                value={formData.password} 
                                                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                                onFocus={() => setFocusedInput('password')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)} 
                                                style={styles.eyeBtn}
                                                className="register-eye-btn"
                                            >
                                                {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                                            </button>
                                        </div>
                                        {formErrors.password && <span style={styles.errorText}>{formErrors.password}</span>}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="register-field-container" style={styles.halfWidth}>
                                        <label style={styles.label}>{t.confirmPass}</label>
                                        <div style={styles.inputGroup('confirmPassword', focusedInput, false, !!formErrors.confirmPassword)}>
                                            <Lock size={16} style={styles.inputIcon} />
                                            <input 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                style={{...styles.inputWithIcon, paddingRight: '48px'}} 
                                                className="register-input-style"
                                                value={formData.confirmPassword} 
                                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} 
                                                onFocus={() => setFocusedInput('confirmPassword')}
                                                onBlur={() => setFocusedInput(null)}
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                                style={styles.eyeBtn}
                                                className="register-eye-btn"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                                            </button>
                                        </div>
                                        {formErrors.confirmPassword && <span style={styles.errorText}>{formErrors.confirmPassword}</span>}
                                    </div>

                                    {/* Agree To Terms Checkbox */}
                                    <div className="register-field-container" style={styles.fullWidth}>
                                        <label className="register-checkbox-label" style={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.agreeToTerms} 
                                                onChange={e => setFormData({ ...formData, agreeToTerms: e.target.checked })} 
                                                style={styles.checkbox} 
                                            /> 
                                            <span>{t.terms}</span>
                                        </label>
                                        {formErrors.agreeToTerms && <span style={styles.errorText}>{formErrors.agreeToTerms}</span>}
                                    </div>

                                </div>
                            )}

                            {/* Buttons */}
                            <div style={styles.buttonContainer}>
                                {activeTab > 1 ? (
                                    <button type="button" onClick={handlePrevious} style={styles.secondaryBtn} className="register-secondary-btn">
                                        {t.previous}
                                    </button>
                                ) : <div />}
                                
                                {activeTab < 3 ? (
                                    <button type="button" onClick={handleNext} style={styles.mainBtn} className="register-main-btn">
                                        {t.next} <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        type="submit" 
                                        style={loading ? styles.disabledBtn : {}} 
                                        className={loading ? "register-disabled-btn" : "register-main-btn"}
                                        disabled={loading}
                                    >
                                        {loading ? "..." : t.btn.toUpperCase()} <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>

                        </form>

                        {/* Switch to Login Footer */}
                        <div className="register-footer" style={styles.footer}>
                            <p className="register-footer-text" style={styles.footerText}>
                                {lang === 'si' ? 'දැනටමත් ගිණුමක් තිබේද?' : lang === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா?' : 'Already have an account?'} 
                                <span onClick={onSwitchToLogin} className="register-link-text" style={styles.linkText}>
                                    {lang === 'si' ? 'පිවිසෙන්න' : lang === 'ta' ? 'உள்நுழைக' : 'Secure Sign In'}
                                </span>
                            </p>
                            
                            <div style={styles.policyLinks}>
                                <span className="register-policy-link" style={styles.policyLink}>{t.privacyPolicy}</span>
                                <span style={styles.dotSeparator}>•</span>
                                <span className="register-policy-link" style={styles.policyLink}>{t.termsOfService}</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            
            {/* Embedded styles and animations */}
            <style>
                {`
                    @keyframes spin { 
                        from { transform: rotate(0deg); } 
                        to { transform: rotate(360deg); } 
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes cardSlideUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slowGradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes slowGlow {
                        0% { transform: translate(-15%, -15%) scale(1); }
                        50% { transform: translate(10%, 15%) scale(1.08); }
                        100% { transform: translate(-10%, -5%) scale(0.95); }
                    }
                    @keyframes spinSlow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    .register-main-card {
                        animation: cardSlideUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    
                    .register-left-panel {
                        background: linear-gradient(135deg, #8B0000 0%, #700000 40%, #5E0000 100%);
                        background-size: 200% 200%;
                        animation: slowGradient 15s ease infinite;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .register-left-pattern {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        opacity: 0.03;
                        background-image: 
                            radial-gradient(circle at 100% 150%, #ffffff 24%, white 25%, transparent 28%),
                            radial-gradient(circle at 0% 150%, #ffffff 24%, white 25%, transparent 28%),
                            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
                        background-size: 20px 20px, 20px 20px, 40px 40px, 40px 40px;
                        pointer-events: none;
                        z-index: 1;
                    }
                    
                    .register-left-glow {
                        position: absolute;
                        top: -25%;
                        left: -25%;
                        width: 150%;
                        height: 150%;
                        background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
                        pointer-events: none;
                        animation: slowGlow 20s infinite alternate ease-in-out;
                        z-index: 1;
                    }
                    
                    .emblem-ring-outer {
                        position: absolute;
                        width: 90px;
                        height: 90px;
                        border-radius: 50%;
                        border: 1.5px dashed rgba(212, 175, 55, 0.45);
                        animation: spinSlow 25s linear infinite;
                    }
                    
                    .register-main-btn {
                        background: linear-gradient(135deg, #8B0000 0%, #5E0000 100%) !important;
                        color: #FFFFFF !important;
                        border: none !important;
                        border-radius: 12px !important;
                        font-weight: 700 !important;
                        font-size: 14px !important;
                        letter-spacing: 0.5px !important;
                        cursor: pointer !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 8px !important;
                        box-shadow: 0 4px 10px rgba(139, 0, 0, 0.2) !important;
                        transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                        outline: none !important;
                        padding: 12px 24px !important;
                    }
                    
                    .register-main-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(139, 0, 0, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.4) !important;
                    }
                    
                    .register-main-btn:active:not(:disabled) {
                        transform: scale(0.98);
                    }
                    
                    .register-secondary-btn {
                        background: #F1F5F9 !important;
                        color: #475569 !important;
                        border: 1px solid #E5E7EB !important;
                        border-radius: 12px !important;
                        font-weight: 600 !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        transition: all 200ms ease !important;
                        outline: none !important;
                        padding: 12px 24px !important;
                    }
                    
                    .register-secondary-btn:hover {
                        background: #E2E8F0 !important;
                        color: #1E293B !important;
                        transform: translateY(-2px);
                    }
                    
                    .register-disabled-btn {
                        opacity: 0.6;
                        cursor: not-allowed !important;
                        box-shadow: none !important;
                        background: linear-gradient(135deg, #8B0000 0%, #5E0000 100%) !important;
                    }
                    
                    .register-tab:hover:not(.active-tab) {
                        background-color: #F8FAFC !important;
                        color: #8B0000 !important;
                    }
                    
                    .register-forgot-link:hover,
                    .register-link-text:hover,
                    .register-policy-link:hover {
                        color: #8B0000 !important;
                        text-decoration: underline !important;
                    }
                    
                    /* Mobile / Tablet Styles */
                    @media (max-width: 768px) {
                        .register-main-card {
                            flex-direction: column !important;
                            border-radius: 0 !important;
                            min-height: 100vh !important;
                            box-shadow: none !important;
                            max-width: 100% !important;
                        }
                        .register-left-panel {
                            width: 100% !important;
                            padding: 40px 20px !important;
                            flex: none !important;
                        }
                        .register-right-panel {
                            width: 100% !important;
                            padding: 24px 16px !important;
                            flex: 1 !important;
                            background-color: #FFFFFF !important;
                        }
                        .register-form-container {
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            max-width: 100% !important;
                            background-color: transparent !important;
                        }
                        .register-portal-name { font-size: 32px !important; }
                        .register-tagline { font-size: 13px !important; }
                    }
                    
                    @media (min-width: 769px) {
                        .register-main-card {
                            flex-direction: row !important;
                            border-radius: 16px !important;
                            max-width: 1080px !important;
                        }
                        .register-left-panel {
                            flex: 0.35 !important;
                            padding: 48px !important;
                        }
                        .register-right-panel {
                            flex: 0.65 !important;
                            padding: 48px !important;
                        }
                    }
                    
                    /* Accessibility: Respect Reduced Motion preference */
                    @media (prefers-reduced-motion: reduce) {
                        .register-main-card,
                        .register-left-panel,
                        .register-left-glow,
                        .emblem-ring-outer,
                        .register-main-btn {
                            animation: none !important;
                            transition: none !important;
                            transform: none !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

const styles = {
    pageWrapper: { 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#F8FAFC', 
        padding: '24px 16px', 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif', 
        width: '100%', 
        overflowX: 'hidden' 
    },
    mainCard: { 
        display: 'flex', 
        background: '#FFFFFF', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        width: '100%', 
        maxWidth: '1080px', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' 
    },
    leftPanel: { 
        flex: '1', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#FFFFFF', 
        padding: '48px', 
        position: 'relative' 
    },
    overlay: { 
        textAlign: 'center', 
        zIndex: 2,
        width: '100%'
    },
    emblemContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '24px',
        position: 'relative',
        height: '100px',
        width: '100px',
        margin: '0 auto 24px auto'
    },
    emblemRingOuter: {
    },
    emblemRingInner: {
        position: 'relative',
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B0000 0%, #5E0000 100%)',
        border: '2px solid #D4AF37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(212, 175, 55, 0.2)',
        zIndex: 2
    },
    portalName: { 
        fontSize: '36px', 
        fontWeight: '800', 
        margin: 0, 
        letterSpacing: '0.5px',
        color: '#FFFFFF'
    },
    tagline: { 
        fontSize: '14px', 
        opacity: 0.9, 
        marginTop: '12px', 
        lineHeight: '1.6',
        maxWidth: '300px',
        marginLeft: 'auto',
        marginRight: 'auto',
        fontWeight: '400',
        color: '#FFFFFF'
    },
    leftSecureBadge: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        border: '1px solid rgba(22, 163, 74, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        marginTop: '32px',
        maxWidth: '320px',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'left'
    },
    leftSecureBadgeTitle: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    leftSecureBadgeDesc: {
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: '1.4'
    },
    rightPanel: { 
        flex: '1.2', 
        padding: '48px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#F8FAFC' 
    },
    formContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 10px 15px -3px rgba(0, 0, 0, 0.03)',
        border: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    },
    langBar: {
        display: 'flex',
        background: '#F1F5F9',
        padding: '4px',
        borderRadius: '30px',
        gap: '2px',
        marginBottom: '32px',
        alignSelf: 'flex-end',
        width: 'fit-content',
        border: '1px solid #E5E7EB'
    },
    langPill: {
        border: 'none',
        background: 'transparent',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6B7280',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none'
    },
    activeLangPill: {
        border: 'none',
        background: '#D4AF37', 
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        color: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)',
        cursor: 'default',
        transition: 'all 200ms ease',
        outline: 'none'
    },
    formHeader: { 
        marginBottom: '24px',
        textAlign: 'left'
    },
    titleStyle: { 
        fontSize: '32px', 
        fontWeight: '800', 
        color: '#111827', 
        marginBottom: '2px',
        letterSpacing: '-0.5px' 
    },
    subtitleStyle: {
        fontSize: '16px',
        fontWeight: '500',
        color: '#6B7280',
        margin: 0
    },
    secureBadge: { 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px', 
        color: '#16A34A', 
        backgroundColor: '#F0FDF4',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid #DCFCE7',
        marginTop: '16px'
    },
    secureBadgeText: {
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    tabContainer: { 
        display: 'flex', 
        background: '#F1F5F9',
        padding: '4px',
        borderRadius: '12px',
        gap: '4px', 
        marginBottom: '24px', 
        border: '1px solid #E5E7EB'
    },
    tab: (isActive) => ({ 
        flex: 1, 
        padding: '10px', 
        textAlign: 'center', 
        cursor: isActive ? 'default' : 'pointer', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        fontSize: '12px', 
        color: isActive ? '#FFFFFF' : '#6B7280', 
        backgroundColor: isActive ? '#8B0000' : 'transparent',
        transition: 'all 200ms ease', 
        fontWeight: '700',
        border: 'none',
        outline: 'none',
        boxShadow: isActive ? '0 2px 4px rgba(139,0,0,0.15)' : 'none'
    }),
    formGrid: { 
        display: 'flex', 
        flexDirection: 'column',
        gap: '16px' 
    },
    tabContent: { 
        width: '100%', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px',
        textAlign: 'left'
    },
    fullWidth: { 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    halfWidth: { 
        width: 'calc(50% - 8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: { 
        fontSize: '13px', 
        fontWeight: '600', 
        color: '#111827'
    },
    inputStyle: { 
        width: '100%', 
        height: '100%',
        padding: '0 16px', 
        borderRadius: '12px', 
        border: 'none', 
        outline: 'none', 
        fontSize: '14px', 
        color: '#111827',
        background: 'transparent' 
    },
    inputWithIcon: { 
        width: '100%', 
        height: '100%',
        padding: '0 16px 0 42px', 
        borderRadius: '12px', 
        border: 'none', 
        outline: 'none', 
        fontSize: '14px', 
        color: '#111827',
        background: 'transparent' 
    },
    textareaStyle: { 
        width: '100%', 
        padding: '12px 16px', 
        borderRadius: '12px', 
        border: 'none', 
        outline: 'none', 
        fontSize: '14px', 
        color: '#111827',
        background: 'transparent',
        minHeight: '80px',
        resize: 'vertical'
    },
    selectStyle: {
        width: '100%', 
        height: '100%',
        padding: '0 16px', 
        borderRadius: '12px', 
        border: 'none', 
        outline: 'none', 
        fontSize: '14px', 
        color: '#111827',
        background: 'transparent',
        cursor: 'pointer'
    },
    inputGroup: (fieldName, focusedName, isValid, isInvalid) => ({ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        border: '1.5px solid', 
        borderColor: isInvalid ? '#DC2626' : (focusedName === fieldName) ? '#D4AF37' : isValid ? '#16A34A' : '#E5E7EB', 
        borderRadius: '12px', 
        backgroundColor: '#FFFFFF',
        boxShadow: (focusedName === fieldName) ? '0 0 0 4px rgba(212, 175, 55, 0.15)' : 'none',
        transition: 'all 200ms ease',
        height: '46px',
        width: '100%'
    }),
    inputIcon: { 
        position: 'absolute', 
        left: '16px', 
        color: '#6B7280'
    },
    eyeBtn: { 
        position: 'absolute', 
        right: '16px', 
        border: 'none', 
        background: 'transparent', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        outline: 'none'
    },
    validIcon: { 
        position: 'absolute', 
        right: '16px' 
    },
    lockedInputGroup: {
        width: '100%',
        height: '46px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center'
    },
    lockedInputStyle: {
        width: '100%',
        height: '100%',
        padding: '0 16px',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        color: '#6B7280',
        cursor: 'not-allowed'
    },
    checkboxLabel: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        fontSize: '13px', 
        color: '#6B7280', 
        cursor: 'pointer', 
        transition: 'color 200ms ease' 
    },
    checkbox: { 
        cursor: 'pointer', 
        width: '16px', 
        height: '16px',
        accentColor: '#8B0000' 
    },
    buttonContainer: { 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '20px', 
        gap: '12px' 
    },
    mainBtn: {
        // styled inside <style>
    },
    secondaryBtn: {
    },
    disabledBtn: { 
        background: '#cbd5e1', 
        padding: '12px 24px', 
        borderRadius: '12px', 
        border: 'none', 
        color: '#64748b', 
        cursor: 'not-allowed', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '10px',
        fontSize: '14px',
        fontWeight: '700'
    },
    errorBox: { 
        padding: '12px 16px', 
        background: '#FEF2F2', 
        color: '#DC2626', 
        borderRadius: '8px', 
        fontSize: '14px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        border: '1px solid #FEE2E2', 
        animation: 'fadeIn 200ms ease' 
    },
    successBox: { 
        padding: '12px 16px', 
        background: '#F0FDF4', 
        color: '#16A34A', 
        borderRadius: '8px', 
        fontSize: '14px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        border: '1px solid #DCFCE7', 
        animation: 'fadeIn 200ms ease' 
    },
    errorText: { 
        color: '#DC2626', 
        fontSize: '11px', 
        marginTop: '2px', 
        display: 'block', 
        fontWeight: '500' 
    },
    helperText: { 
        color: '#16A34A', 
        fontSize: '11px', 
        marginTop: '2px', 
        display: 'block' 
    },
    hintText: { 
        fontSize: '11px', 
        color: '#6B7280', 
        marginTop: '2px', 
        display: 'block' 
    },
    footer: { 
        marginTop: '24px', 
        textAlign: 'center', 
        borderTop: '1px solid #E5E7EB', 
        paddingTop: '24px' 
    },
    footerText: { 
        fontSize: '14px', 
        color: '#6B7280',
        margin: 0
    },
    linkText: { 
        color: '#8B0000', 
        fontWeight: '700', 
        cursor: 'pointer', 
        textDecoration: 'none', 
        marginLeft: '4px' 
    },
    policyLinks: {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px',
        fontSize: '13px',
        color: '#6B7280'
    },
    policyLink: {
        cursor: 'pointer',
        transition: 'color 200ms ease'
    },
    dotSeparator: {
        color: '#E5E7EB'
    }
};

export default Register;