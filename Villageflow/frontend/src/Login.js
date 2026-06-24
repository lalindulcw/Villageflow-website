import React, { useState } from 'react';
import axios from 'axios';
import { User, ShieldCheck, AlertCircle, ArrowRight, Lock, Landmark, Loader2, Info, X, Eye, EyeOff, CheckCircle } from 'lucide-react';

const translations = {
    en: { 
        title: "Village Administrative Services", 
        gov: "Government Digital Access Portal",
        citizen: "Citizen", 
        officer: "Officer", 
        nic: "NIC Number", 
        pass: "Password", 
        btn: "Secure Sign In", 
        proxy: "Elderly Care Proxy Registration", 
        noAccount: "Not registered yet?", 
        register: "Register Now",
        forgot: "Forgot Password?",
        forgotHelp: "To reset your password, please contact your Grama Niladhari or Visit the Divisional Secretariat office for verification.",
        nicHint: "Old: 9 digits + V/X | New: 12 digits",
        passwordHint: "Minimum 8 characters",
        invalidNic: "Invalid NIC format!",
        emptyFields: "Please enter all fields.",
        roleMismatch: "This account is not a {role} account.",
        loginSuccess: "Login successful! Redirecting...",
        networkError: "Network error. Please check your connection.",
        serverError: "Server error. Please try again later."
    },
    si: { 
        title: "ග්‍රාමීය පරිපාලන සේවය", 
        gov: "රාජ්‍ය ඩිජිටල් පිවිසුම් ද්වාරය",
        citizen: "පුරවැසියා", 
        officer: "නිලධාරියා", 
        nic: "NIC අංකය", 
        pass: "මුරපදය", 
        btn: "ආරක්ෂිතව ඇතුළු වන්න", 
        proxy: "වැඩිහිටි ලියාපදිංචි සහය (ප්‍රොක්සි)", 
        noAccount: "තවමත් ලියාපදිංචි වී නැද්ද?", 
        register: "දැන් ලියාපදිංචි වන්න",
        forgot: "මුරපදය අමතකද?",
        forgotHelp: "මුරපදය ප්‍රතිසාධනය කිරීමට ඔබගේ ග්‍රාම නිලධාරීවරයා හෝ ප්‍රාදේශීය ලේකම් කාර්යාලය පෞද්ගලිකව හමුවන්න.",
        nicHint: "පැරණි: අංක 9 + V/X | නව: අංක 12",
        passwordHint: "අවම වශයෙන් අකුරු 8 ක්",
        invalidNic: "වලංගු නොවන NIC ආකෘතිය!",
        emptyFields: "කරුණාකර සියලුම තොරතුරු ඇතුළත් කරන්න.",
        roleMismatch: "මෙම ගිණුම {role} ගිණුමක් නොවේ.",
        loginSuccess: "ප්‍රවේශය සාර්ථකයි! නැවත යොමු වෙමින්...",
        networkError: "ජාල දෝෂයකි. කරුණාකර ඔබගේ සම්බන්ධතාව පරීක්ෂා කරන්න.",
        serverError: "සේවාදායක දෝෂයකි. කරුණාකර පසුව නැවත උත්සාහ කරන්න."
    },
    ta: { 
        title: "கிராம நிர்வாக சேவைகள்", 
        gov: "அரசாங்க டிஜிட்டல் அணுகல் போர்டல்",
        citizen: "குடிமகன்", 
        officer: "அதிகாரி", 
        nic: "NIC எண்", 
        pass: "கடவுச்சொல்", 
        btn: "பாதுகாப்பான உள்நுழைவு", 
        proxy: "முதியோர் பராமரிப்பு பதிவு", 
        noAccount: "இன்னும் பதிவு செய்யவில்லையா?", 
        register: "இப்போது பதிவு செய்யுங்கள்",
        forgot: "கடவுச்சொல் மறந்துவிட்டதா?",
        forgotHelp: "கடவுச்சோல்லை மீட்டமைக்க உங்கள் கிராம அலுவலர் அல்லது பிரதேச செயலகத்தை தொடர்பு கொள்ளவும்.",
        nicHint: "பழைய: 9 இலக்கங்கள் + V/X | புதிய: 12 இலக்கங்கள்",
        passwordHint: "குறைந்தது 8 எழுத்துகள்",
        invalidNic: "தவறான NIC வடிவம்!",
        emptyFields: "அனைத்து புலங்களையும் நிரப்பவும்.",
        roleMismatch: "இந்த கணக்கு {role} கணக்கு அல்ல.",
        loginSuccess: "உள்நுழைவு வெற்றிகரமாக! வழிமாற்றுகிறது...",
        networkError: "பிணைய பிழை. உங்கள் இணைப்பை சரிபார்க்கவும்.",
        serverError: "சேவையக பிழை. பின்னர் மீண்டும் முயற்சிக்கவும்."
    }
};

function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [lang, setLang] = useState('si');
    const [role, setRole] = useState('citizen');
    const [credentials, setCredentials] = useState({ nic: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [touched, setTouched] = useState({ nic: false, password: false });

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
            return { type: 'old', year, gender };
        } else if (cleaned.length === 12) {
            const year = parseInt(cleaned.substring(0, 4));
            const days = parseInt(cleaned.substring(4, 7));
            const gender = days > 500 ? 'Female' : 'Male';
            return { type: 'new', year, gender };
        }
        return null;
    };

    const getPasswordStrength = (password) => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!%*?]+/)) strength++;
        return Math.min(strength, 5);
    };

    const getPasswordStrengthColor = (strength) => {
        if (strength <= 2) return '#ff4757';
        if (strength <= 3) return '#ffa502';
        return '#2ed573';
    };

    const getPasswordStrengthText = (strength, lang) => {
        if (strength <= 2) return lang === 'si' ? 'දුර්වල' : lang === 'ta' ? 'பலவீனமான' : 'Weak';
        if (strength <= 3) return lang === 'si' ? 'මධ්‍යම' : lang === 'ta' ? 'மிதமான' : 'Medium';
        return lang === 'si' ? 'ශක්තිමත්' : lang === 'ta' ? 'வலுவான' : 'Strong';
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
            const res = await axios.post('https://villageflow.onrender.com/api/auth/login', { 
                nic: trimmedNIC, 
                password: password
            });

            if (res.data) {
                const { token, user } = res.data;

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

    const nicDetails = getNICDetails(credentials.nic);
    const passwordStrength = getPasswordStrength(credentials.password);
    const isNicValid = touched.nic && credentials.nic && validateNIC(credentials.nic);
    const isNicInvalid = touched.nic && credentials.nic && !validateNIC(credentials.nic);

    return (
        <div className="login-page-wrapper" style={styles.pageWrapper}>
            <div className="login-main-card" style={styles.mainCard}>
                <div className="login-left-panel" style={styles.leftPanel}>
                    <div style={styles.overlay}>
                        <Landmark size={60} color="#fbc531" />
                        <h2 className="login-gov-text" style={styles.govText}>{t.gov}</h2>
                        <div className="login-divider" style={styles.divider}></div>
                        <h1 className="login-portal-name" style={styles.portalName}>VillageFlow</h1>
                        <p className="login-tagline" style={styles.tagline}>Official Digital Interface for Rural Administrative Affairs</p>
                    </div>
                </div>

                <div className="login-right-panel" style={styles.rightPanel}>
                    <div className="login-lang-bar" style={styles.langBar}>
                        {['en', 'si', 'ta'].map((l) => (
                            <span 
                                key={l}
                                onClick={() => {
                                    setLang(l);
                                    setError('');
                                }} 
                                style={lang === l ? styles.activeLang : styles.langBtn}
                                className={lang === l ? "login-active-lang" : "login-lang-btn"}
                            >
                                {l === 'en' ? 'ENGLISH' : l === 'si' ? 'සිංහල' : 'தமிழ்'}
                            </span>
                        ))}
                    </div>

                    <div className="login-form-header" style={styles.formHeader}>
                        <h2 className="login-title-style" style={styles.titleStyle}>{role === 'citizen' ? t.citizen : t.officer} {t.title}</h2>
                        <div className="login-secure-badge" style={styles.secureBadge}><ShieldCheck size={14} /> Official Access Secured</div>
                    </div>

                    <div className="login-role-toggle" style={styles.roleToggle}>
                        <button 
                            type="button"
                            onClick={() => {
                                setRole('citizen');
                                setError('');
                                setSuccess('');
                                setShowHelp(false);
                            }} 
                            style={role === 'citizen' ? styles.activeRole : styles.inactiveRole}
                            className={role === 'citizen' ? "login-active-role" : "login-inactive-role"}
                        >
                            <User size={16} style={{marginRight: '8px'}}/> {t.citizen}
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                setRole('officer');
                                setError('');
                                setSuccess('');
                                setShowHelp(false);
                            }} 
                            style={role === 'officer' ? styles.activeRole : styles.inactiveRole}
                            className={role === 'officer' ? "login-active-role" : "login-inactive-role"}
                        >
                            <ShieldCheck size={16} style={{marginRight: '8px'}}/> {t.officer}
                        </button>
                    </div>

                    {showHelp && (
                        <div className="login-info-box" style={styles.infoBox}>
                            <div style={{display:'flex', gap:'10px'}}>
                                <Info size={18} />
                                <span style={{fontSize:'13px'}}>{t.forgotHelp}</span>
                            </div>
                            <X size={16} style={{cursor:'pointer'}} onClick={() => setShowHelp(false)} />
                        </div>
                    )}

                    {success && (
                        <div className="login-success-box" style={styles.successBox}>
                            <CheckCircle size={16} /> {success}
                        </div>
                    )}

                    {error && (
                        <div className="login-error-box" style={styles.errorBox}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="login-field-container" style={styles.fieldContainer}>
                            <label className="login-label" style={styles.label}>{t.nic}</label>
                            <div style={{...styles.inputGroup, borderColor: isNicInvalid ? '#ff4757' : isNicValid ? '#2ed573' : '#e2e8f0'}}>
                                <User style={styles.inputIcon} size={18} className="login-input-icon" />
                                <input 
                                    type="text" 
                                    style={styles.inputStyle} 
                                    className="login-input-style"
                                    placeholder="e.g., 199012345678 or 876543210V" 
                                    value={formatNICForDisplay(credentials.nic)}
                                    onChange={handleNICChange}
                                    onBlur={() => setTouched({ ...touched, nic: true })}
                                    required 
                                />
                                {isNicValid && <CheckCircle size={16} style={styles.validIcon} color="#2ed573" />}
                            </div>
                            {nicDetails && (
                                <span className="login-helper-text" style={styles.helperText}>
                                    📋 {nicDetails.type === 'old' ? 'Old NIC' : 'New NIC'} | 
                                    Year: {nicDetails.year} | 
                                    Gender: {nicDetails.gender}
                                </span>
                            )}
                            {!nicDetails && credentials.nic && !validateNIC(credentials.nic) && touched.nic && (
                                <span className="login-hint-text" style={styles.hintText}>{t.nicHint}</span>
                            )}
                            {!credentials.nic && (
                                <span className="login-hint-text" style={styles.hintText}>{t.nicHint}</span>
                            )}
                        </div>

                        <div className="login-field-container" style={styles.fieldContainer}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <label className="login-label" style={styles.label}>{t.pass}</label>
                                <span 
                                    className="login-forgot-link"
                                    style={styles.forgotLink} 
                                    onClick={() => setShowHelp(!showHelp)}
                                >
                                    {t.forgot}
                                </span>
                            </div>
                            <div style={styles.inputGroup}>
                                <Lock style={styles.inputIcon} size={18} className="login-input-icon" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    style={styles.inputStyle} 
                                    className="login-input-style"
                                    placeholder="••••••••" 
                                    value={credentials.password}
                                    onChange={handlePasswordChange}
                                    onBlur={() => setTouched({ ...touched, password: true })}
                                    required 
                                />
                                <span 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={styles.eyeIcon}
                                    className="login-eye-icon"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </span>
                            </div>
                            
                            {credentials.password && (
                                <div className="login-strength-container" style={styles.strengthContainer}>
                                    <div style={styles.strengthBarContainer}>
                                        <div style={{
                                            ...styles.strengthBar,
                                            width: `${(passwordStrength / 5) * 100}%`,
                                            background: getPasswordStrengthColor(passwordStrength)
                                        }}></div>
                                    </div>
                                    <span className="login-strength-text" style={styles.strengthText}>
                                        {t.passwordHint}: {getPasswordStrengthText(passwordStrength, lang)}
                                    </span>
                                </div>
                            )}
                            {!credentials.password && (
                                <span className="login-hint-text" style={styles.hintText}>{t.passwordHint}</span>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            style={loading ? styles.disabledBtn : styles.mainBtn} 
                            className={loading ? "login-disabled-btn" : "login-main-btn"}
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 size={18} style={{animation: 'spin 1s linear infinite'}} /> Verifying...</>
                            ) : (
                                <>{t.btn.toUpperCase()} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="login-footer" style={styles.footer}>
                        <p className="login-footer-text" style={styles.footerText}>
                            {t.noAccount} <span onClick={onSwitchToRegister} className="login-link-text" style={styles.linkText}>{t.register}</span>
                        </p>
                    </div>
                </div>
            </div>
            <style>
                {`
                    @keyframes spin { 
                        from { transform: rotate(0deg); } 
                        to { transform: rotate(360deg); } 
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    /* Mobile: 320px - 768px - Column Layout */
                    @media (max-width: 768px) {
                        .login-main-card {
                            flex-direction: column !important;
                            border-radius: 0 !important;
                            min-height: auto !important;
                            max-width: 100% !important;
                        }
                        .login-left-panel {
                            width: 100% !important;
                            padding: 35px 20px !important;
                        }
                        .login-right-panel {
                            width: 100% !important;
                            padding: 30px 20px !important;
                        }
                        .login-portal-name { font-size: 32px !important; }
                        .login-title-style { font-size: 20px !important; }
                        .login-gov-text { font-size: 11px !important; margin-top: 12px !important; }
                        .login-divider { margin: 15px auto !important; width: 45px !important; }
                        .login-tagline { font-size: 11px !important; }
                        .login-lang-bar { margin-bottom: 20px !important; }
                        .login-secure-badge { font-size: 10px !important; }
                        .login-role-toggle { margin-bottom: 25px !important; }
                        .login-active-role, .login-inactive-role { padding: 10px !important; font-size: 13px !important; }
                        .login-field-container { margin-bottom: 18px !important; }
                        .login-input-style { padding: 12px 12px 12px 42px !important; font-size: 16px !important; }
                        .login-main-btn, .login-disabled-btn { padding: 14px !important; font-size: 14px !important; }
                        .login-error-box, .login-success-box, .login-info-box { padding: 12px !important; font-size: 12px !important; margin-bottom: 20px !important; }
                        .login-footer { padding-top: 20px !important; }
                        .login-footer-text { font-size: 12px !important; }
                    }
                    
                    /* Small Mobile: 320px - 480px */
                    @media (max-width: 480px) {
                        .login-left-panel { padding: 25px 15px !important; }
                        .login-right-panel { padding: 25px 15px !important; }
                        .login-portal-name { font-size: 28px !important; }
                        .login-title-style { font-size: 18px !important; }
                        .login-gov-text { font-size: 10px !important; margin-top: 8px !important; }
                        .login-divider { margin: 10px auto !important; width: 40px !important; }
                        .login-tagline { font-size: 10px !important; }
                        .login-lang-bar { gap: 10px !important; margin-bottom: 15px !important; }
                        .login-lang-btn, .login-active-lang { font-size: 10px !important; }
                        .login-secure-badge { font-size: 9px !important; }
                        .login-role-toggle { margin-bottom: 20px !important; }
                        .login-active-role, .login-inactive-role { padding: 8px !important; font-size: 12px !important; }
                        .login-active-role svg, .login-inactive-role svg { width: 14px !important; height: 14px !important; margin-right: 5px !important; }
                        .login-field-container { margin-bottom: 15px !important; }
                        .login-label { font-size: 10px !important; }
                        .login-input-style { padding: 10px 10px 10px 38px !important; }
                        .login-input-icon { left: 12px !important; }
                        .login-eye-icon { right: 12px !important; }
                        .login-main-btn, .login-disabled-btn { padding: 12px !important; font-size: 13px !important; }
                        .login-error-box, .login-success-box, .login-info-box { padding: 8px 12px !important; font-size: 11px !important; margin-bottom: 15px !important; }
                        .login-footer { padding-top: 15px !important; }
                        .login-footer-text { font-size: 11px !important; }
                        .login-link-text { font-size: 11px !important; }
                        .login-forgot-link { font-size: 10px !important; }
                        .login-hint-text, .login-helper-text { font-size: 9px !important; }
                        .login-strength-text { font-size: 8px !important; }
                    }
                    
                    /* Desktop: 769px+ - Row Layout */
                    @media (min-width: 769px) {
                        .login-main-card {
                            flex-direction: row !important;
                            border-radius: 16px !important;
                            min-height: 620px !important;
                            max-width: 1000px !important;
                        }
                        .login-left-panel { flex: 1 !important; padding: 40px !important; }
                        .login-right-panel { flex: 1.2 !important; padding: 50px !important; }
                        .login-portal-name { font-size: 48px !important; }
                        .login-title-style { font-size: 26px !important; }
                    }
                    
                    input, select, textarea { font-size: 16px !important; }
                `}
            </style>
        </div>
    );
}

const styles = {
    pageWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '20px', fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden' },
    mainCard: { display: 'flex', background: 'white', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '1000px', minHeight: '620px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' },
    leftPanel: { flex: '1', background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px', position: 'relative' },
    overlay: { textAlign: 'center', zIndex: 2 },
    govText: { fontSize: '13px', color: '#fbc531', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '20px', fontWeight: 'bold' },
    divider: { height: '3px', width: '50px', background: '#fbc531', margin: '20px auto', borderRadius: '2px' },
    portalName: { fontSize: '48px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
    tagline: { fontSize: '14px', opacity: 0.9, marginTop: '10px', lineHeight: '1.5' },
    rightPanel: { flex: '1.2', padding: '50px', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
    langBar: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '30px' },
    langBtn: { fontSize: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' },
    activeLang: { fontSize: '12px', fontWeight: '800', color: '#800000', borderBottom: '2px solid #800000', paddingBottom: '2px' },
    formHeader: { marginBottom: '35px' },
    titleStyle: { fontSize: '26px', fontWeight: '800', color: '#1e293b', marginBottom: '5px' },
    secureBadge: { display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
    roleToggle: { display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '12px', marginBottom: '30px' },
    activeRole: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#800000', color: 'white', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    inactiveRole: { flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    fieldContainer: { marginBottom: '22px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputGroup: { position: 'relative', display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', transition: 'border-color 0.2s' },
    inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#800000' },
    inputStyle: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '10px', border: 'none', outline: 'none', fontSize: '15px', background: 'transparent' },
    eyeIcon: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b' },
    validIcon: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' },
    mainBtn: { width: '100%', padding: '16px', background: '#800000', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px', transition: 'transform 0.1s, background 0.2s' },
    disabledBtn: { background: '#cbd5e1', width: '100%', padding: '16px', borderRadius: '10px', border: 'none', color: '#64748b', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    errorBox: { padding: '14px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #fee2e2', animation: 'fadeIn 0.3s ease' },
    successBox: { padding: '14px', background: '#d4edda', color: '#155724', borderRadius: '10px', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #c3e6cb', animation: 'fadeIn 0.3s ease' },
    infoBox: { padding: '14px', background: '#eff6ff', color: '#1e40af', borderRadius: '10px', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', border: '1px solid #bfdbfe' },
    footer: { marginTop: 'auto', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '25px' },
    footerText: { fontSize: '14px', color: '#64748b' },
    linkText: { color: '#800000', fontWeight: '800', cursor: 'pointer', textDecoration: 'none', marginLeft: '5px' },
    forgotLink: { fontSize: '11px', color: '#800000', fontWeight: '600', cursor: 'pointer', textTransform: 'none', opacity: 0.8 },
    hintText: { fontSize: '10px', color: '#94a3b8', marginTop: '5px', display: 'block' },
    helperText: { fontSize: '10px', color: '#2ed573', marginTop: '5px', display: 'block' },
    strengthContainer: { marginTop: '8px' },
    strengthBarContainer: { height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginBottom: '5px' },
    strengthBar: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease' },
    strengthText: { fontSize: '9px', color: '#64748b' }
};

export default Login;