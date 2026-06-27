import React, { useState } from 'react';
import { useLanguage } from './services/languageService';
import axios from 'axios';
import { API_BASE } from './config';
import { User, ShieldCheck, AlertCircle, ArrowRight, Lock, Landmark, Loader2, Info, X, Eye, EyeOff, CheckCircle } from 'lucide-react';

const translations = {
    en: { 
        title: "Village Administrative Services", 
        gov: "Government Digital Access Portal",
        citizen: "Citizen Portal", 
        officer: "Officer Portal", 
        nic: "National Identity Card (NIC)", 
        pass: "Secure Password", 
        btn: "Verify & Sign In", 
        proxy: "Elderly Care Proxy Registration", 
        noAccount: "Don't have a secure profile?", 
        register: "Register Now",
        forgot: "Forgot Credentials?",
        forgotHelp: "For security and auditing compliance, password resets must be requested in person. Please visit your local Grama Niladhari or nearest Divisional Secretariat office with your physical NIC.",
        nicHint: "Format: 9 digits + V/X (e.g. 912345678V) or 12 digits (e.g. 199012345678)",
        passwordHint: "Minimum 8 alphanumeric characters",
        invalidNic: "Invalid NIC number format!",
        emptyFields: "Please fill in all security fields.",
        roleMismatch: "Access denied. This profile is not authorized as a {role}.",
        loginSuccess: "Secure session initiated. Redirecting...",
        networkError: "Connection timeout. Please verify your internet connection.",
        serverError: "Authentication service unavailable. Please try again later.",
        tagline: "Official Digital Gateway for Rural Administrative Services",
        officialAccess: "Authorized Government Access",
        infoProtected: "Session secured via end-to-end 256-bit encryption standards.",
        auditText: "This digital system is protected by secure access controls. Unauthorized access attempts are logged and may result in legal action in accordance with applicable laws and regulations.",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        mfaTitle: "Multi-Factor Authentication",
        mfaSubtitle: "Enter the 6-digit verification code from your Google Authenticator app.",
        mfaVerifyBtn: "Verify & Log In",
        mfaPlaceholder: "Enter 6-digit code",
        mfaInvalid: "Invalid verification code. Please try again."
    },
    si: { 
        title: "ග්‍රාමීය පරිපාලන සේවය", 
        gov: "රාජ්‍ය ඩිජිටල් පිවිසුම් ද්වාරය",
        citizen: "පුරවැසි ද්වාරය", 
        officer: "නිලධාරී ද්වාරය", 
        nic: "ජාතික හැඳුනුම්පත් අංකය (NIC)", 
        pass: "ආරක්ෂිත මුරපදය", 
        btn: "සත්‍යාපනය කර ඇතුළු වන්න", 
        proxy: "වැඩිහිටි ලියාපදිංචි සහය (ප්‍රොක්සි)", 
        noAccount: "තවමත් ගිණුමක් සකසා නැද්ද?", 
        register: "දැන් ලියාපදිංචි වන්න",
        forgot: "මුරපදය අමතකද?",
        forgotHelp: "ආරක්ෂාව සහ විගණන අනුකූලතාවය සඳහා, මුරපදය ප්‍රතිසාධනය කිරීමට ඔබගේ මුල් ජාතික හැඳුනුම්පත ද රැගෙන ග්‍රාම නිලධාරීවරයා හෝ ප්‍රාදේශීය ලේකම් කාර්යාලය වෙත පෞද්ගලිකව පැමිණිය යුතුය.",
        nicHint: "ආකෘතිය: අංක 9 + V/X (උදා: 912345678V) හෝ අංක 12 (උදා: 199012345678)",
        passwordHint: "අවම වශයෙන් අකුරු සහ අංක 8 ක්",
        invalidNic: "වලංගු නොවන හැඳුනුම්පත් අංකයකි!",
        emptyFields: "කරුණාකර සියලුම ආරක්ෂක තොරතුරු ඇතුළත් කරන්න.",
        roleMismatch: "ප්‍රවේශය ප්‍රතික්ෂේප විය. මෙම ගිණුම {role} ගිණුමක් නොවේ.",
        loginSuccess: "ආරක්ෂිත සක්‍රිය සැසියක් ආරම්භ විය. යොමු වෙමින්...",
        networkError: "සම්බන්ධතා කාලය ඉක්මවා ගියේය. කරුණාකර ජාල සම්බන්ධතාව පරීක්ෂා කරන්න.",
        serverError: "සත්‍යාපන සේවාව අක්‍රීයයි. කරුණාකර පසුව නැවත උත්සාහ කරන්න.",
        tagline: "ග්‍රාමීය පරිපාලන සේවා සඳහා වන නිල රාජ්‍ය ඩිජිටල් ද්වාරය",
        officialAccess: "නිල රාජ්‍ය පිවිසුම",
        infoProtected: "සැසිය බිටු 256 ක සංකේතන ප්‍රමිතීන් යටතේ සුරක්ෂිත කර ඇත.",
        auditText: "මෙම ඩිජිටල් පද්ධතිය ආරක්ෂිත ප්‍රවේශ පාලනයක් යටතේ ක්‍රියාත්මක වේ. අනවසර ප්‍රවේශ උත්සාහයන් වාර්තා කරනු ලබන අතර, අදාළ නීති හා රෙගුලාසි අනුව නීතිමය ක්‍රියාමාර්ග ගැනීමට හැකිය.",
        privacyPolicy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
        termsOfService: "සේවා කොන්දේසි",
        mfaTitle: "ද්වි-සාධක සත්‍යාපනය (MFA)",
        mfaSubtitle: "ඔබගේ Google Authenticator යෙදුමෙන් ලබාගත් ඉලක්කම් 6ක සත්‍යාපන කේතය ඇතුළත් කරන්න.",
        mfaVerifyBtn: "තහවුරු කර ඇතුළු වන්න",
        mfaPlaceholder: "කේතය ඇතුළත් කරන්න",
        mfaInvalid: "වැරදි සත්‍යාපන කේතයකි. කරුණාකර නැවත උත්සාහ කරන්න."
    },
    ta: {
        title: "கிராம நிர்வாக சேவைகள்", 
        gov: "அரசாங்க டிஜிட்டல் அணுகல் போர்டல்",
        citizen: "குடிமகன் போர்டல்", 
        officer: "அதிகாரி போர்டல்", 
        nic: "தேசிய அடையாள அட்டை எண் (NIC)", 
        pass: "பாதுகாப்பான கடவுச்சொல்", 
        btn: "சரிபார்த்து உள்நுழையவும்", 
        proxy: "முதியோர் பதிவு", 
        noAccount: "பாதுகாப்பான கணக்கு இல்லையா?", 
        register: "இப்போது பதிவு செய்யுங்கள்",
        forgot: "கடவுச்சொல் மறந்துவிட்டதா?",
        forgotHelp: "பாதுகாப்பு மற்றும் தணிக்கை இணக்கத்திற்காக, கடவுச்சொல் மீட்டமைப்பு கோரிக்கைகள் நேரில் மட்டுமே செய்யப்பட வேண்டும். உங்கள் அசல் அடையாள அட்டையுடன் கிராம அலுவலர் அல்லது பிரதேச செயலகத்திற்கு வருகை தரவும்.",
        nicHint: "வடிவம்: 9 இலக்கங்கள் + V/X (உதா: 912345678V) அல்லது 12 இலக்கங்கள் (உதா: 199012345678)",
        passwordHint: "குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்",
        invalidNic: "தவறான NIC எண் வடிவம்!",
        emptyFields: "அனைத்து பாதுகாப்பு புலங்களையும் நிரப்பவும்.",
        roleMismatch: "அணுகல் மறுக்கப்பட்டது. இந்த கணக்கு {role} கணக்கு அல்ல.",
        loginSuccess: "பாதுகாப்பான அமர்வு தொடங்கியது. வழிமாற்றுகிறது...",
        networkError: "இணைப்பு காலாவதியானது. உங்கள் இணைய தொடர்பை சரிபார்க்கவும்.",
        serverError: "அங்கீகார சேவை கிடைக்கவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.",
        tagline: "கிராமப்புற நிர்வாக சேவைகளுக்கான அதிகாரப்பூர்வ அரசாங்க டிஜிட்டல் தளம்",
        officialAccess: "அங்கீகரிக்கப்பட்ட அரசாங்க அணுகல்",
        infoProtected: "தரவு பரிமாற்றம் 256-பிட் குறியாக்க பாதுகாப்பு மூலம் பாதுகாக்கப்படுகிறது.",
        auditText: "இந்த டிஜிட்டல் அமைப்பு பாதுகாப்பான அணுகல் கட்டுப்பாடுகளால் பாதுகாக்கப்படுகிறது. அங்கீகரிக்கப்படாத அணுகல் முயற்சிகள் பதிவுசெய்யப்படும் மற்றும் பொருந்தக்கூடிய சட்டங்கள் மற்றும் விதிமுறைகளின்படி சட்ட நடவடிக்கை எடுக்கப்படலாம்.",
        privacyPolicy: "தனியுரிமைக் கொள்கை",
        termsOfService: "சேவை விதிமுறைகள்",
        mfaTitle: "இரு காரணி அங்கீகாரம் (MFA)",
        mfaSubtitle: "உங்கள் Google Authenticator பயன்பாட்டிலிருந்து 6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்.",
        mfaVerifyBtn: "சரிபார்த்து உள்நுழையவும்",
        mfaPlaceholder: "6 இலக்க குறியீட்டை உள்ளிடவும்",
        mfaInvalid: "தவறான சரிபார்ப்புக் குறியீடு. மீண்டும் முயற்சிக்கவும்."
    }
};

function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [lang, setLang] = useLanguage();
    const [role, setRole] = useState('citizen');
    const [credentials, setCredentials] = useState({ nic: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({ nic: false, password: false });
    const [nicFocused, setNicFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [modalType, setModalType] = useState(''); 
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaUserId, setMfaUserId] = useState('');
    const [mfaCode, setMfaCode] = useState('');

    const t = translations[lang];

    const validateNIC = (nic) => {
        if (!nic || nic.trim() === '') return false;
        const cleaned = nic.trim().toUpperCase();
        const oldNicPattern = /^[0-9]{9}[VX]$/;
        const newNicPattern = /^[0-9]{12}$/;
        return oldNicPattern.test(cleaned) || newNicPattern.test(cleaned);
    };

    const getNICDetails = (nic) => {
        if (!nic || !validateNIC(nic)) return null;
        const cleaned = nic.trim().toUpperCase();
        if (cleaned.length === 10) {
            const year = 1900 + parseInt(cleaned.substring(0, 2));
            const days = parseInt(cleaned.substring(2, 5));
            const gender = days > 500 ? 'Female' : 'Male';
            return { type: 'Old NIC', year, gender };
        } else if (cleaned.length === 12) {
            const year = parseInt(cleaned.substring(0, 4));
            const days = parseInt(cleaned.substring(4, 7));
            const gender = days > 500 ? 'Female' : 'Male';
            return { type: 'New NIC', year, gender };
        }
        return null;
    };

    const formatNICForDisplay = (nic) => {
        if (!nic) return nic;
        const cleaned = nic.trim().toUpperCase();
        if (cleaned.length === 10) {
            return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
        } else if (cleaned.length === 12) {
            return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 10)} ${cleaned.substring(10, 12)}`;
        }
        return nic;
    };

    const handleNICChange = (e) => {
        let value = e.target.value.replace(/\s/g, '');
        setCredentials({ ...credentials, nic: value });
        setTouched({ ...touched, nic: true });
        if (error) setError('');
    };

    const handlePasswordChange = (e) => {
        setCredentials({ ...credentials, password: e.target.value });
        setTouched({ ...touched, password: true });
        if (error) setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const trimmedNIC = credentials.nic.trim();
        const password = credentials.password;

        if (!trimmedNIC || !password) {
            setError(t.emptyFields);
            setLoading(false);
            return;
        }

        if (!validateNIC(trimmedNIC)) {
            setError(t.invalidNic);
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError(lang === 'si' ? "මුරපදය අවම වශයෙන් අකුරු 6 ක් විය යුතුය." : "Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { 
                nic: trimmedNIC, 
                password: password
            }, {
                withCredentials: true
            });

            if (res.data) {
                const { token, user, mfaRequired: mfaReq, userId } = res.data;

                if (mfaReq) {
                    setMfaUserId(userId);
                    setMfaRequired(true);
                    setLoading(false);
                    return;
                }

                if (!token) {
                    setError(lang === 'si' ? "පද්ධති දෝෂයකි (No Token)." : "Server Error: No token received.");
                    setLoading(false);
                    return;
                }

                if (user && user.role !== role) {
                    const roleName = role === 'citizen' 
                        ? (lang === 'si' ? 'පුරවැසි' : lang === 'ta' ? 'குடிமகன்' : 'citizen')
                        : (lang === 'si' ? 'නිලධාරී' : lang === 'ta' ? 'அதிகாரி' : 'officer');
                    setError(t.roleMismatch.replace('{role}', roleName));
                    setLoading(false);
                    return;
                }

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                setSuccess(t.loginSuccess);
                
                setTimeout(() => {
                    onLoginSuccess();
                }, 1000);
            }
        } catch (err) {
            console.error('Login error:', err.response?.data || err.message);
            
            if (err.code === 'ERR_NETWORK') {
                setError(t.networkError);
            } else if (err.response?.status === 500) {
                setError(t.serverError);
            } else {
                const errorMsg = err.response?.data?.errors?.nic || 
                               err.response?.data?.errors?.password || 
                               err.response?.data?.msg || 
                               "Login failed. Please check your credentials.";
                setError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (mfaCode.length !== 6) {
            setError(lang === 'si' ? "කේතය ඉලක්කම් 6ක් විය යුතුය." : "Code must be 6 digits.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(`${API_BASE}/auth/mfa/login`, {
                userId: mfaUserId,
                code: mfaCode
            }, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                withCredentials: true
            });

            if (res.data) {
                const { token, user } = res.data;
                
                if (user && user.role !== role) {
                    const roleName = role === 'citizen' 
                        ? (lang === 'si' ? 'පුරවැසි' : lang === 'ta' ? 'குடிமகன்' : 'citizen')
                        : (lang === 'si' ? 'නිලධාරී' : lang === 'ta' ? 'அதிகாரி' : 'officer');
                    setError(t.roleMismatch.replace('{role}', roleName));
                    setLoading(false);
                    return;
                }

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                setSuccess(t.loginSuccess);
                
                setTimeout(() => {
                    onLoginSuccess();
                }, 1000);
            }
        } catch (err) {
            console.error('MFA login error:', err.response?.data || err.message);
            setError(err.response?.data?.error || t.mfaInvalid || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const nicDetails = getNICDetails(credentials.nic);
    const isNicValid = touched.nic && credentials.nic && validateNIC(credentials.nic);
    const isNicInvalid = touched.nic && credentials.nic && !validateNIC(credentials.nic);

    return (
        <div className="login-page-wrapper" style={styles.pageWrapper}>
            
            {/* Top Bar Language Selector */}
            <div style={styles.topHeader}>
                <div style={styles.logoFlex}>
                    <Landmark size={22} color="#D4AF37" style={{ marginRight: '8px' }} />
                    <span style={styles.topLogoText}>VillageFlow <span style={{ color: '#D4AF37' }}>.gov</span></span>
                </div>
                <div style={styles.langSelectorContainer}>
                    {['en', 'si', 'ta'].map((l) => (
                        <button
                            key={l}
                            type="button"
                            onClick={() => {
                                setLang(l);
                                setError('');
                            }}
                            style={{
                                ...styles.langSelectorButton,
                                backgroundColor: lang === l ? '#D4AF37' : 'transparent',
                                color: lang === l ? '#FFFFFF' : '#475569',
                                fontWeight: lang === l ? '700' : '600'
                            }}
                        >
                            {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'தமிழ்'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="login-main-card" style={styles.mainCard}>
                
                {/* Left Panel — Official Secure Identity Brand */}
                <div className="login-left-panel" style={styles.leftPanel}>
                    <div className="login-left-pattern"></div>
                    <div className="login-left-glow"></div>
                    <div style={styles.leftPanelContent}>
                        
                        <div style={styles.emblemContainer}>
                            <div className="emblem-ring-outer" style={styles.emblemRingOuter}></div>
                            <div style={styles.emblemRingInner}>
                                <Landmark size={42} color="#D4AF37" strokeWidth={1.5} />
                            </div>
                        </div>
                        
                        <h1 className="login-portal-name" style={styles.portalName}>
                            VillageFlow<span style={{ color: '#D4AF37' }}>.</span>
                        </h1>
                        <div style={styles.portalBadge}>{t.gov.toUpperCase()}</div>
                        
                        <p className="login-tagline" style={styles.tagline}>
                            {t.tagline}
                        </p>

                        <div style={styles.leftSecureBadge}>
                            <ShieldCheck size={22} color="#D4AF37" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span style={styles.leftSecureBadgeTitle}>{t.officialAccess}</span>
                                <span style={styles.leftSecureBadgeDesc}>{t.infoProtected}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel — Secure Form */}
                <div className="login-right-panel" style={styles.rightPanel}>
                    <div style={styles.formContentWrapper}>
                        
                        {/* Title Section */}
                        <div style={styles.formHeader}>
                            <h2 style={styles.titleStyle}>
                                {role === 'citizen' ? t.citizen : t.officer}
                            </h2>
                            <p style={styles.subtitleStyle}>{t.title}</p>
                        </div>

                        {/* Sliding Role Switcher */}
                        <div style={styles.roleToggleContainer}>
                            <div 
                                style={{
                                    ...styles.roleToggleSlider,
                                    left: role === 'citizen' ? '3px' : 'calc(50% + 1px)',
                                    width: 'calc(50% - 4px)'
                                }} 
                            />
                            <button 
                                type="button" 
                                onClick={() => {
                                    setRole('citizen');
                                    setError('');
                                    setSuccess('');
                                    setShowHelp(false);
                                }}
                                style={{
                                    ...styles.roleToggleButton,
                                    color: role === 'citizen' ? '#FFFFFF' : '#475569'
                                }}
                            >
                                <User size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
                                {lang === 'si' ? 'පුරවැසි' : lang === 'ta' ? 'குடிமகன்' : 'Citizen'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setRole('officer');
                                    setError('');
                                    setSuccess('');
                                    setShowHelp(false);
                                }}
                                style={{
                                    ...styles.roleToggleButton,
                                    color: role === 'officer' ? '#FFFFFF' : '#475569'
                                }}
                            >
                                <ShieldCheck size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
                                {lang === 'si' ? 'නිලධාරී' : lang === 'ta' ? 'அதிகாரி' : 'Officer'}
                            </button>
                        </div>

                        {/* Notifications */}
                        {showHelp && (
                            <div className="login-info-box" style={styles.infoBox}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#1D4ED8' }} />
                                    <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#1E40AF', fontWeight: '500' }}>{t.forgotHelp}</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowHelp(false)}
                                    style={styles.closeHelpBtn}
                                    aria-label="Close message"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {success && (
                            <div className="login-success-box" style={styles.successBox}>
                                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: '500' }}>{success}</span>
                            </div>
                        )}

                        {error && (
                            <div className="login-error-box" style={styles.errorBox}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span style={{ fontWeight: '500' }}>{error}</span>
                            </div>
                        )}

                        {/* Login Form / MFA Form */}
                        {mfaRequired ? (
                            <form onSubmit={handleMfaSubmit} style={styles.formLayout}>
                                <div style={styles.fieldContainer}>
                                    <label style={styles.label}>{t.mfaTitle}</label>
                                    <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '15px', lineHeight: '1.5' }}>
                                        {t.mfaSubtitle}
                                    </p>
                                    <div style={styles.inputWrapper(passFocused, false, false)}>
                                        <Lock style={styles.inputIcon} size={18} />
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            style={styles.inputStyle} 
                                            className="login-input-style"
                                            placeholder={t.mfaPlaceholder}
                                            value={mfaCode}
                                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                            onFocus={() => setPassFocused(true)}
                                            onBlur={() => setPassFocused(false)}
                                            required 
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    style={loading ? styles.disabledBtn : styles.submitBtn} 
                                    className={loading ? "login-disabled-btn" : "login-main-btn"}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>{lang === 'si' ? 'සත්‍යාපනය වෙමින්...' : 'VERIFYING...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t.mfaVerifyBtn.toUpperCase()}</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMfaRequired(false);
                                        setMfaUserId('');
                                        setMfaCode('');
                                        setError('');
                                        setSuccess('');
                                    }}
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: '#8B0000',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        marginTop: '15px',
                                        textAlign: 'center',
                                        alignSelf: 'center'
                                    }}
                                >
                                    {lang === 'si' ? 'නැවත මුලට' : 'Cancel'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} style={styles.formLayout}>
                                
                                {/* NIC Input */}
                                <div style={styles.fieldContainer}>
                                    <label style={styles.label}>{t.nic}</label>
                                    <div style={styles.inputWrapper(nicFocused, isNicValid, isNicInvalid)}>
                                        <User style={styles.inputIcon} size={18} />
                                        <input 
                                            type="text" 
                                            style={styles.inputStyle} 
                                            className="login-input-style"
                                            placeholder="e.g. 199012345678 or 912345678V" 
                                            value={formatNICForDisplay(credentials.nic)}
                                            onChange={handleNICChange}
                                            onFocus={() => setNicFocused(true)}
                                            onBlur={() => {
                                                setNicFocused(false);
                                                setTouched({ ...touched, nic: true });
                                            }}
                                            required 
                                        />
                                        {isNicValid && <CheckCircle size={18} style={styles.validationIcon} color="#16A34A" />}
                                    </div>
                                    {nicDetails && (
                                        <span style={styles.successHelperText}>
                                            ✓ {nicDetails.type} | Year: {nicDetails.year} | Gender: {nicDetails.gender}
                                        </span>
                                    )}
                                    {!nicDetails && touched.nic && credentials.nic && (
                                        <span style={styles.errorHelperText}>{t.invalidNic}</span>
                                    )}
                                    {!credentials.nic && (
                                        <span style={styles.hintText}>{t.nicHint}</span>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div style={styles.fieldContainer}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={styles.label}>{t.pass}</label>
                                        <span 
                                            className="login-forgot-link"
                                            style={styles.forgotLink} 
                                            onClick={() => setShowHelp(!showHelp)}
                                        >
                                            {t.forgot}
                                        </span>
                                    </div>
                                    <div style={styles.inputWrapper(passFocused, false, false)}>
                                        <Lock style={styles.inputIcon} size={18} />
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            style={styles.inputStyle} 
                                            className="login-input-style"
                                            placeholder="••••••••" 
                                            value={credentials.password}
                                            onChange={handlePasswordChange}
                                            onFocus={() => setPassFocused(true)}
                                            onBlur={() => {
                                                setPassFocused(false);
                                                setTouched({ ...touched, password: true });
                                            }}
                                            required 
                                        />
                                        <div 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            style={{...styles.eyeBtn, cursor: 'pointer', zIndex: 10}}
                                            role="button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
                                        </div>
                                    </div>
                                    {!credentials.password && (
                                        <span style={styles.hintText}>{t.passwordHint}</span>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button 
                                    type="submit" 
                                    style={loading ? styles.disabledBtn : styles.submitBtn} 
                                    className={loading ? "login-disabled-btn" : "login-main-btn"}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            <span>{lang === 'si' ? 'සත්‍යාපනය වෙමින්...' : lang === 'ta' ? 'சரிபார்க்கிறது...' : 'VERIFYING SESSION...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{t.btn.toUpperCase()}</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Footer & Accompanying Details */}
                        <div style={styles.footer}>
                            <p style={styles.footerText}>
                                {t.noAccount} 
                                <span onClick={onSwitchToRegister} className="login-link-text" style={styles.linkText}>
                                    {t.register}
                                </span>
                            </p>
                            
                            <div style={styles.policyLinks}>
                                <span 
                                    className="login-policy-link-active" 
                                    style={styles.policyLinkActive}
                                    onClick={() => {
                                        setModalType('privacy');
                                        setShowPolicyModal(true);
                                    }}
                                >
                                    {t.privacyPolicy}
                                </span>
                                <span style={styles.dotSeparator}>•</span>
                                <span 
                                    className="login-policy-link" 
                                    style={styles.policyLink}
                                    onClick={() => {
                                        setModalType('terms');
                                        setShowPolicyModal(true);
                                    }}
                                >
                                    {t.termsOfService}
                                </span>
                            </div>
                        </div>

                        {/* Audit Disclaimer Text */}
                        <p style={styles.securityStatement}>
                            {t.auditText}
                        </p>
                    </div>
                </div>

            </div>

            {/* Policy & Terms Modal Dialog */}
            {showPolicyModal && (
                <div style={styles.modalOverlay} onClick={() => setShowPolicyModal(false)}>
                    <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>
                                {modalType === 'privacy' ? t.privacyPolicy : t.termsOfService}
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setShowPolicyModal(false)} 
                                style={styles.modalCloseBtn}
                                className="login-modal-close-btn"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            {modalType === 'privacy' ? (
                                <div style={styles.modalText}>
                                    <h4 style={styles.modalSubheading}>1. Data Protection Overview</h4>
                                    <p>VillageFlow is committed to protecting the privacy of all citizens and administrative officers. This platform processes personal identification data (NIC, full name, address, email, and mobile number) strictly for authentication and administrative services execution.</p>
                                    
                                    <h4 style={styles.modalSubheading}>2. Collection of Information</h4>
                                    <p>Personal data is collected during user registration. This information is secured in an encrypted database and is used solely to verify credentials against national identity records.</p>
                                    
                                    <h4 style={styles.modalSubheading}>3. Data Access and Security</h4>
                                    <p>Access to your personal data is restricted to authorized administrative officers (Grama Niladhari) for official verification purposes. All data transmissions are encrypted using SSL/TLS protocols.</p>
                                    
                                    <h4 style={styles.modalSubheading}>4. Monitoring and Auditing</h4>
                                    <p>For security, compliance, and auditing purposes, all user activities on this platform (such as welfare applications, certificate requests, and logins) are recorded in secure audit logs containing system timestamps and actions performed.</p>
                                </div>
                            ) : (
                                <div style={styles.modalText}>
                                    <h4 style={styles.modalSubheading}>1. Terms of Use</h4>
                                    <p>By accessing and utilizing the VillageFlow government digital identity portal, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must not utilize this service.</p>
                                    
                                    <h4 style={styles.modalSubheading}>2. Authorized Access Only</h4>
                                    <p>This is an official government administrative portal. Access is permitted strictly to registered citizens and authorized Grama Niladhari officers. Unauthorized access, tampering, or malicious activity is strictly prohibited and subject to legal prosecution.</p>
                                    
                                    <h4 style={styles.modalSubheading}>3. User Responsibilities</h4>
                                    <p>Users are responsible for maintaining the confidentiality of their login credentials (NIC number and password) and for all actions carried out under their account. You agree to provide accurate and truthful information for all official requests.</p>
                                    
                                    <h4 style={styles.modalSubheading}>4. Platform Auditing</h4>
                                    <p>You acknowledge and agree that your actions on this platform may be recorded, monitored, and audited for security verification and service delivery audits.</p>
                                </div>
                            )}
                        </div>
                        <div style={styles.modalFooter}>
                            <button 
                                type="button" 
                                onClick={() => setShowPolicyModal(false)}
                                style={styles.modalCloseActionBtn}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animation & Hover Injector */}
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
                        0% { transform: translate(-10%, -10%) scale(1); }
                        50% { transform: translate(8%, 10%) scale(1.05); }
                        100% { transform: translate(-8%, -5%) scale(0.98); }
                    }
                    @keyframes spinSlow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulseHeartbeat {
                        0%, 100% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.2); opacity: 1; }
                    }

                    .login-main-card {
                        animation: cardSlideUp 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    
                    .login-left-panel {
                        background: linear-gradient(135deg, #8B0000 0%, #6E0000 45%, #4C0000 100%);
                        background-size: 200% 200%;
                        animation: slowGradient 12s ease infinite;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .login-left-pattern {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        opacity: 0.04;
                        background-image: 
                            radial-gradient(circle at 100% 150%, #ffffff 24%, white 25%, transparent 28%),
                            radial-gradient(circle at 0% 150%, #ffffff 24%, white 25%, transparent 28%),
                            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
                        background-size: 24px 24px, 24px 24px, 48px 48px, 48px 48px;
                        pointer-events: none;
                        z-index: 1;
                    }
                    
                    .login-left-glow {
                        position: absolute;
                        top: -25%;
                        left: -25%;
                        width: 150%;
                        height: 150%;
                        background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
                        pointer-events: none;
                        animation: slowGlow 15s infinite alternate ease-in-out;
                        z-index: 1;
                    }
                    
                    .emblem-ring-outer {
                        position: absolute;
                        width: 100px;
                        height: 100px;
                        border-radius: 50%;
                        border: 1.5px dashed rgba(212, 175, 55, 0.4);
                        animation: spinSlow 20s linear infinite;
                    }
                    
                    .login-main-btn {
                        width: 100%;
                        height: 48px;
                        background: linear-gradient(135deg, #8B0000 0%, #600000 100%) !important;
                        color: #FFFFFF !important;
                        border: none !important;
                        border-radius: 12px !important;
                        font-weight: 700 !important;
                        font-size: 14px !important;
                        letter-spacing: 0.5px !important;
                        cursor: pointer !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 10px !important;
                        box-shadow: 0 4px 12px rgba(139, 0, 0, 0.2) !important;
                        transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                        outline: none !important;
                    }
                    
                    .login-main-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(139, 0, 0, 0.35), 0 0 0 2px rgba(212, 175, 55, 0.45) !important;
                    }

                    .login-main-btn:hover:not(:disabled) svg {
                        transform: translateX(4px);
                    }
                    
                    .login-main-btn svg {
                        transition: transform 200ms ease;
                    }
                    
                    .login-main-btn:active:not(:disabled) {
                        transform: scale(0.98);
                    }
                    
                    .login-disabled-btn {
                        width: 100%;
                        height: 48px;
                        background: #CBD5E1 !important;
                        color: #64748B !important;
                        border: none !important;
                        border-radius: 12px !important;
                        font-weight: 700 !important;
                        font-size: 14px !important;
                        cursor: not-allowed !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 10px !important;
                        box-shadow: none !important;
                    }

                    input[type="text"].login-input-style, 
                    input[type="password"].login-input-style {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 40px 0 48px !important;
                        height: 100% !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        box-shadow: none !important;
                        outline: none !important;
                        border-radius: 10px !important;
                    }

                    input[type="text"].login-input-style::placeholder, 
                    input[type="password"].login-input-style::placeholder {
                        color: #94A3B8;
                    }

                    input[type="text"].login-input-style:focus, 
                    input[type="password"].login-input-style:focus {
                        color: #0F172A !important;
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                    }

                    button.login-eye-btn {
                        position: absolute !important;
                        right: 14px !important;
                        width: 32px !important;
                        height: 32px !important;
                        min-height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                        border: none !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        z-index: 2 !important;
                    }
                    
                    .login-forgot-link:hover,
                    .login-link-text:hover,
                    .login-policy-link:hover {
                        color: #8B0000 !important;
                        text-decoration: underline !important;
                        opacity: 1 !important;
                    }
                    
                    /* Mobile/Tablet Overrides */
                    @media (max-width: 820px) {
                        .login-main-card {
                            flex-direction: column !important;
                            border-radius: 16px !important;
                            min-height: auto !important;
                            max-width: 480px !important;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.06) !important;
                            overflow: hidden !important;
                        }
                        .login-left-panel {
                            width: 100% !important;
                            padding: 36px 24px !important;
                            flex: none !important;
                        }
                        .login-right-panel {
                            width: 100% !important;
                            padding: 36px 24px !important;
                            background-color: #FFFFFF !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .login-page-wrapper {
                            padding: 12px !important;
                        }
                        .login-main-card {
                            border-radius: 12px !important;
                            max-width: 100% !important;
                        }
                        .login-left-panel {
                            padding: 28px 16px !important;
                        }
                        .login-right-panel {
                            padding: 28px 16px !important;
                        }
                    }
                    
                    /* Accessibility Support */
                    @media (prefers-reduced-motion: reduce) {
                        .login-main-card,
                        .login-left-panel,
                        .login-left-glow,
                        .emblem-ring-outer,
                        .login-main-btn {
                            animation: none !important;
                            transition: none !important;
                            transform: none !important;
                        }
                        .login-main-btn:hover:not(:disabled) svg {
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
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'radial-gradient(circle at top right, #F8FAFC 0%, #EEF2F6 100%)',
        padding: '36px 20px 24px 20px', 
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
        width: '100%', 
        boxSizing: 'border-box',
        overflowX: 'hidden' 
    },
    topHeader: {
        width: '100%',
        maxWidth: '1020px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        boxSizing: 'border-box',
        padding: '0 4px'
    },
    logoFlex: {
        display: 'flex',
        alignItems: 'center',
    },
    topLogoText: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: '-0.3px',
        fontFamily: "'Inter', sans-serif"
    },
    langSelectorContainer: {
        display: 'flex',
        background: '#E2E8F0',
        padding: '2px',
        borderRadius: '30px',
        gap: '2px',
        border: '1px solid #CBD5E1'
    },
    langSelectorButton: {
        border: 'none',
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none'
    },
    mainCard: { 
        display: 'flex', 
        background: '#FFFFFF', 
        borderRadius: '20px', 
        width: '100%', 
        maxWidth: '1020px', 
        minHeight: '620px', 
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box'
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
    leftPanelContent: { 
        textAlign: 'center', 
        zIndex: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    emblemContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '24px',
        position: 'relative',
        height: '110px',
        width: '110px',
    },
    emblemRingOuter: {
        // Controlled by CSS keyframe spinSlow
    },
    emblemRingInner: {
        position: 'relative',
        width: '74px',
        height: '74px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #9C0000 0%, #6A0000 100%)',
        border: '2px solid #D4AF37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 20px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255, 255, 255, 0.15)',
        zIndex: 2
    },
    portalName: { 
        fontSize: '40px', 
        fontWeight: '900', 
        margin: 0, 
        letterSpacing: '-1px',
        color: '#FFFFFF',
        lineHeight: 1
    },
    portalBadge: {
        fontSize: '11px',
        fontWeight: '800',
        letterSpacing: '2px',
        color: '#D4AF37',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        padding: '4px 10px',
        borderRadius: '20px',
        marginTop: '8px',
        display: 'inline-block',
        backgroundColor: 'rgba(212, 175, 55, 0.05)'
    },
    tagline: { 
        fontSize: '14px', 
        opacity: 0.9, 
        marginTop: '16px', 
        lineHeight: '1.6',
        maxWidth: '310px',
        fontWeight: '400',
        color: '#F1F5F9'
    },
    leftSecureBadge: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.25)',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '36px',
        maxWidth: '320px',
        textAlign: 'left',
        boxSizing: 'border-box'
    },
    leftSecureBadgeTitle: {
        fontSize: '12px',
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
    },
    leftSecureBadgeDesc: {
        fontSize: '11px',
        color: '#E2E8F0',
        lineHeight: '1.4',
        marginTop: '2px'
    },
    rightPanel: { 
        flex: '1.1', 
        padding: '48px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#FFFFFF' 
    },
    formContentWrapper: {
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column'
    },
    formHeader: { 
        marginBottom: '24px',
        textAlign: 'left'
    },
    titleStyle: { 
        fontSize: '28px', 
        fontWeight: '900', 
        color: '#0F172A', 
        margin: '0 0 4px 0',
        letterSpacing: '-0.5px' 
    },
    subtitleStyle: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#64748B',
        margin: 0
    },
    roleToggleContainer: { 
        position: 'relative',
        display: 'flex', 
        background: '#F1F5F9', 
        padding: '3px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        border: '1px solid #E2E8F0',
        height: '42px',
        boxSizing: 'border-box',
        alignItems: 'center'
    },
    roleToggleSlider: {
        position: 'absolute',
        top: '3px',
        bottom: '3px',
        borderRadius: '9px',
        background: '#8B0000',
        boxShadow: '0 4px 10px rgba(139, 0, 0, 0.25)',
        transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1
    },
    roleToggleButton: {
        flex: 1,
        height: '100%',
        border: 'none',
        background: 'transparent',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        zIndex: 2,
        transition: 'color 200ms ease'
    },
    fieldContainer: { 
        marginBottom: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        textAlign: 'left'
    },
    label: { 
        fontSize: '12px', 
        fontWeight: '700', 
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    inputWrapper: (isFocused, isValid, isInvalid) => ({ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        border: '1.5px solid', 
        borderColor: isInvalid ? '#EF4444' : isFocused ? '#D4AF37' : isValid ? '#10B981' : '#CBD5E1', 
        borderRadius: '10px', 
        backgroundColor: '#FFFFFF',
        boxShadow: isFocused ? '0 0 0 3px rgba(212, 175, 55, 0.12)' : 'none',
        transition: 'all 200ms ease',
        height: '46px',
        width: '100%',
        boxSizing: 'border-box'
    }),
    inputIcon: { 
        position: 'absolute', 
        left: '14px', 
        color: '#64748B'
    },
    inputStyle: { 
        width: '100%', 
        height: '100%',
        padding: '0 40px 0 42px', 
        borderRadius: '10px', 
        border: 'none', 
        outline: 'none', 
        fontSize: '14px', 
        color: '#0F172A',
        background: 'transparent',
        boxSizing: 'border-box'
    },
    eyeBtn: { 
        position: 'absolute', 
        right: '14px', 
        width: '32px',
        height: '32px',
        border: 'none', 
        background: 'transparent', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        outline: 'none',
        zIndex: 2
    },
    validationIcon: { 
        position: 'absolute', 
        right: '14px'
    },
    formLayout: {
        display: 'flex',
        flexDirection: 'column'
    },
    submitBtn: {
        // Main button rules configured in global class login-main-btn
    },
    disabledBtn: {
        // Disabled button rules configured in global class login-disabled-btn
    },
    errorBox: { 
        padding: '12px 14px', 
        background: '#FEF2F2', 
        color: '#EF4444', 
        borderRadius: '10px', 
        fontSize: '13px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        border: '1px solid #FEE2E2', 
        animation: 'fadeIn 250ms ease' 
    },
    successBox: { 
        padding: '12px 14px', 
        background: '#F0FDF4', 
        color: '#10B981', 
        borderRadius: '10px', 
        fontSize: '13px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        border: '1px solid #DCFCE7', 
        animation: 'fadeIn 250ms ease' 
    },
    infoBox: { 
        padding: '12px 14px', 
        background: '#EFF6FF', 
        borderRadius: '10px', 
        marginBottom: '20px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        border: '1px solid #DBEAFE',
        animation: 'fadeIn 250ms ease'
    },
    closeHelpBtn: {
        border: 'none',
        background: 'transparent',
        color: '#3B82F6',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        marginTop: '2px'
    },
    footer: { 
        marginTop: '22px', 
        textAlign: 'center', 
        borderTop: '1px solid #F1F5F9', 
        paddingTop: '20px' 
    },
    footerText: { 
        fontSize: '13.5px', 
        color: '#64748B',
        margin: 0
    },
    linkText: { 
        color: '#8B0000', 
        fontWeight: '700', 
        cursor: 'pointer', 
        textDecoration: 'none', 
        marginLeft: '5px' 
    },
    forgotLink: { 
        fontSize: '12px', 
        color: '#8B0000', 
        fontWeight: '700', 
        cursor: 'pointer',
        transition: 'color 200ms ease'
    },
    hintText: { 
        fontSize: '11px', 
        color: '#64748B', 
        marginTop: '2px', 
        display: 'block' 
    },
    errorHelperText: {
        fontSize: '11px', 
        color: '#EF4444', 
        marginTop: '2px', 
        display: 'block',
        fontWeight: '600'
    },
    successHelperText: { 
        fontSize: '11px', 
        color: '#16A34A', 
        marginTop: '2px', 
        display: 'block',
        fontWeight: '600'
    },
    securityStatement: {
        fontSize: '11.5px',
        color: '#94A3B8',
        lineHeight: '1.6',
        marginTop: '20px',
        marginBottom: 0,
        textAlign: 'center',
        fontWeight: '400'
    },
    policyLinks: {
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '12px',
        fontSize: '12px',
        color: '#64748B'
    },
    policyLinkActive: {
        color: '#8B0000',
        textDecoration: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'opacity 200ms ease'
    },
    policyLink: {
        color: '#64748B',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'color 200ms ease'
    },
    dotSeparator: {
        color: '#CBD5E1'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '80vh',
        overflow: 'hidden',
        animation: 'cardSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
    },
    modalHeader: {
        padding: '18px 24px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#0F172A',
        margin: 0
    },
    modalCloseBtn: {
        border: 'none',
        background: 'transparent',
        color: '#64748B',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        transition: 'color 200ms ease'
    },
    modalBody: {
        padding: '24px',
        overflowY: 'auto',
        textAlign: 'left'
    },
    modalText: {
        fontSize: '14px',
        color: '#475569',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    modalSubheading: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#0F172A',
        margin: '12px 0 0 0',
        borderLeft: '3px solid #8B0000',
        paddingLeft: '8px'
    },
    modalFooter: {
        padding: '14px 24px',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: '#F8FAFC'
    },
    modalCloseActionBtn: {
        backgroundColor: '#8B0000',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        outline: 'none',
        boxShadow: '0 2px 5px rgba(139,0,0,0.2)'
    }
};

export default Login;
