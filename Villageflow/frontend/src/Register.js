import React, { useState } from 'react';
import axios from 'axios';
import { Landmark, ArrowRight, CheckCircle2, Eye, EyeOff, Phone, Calendar, MapPin, Home, Briefcase, UserCheck, Settings } from 'lucide-react';

const translations = {
    en: {
        title: "Create Account", gov: "Gov Digital Access", sub: "Join VillageFlow - Bibile",
        name: "Full Name", nic: "NIC Number", email: "Email Address", pass: "Password",
        role: "Role", gender: "Gender", male: "Male", female: "Female",
        district: "District", ds: "Divisional Secretariat",
        gn: "GN Division", secKey: "Officer Key", btn: "Register Account",
        err_key: "Invalid Key!", success: "Registration Successful!",
        age: "Age", address: "Permanent Address", household: "Household Number",
        mobile: "Mobile Number", dob: "Date of Birth", occupation: "Occupation",
        emergency: "Emergency Contact", terms: "I agree to the Terms & Conditions",
        village: "Village/Street", city: "City", passwordStrength: "Password Strength",
        weak: "Weak", medium: "Medium", strong: "Strong", confirmPass: "Confirm Password",
        passMismatch: "Passwords do not match!", requiredField: "This field is required",
        personalInfo: "Personal Information", addressInfo: "Address Information",
        accountInfo: "Account Information", next: "Next", previous: "Previous",
        tab1: "Basic Info", tab2: "Address", tab3: "Account"
    },
    si: {
        title: "ගිණුමක් සාදන්න", gov: "රාජ්‍ය ඩිජිටල් පිවිසුම", sub: "VillageFlow සමඟ එක්වන්න - බිබිලේ",
        name: "සම්පූර්ණ නම", nic: "NIC අංකය", email: "විද්‍යුත් තැපෑල", pass: "මුරපදය",
        role: "භූමිකාව", gender: "ස්ත්‍රී/පුරුෂ භාවය", male: "පුරුෂ", female: "ස්ත්‍රී",
        district: "දිස්ත්‍රික්කය", ds: "ප්‍රාදේශීය ලේකම් කාර්යාලය",
        gn: "ග්‍රාම නිලධාරී වසම", secKey: "නිලධාරී කේතය", btn: "ලියාපදිංචි වන්න",
        err_key: "වැරදි කේතයකි!", success: "ලියාපදිංචිය සාර්ථකයි!",
        age: "වයස", address: "ස්ථිර ලිපිනය", household: "ගෘහ මූලික අංකය",
        mobile: "ජංගම දුරකථන අංකය", dob: "උපන් දිනය", occupation: "රැකියාව",
        emergency: "හදිසි අවස්ථා සඳහා සම්බන්ධ කරගත යුතු අංකය", terms: "මම නියමයන් සහ කොන්දේසි වලට එකඟ වෙමි",
        village: "ගම/වීදිය", city: "නගරය", passwordStrength: "මුරපද ශක්තිය",
        weak: "දුර්වල", medium: "මධ්‍යම", strong: "ශක්තිමත්", confirmPass: "මුරපදය තහවුරු කරන්න",
        passMismatch: "මුරපද ගැලපෙන්නේ නැත!", requiredField: "මෙම ක්ෂේත්‍රය අවශ්‍ය වේ",
        personalInfo: "පුද්ගලික තොරතුරු", addressInfo: "ලිපින තොරතුරු",
        accountInfo: "ගිණුම් තොරතුරු", next: "ඊළඟ", previous: "පෙර",
        tab1: "මූලික", tab2: "ලිපිනය", tab3: "ගිණුම"
    },
    ta: {
        title: "கணக்கை உருவாக்கு", gov: "அரச டிஜிட்டல் அணுகல்", sub: "VillageFlow இல் இணையுங்கள் - பிபிலே",
        name: "முழு பெயர்", nic: "NIC எண்", email: "மின்னஞ்சல்", pass: "கடவுச்சொல்",
        role: "பங்கு", gender: "பாலினம்", male: "ஆண்", female: "பெண்",
        district: "மாவட்டம்", ds: "பிரதேச செயலகம்",
        gn: "கிராம அலுவலர் பிரிவு", secKey: "அதிகாரி குறியீடு", btn: "பதிவு செய்க",
        err_key: "தவறான குறியீடு!", success: "பதிவு வெற்றிகரமாக முடிந்தது!",
        age: "வயது", address: "நிரந்தர முகவரி", household: "வீட்டு எண்",
        mobile: "கைபேசி எண்", dob: "பிறந்த தேதி", occupation: "தொழில்",
        emergency: "அவசர தொடர்பு", terms: "நான் விதிமுறைகள் மற்றும் நிபந்தனைகளை ஏற்கிறேன்",
        village: "கிராமம்/தெரு", city: "நகரம்", passwordStrength: "கடவுச்சொல் வலிமை",
        weak: "பலவீனமான", medium: "மிதமான", strong: "வலுவான", confirmPass: "கடவுச்சொல்லை உறுதி செய்க",
        passMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை!", requiredField: "இந்த புலம் தேவை",
        personalInfo: "தனிப்பட்ட தகவல்கள்", addressInfo: "முகவரி தகவல்கள்",
        accountInfo: "கணக்கு தகவல்கள்", next: "அடுத்து", previous: "முந்தைய",
        tab1: "அடிப்படை", tab2: "முகவரி", tab3: "கணக்கு"
    }
};

function Register({ onSwitchToLogin }) {
    const [lang, setLang] = useState('si');
    const [activeTab, setActiveTab] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const [passwordStrength, setPasswordStrength] = useState(0);

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

    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[$@#&!%*?]+/)) strength++;
        setPasswordStrength(Math.min(strength, 5));
        return strength;
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
            } else if (passwordStrength < 3) {
                errors.password = "Password too weak! Use at least 8 characters with uppercase, lowercase, and numbers";
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

            await axios.post('https://villageflow.onrender.com/api/auth/register', finalData);

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

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return '#ff4757';
        if (passwordStrength <= 3) return '#ffa502';
        return '#2ed573';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 2) return t.weak;
        if (passwordStrength <= 3) return t.medium;
        return t.strong;
    };

    const getInputBorderColor = (hasError, isValid) => {
        if (hasError) return '#ff4757';
        if (isValid) return '#2ed573';
        return '#e0e0e0';
    };

    return (
        <div className="register-wrapper" style={styles.pageWrapper}>
            <div className="register-card" style={styles.mainCard}>
                <div className="register-left" style={styles.leftPanel}>
                    <Landmark size={50} color="#fbc531" />
                    <h2 className="register-gov" style={styles.govText}>{t.gov}</h2>
                    <h1 className="register-name" style={styles.portalName}>VillageFlow</h1>
                    <p className="register-sub" style={styles.tagline}>{t.sub}</p>
                </div>

                <div className="register-right" style={styles.rightPanel}>
                    <div className="register-lang" style={styles.langBar}>
                        <span onClick={() => setLang('en')} style={lang === 'en' ? styles.activeLang : styles.langBtn}>EN</span>
                        <span onClick={() => setLang('si')} style={lang === 'si' ? styles.activeLang : styles.langBtn}>සිංහල</span>
                        <span onClick={() => setLang('ta')} style={lang === 'ta' ? styles.activeLang : styles.langBtn}>தமிழ்</span>
                    </div>

                    <div className="register-tabs" style={styles.tabContainer}>
                        <div style={{ ...styles.tab, ...(activeTab === 1 ? styles.activeTab : {}) }} onClick={() => setActiveTab(1)}>
                            <UserCheck size={14} /><span>{t.tab1}</span>
                        </div>
                        <div style={{ ...styles.tab, ...(activeTab === 2 ? styles.activeTab : {}) }} onClick={() => setActiveTab(2)}>
                            <MapPin size={14} /><span>{t.tab2}</span>
                        </div>
                        <div style={{ ...styles.tab, ...(activeTab === 3 ? styles.activeTab : {}) }} onClick={() => setActiveTab(3)}>
                            <Settings size={14} /><span>{t.tab3}</span>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="register-form" style={styles.formGrid}>
                        {successMsg && <div style={styles.successBox}><CheckCircle2 size={18} /> {successMsg}</div>}
                        {formErrors.general && <div style={styles.generalError}>{formErrors.general}</div>}

                        {activeTab === 1 && (
                            <div style={styles.tabContent}>
                                <div style={styles.sectionTitle}>{t.personalInfo}</div>
                                <div className="input-field" style={styles.fullWidth}>
                                    <label style={styles.label}>{t.name}</label>
                                    <input className="custom-input" style={{ ...styles.inputStyle, borderColor: getInputBorderColor(formErrors.fullName, false) }} value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g., M D Perera" />
                                    {formErrors.fullName && <span style={styles.errorText}>{formErrors.fullName}</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.nic}</label>
                                    <input className="custom-input" style={{ ...styles.inputStyle, borderColor: getInputBorderColor(formErrors.nic, formData.nic && validateSriLankanNIC(formData.nic)) }} value={formData.nic} onChange={e => handleNICChange(e.target.value)} placeholder="123456789V or 200012345678" />
                                    {formErrors.nic && <span style={styles.errorText}>{formErrors.nic}</span>}
                                    {formData.nic && validateSriLankanNIC(formData.nic) && !formErrors.nic && <span style={styles.helperText}>✓ Valid NIC</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.mobile}</label>
                                    <div style={styles.inputIconWrapper}>
                                        <Phone size={16} style={styles.inputIcon} />
                                        <input className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.mobileNumber, false) }} value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} placeholder="07X XXX XXXX" />
                                    </div>
                                    {formErrors.mobileNumber && <span style={styles.errorText}>{formErrors.mobileNumber}</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.dob}</label>
                                    <div style={styles.inputIconWrapper}>
                                        <Calendar size={16} style={styles.inputIcon} />
                                        <input type="date" className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.dateOfBirth, false) }} value={formData.dateOfBirth} onChange={e => handleDOBChange(e.target.value)} />
                                    </div>
                                    {formErrors.dateOfBirth && <span style={styles.errorText}>{formErrors.dateOfBirth}</span>}
                                    {formData.dateOfBirth && !formErrors.dateOfBirth && <span style={styles.helperText}>Age: {calculateAgeFromDOB(formData.dateOfBirth)} years</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.role}</label>
                                    <select className="custom-select" style={styles.inputStyle} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="citizen">Citizen</option>
                                        <option value="officer">Officer</option>
                                    </select>
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.gender}</label>
                                    <select className="custom-select" style={styles.inputStyle} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                        <option value="Male">{t.male}</option>
                                        <option value="Female">{t.female}</option>
                                    </select>
                                </div>
                                {formData.role === 'officer' && (
                                    <div className="input-field" style={styles.fullWidth}>
                                        <label style={{ ...styles.label, color: '#e67e22' }}>{t.secKey}</label>
                                        <input type="password" className="custom-input" style={{ ...styles.inputStyle, borderColor: formErrors.securityKey ? '#ff4757' : '#e67e22' }} onChange={e => setSecurityKey(e.target.value)} />
                                        {formErrors.securityKey && <span style={styles.errorText}>{formErrors.securityKey}</span>}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 2 && (
                            <div style={styles.tabContent}>
                                <div style={styles.sectionTitle}>{t.addressInfo}</div>
                                {formData.role === 'citizen' ? (
                                    <>
                                        <div className="input-field" style={styles.fullWidth}>
                                            <label style={styles.label}>{t.village}</label>
                                            <div style={styles.inputIconWrapper}>
                                                <MapPin size={16} style={styles.inputIcon} />
                                                <input className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.village, false) }} value={formData.village} onChange={e => setFormData({ ...formData, village: e.target.value })} placeholder="e.g., Kotagama" />
                                            </div>
                                            {formErrors.village && <span style={styles.errorText}>{formErrors.village}</span>}
                                        </div>
                                        <div className="input-field" style={styles.halfWidth}>
                                            <label style={styles.label}>{t.city}</label>
                                            <input className="custom-input" style={{ ...styles.inputStyle, borderColor: getInputBorderColor(formErrors.city, false) }} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="e.g., Bibile" />
                                            {formErrors.city && <span style={styles.errorText}>{formErrors.city}</span>}
                                        </div>
                                        <div className="input-field" style={styles.halfWidth}>
                                            <label style={styles.label}>{t.household}</label>
                                            <div style={styles.inputIconWrapper}>
                                                <Home size={16} style={styles.inputIcon} />
                                                <input className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.householdNo, false) }} value={formData.householdNo} onChange={e => setFormData({ ...formData, householdNo: e.target.value })} placeholder="GN-KTG-001" />
                                            </div>
                                            {formErrors.householdNo && <span style={styles.errorText}>{formErrors.householdNo}</span>}
                                        </div>
                                        <div className="input-field" style={styles.halfWidth}>
                                            <label style={styles.label}>{t.occupation}</label>
                                            <div style={styles.inputIconWrapper}>
                                                <Briefcase size={16} style={styles.inputIcon} />
                                                <input className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.occupation, false) }} value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })} placeholder="e.g., Farmer, Teacher" />
                                            </div>
                                            {formErrors.occupation && <span style={styles.errorText}>{formErrors.occupation}</span>}
                                        </div>
                                        <div className="input-field" style={styles.halfWidth}>
                                            <label style={styles.label}>{t.emergency}</label>
                                            <input className="custom-input" style={styles.inputStyle} value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} placeholder="Optional - 07XXXXXXXX" />
                                            {formErrors.emergencyContact && <span style={styles.errorText}>{formErrors.emergencyContact}</span>}
                                        </div>
                                        <div className="input-field" style={styles.fullWidth}>
                                            <label style={styles.label}>{t.address}</label>
                                            <textarea className="custom-textarea" style={{ ...styles.inputStyle, minHeight: '60px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Full address (optional)" />
                                            {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
                                        </div>
                                    </>
                                ) : (
                                    <div className="input-field" style={styles.fullWidth}>
                                        <label style={styles.label}>{t.address}</label>
                                        <textarea className="custom-textarea" style={{ ...styles.inputStyle, minHeight: '80px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Office address" />
                                        {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
                                    </div>
                                )}
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.district}</label>
                                    <input className="locked-input" style={styles.lockedInput} value={formData.district} readOnly />
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.ds}</label>
                                    <input className="locked-input" style={styles.lockedInput} value={formData.divisionalSecretariat} readOnly />
                                </div>
                                <div className="input-field" style={styles.fullWidth}>
                                    <label style={styles.label}>{t.gn}</label>
                                    <input className="locked-input" style={styles.lockedInput} value={formData.gnDivision} readOnly />
                                </div>
                            </div>
                        )}

                        {activeTab === 3 && (
                            <div style={styles.tabContent}>
                                <div style={styles.sectionTitle}>{t.accountInfo}</div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.email}</label>
                                    <input type="email" className="custom-input" style={{ ...styles.inputStyle, borderColor: getInputBorderColor(formErrors.email, false) }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="name@example.com" />
                                    {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.pass}</label>
                                    <div style={styles.inputIconWrapper}>
                                        <input type={showPassword ? "text" : "password"} className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.password, false), paddingRight: '35px' }} value={formData.password} onChange={e => { setFormData({ ...formData, password: e.target.value }); checkPasswordStrength(e.target.value); }} />
                                        <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                                    </div>
                                    {formData.password && <div style={styles.strengthContainer}><div style={{ ...styles.strengthBar, width: `${(passwordStrength / 5) * 100}%`, backgroundColor: getPasswordStrengthColor() }}></div><span style={styles.strengthText}>{t.passwordStrength}: {getPasswordStrengthText()}</span></div>}
                                    {formErrors.password && <span style={styles.errorText}>{formErrors.password}</span>}
                                </div>
                                <div className="input-field" style={styles.halfWidth}>
                                    <label style={styles.label}>{t.confirmPass}</label>
                                    <div style={styles.inputIconWrapper}>
                                        <input type={showConfirmPassword ? "text" : "password"} className="custom-input" style={{ ...styles.inputWithIcon, borderColor: getInputBorderColor(formErrors.confirmPassword, false), paddingRight: '35px' }} value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} />
                                        <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                                    </div>
                                    {formErrors.confirmPassword && <span style={styles.errorText}>{formErrors.confirmPassword}</span>}
                                </div>
                                <div className="input-field" style={styles.fullWidth}>
                                    <label style={styles.checkboxLabel}><input type="checkbox" checked={formData.agreeToTerms} onChange={e => setFormData({ ...formData, agreeToTerms: e.target.checked })} style={styles.checkbox} /> {t.terms}</label>
                                    {formErrors.agreeToTerms && <span style={styles.errorText}>{formErrors.agreeToTerms}</span>}
                                </div>
                            </div>
                        )}

                        <div style={styles.buttonContainer}>
                            {activeTab > 1 && <button type="button" onClick={handlePrevious} style={styles.secondaryBtn}>{t.previous}</button>}
                            {activeTab < 3 ? <button type="button" onClick={handleNext} style={styles.mainBtn}>{t.next} <ArrowRight size={18} /></button> : <button type="submit" style={loading ? styles.disabledBtn : styles.mainBtn} disabled={loading}>{loading ? "..." : t.btn} <ArrowRight size={18} /></button>}
                        </div>
                    </form>
                </div>
            </div>
            <style>
                {`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                    
                    /* Input Focus & Hover Effects */
                    .custom-input:focus, .custom-select:focus, .custom-textarea:focus {
                        border-color: #800000 !important;
                        outline: none !important;
                        box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.1) !important;
                        background-color: #fff !important;
                    }
                    
                    .custom-input:hover, .custom-select:hover, .custom-textarea:hover {
                        border-color: #a00000 !important;
                    }
                    
                    .locked-input:focus {
                        outline: none !important;
                    }
                    
                    /* Button Hover Effects */
                    .register-main-btn:hover, .register-form button[type="submit"]:hover {
                        background-color: #a00000 !important;
                        transform: translateY(-2px) !important;
                        box-shadow: 0 4px 12px rgba(128, 0, 0, 0.3) !important;
                    }
                    
                    .register-secondary-btn:hover {
                        background-color: #5a6268 !important;
                        transform: translateY(-2px) !important;
                    }
                    
                    /* Tab Hover Effects */
                    .register-tabs div:not(.register-active-tab):hover {
                        background-color: #f5f5f5 !important;
                        color: #800000 !important;
                    }
                    
                    /* Language Button Hover */
                    .register-lang span:hover {
                        color: #800000 !important;
                    }
                    
                    /* Checkbox Hover */
                    .register-checkbox-label:hover {
                        color: #800000 !important;
                    }
                    
                    /* Mobile Responsive */
                    @media (max-width: 768px) {
                        .register-card { flex-direction: column !important; border-radius: 0 !important; max-width: 100% !important; }
                        .register-left { width: 100% !important; padding: 30px 20px !important; }
                        .register-right { width: 100% !important; padding: 25px 20px !important; }
                        .register-name { font-size: 28px !important; }
                        .register-gov { font-size: 11px !important; margin-top: 10px !important; }
                        .register-sub { font-size: 10px !important; }
                        .register-lang { margin-bottom: 15px !important; }
                        .register-lang span { font-size: 10px !important; margin: 0 5px !important; }
                        .register-tabs { gap: 5px !important; margin-bottom: 15px !important; }
                        .register-tabs div { padding: 8px !important; font-size: 11px !important; }
                        .register-tabs svg { width: 12px !important; height: 12px !important; }
                        .register-form .halfWidth { width: 100% !important; }
                        .register-form .fullWidth { width: 100% !important; }
                        .register-form input, .register-form select, .register-form textarea { padding: 10px 12px !important; font-size: 16px !important; }
                        .register-form button { padding: 10px 16px !important; font-size: 13px !important; }
                    }
                    
                    @media (max-width: 480px) {
                        .register-left { padding: 20px 15px !important; }
                        .register-right { padding: 20px 15px !important; }
                        .register-name { font-size: 24px !important; }
                        .register-tabs div { padding: 6px !important; font-size: 10px !important; }
                        .register-tabs svg { width: 10px !important; height: 10px !important; }
                        .register-form input, .register-form select, .register-form textarea { padding: 8px 10px !important; font-size: 14px !important; }
                        .register-form button { padding: 8px 12px !important; font-size: 12px !important; }
                    }
                    
                    @media (min-width: 769px) {
                        .register-card { flex-direction: row !important; border-radius: 16px !important; max-width: 950px !important; }
                        .register-left { flex: 0.5 !important; padding: 40px !important; }
                        .register-right { flex: 1.5 !important; padding: 30px !important; }
                        .register-name { font-size: 28px !important; }
                        .register-form .halfWidth { width: calc(50% - 8px) !important; }
                        .register-form .fullWidth { width: 100% !important; }
                    }
                    
                    input, select, textarea { font-size: 16px !important; }
                `}
            </style>
        </div>
    );
}

const styles = {
    successBox: { width: '100%', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#c3e6cb', fontWeight: 'bold' },
    errorText: { color: '#ff4757', fontSize: '10px', marginTop: '4px', display: 'block', fontWeight: '500' },
    helperText: { color: '#2ed573', fontSize: '10px', marginTop: '4px', display: 'block' },
    generalError: { width: '100%', padding: '12px', backgroundColor: '#ffe0e3', color: '#ff4757', borderRadius: '8px', fontSize: '12px', marginBottom: '15px', textAlign: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ff4757' },
    pageWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', padding: '20px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', width: '100%', overflowX: 'hidden' },
    mainCard: { display: 'flex', backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '950px', boxShadow: '0 20px 35px -10px rgba(0,0,0,0.15)' },
    leftPanel: { flex: '0.5', backgroundColor: '#800000', color: 'white', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    rightPanel: { flex: '1.5', padding: '30px', backgroundColor: '#fff' },
    formGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
    fullWidth: { width: '100%' },
    halfWidth: { width: 'calc(50% - 6px)' },
    label: { fontSize: '11px', fontWeight: '600', display: 'block', marginBottom: '5px', color: '#444', letterSpacing: '0.3px' },
    inputStyle: { width: '100%', padding: '10px 12px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', outline: 'none', transition: 'all 0.2s ease', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#fafafa' },
    inputIconWrapper: { position: 'relative', width: '100%' },
    inputWithIcon: { width: '100%', padding: '10px 12px 10px 34px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', outline: 'none', transition: 'all 0.2s ease', fontSize: '13px', boxSizing: 'border-box', backgroundColor: '#fafafa' },
    lockedInput: { width: '100%', padding: '10px 12px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#eee', backgroundColor: '#f5f5f5', color: '#888', cursor: 'not-allowed', fontSize: '13px', boxSizing: 'border-box' },
    mainBtn: { padding: '10px 24px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease' },
    secondaryBtn: { padding: '10px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease' },
    disabledBtn: { padding: '10px 24px', backgroundColor: '#ccc', color: '#888', border: 'none', borderRadius: '8px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' },
    langBar: { textAlign: 'right', marginBottom: '20px' },
    langBtn: { margin: '0 8px', cursor: 'pointer', fontSize: '12px', color: '#999', transition: 'color 0.2s ease' },
    activeLang: { margin: '0 8px', fontWeight: 'bold', color: '#800000', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#800000', paddingBottom: '4px', fontSize: '12px' },
    govText: { fontSize: '13px', marginTop: '15px', opacity: 0.85, letterSpacing: '1px' },
    portalName: { fontSize: '28px', margin: '8px 0', fontWeight: '700', letterSpacing: '-0.5px' },
    tagline: { fontSize: '11px', opacity: 0.7 },
    inputIcon: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999', transition: 'color 0.2s ease' },
    eyeIcon: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999', transition: 'color 0.2s ease' },
    strengthContainer: { marginTop: '6px' },
    strengthBar: { height: '3px', borderRadius: '3px', transition: 'width 0.3s ease', marginBottom: '4px' },
    strengthText: { fontSize: '9px', color: '#888' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#555', cursor: 'pointer', transition: 'color 0.2s ease' },
    checkbox: { cursor: 'pointer', width: '16px', height: '16px' },
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '25px', borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#eee', paddingBottom: '12px' },
    tab: { flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#888', transition: 'all 0.2s ease', fontWeight: '500' },
    activeTab: { backgroundColor: '#800000', color: 'white' },
    tabContent: { width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px' },
    sectionTitle: { width: '100%', fontSize: '14px', fontWeight: 'bold', color: '#800000', marginBottom: '5px', paddingBottom: '8px', borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: '#800000' },
    buttonContainer: { width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }
};

export default Register;