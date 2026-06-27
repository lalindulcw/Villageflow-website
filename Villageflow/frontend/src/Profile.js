import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from './services/languageService';
import axios from 'axios';
import { API_BASE } from './config';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, Trash2, Edit3, Save, X, 
  UserPlus, Download, LogOut, Landmark, Award, Loader2, Phone, MapPin, Clock, Shield,
  Calendar, Mail, Briefcase, Home, FileText, Smartphone, AlertCircle, CheckCircle
} from 'lucide-react';
import { loadPublicConfig } from './services/configService'; 

const translations = {
    en: { 
        title: "Digital ID Card", profile: "Citizen Profile", proxy: "Elderly Care Proxy Registration", 
        name: "Full Name", role: "Designation", edit: "Update Info", delete: "Deactivate Account", 
        download: "DOWNLOAD QR", save: "Save Changes", cancel: "Discard", regBtn: "Authorize Registration", 
        logout: "Secure Logout", nicLabel: "NIC Number", passLabel: "Secure Password", 
        relLabel: "Family Relationship", area: "Administrative Area",
        age: "Age", address: "Permanent Address", household: "Household Number", gender: "Gender",
        successMsg: "Profile updated successfully!", proxySuccess: "Proxy registered successfully!",
        confirmDelete: "Are you sure you want to permanently deactivate this account?",
        officer: "Grama Niladhari", citizen: "Citizen",
        officeTitle: "Grama Niladhari Office Details",
        mobile: "Mobile Number", email: "Email Address", dob: "Date of Birth",
        occupation: "Occupation", emergency: "Emergency Contact", village: "Village", city: "City",
        district: "District", ds: "DS Division", gn: "GN Division",
        validation: {
            nicRequired: "NIC number is required",
            nicInvalid: "Invalid NIC number (e.g., 199012345678 or 912345678V)",
            mobileRequired: "Mobile number is required",
            mobileInvalid: "Invalid mobile number (e.g., 0712345678)",
            passwordRequired: "Password is required",
            passwordMin: "Password must be at least 4 characters",
            passwordMax: "Password must be at most 20 characters",
            passwordPattern: "Password must contain at least one letter and one number",
            fullNameRequired: "Full name is required",
            fullNameMin: "Full name must be at least 3 characters",
            fullNameMax: "Full name must be at most 100 characters",
            fullNamePattern: "Full name can only contain letters, spaces, and hyphens",
            addressRequired: "Address is required",
            addressMin: "Address must be at least 5 characters",
            addressMax: "Address must be at most 200 characters",
            householdRequired: "Household number is required",
            householdPattern: "Household number should be like 123, 123/A, 123B",
            villageRequired: "Village is required",
            villageMin: "Village name must be at least 2 characters",
            villageMax: "Village name must be at most 50 characters",
            villagePattern: "Village name can only contain letters and spaces",
            cityRequired: "City is required",
            cityMin: "City name must be at least 2 characters",
            cityMax: "City name must be at most 50 characters",
            cityPattern: "City name can only contain letters and spaces",
            occupationRequired: "Occupation is required",
            occupationMin: "Occupation must be at least 2 characters",
            occupationMax: "Occupation must be at most 50 characters",
            dobRequired: "Date of birth is required",
            ageMin: "Age must be at least 18 years",
            ageMax: "Age cannot exceed 120 years",
            relationshipRequired: "Family relationship is required",
            emailInvalid: "Invalid email address",
            emergencyInvalid: "Invalid emergency contact number (e.g., 0712345678)",
            termsRequired: "You must agree to the terms and conditions",
            nicExists: "This NIC number is already registered",
            mobileExists: "This mobile number is already registered"
        },
        mfaTitle: "Multi-Factor Authentication (2FA)",
        mfaStatusEnabled: "MFA is currently Enabled",
        mfaStatusDisabled: "MFA is currently Disabled",
        mfaSetupHeading: "Set up Multi-Factor Authentication",
        mfaScanInstructions: "Scan the QR code below with your Authenticator app (e.g. Google Authenticator), then enter the 6-digit verification code to enable MFA.",
        mfaEnableBtn: "Enable 2FA",
        mfaDisableBtn: "Disable 2FA",
        mfaVerifyCodeBtn: "Verify and Enable",
        mfaCodeLabel: "Verification Code",
        mfaCodePlaceholder: "e.g. 123456",
        mfaSuccessEnable: "MFA enabled successfully!",
        mfaSuccessDisable: "MFA disabled successfully!"
    },
    si: { 
        title: "ඩිජිටල් හැඳුනුම්පත", profile: "පුරවැසි පැතිකඩ", proxy: "වැඩිහිටි සේවා ප්‍රොක්සි ලියාපදිංචිය", 
        name: "සම්පූර්ණ නම", role: "තනතුර/භූමිකාව", edit: "තොරතුරු යාවත්කාලීන කරන්න", delete: "ගිණුම අක්‍රීය කරන්න", 
        download: "QR පත බාගන්න", save: "සුරකින්න", cancel: "අවලංගු කරන්න", regBtn: "ලියාපදිංචිය අනුමත කරන්න", 
        logout: "ආරක්ෂිතව නික්ම යන්න", nicLabel: "ජාතික හැඳුනුම්පත් අංකය", passLabel: "ආරක්ෂිත මුරපදය", 
        relLabel: "පවුලේ සම්බන්ධතාවය", area: "පරිපාලන ප්‍රදේශය",
        age: "වයස", address: "ස්ථිර ලිපිනනය", household: "ගෘහ මූලික අංකය", gender: "ස්ත්‍රී/පුරුෂ භාවය",
        successMsg: "පැතිකඩ යාවත්කාලීන කිරීම සාර්ථකයි!", proxySuccess: "ප්‍රොක්සි ලියාපදිංචිය සාර්ථකයි!",
        confirmDelete: "මෙම ගිණුම ස්ථිරවම ඉවත් කිරීමට ඔබට අවශ්‍යද?",
        officer: "ග්‍රාම නිලධාරී", citizen: "පුරවැසියා",
        officeTitle: "ග්‍රාම නිලධාරී කාර්යාලීය තොරතුරු",
        mobile: "දුරකථන අංකය", email: "ඊමේල් ලිපිනය", dob: "උපන් දිනය",
        occupation: "රැකියාව", emergency: "හදිසි ඇමතුම්", village: "ගම", city: "නගරය",
        district: "දිස්ත්‍රික්කය", ds: "ප්‍රා.ලේ. කොට්ඨාසය", gn: "ග්‍රාම නිලධාරී වසම",
        validation: {
            nicRequired: "NIC අංකය අවශ්‍යයි",
            nicInvalid: "අවලංගු NIC අංකයකි (උදා: 199012345678 හෝ 912345678V)",
            mobileRequired: "දුරකථන අංකය අවශ්‍යයි",
            mobileInvalid: "අවලංගු දුරකථන අංකයකි (උදා: 0712345678)",
            passwordRequired: "මුරපදය අවශ්‍යයි",
            passwordMin: "මුරපදය අකුරු 4කට වඩා වැඩි විය යුතුය",
            passwordMax: "මුරපදය අකුරු 20කට වඩා අඩු විය යුතුය",
            passwordPattern: "මුරපදයේ අවම වශයෙන් එක් අකුරක් සහ එක් අංකයක් තිබිය යුතුය",
            fullNameRequired: "සම්පූර්ණ නම අවශ්‍යයි",
            fullNameMin: "සම්පූර්ණ නම අකුරු 3කට වඩා වැඩි විය යුතුය",
            fullNameMax: "සම්පූර්ණ නම අකුරු 100කට වඩා අඩු විය යුතුය",
            fullNamePattern: "සම්පූර්ණ නමේ අකුරු, හිස්තැන් සහ ඉරි පමණක් තිබිය හැක",
            addressRequired: "ලිපිනය අවශ්‍යයි",
            addressMin: "ලිපිනය අකුරු 5කට වඩා වැඩි විය යුතුය",
            addressMax: "ලිපිනය අකුරු 200කට වඩා අඩු විය යුතුය",
            householdRequired: "ගෘහ මූලික අංකය අවශ්‍යයි",
            householdPattern: "ගෘහ මූලික අංකය 123, 123/A, 123B වැනි ආකාරයක් විය යුතුය",
            villageRequired: "ගම/වීදිය අවශ්‍යයි",
            villageMin: "ගමේ නම අකුරු 2කට වඩා වැඩි විය යුතුය",
            villageMax: "ගමේ නම අකුරු 50කට වඩා අඩු විය යුතුය",
            villagePattern: "ගමේ නමේ අකුරු සහ හිස්තැන් පමණක් තිබිය හැක",
            cityRequired: "නගරය අවශ්‍යයි",
            cityMin: "නගරයේ නම අකුරු 2කට වඩා වැඩි විය යුතුය",
            cityMax: "නගරයේ නම අකුරු 50කට වඩා අඩු විය යුතුය",
            cityPattern: "නගරයේ නමේ අකුරු සහ හිස්තැන් පමණක් තිබිය හැක",
            occupationRequired: "රැකියාව අවශ්‍යයි",
            occupationMin: "රැකියාව අකුරු 2කට වඩා වැඩි විය යුතුය",
            occupationMax: "රැකියාව අකුරු 50කට වඩා අඩු විය යුතුය",
            dobRequired: "උපන් දිනය අවශ්‍යයි",
            ageMin: "අවම වයස අවුරුදු 18 ක් විය යුතුයි",
            ageMax: "වයස අවුරුදු 120 ඉක්මවිය නොහැක",
            relationshipRequired: "පවුලේ සම්බන්ධතාවය අවශ්‍යයි",
            emailInvalid: "අවලංගු ඊමේල් ලිපිනයකි",
            emergencyInvalid: "අවලංගු හදිසි ඇමතුම් අංකයකි (උදා: 0712345678)",
            termsRequired: "නියමයන් හා කොන්දේසි වලට එකඟ විය යුතුයි",
            nicExists: "මෙම NIC අංකය දැනටමත් ලියාපදිංචි කර ඇත",
            mobileExists: "මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත"
        },
        mfaTitle: "ද්වි-සාධක සත්‍යාපනය (2FA)",
        mfaStatusEnabled: "ද්වි-සාධක සත්‍යාපනය දැනට ක්‍රියාත්මකයි",
        mfaStatusDisabled: "ද්වි-සාධක සත්‍යාපනය දැනට අක්‍රියයි",
        mfaSetupHeading: "ද්වි-සාධක සත්‍යාපනය සකසන්න",
        mfaScanInstructions: "පහත QR කේතය ඔබගේ Authenticator යෙදුමෙන් scan කර, එය සක්‍රිය කිරීමට ඉලක්කම් 6ක සත්‍යාපන කේතය ඇතුළත් කරන්න.",
        mfaEnableBtn: "2FA සක්‍රිය කරන්න",
        mfaDisableBtn: "2FA අක්‍රිය කරන්න",
        mfaVerifyCodeBtn: "තහවුරු කර සක්‍රිය කරන්න",
        mfaCodeLabel: "සත්‍යාපන කේතය",
        mfaCodePlaceholder: "උදා: 123456",
        mfaSuccessEnable: "ද්වි-සාධක සත්‍යාපනය සාර්ථකව සක්‍රිය කරන ලදී!",
        mfaSuccessDisable: "ද්වි-සාධක සත්‍යාපනය සාර්ථකව අක්‍රිය කරන ලදී!"
    },
    ta: { 
        title: "டிஜிட்டல் அடையாள அட்டை", profile: "குடிமகன் விவரக்குறிப்பு", proxy: "முதியோர் பராமரிப்பு ப்ராக்ஸி பதிவு", 
        name: "முழு பெயர்", role: "பதவி", edit: "தகவலைப் புதுப்பிக்கவும்", delete: "கணக்கை நீக்கவும்", 
        download: "QR பதிவிறக்கம்", save: "மாற்றங்களைச் சேமி", cancel: "ரத்து செய்", regBtn: "பதிவை அங்கீகரிக்கவும்", 
        logout: "வெளியேறு", nicLabel: "NIC எண்", passLabel: "கடவுச்சொல்", 
        relLabel: "குடும்ப உறவு", area: "நிர்வாக பகுதி",
        age: "வயது", address: "நிரந்தர முகவரி", household: "வீட்டு எண்", gender: "பாலினம்",
        successMsg: "விவரக்குறிப்பு வெற்றிகரமாக புதுப்பிக்கப்பட்டது!", proxySuccess: "ப்ராக்ஸி வெற்றிகரமாக பதிவு செய்யப்பட்டது!",
        confirmDelete: "இந்தக் கணக்கை நிரந்தரமாக நீக்க விரும்புகிறீர்களா?",
        officer: "கிராம அதிகாரி", citizen: "குடிமகன்",
        officeTitle: "கிராம உத்தியோகத்தர் அலுவலக விபரங்கள்",
        mobile: "தொலைபேசி எண்", email: "மின்னஞ்சல்", dob: "பிறந்த தேதி",
        occupation: "தொழில்", emergency: "அவசர தொடர்பு", village: "கிராமம்", city: "நகரம்",
        district: "மாவட்டம்", ds: "பிரதேச செயலகம்", gn: "கிராம உத்தியோகத்தர் பிரிவு",
        validation: {
            nicRequired: "NIC எண் தேவை",
            nicInvalid: "செல்லுபடியாகாத NIC எண் (எ.கா: 199012345678 அல்லது 912345678V)",
            mobileRequired: "தொலைபேசி எண் தேவை",
            mobileInvalid: "செல்லுபடியாகாத தொலைபேசி எண் (எ.கா: 0712345678)",
            passwordRequired: "கடவுச்சொல் தேவை",
            passwordMin: "கடவுச்சொல் குறைந்தது 4 எழுத்துகளாக இருக்க வேண்டும்",
            passwordMax: "கடவுச்சொல் அதிகபட்சம் 20 எழுத்துகளாக இருக்க வேண்டும்",
            passwordPattern: "கடவுச்சொல்லில் குறைந்தது ஒரு எழுத்து மற்றும் ஒரு எண் இருக்க வேண்டும்",
            fullNameRequired: "முழு பெயர் தேவை",
            fullNameMin: "முழு பெயர் குறைந்தது 3 எழுத்துகளாக இருக்க வேண்டும்",
            fullNameMax: "முழு பெயர் அதிகபட்சம் 100 எழுத்துகளாக இருக்க வேண்டும்",
            fullNamePattern: "முழு பெயரில் எழுத்துகள், இடைவெளிகள் மற்றும் கோடுகள் மட்டுமே இருக்க முடியும்",
            addressRequired: "முகவரி தேவை",
            addressMin: "முகவரி குறைந்தது 5 எழுத்துகளாக இருக்க வேண்டும்",
            addressMax: "முகவரி அதிகபட்சம் 200 எழுத்துகளாக இருக்க வேண்டும்",
            householdRequired: "வீட்டு எண் தேவை",
            householdPattern: "வீட்டு எண் 123, 123/A, 123B போன்ற வடிவமாக இருக்க வேண்டும்",
            villageRequired: "கிராமம் தேவை",
            villageMin: "கிராமத்தின் பெயர் குறைந்தது 2 எழுத்துகளாக இருக்க வேண்டும்",
            villageMax: "கிராமத்தின் பெயர் அதிகபட்சம் 50 எழுத்துகளாக இருக்க வேண்டும்",
            villagePattern: "கிராமத்தின் பெயரில் எழுத்துகள் மற்றும் இடைவெளிகள் மட்டுமே இருக்க முடியும்",
            cityRequired: "நகரம் தேவை",
            cityMin: "நகரத்தின் பெயர் குறைந்தது 2 எழுத்துகளாக இருக்க வேண்டும்",
            cityMax: "நகரத்தின் பெயர் அதிகபட்சம் 50 எழுத்துகளாக இருக்க வேண்டும்",
            cityPattern: "நகரத்தின் பெயரில் எழுத்துகள் மற்றும் இடைவெளிகள் மட்டுமே இருக்க முடியும்",
            occupationRequired: "தொழில் தேவை",
            occupationMin: "தொழில் குறைந்தது 2 எழுத்துகளாக இருக்க வேண்டும்",
            occupationMax: "தொழில் அதிகபட்சம் 50 எழுத்துகளாக இருக்க வேண்டும்",
            dobRequired: "பிறந்த தேதி தேவை",
            ageMin: "வயது குறைந்தது 18 ஆக இருக்க வேண்டும்",
            ageMax: "வயது 120ஐ விட அதிகமாக இருக்க முடியாது",
            relationshipRequired: "குடும்ப உறவு தேவை",
            emailInvalid: "செல்லுபடியாகாத மின்னஞ்சல் முகவரி",
            emergencyInvalid: "செல்லுபடியாகாத அவசர தொடர்பு எண் (எ.கா: 0712345678)",
            termsRequired: "நீங்கள் விதிமுறைகளை ஏற்க வேண்டும்",
            nicExists: "இந்த NIC எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது",
            mobileExists: "இந்த தொலைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது"
        },
        mfaTitle: "இரு காரணி அங்கீகாரம் (2FA)",
        mfaStatusEnabled: "2FA தற்போது இயக்கப்பட்டுள்ளது",
        mfaStatusDisabled: "2FA தற்போது முடக்கப்பட்டுள்ளது",
        mfaSetupHeading: "இரு காரணி அங்கீகாரத்தை அமைக்கவும்",
        mfaScanInstructions: "கீழே உள்ள QR குறியீட்டை உங்கள் அங்கீகாரப் பயன்பாட்டின் மூலம் ஸ்கேன் செய்து, 2FA ஐ இயக்க 6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்.",
        mfaEnableBtn: "2FA ஐ இயக்கு",
        mfaDisableBtn: "2FA ஐ முடக்கு",
        mfaVerifyCodeBtn: "சரிபார்த்து இயக்கு",
        mfaCodeLabel: "சரிபார்ப்புக் குறியீடு",
        mfaCodePlaceholder: "எ.கா: 123456",
        mfaSuccessEnable: "2FA வெற்றிகரமாக இயக்கப்பட்டது!",
        mfaSuccessDisable: "2FA வெற்றிகரமாக முடக்கப்பட்டது!"
    }
};

function Profile() {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null; 
    });

    const [lang, setLang] = useLanguage();
    const t = translations[lang] || translations.en;
    const [isEditing, setIsEditing] = useState(false);
    const [officeInfo, setOfficeInfo] = useState(null);
    const isFirstRun = useRef(true);
    
    const [editData, setEditData] = useState({
        fullName: '', nic: '', email: '', dateOfBirth: '', age: '', 
        address: '', householdNo: '', gender: '', mobileNumber: '', 
        occupation: '', emergencyContact: ''
    });

    const [proxyData, setProxyData] = useState({ 
        fullName: '', nic: '', password: '', relationship: '', age: '', 
        address: '', householdNo: '', gender: 'Male', mobileNumber: '', 
        occupation: '', email: '', dateOfBirth: '', village: '', city: '', 
        emergencyContact: '', agreeToTerms: true
    });
    
    const [errors, setErrors] = useState({});
    const [proxyErrors, setProxyErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [proxyLoading, setProxyLoading] = useState(false);

    // Speakeasy MFA Setup States
    const [mfaSetupData, setMfaSetupData] = useState(null); 
    const [mfaCode, setMfaCode] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);
    const [mfaError, setMfaError] = useState('');
    const [mfaSuccess, setMfaSuccess] = useState('');

    // Validation helper functions
    const validateNIC = (nic) => {
        const oldNic = /^[0-9]{9}[vVxX]$/;
        const newNic = /^[0-9]{12}$/;
        return oldNic.test(nic) || newNic.test(nic);
    };

    const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);
    
    const validateEmail = (email) => {
        if (!email) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    
    const validatePassword = (password) => {
        if (password.length < 4) return false;
        if (password.length > 20) return false;
        return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    };
    
    const validateFullName = (name) => {
        if (name.length < 3) return false;
        if (name.length > 100) return false;
        // Allow Sinhala/Tamil/other Unicode letters with spaces and hyphens
        return /^[\p{L}\s-]+$/u.test(name);
    };
    
    const validateHouseholdNo = (householdNo) => {
        return /^[0-9]+[/A-Za-z0-9-]*$/.test(householdNo);
    };
    
    const validateVillageOrCity = (value) => {
        if (value.length < 2) return false;
        if (value.length > 50) return false;
        // Allow Unicode letters (Sinhala/Tamil/English) and spaces
        return /^[\p{L}\s]+$/u.test(value);
    };
    
    const calculateAge = (dateOfBirth) => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchUserData = useCallback(async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/auth/user/${id}`);
            const latestData = { ...res.data, id: res.data._id };
            setUser(latestData);
            localStorage.setItem('user', JSON.stringify(latestData));
            
            setEditData({
                fullName: latestData.fullName || '',
                nic: latestData.nic || '',
                email: latestData.email || '',
                dateOfBirth: latestData.dateOfBirth ? latestData.dateOfBirth.split('T')[0] : '',
                age: latestData.age || '',
                address: latestData.address || '',
                householdNo: latestData.householdNo || '',
                gender: latestData.gender || 'Male',
                mobileNumber: latestData.mobileNumber || '',
                occupation: latestData.occupation || '',
                emergencyContact: latestData.emergencyContact || ''
            });
        } catch (err) {
            console.error("Error fetching user data", err);
        }
    }, []);

    const fetchOfficeData = useCallback(async (gnDivision) => {
        try {
            const config = await loadPublicConfig(gnDivision);
            if (config?.general) setOfficeInfo(config.general);
            else if (config) setOfficeInfo(config);
        } catch (error) {
            console.error("Error fetching office config", error);
        }
    }, []);

    // Refresh office info when system config updates
    useEffect(() => {
        const onConfigUpdated = () => fetchOfficeData(user?.gnDivision);
        window.addEventListener('villageflow:config-updated', onConfigUpdated);
        return () => window.removeEventListener('villageflow:config-updated', onConfigUpdated);
    }, [fetchOfficeData, user]);

    useEffect(() => {
        if (user && isFirstRun.current) {
            const targetId = user._id || user.id;
            fetchUserData(targetId);
            fetchOfficeData(user.gnDivision);
            isFirstRun.current = false;
        }
    }, [user, fetchUserData, fetchOfficeData]); 

    if (!user) {
        return <div style={{padding: '100px', textAlign: 'center', color: '#8B0000'}}><Loader2 className="spin" /> Loading Official Profile...</div>;
    }

    const handleUpdate = async () => {
        let updateErrors = {};
        if (!validateNIC(editData.nic)) updateErrors.nic = t.validation.nicInvalid;
        if (!validatePhone(editData.mobileNumber)) updateErrors.mobileNumber = t.validation.mobileInvalid;
        if (!editData.fullName) updateErrors.fullName = t.validation.fullNameRequired;

        if (Object.keys(updateErrors).length > 0) {
            setErrors(updateErrors);
            return;
        }

        setLoading(true);
        try {
            const targetId = user._id || user.id;
            const res = await axios.put(`${API_BASE}/auth/update/${targetId}`, editData);
            const updatedUser = { ...res.data.user, id: res.data.user._id };
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSuccessMessage(t.successMsg);
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) { 
            setErrors(err.response?.data?.errors || { general: "Update failed." });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(t.confirmDelete)) {
            try {
                const targetId = user._id || user.id;
                await axios.delete(`${API_BASE}/auth/delete/${targetId}`);
                localStorage.removeItem('user');
                window.location.href = '/login'; 
            } catch (err) {
                setErrors({ general: "Delete failed." });
            }
        }
    };

    const handleMfaSetup = async () => {
        setMfaLoading(true);
        setMfaError('');
        setMfaSuccess('');
        try {
            const res = await axios.post(`${API_BASE}/auth/mfa/setup`, {}, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                withCredentials: true
            });
            setMfaSetupData(res.data);
        } catch (err) {
            console.error("MFA setup error:", err);
            if (err.response?.status === 401) {
                setMfaError("Session expired. Please log in again.");
            } else if (err.response?.status === 403) {
                setMfaError("Only officers and administrators can enable MFA.");
            } else {
                setMfaError(err.response?.data?.error || "Failed to generate MFA secret. Please try again.");
            }
        } finally {
            setMfaLoading(false);
        }
    };

    const handleMfaVerify = async () => {
        if (mfaCode.length !== 6) return;
        setMfaLoading(true);
        setMfaError('');
        setMfaSuccess('');
        try {
            await axios.post(`${API_BASE}/auth/mfa/verify`, { code: mfaCode }, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                withCredentials: true
            });
            
            // Fetch fresh user data from server to get accurate mfaEnabled state
            const targetId = user._id || user.id;
            try {
                const userRes = await axios.get(`${API_BASE}/auth/user/${targetId}`);
                const latestData = { ...userRes.data, id: userRes.data._id, mfaEnabled: true };
                setUser(latestData);
                localStorage.setItem('user', JSON.stringify(latestData));
            } catch {
                const updatedUser = { ...user, mfaEnabled: true };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            setMfaSuccess(t.mfaSuccessEnable || "MFA enabled successfully!");
            setMfaSetupData(null);
            setMfaCode('');
        } catch (err) {
            console.error("MFA verify error:", err);
            if (err.response?.status === 401) {
                setMfaError("Session expired. Please log in again.");
            } else {
                setMfaError(err.response?.data?.error || t.mfaInvalid || "Invalid code. Please try again.");
            }
        } finally {
            setMfaLoading(false);
        }
    };

    const handleMfaDisable = async () => {
        if (mfaCode.length !== 6) return;
        setMfaLoading(true);
        setMfaError('');
        setMfaSuccess('');
        try {
            await axios.post(`${API_BASE}/auth/mfa/disable`, { code: mfaCode }, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                withCredentials: true
            });
            
            // Fetch fresh user data from server to get accurate mfaEnabled state
            const targetId = user._id || user.id;
            try {
                const userRes = await axios.get(`${API_BASE}/auth/user/${targetId}`);
                const latestData = { ...userRes.data, id: userRes.data._id, mfaEnabled: false };
                setUser(latestData);
                localStorage.setItem('user', JSON.stringify(latestData));
            } catch {
                const updatedUser = { ...user, mfaEnabled: false };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            setMfaSuccess(t.mfaSuccessDisable || "MFA disabled successfully!");
            setMfaCode('');
        } catch (err) {
            console.error("MFA disable error:", err);
            if (err.response?.status === 401) {
                setMfaError("Session expired. Please log in again.");
            } else {
                setMfaError(err.response?.data?.error || "Failed to disable MFA. Verify code.");
            }
        } finally {
            setMfaLoading(false);
        }
    };

    const handleProxyRegister = async (e) => {
        e.preventDefault();
        if (proxyLoading) return;
        setProxyErrors({});
        setSuccessMessage('');
        
        const normalizedProxy = {
            ...proxyData,
            fullName: proxyData.fullName.trim(),
            nic: proxyData.nic.trim().toUpperCase(),
            mobileNumber: proxyData.mobileNumber.trim(),
            password: proxyData.password,
            address: proxyData.address.trim(),
            householdNo: proxyData.householdNo.trim(),
            village: proxyData.village.trim(),
            city: proxyData.city.trim(),
            occupation: proxyData.occupation.trim(),
            email: proxyData.email ? proxyData.email.trim() : '',
            emergencyContact: proxyData.emergencyContact ? proxyData.emergencyContact.trim() : '',
            relationship: proxyData.relationship
        };
        
        let pErrors = {};
        
        if (!normalizedProxy.nic) {
            pErrors.nic = t.validation.nicRequired;
        } else if (!validateNIC(normalizedProxy.nic)) {
            pErrors.nic = t.validation.nicInvalid;
        }
        
        if (!normalizedProxy.mobileNumber) {
            pErrors.mobileNumber = t.validation.mobileRequired;
        } else if (!validatePhone(normalizedProxy.mobileNumber)) {
            pErrors.mobileNumber = t.validation.mobileInvalid;
        }
        
        if (!normalizedProxy.password) {
            pErrors.password = t.validation.passwordRequired;
        } else if (normalizedProxy.password.length < 4) {
            pErrors.password = t.validation.passwordMin;
        } else if (normalizedProxy.password.length > 20) {
            pErrors.password = t.validation.passwordMax;
        } else if (!validatePassword(normalizedProxy.password)) {
            pErrors.password = t.validation.passwordPattern;
        }
        
        if (!normalizedProxy.fullName) {
            pErrors.fullName = t.validation.fullNameRequired;
        } else if (normalizedProxy.fullName.length < 3) {
            pErrors.fullName = t.validation.fullNameMin;
        } else if (normalizedProxy.fullName.length > 100) {
            pErrors.fullName = t.validation.fullNameMax;
        } else if (!validateFullName(normalizedProxy.fullName)) {
            pErrors.fullName = t.validation.fullNamePattern;
        }
        
        // Optional fields: validate only when provided
        if (normalizedProxy.address && normalizedProxy.address.length < 5) {
            pErrors.address = t.validation.addressMin;
        } else if (normalizedProxy.address && normalizedProxy.address.length > 200) {
            pErrors.address = t.validation.addressMax;
        }
        
        if (normalizedProxy.householdNo && !validateHouseholdNo(normalizedProxy.householdNo)) {
            pErrors.householdNo = t.validation.householdPattern;
        }
        
        if (normalizedProxy.village && normalizedProxy.village.length < 2) {
            pErrors.village = t.validation.villageMin;
        } else if (normalizedProxy.village && normalizedProxy.village.length > 50) {
            pErrors.village = t.validation.villageMax;
        } else if (normalizedProxy.village && !validateVillageOrCity(normalizedProxy.village)) {
            pErrors.village = t.validation.villagePattern;
        }
        
        if (normalizedProxy.city && normalizedProxy.city.length < 2) {
            pErrors.city = t.validation.cityMin;
        } else if (normalizedProxy.city && normalizedProxy.city.length > 50) {
            pErrors.city = t.validation.cityMax;
        } else if (normalizedProxy.city && !validateVillageOrCity(normalizedProxy.city)) {
            pErrors.city = t.validation.cityPattern;
        }
        
        if (normalizedProxy.occupation && normalizedProxy.occupation.length < 2) {
            pErrors.occupation = t.validation.occupationMin;
        } else if (normalizedProxy.occupation && normalizedProxy.occupation.length > 50) {
            pErrors.occupation = t.validation.occupationMax;
        }
        
        let computedProxyAge = normalizedProxy.age;
        if (!normalizedProxy.dateOfBirth) {
            pErrors.dateOfBirth = t.validation.dobRequired;
        } else {
            const age = calculateAge(normalizedProxy.dateOfBirth);
            if (age < 18) {
                pErrors.dateOfBirth = t.validation.ageMin;
            } else if (age > 120) {
                pErrors.dateOfBirth = t.validation.ageMax;
            } else {
                computedProxyAge = age;
            }
        }
        
        if (normalizedProxy.email && !validateEmail(normalizedProxy.email)) {
            pErrors.email = t.validation.emailInvalid;
        }
        
        if (normalizedProxy.emergencyContact && !validatePhone(normalizedProxy.emergencyContact)) {
            pErrors.emergencyContact = t.validation.emergencyInvalid;
        }
        
        if (Object.keys(pErrors).length > 0) {
            setProxyErrors({
                ...pErrors,
                general: lang === 'si'
                    ? "⚠️ කරුණාකර වැරදි ඇතුළත් කිරීම් නිවැරදි කර නැවත උත්සාහ කරන්න."
                    : (lang === 'ta'
                        ? "⚠️ தவறான உள்ளீடுகளைச் சரிசெய்து மீண்டும் முயற்சிக்கவும்."
                        : "⚠️ Please correct highlighted fields and try again.")
            });
            return;
        }

        setProxyLoading(true);
        try {
            const targetId = user._id || user.id;
            if (!targetId) {
                setProxyErrors({ general: lang === 'si' ? "නිලධාරී හැඳුනුම් අංකය සොයාගත නොහැක. නැවත පිවිසෙන්න." : (lang === 'ta' ? "அதிகாரி அடையாளம் காணப்படவில்லை. மீண்டும் உள்நுழையவும்." : "Officer identity not found. Please login again.") });
                return;
            }
            
            const submitData = {
                fullName: normalizedProxy.fullName,
                nic: normalizedProxy.nic,
                password: normalizedProxy.password,
                officerId: targetId,
                role: 'citizen',
                relationship: normalizedProxy.relationship,
                age: computedProxyAge,
                address: normalizedProxy.address,
                householdNo: normalizedProxy.householdNo,
                gender: normalizedProxy.gender,
                mobileNumber: normalizedProxy.mobileNumber,
                dateOfBirth: normalizedProxy.dateOfBirth,
                village: normalizedProxy.village,
                city: normalizedProxy.city,
                occupation: normalizedProxy.occupation,
                email: normalizedProxy.email || null,
                emergencyContact: normalizedProxy.emergencyContact || null,
                agreeToTerms: proxyData.agreeToTerms,
                district: user.district || "Monaragala",
                divisionalSecretariat: user.divisionalSecretariat || "Bibile",
                gnDivision: user.gnDivision || "Kotagama"
            };
            
            console.log("Sending proxy data:", submitData);
            
            const response = await axios.post(`${API_BASE}/auth/proxy-register`, submitData, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 200 || response.status === 201) {
                setSuccessMessage(t.proxySuccess);
                setProxyData({ 
                    fullName: '', nic: '', password: '', relationship: '', age: '', 
                    address: '', householdNo: '', gender: 'Male', mobileNumber: '', 
                    occupation: '', email: '', dateOfBirth: '', village: '', city: '', 
                    emergencyContact: '', agreeToTerms: true
                });
                setTimeout(() => setSuccessMessage(''), 4000);
            }
        } catch (err) {
            console.error("Proxy Register Error:", err);
            if (err.response) {
                if (err.response.status === 400) {
                    if (err.response.data.errors) {
                        const backendErrors = {};
                        Object.keys(err.response.data.errors).forEach((key) => {
                            const message = err.response.data.errors[key];
                            backendErrors[key] = Array.isArray(message) ? message.join(', ') : String(message);
                        });
                        if (!backendErrors.general) {
                            backendErrors.general = lang === 'si'
                                ? "ලියාපදිංචිය අසාර්ථකයි. පහත දෝෂ නිවැරදි කරන්න."
                                : (lang === 'ta'
                                    ? "பதிவு தோல்வியடைந்தது. கீழே உள்ள பிழைகளை சரிசெய்யவும்."
                                    : "Registration failed. Please fix the errors below.");
                        }
                        setProxyErrors(backendErrors);
                    } else if (err.response.data.msg) {
                        if (err.response.data.msg.includes("NIC")) {
                            setProxyErrors({ nic: t.validation.nicExists });
                        } else if (err.response.data.msg.includes("mobile")) {
                            setProxyErrors({ mobileNumber: t.validation.mobileExists });
                        } else {
                            setProxyErrors({ general: err.response.data.msg });
                        }
                    } else {
                        setProxyErrors({ general: lang === 'si' ? "දත්ත සත්‍යාපනය අසාර්ථකයි. කරුණාකර සියලුම ක්ෂේත්‍ර නිවැරදිව පුරවන්න." : (lang === 'ta' ? "தரவு சரிபார்ப்பு தோல்வியுற்றது. தயவுசெய்து அனைத்து புலங்களையும் சரியாக நிரப்பவும்." : "Data validation failed. Please fill all fields correctly.") });
                    }
                } else if (err.response.status === 404) {
                    setProxyErrors({ general: lang === 'si' ? "ලියාපදිංචි කරන්නා හඳුනාගත නොහැක." : (lang === 'ta' ? "பதிவாளரை அடையாளம் காண முடியவில்லை." : "Registrar not found.") });
                } else {
                    // Surface backend details when available to help user resolve quickly
                    const backendErrors = err.response.data?.errors;
                    if (backendErrors && typeof backendErrors === 'object') {
                        const normalizedErrors = {};
                        Object.keys(backendErrors).forEach((key) => {
                            const message = backendErrors[key];
                            normalizedErrors[key] = Array.isArray(message) ? message.join(', ') : String(message);
                        });
                        setProxyErrors({
                            ...normalizedErrors,
                            general: normalizedErrors.general || err.response.data?.msg || (lang === 'si' ? "සේවාදායක දෝෂයකි. නැවත උත්සාහ කරන්න." : (lang === 'ta' ? "சேவையக பிழை. மீண்டும் முயற்சிக்கவும்." : "Server error. Please try again."))
                        });
                    } else {
                        setProxyErrors({ general: err.response.data?.msg || (lang === 'si' ? "සේවාදායක දෝෂයකි. නැවත උත්සාහ කරන්න." : (lang === 'ta' ? "சேவையக பிழை. மீண்டும் முயற்சிக்கவும்." : "Server error. Please try again.")) });
                    }
                }
            } else if (err.request) {
                setProxyErrors({ general: lang === 'si' ? `සේවාදායකයට සම්බන්ධ විය නොහැක. Backend server එක (${API_BASE}) ක්‍රියාත්මකද පරීක්ෂා කරන්න.` : (lang === 'ta' ? `சேவையகத்துடன் இணைக்க முடியவில்லை. Backend server (${API_BASE}) இயங்குகிறதா சரிபார்க்கவும்.` : `Cannot connect to server. Check whether backend server (${API_BASE}) is running.`) });
            } else {
                setProxyErrors({ general: (lang === 'si' ? "දෝෂයක් සිදුවිය: " : (lang === 'ta' ? "பிழை ஏற்பட்டது: " : "Error occurred: ")) + err.message });
            }
        } finally {
            setProxyLoading(false);
        }
    };

    const downloadQR = () => {
        const svg = document.querySelector("#qr-svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const link = document.createElement("a");
            link.download = `VILLAGEFLOW_ID_${user.nic}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handleProxyFieldChange = (field, value) => {
        setProxyData((prev) => ({ ...prev, [field]: value }));
        setProxyErrors((prev) => ({ ...prev, [field]: undefined }));

        if (field === 'fullName' && value.length > 0 && value.length < 3) {
            setProxyErrors((prev) => ({ ...prev, fullName: t.validation.fullNameMin }));
        } else if (field === 'fullName' && value.length >= 3) {
            setProxyErrors((prev) => ({ ...prev, fullName: undefined }));
        }

        if (field === 'nic' && value.length > 0 && !validateNIC(value.trim().toUpperCase())) {
            setProxyErrors((prev) => ({ ...prev, nic: t.validation.nicInvalid }));
        } else if (field === 'nic' && validateNIC(value.trim().toUpperCase())) {
            setProxyErrors((prev) => ({ ...prev, nic: undefined }));
        }
        
        if (field === 'password' && value.length > 0 && value.length < 4) {
            setProxyErrors((prev) => ({ ...prev, password: t.validation.passwordMin }));
        } else if (field === 'password' && value.length >= 4 && value.length <= 20 && validatePassword(value)) {
            setProxyErrors((prev) => ({ ...prev, password: undefined }));
        }

        if (field === 'mobileNumber' && value.length > 0 && !validatePhone(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, mobileNumber: t.validation.mobileInvalid }));
        } else if (field === 'mobileNumber' && validatePhone(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, mobileNumber: undefined }));
        }

        if (field === 'householdNo' && value.length > 0 && !validateHouseholdNo(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, householdNo: t.validation.householdPattern }));
        } else if (field === 'householdNo' && validateHouseholdNo(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, householdNo: undefined }));
        }

        if (field === 'email' && value && !validateEmail(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, email: t.validation.emailInvalid }));
        } else if (field === 'email' && (!value || validateEmail(value.trim()))) {
            setProxyErrors((prev) => ({ ...prev, email: undefined }));
        }

        if (field === 'emergencyContact' && value && !validatePhone(value.trim())) {
            setProxyErrors((prev) => ({ ...prev, emergencyContact: t.validation.emergencyInvalid }));
        } else if (field === 'emergencyContact' && (!value || validatePhone(value.trim()))) {
            setProxyErrors((prev) => ({ ...prev, emergencyContact: undefined }));
        }

        if (field === 'relationship' && !value) {
            setProxyErrors((prev) => ({ ...prev, relationship: t.validation.relationshipRequired }));
        } else if (field === 'relationship' && value) {
            setProxyErrors((prev) => ({ ...prev, relationship: undefined }));
        }

        if (field === 'agreeToTerms' && !value) {
            setProxyErrors((prev) => ({ ...prev, agreeToTerms: t.validation.termsRequired }));
        } else if (field === 'agreeToTerms' && value) {
            setProxyErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
        }
        
        if (field === 'dateOfBirth' && value) {
            const age = calculateAge(value);
            if (age < 18 && age > 0) {
                setProxyErrors((prev) => ({ ...prev, dateOfBirth: t.validation.ageMin }));
            } else if (age > 120) {
                setProxyErrors((prev) => ({ ...prev, dateOfBirth: t.validation.ageMax }));
            } else if (age >= 18 && age <= 120) {
                setProxyErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
            }
        }
    };

    return (
        <div className="profile-page" style={styles.pageBg}>
            <header className="profile-header" style={styles.header}>
                <div className="header-content" style={styles.headerContent}>
                    <div className="brand" style={styles.brand}>
                        <Landmark size={32} color="#D4AF37" />
                        <div>
                            <h2 className="gov-title" style={styles.govTitle}>GOVERNMENT OF SRI LANKA</h2>
                            <p className="portal-title" style={styles.portalTitle}>VillageFlow Identity & Social Welfare System</p>
                        </div>
                    </div>
                    <div className="header-actions" style={styles.headerActions}>
                        <button onClick={() => {localStorage.removeItem('user'); window.location.href='/login';}} className="logout-btn" style={styles.logoutBtn}>
                            <LogOut size={16} /> {t.logout}
                        </button>
                    </div>
                </div>
            </header>

            <div className="main-wrapper" style={styles.mainWrapper}>
                {successMessage && <div className="success-toast" style={styles.successToast}>{successMessage}</div>}
                
                <div className="profile-container" style={styles.container}>
                    <aside className="profile-sidebar" style={styles.sidebar}>
                        <div className="id-card" style={styles.idCard}>
                            <div className="card-header" style={styles.cardHeader}>OFFICIAL DIGITAL IDENTITY</div>
                            <div className="qr-container" style={styles.qrContainer}>
                                <QRCodeSVG 
                                    id="qr-svg" 
                                    value={`${window.location.origin}/verify/${user._id || user.id}`} 
                                    size={180} level={"H"} includeMargin={true}
                                />
                            </div>
                            <h3 className="id-name" style={styles.idName}>{user.fullName}</h3>
                            <div className="id-role-badge" style={styles.idRoleBadge}>
                                {user.role === 'officer' ? t.officer.toUpperCase() : t.citizen.toUpperCase()}
                            </div>
                            <p style={{fontSize: '13px', color: '#7f8c8d', margin: '10px 0'}}>NIC: {user.nic}</p>
                            <button onClick={downloadQR} className="download-btn" style={styles.downloadBtn}><Download size={16} /> {t.download}</button>
                            <div className="card-footer" style={styles.cardFooter}>Valid Document for Village Administration</div>
                        </div>

                        {officeInfo && (
                            <div className="office-card" style={styles.officeCard}>
                                <div className="office-header" style={styles.officeHeader}>
                                    <Shield size={18} color="#8B0000" />
                                    <h3 className="office-title" style={styles.officeTitle}>{t.officeTitle}</h3>
                                </div>
                                <div className="office-body" style={styles.officeBody}>
                                    <div className="office-item" style={styles.officeItem}><User size={14} style={styles.officeIcon} /> {officeInfo.gramaNiladhariName}</div>
                                    <div className="office-item" style={styles.officeItem}><MapPin size={14} style={styles.officeIcon} /> {officeInfo.gramaNiladhariDivision}</div>
                                    <div className="office-item" style={styles.officeItem}><Phone size={14} style={styles.officeIcon} /> {officeInfo.contactNumber}</div>
                                    <div className="office-item" style={styles.officeItem}><Clock size={14} style={styles.officeIcon} /> {officeInfo.officeHours}</div>
                                </div>
                            </div>
                        )}
                    </aside>

                    <main className="profile-content" style={styles.content}>
                        <section className="profile-section" style={styles.section}>
                            <div className="section-header" style={styles.sectionHeader}><User size={22} color="#8B0000" /> <h3>{t.profile}</h3></div>
                            
                            {isEditing ? (
                                <div className="form-grid edit-form" style={styles.formGrid}>
                                    <div className="full-width">
                                        <label className="form-label" style={styles.label}>{t.name}</label>
                                        <input className="form-input" style={{...styles.input, borderColor: errors.fullName ? '#eb4d4b' : '#dde1e7'}} value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} />
                                        {errors.fullName && <small style={{color: '#eb4d4b'}}>{errors.fullName}</small>}
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.nicLabel}</label>
                                        <input className="form-input" style={{...styles.input, borderColor: errors.nic ? '#eb4d4b' : '#dde1e7'}} value={editData.nic} onChange={e => setEditData({...editData, nic: e.target.value})} />
                                        {errors.nic && <small style={{color: '#eb4d4b'}}>{errors.nic}</small>}
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.email}</label>
                                        <input className="form-input" style={styles.input} type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.dob}</label>
                                        <input type="date" className="form-input" style={styles.input} value={editData.dateOfBirth} onChange={e => setEditData({...editData, dateOfBirth: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.mobile}</label>
                                        <input className="form-input" style={{...styles.input, borderColor: errors.mobileNumber ? '#eb4d4b' : '#dde1e7'}} value={editData.mobileNumber} onChange={e => setEditData({...editData, mobileNumber: e.target.value})} />
                                        {errors.mobileNumber && <small style={{color: '#eb4d4b'}}>{errors.mobileNumber}</small>}
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.gender}</label>
                                        <select className="form-select" style={styles.input} value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value})}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.household}</label>
                                        <input className="form-input" style={styles.input} value={editData.householdNo} onChange={e => setEditData({...editData, householdNo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="form-label" style={styles.label}>{t.occupation}</label>
                                        <input className="form-input" style={styles.input} value={editData.occupation} onChange={e => setEditData({...editData, occupation: e.target.value})} />
                                    </div>
                                    <div className="full-width">
                                        <label className="form-label" style={styles.label}>{t.address}</label>
                                        <textarea className="form-textarea" style={{...styles.input, height: '60px'}} value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
                                    </div>
                                    <div className="full-width button-group" style={{display: 'flex', gap: '10px'}}>
                                        <button onClick={handleUpdate} className="save-btn" style={styles.saveBtn} disabled={loading}>
                                            {loading ? <Loader2 className="spin" size={16}/> : <Save size={16}/>} {t.save}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="cancel-btn" style={styles.cancelBtn}><X size={16}/> {t.cancel}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-grid" style={styles.displayGrid}>
                                    <InfoItem icon={<FileText />} label={t.name} value={user.fullName} />
                                    <InfoItem icon={<Shield />} label={t.nicLabel} value={user.nic} />
                                    <InfoItem icon={<Calendar />} label={t.dob} value={user.dateOfBirth?.split('T')[0]} />
                                    <InfoItem icon={<User />} label={t.gender} value={user.gender} />
                                    <InfoItem icon={<Smartphone />} label={t.mobile} value={user.mobileNumber} />
                                    <InfoItem icon={<Mail />} label={t.email} value={user.email} />
                                    <InfoItem icon={<Home />} label={t.household} value={user.householdNo} />
                                    <InfoItem icon={<Briefcase />} label={t.occupation} value={user.occupation} />
                                    <InfoItem icon={<MapPin />} label={t.area} value={`${user.gnDivision || 'N/A'}, ${user.divisionalSecretariat || 'N/A'}`} />
                                    <InfoItem icon={<Phone />} label={t.emergency} value={user.emergencyContact} />
                                    <div className="full-width action-buttons" style={{marginTop: '20px', display: 'flex', gap: '12px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
                                        <button onClick={() => setIsEditing(true)} className="edit-btn" style={styles.editBtn}><Edit3 size={16}/> {t.edit}</button>
                                        <button className="delete-btn" style={styles.deleteBtn} onClick={handleDelete}><Trash2 size={16}/> {t.delete}</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Google Authenticator Speakeasy MFA Setup Panel */}
                        {['officer', 'admin'].includes(user.role?.toLowerCase()) && (
                            <section className="mfa-section" style={{...styles.section, marginTop: '20px'}}>
                                <div className="section-header" style={styles.sectionHeader}>
                                    <Shield size={22} color="#8B0000" />
                                    <h3>{t.mfaTitle}</h3>
                                </div>
                                
                                {mfaSuccess && (
                                    <div style={{marginBottom: '15px', padding: '12px', borderRadius: '8px', backgroundColor: '#d4edda', color: '#155724', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <CheckCircle size={18} />
                                        <span style={{ fontWeight: '500' }}>{mfaSuccess}</span>
                                    </div>
                                )}
                                
                                {mfaError && (
                                    <div style={{marginBottom: '15px', padding: '12px', borderRadius: '8px', backgroundColor: '#f8d7da', color: '#721c24', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <AlertCircle size={18} />
                                        <span style={{ fontWeight: '500' }}>{mfaError}</span>
                                    </div>
                                )}

                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div>
                                            <h4 style={{margin: '0 0 5px 0', fontSize: '15px', color: '#333'}}>Google Authenticator MFA</h4>
                                            <p style={{margin: 0, fontSize: '13px', color: '#666'}}>
                                                {user.mfaEnabled ? t.mfaStatusEnabled : t.mfaStatusDisabled}
                                            </p>
                                        </div>
                                        
                                        {!user.mfaEnabled && !mfaSetupData && (
                                            <button 
                                                onClick={handleMfaSetup} 
                                                className="edit-btn"
                                                style={{...styles.editBtn, backgroundColor: '#8B0000', color: '#fff'}}
                                                disabled={mfaLoading}
                                            >
                                                {mfaLoading ? <Loader2 className="spin" size={16}/> : null} {t.mfaEnableBtn}
                                            </button>
                                        )}
                                        
                                        {user.mfaEnabled && (
                                            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                                <input 
                                                    type="text" 
                                                    maxLength="6"
                                                    placeholder="6-digit code"
                                                    value={mfaCode}
                                                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                    style={{...styles.input, width: '120px', padding: '8px 12px', margin: 0}}
                                                />
                                                <button 
                                                    onClick={handleMfaDisable} 
                                                    className="delete-btn"
                                                    style={{...styles.deleteBtn, backgroundColor: '#eb4d4b', color: '#fff'}}
                                                    disabled={mfaLoading || mfaCode.length !== 6}
                                                >
                                                    {mfaLoading ? <Loader2 className="spin" size={16}/> : null} {t.mfaDisableBtn}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {mfaSetupData && (
                                        <div style={{borderTop: '1px dashed #ccc', paddingTop: '15px', marginTop: '5px', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
                                            <img 
                                                src={mfaSetupData.qrCode} 
                                                alt="MFA QR Code" 
                                                style={{width: '150px', height: '150px', border: '1px solid #ddd', padding: '5px', borderRadius: '4px', backgroundColor: '#fff'}}
                                            />
                                            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                                <h5 style={{margin: '0 0 5px 0', fontSize: '14px', color: '#8B0000'}}>{t.mfaSetupHeading}</h5>
                                                <p style={{margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.5'}}>
                                                    {t.mfaScanInstructions}
                                                </p>
                                                <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px'}}>
                                                    <input 
                                                        type="text" 
                                                        maxLength="6"
                                                        placeholder={t.mfaCodePlaceholder}
                                                        value={mfaCode}
                                                        onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                                        style={{...styles.input, width: '150px', padding: '8px 12px', margin: 0}}
                                                    />
                                                    <button 
                                                        onClick={handleMfaVerify} 
                                                        className="save-btn"
                                                        style={{...styles.saveBtn, padding: '8px 16px'}}
                                                        disabled={mfaLoading || mfaCode.length !== 6}
                                                    >
                                                        {mfaLoading ? <Loader2 className="spin" size={16}/> : null} {t.mfaVerifyCodeBtn}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setMfaSetupData(null);
                                                            setMfaCode('');
                                                            setMfaError('');
                                                            setMfaSuccess('');
                                                        }} 
                                                        className="cancel-btn"
                                                        style={{...styles.cancelBtn, padding: '8px 16px'}}
                                                    >
                                                        {t.cancel}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <section className="proxy-section" style={styles.section}>
                            <div className="section-header" style={styles.sectionHeader}><UserPlus size={22} color="#8B0000" /> <h3>{t.proxy}</h3></div>
                            
                            <div className="location-box" style={{...styles.locationBox, marginBottom: '20px'}}>
                                <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#8B0000'}}>
                                    📍 {lang === 'si' ? 'නිලධාරියාගේ ප්‍රදේශය' : (lang === 'ta' ? 'அதிகாரியின் பகுதி' : 'Officer\'s Location')}
                                </h4>
                                <div className="location-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px'}}>
                                    <div style={styles.locationItem}><strong>{t.district}:</strong> {user.district || 'Monaragala'}</div>
                                    <div style={styles.locationItem}><strong>{t.ds}:</strong> {user.divisionalSecretariat || 'Bibile'}</div>
                                    <div style={styles.locationItem}><strong>{t.gn}:</strong> {user.gnDivision || 'Kotagama'}</div>
                                </div>
                                <p style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                                    {lang === 'si' ? '※ මෙම ප්‍රදේශය සඳහා පමණක් ලියාපදිංචි කළ හැක' : (lang === 'ta' ? '※ இந்த பகுதிக்கு மட்டுமே பதிவு செய்ய முடியும்' : '※ Can only register for this area')}
                                </p>
                            </div>
                            
                            <form onSubmit={handleProxyRegister} className="proxy-form" style={styles.formGrid}>
                                <div className="full-width">
                                    <label className="form-label" style={styles.label}>{t.name} *</label>
                                    <input required minLength={3} maxLength={100} className="proxy-input" style={{...styles.input, borderColor: proxyErrors.fullName ? '#eb4d4b' : '#dde1e7'}} value={proxyData.fullName} onChange={e => handleProxyFieldChange('fullName', e.target.value)} placeholder={lang === 'si' ? 'උදා: සමන් පෙරේරා' : (lang === 'ta' ? 'எ.கா: சமன் பெரேரா' : 'Eg: Saman Perera')} />
                                    {proxyErrors.fullName && <small style={{color: '#eb4d4b'}}>{proxyErrors.fullName}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.nicLabel} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.nic ? '#eb4d4b' : '#dde1e7'}} value={proxyData.nic} onChange={e => handleProxyFieldChange('nic', e.target.value.toUpperCase())} placeholder="199012345678 හෝ 912345678V" />
                                    {proxyErrors.nic && <small style={{color: '#eb4d4b'}}>{proxyErrors.nic}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.passLabel} *</label>
                                    <input type="password" required minLength={4} maxLength={20} className="proxy-input" style={{...styles.input, borderColor: proxyErrors.password ? '#eb4d4b' : '#dde1e7'}} value={proxyData.password} onChange={e => handleProxyFieldChange('password', e.target.value)} placeholder={lang === 'si' ? 'අවම වශයෙන් අකුරු 4ක්' : (lang === 'ta' ? 'குறைந்தது 4 எழுத்துகள்' : 'Minimum 4 characters')} />
                                    {proxyErrors.password && <small style={{color: '#eb4d4b'}}>{proxyErrors.password}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.relLabel} *</label>
                                    <select required className="proxy-select" style={{...styles.input, borderColor: proxyErrors.relationship ? '#eb4d4b' : '#dde1e7'}} value={proxyData.relationship} onChange={e => handleProxyFieldChange('relationship', e.target.value)}>
                                        <option value="">-- {lang === 'si' ? 'තෝරන්න' : (lang === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select')} --</option>
                                        <option value="Mother">{lang === 'si' ? 'මව' : (lang === 'ta' ? 'தாய்' : 'Mother')}</option>
                                        <option value="Father">{lang === 'si' ? 'පියා' : (lang === 'ta' ? 'தந்தை' : 'Father')}</option>
                                        <option value="Son">{lang === 'si' ? 'පුතා' : (lang === 'ta' ? 'மகன்' : 'Son')}</option>
                                        <option value="Daughter">{lang === 'si' ? 'දුව' : (lang === 'ta' ? 'மகள்' : 'Daughter')}</option>
                                        <option value="Brother">{lang === 'si' ? 'සහෝදරයා' : (lang === 'ta' ? 'சகோதரர்' : 'Brother')}</option>
                                        <option value="Sister">{lang === 'si' ? 'සහෝදරිය' : (lang === 'ta' ? 'சகோதரி' : 'Sister')}</option>
                                        <option value="Spouse">{lang === 'si' ? 'කලත්‍රයා' : (lang === 'ta' ? 'துணைவர்' : 'Spouse')}</option>
                                        <option value="Relative">{lang === 'si' ? 'ඥාතියෙකු' : (lang === 'ta' ? 'உறவினர்' : 'Relative')}</option>
                                    </select>
                                    {proxyErrors.relationship && <small style={{color: '#eb4d4b'}}>{proxyErrors.relationship}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.dob} *</label>
                                    <input type="date" required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.dateOfBirth ? '#eb4d4b' : '#dde1e7'}} value={proxyData.dateOfBirth} onChange={e => handleProxyFieldChange('dateOfBirth', e.target.value)} />
                                    {proxyErrors.dateOfBirth && <small style={{color: '#eb4d4b'}}>{proxyErrors.dateOfBirth}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.mobile} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.mobileNumber ? '#eb4d4b' : '#dde1e7'}} value={proxyData.mobileNumber} onChange={e => handleProxyFieldChange('mobileNumber', e.target.value.replace(/[^\d+]/g, ''))} placeholder="0712345678" />
                                    {proxyErrors.mobileNumber && <small style={{color: '#eb4d4b'}}>{proxyErrors.mobileNumber}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.gender} *</label>
                                    <select className="proxy-select" style={styles.input} value={proxyData.gender} onChange={e => handleProxyFieldChange('gender', e.target.value)}>
                                        <option value="Male">{lang === 'si' ? 'පිරිමි' : (lang === 'ta' ? 'ஆண்' : 'Male')}</option>
                                        <option value="Female">{lang === 'si' ? 'ගැහැණු' : (lang === 'ta' ? 'பெண்' : 'Female')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.household} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.householdNo ? '#eb4d4b' : '#dde1e7'}} value={proxyData.householdNo} onChange={e => handleProxyFieldChange('householdNo', e.target.value)} placeholder={lang === 'si' ? 'උදා: 123/B' : (lang === 'ta' ? 'எ.கா: 123/B' : 'Eg: 123/B')} />
                                    {proxyErrors.householdNo && <small style={{color: '#eb4d4b'}}>{proxyErrors.householdNo}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.village} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.village ? '#eb4d4b' : '#dde1e7'}} value={proxyData.village} onChange={e => handleProxyFieldChange('village', e.target.value)} placeholder={lang === 'si' ? 'උදා: කොටගම' : (lang === 'ta' ? 'எ.கா: கொட்டகம' : 'Eg: Kotagama')} />
                                    {proxyErrors.village && <small style={{color: '#eb4d4b'}}>{proxyErrors.village}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.city} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.city ? '#eb4d4b' : '#dde1e7'}} value={proxyData.city} onChange={e => handleProxyFieldChange('city', e.target.value)} placeholder={lang === 'si' ? 'උදා: බිබිලේ' : (lang === 'ta' ? 'எ.கா: பிபிலே' : 'Eg: Bibile')} />
                                    {proxyErrors.city && <small style={{color: '#eb4d4b'}}>{proxyErrors.city}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.occupation} *</label>
                                    <input required className="proxy-input" style={{...styles.input, borderColor: proxyErrors.occupation ? '#eb4d4b' : '#dde1e7'}} value={proxyData.occupation} onChange={e => handleProxyFieldChange('occupation', e.target.value)} placeholder={lang === 'si' ? 'උදා: ගොවියා, වෙළෙන්දා' : (lang === 'ta' ? 'எ.கா: விவசாயி, வியாபாரி' : 'Eg: Farmer, Merchant')} />
                                    {proxyErrors.occupation && <small style={{color: '#eb4d4b'}}>{proxyErrors.occupation}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.email}</label>
                                    <input className="proxy-input" style={{...styles.input, borderColor: proxyErrors.email ? '#eb4d4b' : '#dde1e7'}} value={proxyData.email} onChange={e => handleProxyFieldChange('email', e.target.value)} placeholder="example@email.com" />
                                    {proxyErrors.email && <small style={{color: '#eb4d4b'}}>{proxyErrors.email}</small>}
                                </div>
                                <div>
                                    <label className="form-label" style={styles.label}>{t.emergency}</label>
                                    <input className="proxy-input" style={{...styles.input, borderColor: proxyErrors.emergencyContact ? '#eb4d4b' : '#dde1e7'}} value={proxyData.emergencyContact} onChange={e => handleProxyFieldChange('emergencyContact', e.target.value)} placeholder="0712345678" />
                                    {proxyErrors.emergencyContact && <small style={{color: '#eb4d4b'}}>{proxyErrors.emergencyContact}</small>}
                                </div>
                                <div className="full-width">
                                    <label style={{...styles.checkboxLabel}}>
                                        <input type="checkbox" checked={proxyData.agreeToTerms} onChange={e => handleProxyFieldChange('agreeToTerms', e.target.checked)} />
                                        <span style={{fontSize: '13px'}}>{lang === 'si' ? 'මම නියමයන් හා කොන්දේසි වලට එකඟ වෙමි *' : (lang === 'ta' ? 'நான் விதிமுறைகளை ஏற்கிறேன் *' : 'I agree to the terms and conditions *')}</span>
                                    </label>
                                    {proxyErrors.agreeToTerms && <small style={{color: '#eb4d4b'}}>{proxyErrors.agreeToTerms}</small>}
                                </div>
                                <button type="submit" className="proxy-submit-btn" style={styles.proxyBtn} disabled={proxyLoading}>
                                    {proxyLoading ? <Loader2 size={18} className="spin" /> : <Award size={18} />} {t.regBtn}
                                </button>
                                {proxyErrors.general && <div className="full-width error-general" style={{color: '#eb4d4b', textAlign: 'center', marginTop: '10px', padding: '10px', background: '#ffebee', borderRadius: '6px'}}>{proxyErrors.general}</div>}
                            </form>
                        </section>
                    </main>
                </div>
            </div>
            <style>
                {`
                    .spin { animation: rotation 2s infinite linear; } 
                    @keyframes rotation { from { transform: rotate(0deg); } to { transform: rotate(359deg); } } 
                    .full-width { grid-column: 1 / -1; }
                    
                    /* Hover Effects */
                    .download-btn:hover, .save-btn:hover, .proxy-submit-btn:hover {
                        transform: translateY(-2px);
                        transition: all 0.3s ease;
                    }
                    .edit-btn:hover, .cancel-btn:hover {
                        background-color: #e0e0e0 !important;
                        transition: all 0.3s ease;
                    }
                    .delete-btn:hover {
                        background-color: #c0392b !important;
                        transition: all 0.3s ease;
                    }
                    .logout-btn:hover {
                        background-color: rgba(255,255,255,0.2) !important;
                        transition: all 0.3s ease;
                    }
                    .form-input:focus, .form-select:focus, .form-textarea:focus, .proxy-input:focus, .proxy-select:focus {
                        border-color: #8B0000 !important;
                        outline: none !important;
                        box-shadow: 0 0 0 3px rgba(128, 0, 0, 0.1) !important;
                        background-color: #fff !important;
                    }
                    .lang-bar span:hover {
                        color: #D4AF37 !important;
                        transition: all 0.3s ease;
                    }
                    
                    /* Mobile Responsive */
                    @media (max-width: 900px) {
                        .profile-container {
                            grid-template-columns: 1fr !important;
                            gap: 20px !important;
                        }
                        .profile-sidebar {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 15px !important;
                        }
                        .header-content {
                            flex-direction: column !important;
                            gap: 15px !important;
                            text-align: center !important;
                        }
                        .brand {
                            justify-content: center !important;
                        }
                        .header-actions {
                            justify-content: center !important;
                        }
                        .info-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .form-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .proxy-form {
                            grid-template-columns: 1fr !important;
                        }
                        .location-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .profile-sidebar {
                            grid-template-columns: 1fr !important;
                        }
                        .id-card .qr-container svg {
                            width: 150px !important;
                            height: 150px !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .main-wrapper {
                            padding: 20px 12px !important;
                        }
                        .profile-header {
                            padding: 16px 0 !important;
                        }
                        .header-actions {
                            flex-direction: column !important;
                            gap: 12px !important;
                            width: 100% !important;
                        }
                        .lang-bar {
                            justify-content: center !important;
                            flex-wrap: wrap !important;
                            gap: 10px !important;
                        }
                        .logout-btn {
                            width: 100% !important;
                            justify-content: center !important;
                        }
                        .profile-container {
                            gap: 16px !important;
                        }
                        .profile-sidebar {
                            gap: 16px !important;
                        }
                        .id-card, .office-card {
                            border-radius: 14px !important;
                        }
                        .profile-section, .proxy-section {
                            padding: 16px !important;
                        }
                        .section-header h3 {
                            font-size: 16px !important;
                        }
                        .id-name {
                            font-size: 18px !important;
                        }
                        .gov-title {
                            font-size: 12px !important;
                        }
                        .portal-title {
                            font-size: 10px !important;
                        }
                        .lang-bar span {
                            font-size: 11px !important;
                        }
                        .logout-btn { padding: 10px 12px !important; font-size: 12px !important; }
                        .form-input, .form-select, .form-textarea, .proxy-input, .proxy-select {
                            padding: 8px 10px !important;
                            font-size: 14px !important;
                        }
                        .save-btn, .cancel-btn, .edit-btn, .delete-btn {
                            padding: 8px 16px !important;
                            font-size: 12px !important;
                        }
                    }
                    
                    @media (min-width: 901px) {
                        .profile-container {
                            grid-template-columns: 320px 1fr !important;
                            gap: 40px !important;
                        }
                        .info-grid {
                            grid-template-columns: 1fr 1fr !important;
                        }
                        .form-grid {
                            grid-template-columns: 1fr 1fr !important;
                        }
                        .proxy-form {
                            grid-template-columns: 1fr 1fr !important;
                        }
                        .location-grid {
                            grid-template-columns: 1fr 1fr 1fr !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

const InfoItem = ({ icon, label, value }) => (
    <div style={styles.infoItem}>
        <div style={styles.infoIcon}>{React.cloneElement(icon, { size: 16 })}</div>
        <div>
            <div style={styles.infoLabel}>{label}</div>
            <div style={styles.infoValue}>{value || 'Not Provided'}</div>
        </div>
    </div>
);

const styles = {
    pageBg: { minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Inter', sans-serif" },
    header: { background: '#8B0000', color: 'white', padding: '20px 0', borderBottom: '5px solid #D4AF37' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
    brand: { display: 'flex', alignItems: 'center', gap: '15px' },
    govTitle: { fontSize: '16px', fontWeight: '900', color: '#D4AF37', margin: 0, letterSpacing: '1px' },
    portalTitle: { fontSize: '12px', margin: 0, opacity: 0.9 },
    headerActions: { display: 'flex', alignItems: 'center', gap: '25px' },
    langBar: { display: 'flex', gap: '15px' },
    langBtn: { fontSize: '13px', cursor: 'pointer', opacity: 0.6, transition: '0.3s' },
    activeLang: { fontSize: '13px', fontWeight: 'bold', color: '#D4AF37', borderBottom: '2px solid #D4AF37' },
    logoutBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
    mainWrapper: { padding: '40px 20px' },
    container: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: '40px' },
    sidebar: { display: 'flex', flexDirection: 'column', gap: '25px' },
    idCard: { background: 'white', borderRadius: '12px', textAlign: 'center', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e0e0e0' },
    cardHeader: { background: '#1a1a1a', color: '#D4AF37', padding: '12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' },
    qrContainer: { padding: '25px', background: '#f8f9fa', display: 'flex', justifyContent: 'center' },
    idName: { fontSize: '20px', fontWeight: 'bold', margin: '15px 0 5px 0', color: '#2d3436' },
    idRoleBadge: { display: 'inline-block', background: '#8B0000', color: 'white', padding: '5px 15px', borderRadius: '50px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' },
    downloadBtn: { width: '80%', margin: '20px auto', padding: '12px', background: '#2d3436', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s' },
    cardFooter: { padding: '10px', background: '#D4AF37', color: '#8B0000', fontSize: '10px', fontWeight: 'bold' },
    section: { background: 'white', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #eaeaea' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', borderBottom: '2px solid #f0f2f5', paddingBottom: '15px' },
    displayGrid: { display: 'grid', gap: '25px' },
    formGrid: { display: 'grid', gap: '20px' },
    infoItem: { display: 'flex', gap: '15px', alignItems: 'flex-start' },
    infoIcon: { color: '#8B0000', marginTop: '4px', opacity: 0.8 },
    infoLabel: { fontSize: '11px', color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase' },
    infoValue: { fontSize: '14px', color: '#2c3e50', fontWeight: '500' },
    input: { width: '100%', padding: '12px', border: '1px solid #dde1e7', borderRadius: '8px', fontSize: '14px', background: '#fcfcfc', transition: '0.3s', boxSizing: 'border-box' },
    label: { fontSize: '12px', fontWeight: '700', color: '#4b4b4b', marginBottom: '8px', display: 'block' },
    saveBtn: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    cancelBtn: { background: '#f1f2f6', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', color: '#2f3640', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    editBtn: { background: '#f1f2f6', border: '1px solid #dcdde1', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', color: '#2f3640', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    deleteBtn: { background: '#eb4d4b', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    proxyBtn: { background: '#1e272e', color: 'white', border: 'none', padding: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' },
    officeCard: { background: 'white', borderRadius: '12px', padding: '20px', borderLeft: '6px solid #8B0000', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    officeHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
    officeTitle: { fontSize: '14px', fontWeight: 'bold', color: '#8B0000', margin: 0 },
    officeItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#57606f', marginTop: '12px' },
    officeIcon: { opacity: 0.7 },
    successToast: { position: 'fixed', top: '30px', right: '30px', background: '#2ecc71', color: 'white', padding: '15px 30px', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 9999 },
    locationBox: { background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' },
    locationItem: { fontSize: '13px', padding: '5px 0' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }
};

export default Profile;
