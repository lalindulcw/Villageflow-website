const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

//  JWT Secret & Official Key
const JWT_SECRET = process.env.JWT_SECRET || "SL_GOV_VILLAGE_FLOW_2026";
const OFFICIAL_KEY = "SL-GOV-2026";

//  Helper: Age calculation from Date of Birth
const calculateAge = (dob) => {
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

//  Helper: NIC validation (old & new)
const validateNIC = (nic) => {
    const oldNicPattern = /^[0-9]{9}[VXvx]$/;
    const newNicPattern = /^[0-9]{12}$/;
    return oldNicPattern.test(nic) || newNicPattern.test(nic);
};

//  Helper: Mobile number validation (Sri Lanka)
const validateMobile = (mobile) => {
    const mobilePattern = /^(\+94|0)?[0-9]{9,10}$/;
    return mobilePattern.test(mobile);
};

//  Validation Function 
const validateUserData = (data, isProxy = false) => {
    const { 
        fullName, nic, password, district, divisionalSecretariat, gnDivision,
        mobileNumber, dateOfBirth, email, agreeToTerms, role,
        village, city, householdNo, occupation
    } = data;
    let errors = {};

    // Common required fields
    if (!fullName) errors.fullName = "සම්පූර්ණ නම ඇතුළත් කරන්න.";
    if (!nic) errors.nic = "NIC අංකය ඇතුළත් කරන්න.";
    else if (!validateNIC(nic)) errors.nic = "අවලංගු NIC අංකයකි.";
    
    if (!password) errors.password = "මුරපදයක් ඇතුළත් කරන්න.";
    else if (password.length < 4) errors.password = "මුරපදය කෙටියි.";

    if (!mobileNumber) errors.mobileNumber = "ජංගම දුරකථන අංකය ඇතුළත් කරන්න.";
    else if (!validateMobile(mobileNumber)) errors.mobileNumber = "අවලංගු දුරකථන අංකයකි.";

    if (!dateOfBirth) errors.dateOfBirth = "උපන් දිනය ඇතුළත් කරන්න.";
    else {
        const age = calculateAge(dateOfBirth);
        if (age < 18) errors.dateOfBirth = "අවම වයස අවුරුදු 18 ක් විය යුතුයි.";
    }

    // Email validation
    if (!email && !isProxy) errors.email = "විද්‍යුත් තැපෑල ඇතුළත් කරන්න.";
    else if (email && !/\S+@\S+\.\S+/.test(email)) errors.email = "වලංගු විද්‍යුත් තැපෑලක් නොවේ.";

    // Terms check - Only for direct signup
    if (!isProxy && !agreeToTerms) errors.agreeToTerms = "නියමයන් හා කොන්දේසි වලට එකඟ විය යුතුයි.";

    // Location restrictions 
    if (!isProxy) {
        if (!district || district.toLowerCase() !== "monaragala") 
            errors.district = "මොනරාගල දිස්ත්‍රික්කයට පමණක් සීමා වේ.";
        if (!divisionalSecretariat || divisionalSecretariat.toLowerCase() !== "bibile") 
            errors.divisionalSecretariat = "බිබිලේ ප්‍රා.ලේ. කොට්ඨාසයට පමණක් සීමා වේ.";
        if (!gnDivision || gnDivision.toLowerCase() !== "kotagama") 
            errors.gnDivision = "කොටගම වසමට පමණක් සීමා වේ.";
    }

    // Citizen-specific fields 
    if (role === 'citizen' && !isProxy) {
        if (!village) errors.village = "ගම/වීදිය ඇතුළත් කරන්න.";
        if (!city) errors.city = "නගරය ඇතුළත් කරන්න.";
        if (!householdNo) errors.householdNo = "ගෘහ මූලික අංකය ඇතුළත් කරන්න.";
        if (!occupation) errors.occupation = "රැකියාව ඇතුළත් කරන්න.";
    }
    
    return errors;
};

router.post('/register', [
    body('fullName').trim().escape(),
    body('nic').trim().toUpperCase().escape(),
    body('email').trim().normalizeEmail(),
    body('mobileNumber').trim().escape(),
    body('password').trim().escape(),
    body('village').trim().escape(),
    body('city').trim().escape(),
    body('householdNo').trim().escape(),
    body('occupation').trim().escape(),
    body('district').trim().escape(),
    body('divisionalSecretariat').trim().escape(),
    body('gnDivision').trim().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ errors: { general: "අවලංගු දත්ත ආකෘතියකි." } });
    }

    const errors = validateUserData(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    try {
        const { 
            fullName, nic, email, password, role, 
            district, divisionalSecretariat, gnDivision, securityKey,
            age, address, householdNo, gender, mobileNumber, dateOfBirth,
            village, city, occupation, emergencyContact, agreeToTerms
        } = req.body;
        
        let user = await User.findOne({ nic });
        if (user) return res.status(400).json({ errors: { nic: "මෙම NIC අංකය දැනටමත් ඇත." } });

        if (role === 'officer' && securityKey !== OFFICIAL_KEY) {
            return res.status(400).json({ errors: { securityKey: "වැරදි ආරක්ෂිත කේතයකි!" } });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const finalAge = age || calculateAge(dateOfBirth);

        const newUser = new User({ 
            fullName, nic, email, password: hashedPassword, role, 
            district, divisionalSecretariat, gnDivision,
            age: finalAge, address, householdNo, gender, mobileNumber,
            dateOfBirth, village, city, occupation,
            emergencyContact: emergencyContact || null,
            agreedToTerms: agreeToTerms || false
        });

        await newUser.save();
        logger.info("New citizen registered successfully:", { nic: newUser.nic, role: newUser.role });
        res.status(201).json({ msg: 'ලියාපදිංචිය සාර්ථකයි!' });
    } catch (err) {
        logger.error("Register Error:", { error: err.message });
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/proxy-register', auth, auth.authorize(['officer', 'admin']), [
    body('fullName').trim().escape(),
    body('nic').trim().toUpperCase().escape(),
    body('mobileNumber').trim().escape(),
    body('password').trim().escape(),
    body('village').trim().escape(),
    body('city').trim().escape(),
    body('householdNo').trim().escape(),
    body('occupation').trim().escape(),
    body('district').trim().escape(),
    body('divisionalSecretariat').trim().escape(),
    body('gnDivision').trim().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ errors: { general: "අවලංගු දත්ත ආකෘතියකි." } });
    }

    logger.info('[PROXY] Register attempt for NIC:', { officerId: req.user.id, targetNic: req.body?.nic });
    const errors = validateUserData(req.body, true);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    try {
        const { 
            fullName, nic, password, officerId, relationship, 
            age, address, householdNo, gender, mobileNumber, dateOfBirth,
            village, city, occupation, emergencyContact, district, divisionalSecretariat, gnDivision
        } = req.body;

        const normalizedNic = (nic || '').trim().toUpperCase();
        const normalizedMobile = (mobileNumber || '').trim();
        const normalizedName = (fullName || '').trim();

        let user = await User.findOne({ nic: normalizedNic });
        if (user) return res.status(400).json({ errors: { nic: "මෙම පුද්ගලයා දැනටමත් ලියාපදිංචි කර ඇත." } });

        const creator = await User.findById(officerId || req.user.id);
        if (!creator) return res.status(404).json({ msg: "ලියාපදිංචි කරන්නා හඳුනාගත නොහැක." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName: normalizedName,
            nic: normalizedNic,
            email: `proxy_${normalizedNic}@villageflow.lk`, 
            password: hashedPassword, 
            role: 'citizen',
            relationship: relationship || null, 
            age: age || calculateAge(dateOfBirth), 
            address: address || null,
            householdNo: householdNo || null,
            gender: gender || null,
            mobileNumber: normalizedMobile,
            dateOfBirth,
            village: village || null,
            city: city || null,
            occupation: occupation || null,
            emergencyContact: emergencyContact || null,
            agreedToTerms: true, // Proxy registers are pre-agreed by officer
            district: district || creator.district || 'Monaragala',
            divisionalSecretariat: divisionalSecretariat || creator.divisionalSecretariat || 'Bibile',
            gnDivision: gnDivision || creator.gnDivision || 'Kotagama',
            createdBy: creator._id 
        });

        await newUser.save();
        logger.info('[PROXY] Register success for NIC:', { targetNic: normalizedNic, officerId: creator.id });
        res.json({ msg: 'ලියාපදිංචිය සාර්ථකයි!' });
    } catch (err) {
        logger.error("Proxy Register Error:", { error: err.message });
        if (err.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(err.errors || {}).forEach((key) => {
                validationErrors[key] = err.errors[key].message || 'Invalid value';
            });
            return res.status(400).json({ errors: validationErrors });
        }
        if (err.code === 11000) {
            if (err.keyPattern?.nic) return res.status(400).json({ errors: { nic: "මෙම NIC අංකය දැනටමත් ඇත." } });
            if (err.keyPattern?.email) return res.status(400).json({ errors: { email: "මෙම විද්‍යුත් තැපෑල දැනටමත් ඇත." } });
        }
        res.status(500).json({ msg: 'දෝෂයක් සිදුවිය.', error: err.message });
    }
});

router.get('/citizens', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const citizens = await User.find({ role: 'citizen' }).select('-password').sort({ createdAt: -1 });
        res.json(citizens);
    } catch (err) {
        logger.error("Fetch Citizens Error:", { error: err.message });
        res.status(500).json({ msg: "දත්ත ලබාගැනීම අසාර්ථකයි." });
    }
});

router.post('/login', [
    body('nic').trim().toUpperCase().escape(),
    body('password').trim().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ errors: { nic: "අවලංගු NIC හෝ මුරපදයකි", password: "අවලංගු NIC හෝ මුරපදයකි" } });
    }

    const { nic, password } = req.body;
    try {
        let user = await User.findOne({ nic });
        
        // Return identical generic error on either user missing or password mismatch to prevent user enumeration
        const genericError = "ඇතුළත් කළ NIC අංකය හෝ මුරපදය වැරදියි.";
        if (!user) {
            logger.warn("Failed login attempt - User not found:", { nic });
            return res.status(400).json({ errors: { nic: genericError, password: genericError } });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn("Failed login attempt - Incorrect password:", { nic });
            return res.status(400).json({ errors: { nic: genericError, password: genericError } });
        }

        // If MFA is enabled on this user, require verification code instead of issuing JWT
        if (user.mfaEnabled) {
            logger.info("MFA code required for user login:", { userId: user.id });
            return res.json({ mfaRequired: true, userId: user.id });
        }

        const payload = {
            user: { id: user.id, role: user.role }
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // Save refresh token to DB
        user.refreshToken = refreshToken;
        await user.save();

        // Set HttpOnly refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        logger.info("User logged in successfully:", { userId: user.id, role: user.role });
        res.json({ 
            token: accessToken, 
            user: {
                _id: user.id,
                fullName: user.fullName,
                nic: user.nic,
                email: user.email,
                role: user.role,
                mobileNumber: user.mobileNumber,
                dateOfBirth: user.dateOfBirth,
                village: user.village,
                city: user.city,
                householdNo: user.householdNo,
                occupation: user.occupation,
                emergencyContact: user.emergencyContact,
                address: user.address,
                gender: user.gender,
                age: user.age,
                district: user.district,
                divisionalSecretariat: user.divisionalSecretariat,
                gnDivision: user.gnDivision,
                mfaEnabled: user.mfaEnabled || false
            }
        });
    } catch (err) {
        logger.error("Login Error:", { error: err.message });
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.put('/update/:id', auth, [
    body('fullName').optional().trim().escape(),
    body('mobileNumber').optional().trim().escape(),
    body('village').optional().trim().escape(),
    body('city').optional().trim().escape(),
    body('householdNo').optional().trim().escape(),
    body('occupation').optional().trim().escape(),
    body('address').optional().trim().escape(),
    body('gender').optional().trim().escape(),
    body('emergencyContact').optional().trim().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ errors: { general: "අවලංගු දත්ත ආකෘතියකි." } });
    }

    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'officer') {
            return res.status(403).json({ msg: "මෙම ක්‍රියාව සඳහා අවසර නැත - Access Denied" });
        }

        const { 
            fullName, age, address, householdNo, gender, mobileNumber,
            dateOfBirth, village, city, occupation, emergencyContact
        } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (age) updateData.age = age;
        if (address) updateData.address = address;
        if (householdNo) updateData.householdNo = householdNo;
        if (gender) updateData.gender = gender;
        if (mobileNumber) updateData.mobileNumber = mobileNumber;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        if (village) updateData.village = village;
        if (city) updateData.city = city;
        if (occupation) updateData.occupation = occupation;
        if (emergencyContact) updateData.emergencyContact = emergencyContact;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, 
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: "පරිශීලකයා හමු නොවීය." });
        }

        logger.info("User profile updated:", { userId: updatedUser.id, updatedBy: req.user.id });
        res.json({ user: updatedUser });
    } catch (err) {
        logger.error("Update Error:", { error: err.message });
        res.status(500).json({ msg: "Update failed" });
    }
});
router.delete('/delete/:id', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin' && req.user.role !== 'officer') {
            return res.status(403).json({ msg: "මෙම ක්‍රියාව සඳහා අවසර නැත - Access Denied" });
        }
        await User.findByIdAndDelete(req.params.id);
        logger.info("User account deleted:", { targetId: req.params.id, deletedBy: req.user.id });
        res.json({ msg: "සාර්ථකව ඉවත් කරන ලදී." });
    } catch (err) {
        logger.error("Delete Error:", { error: err.message });
        res.status(500).json({ msg: "Delete failed" });
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid user identifier format" });
        }

        const user = await User.findById(req.params.id).select('-password -mfaSecret -refreshToken'); 
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // If the request comes from a browser (not a JSON request), return a pretty HTML page
        const acceptHeader = req.headers.accept || '';
        const isJsonRequest = acceptHeader.includes('application/json');
        const isBrowser = !isJsonRequest && (acceptHeader.includes('text/html') || acceptHeader.includes('*/*'));
        
        if (isBrowser && !req.xhr && !req.headers['x-requested-with']) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>VillageFlow - Identity Verified</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; color: white; }
                        .card { background: #1e293b; padding: 2.5rem; borderRadius: 32px; boxShadow: 0 20px 50px rgba(0,0,0,0.5); width: 90%; max-width: 400px; textAlign: center; border: 1px solid rgba(255,255,255,0.1); }
                        .status-badge { display: inline-block; padding: 0.6rem 1.2rem; background: #065f46; color: #34d399; borderRadius: 50px; fontSize: 0.8rem; fontWeight: 800; marginBottom: 1.5rem; letterSpacing: 1px; }
                        .avatar { width: 100px; height: 100px; background: linear-gradient(135deg, #800000, #b91c1c); borderRadius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: white; fontSize: 2.5rem; fontWeight: bold; boxShadow: 0 10px 20px rgba(128,0,0,0.3); }
                        h1 { margin: 0; fontSize: 1.8rem; fontWeight: 800; }
                        p { color: #94a3b8; margin: 0.5rem 0; fontSize: 1.1rem; }
                        .details { marginTop: 2rem; paddingTop: 2rem; borderTop: 1px solid rgba(255,255,255,0.1); display: grid; gap: 1rem; }
                        .detail-item { display: flex; justifyContent: space-between; fontSize: 0.9rem; }
                        .label { color: #64748b; fontWeight: 600; }
                        .val { color: #f1f5f9; fontWeight: 700; }
                        .footer { marginTop: 2.5rem; fontSize: 0.75rem; color: #475569; letterSpacing: 0.5px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="status-badge">✓ REGISTERED CITIZEN</div>
                        <div class="avatar">${user.fullName.charAt(0)}</div>
                        <h1>${user.fullName}</h1>
                        <p>${user.gnDivision} Division</p>
                        
                        <div class="details">
                            <div class="detail-item"><span class="label">NIC</span> <span class="val">${user.nic}</span></div>
                            <div class="detail-item"><span class="label">STATUS</span> <span class="val" style="color: #34d399">ACTIVE</span></div>
                        </div>
                        
                        <div class="footer">OFFICIAL VILLAGEFLOW IDENTITY PORTAL</div>
                    </div>
                </body>
                </html>
            `);
        }

        res.json(user);
    } catch (err) {
        logger.error("QR Verification API Error:", { error: err.message });
        res.status(500).json({ msg: "Server Error" });
    }
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.signedCookies?.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await User.findById(decoded.user.id);
        
        if (!user || user.refreshToken !== refreshToken) {
            logger.warn("Invalid refresh token attempt or token revoked:", { userId: decoded.user?.id });
            return res.status(401).json({ error: "Session expired or invalid refresh token" });
        }

        const payload = {
            user: { id: user.id, role: user.role }
        };
        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        
        res.json({ token: newAccessToken });
    } catch (err) {
        logger.error("Token refresh failed:", { error: err.message });
        return res.status(401).json({ error: "Invalid refresh token" });
    }
});

router.post('/logout', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        res.clearCookie('refreshToken');
        res.json({ success: true, msg: "Logged out successfully" });
    } catch (err) {
        logger.error("Logout error:", { error: err.message });
        res.status(500).json({ error: "Server error during logout" });
    }
});

router.post('/mfa/setup', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Enforce role permission - Speakeasy MFA (Officer/Admin සඳහා)
        if (!['officer', 'admin'].includes(user.role)) {
            return res.status(403).json({ error: "Only officers and administrators can enable MFA" });
        }

        const secret = speakeasy.generateSecret({
            name: `VillageFlow:${user.nic}`
        });

        // Store temporary secret until verified
        user.mfaSecret = secret.base32;
        await user.save();

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
    } catch (err) {
        logger.error("MFA Setup error:", { error: err.message });
        res.status(500).json({ error: "MFA Setup failed" });
    }
});

router.post('/mfa/verify', auth, [
    body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ error: "අවලංගු කේතයකි." });
    }

    const { code } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.mfaSecret) {
            return res.status(400).json({ error: "MFA has not been set up yet." });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 1 // Allow slightly out-of-sync clocks
        });

        if (!verified) {
            return res.status(400).json({ error: "වැරදි කේතයකි. කරුණාකර නැවත උත්සාහ කරන්න." });
        }

        user.mfaEnabled = true;
        await user.save();

        logger.info("MFA enabled successfully for user:", { userId: user.id });
        res.json({ success: true, msg: "MFA enabled successfully." });
    } catch (err) {
        logger.error("MFA Verify error:", { error: err.message });
        res.status(500).json({ error: "MFA Verification failed" });
    }
});

router.post('/mfa/disable', auth, [
    body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ error: "අවලංගු කේතයකි." });
    }

    const { code } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.mfaEnabled) {
            return res.status(400).json({ error: "MFA is not enabled." });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ error: "වැරදි කේතයකි. කරුණාකර නැවත උත්සාහ කරන්න." });
        }

        user.mfaEnabled = false;
        user.mfaSecret = null;
        user.refreshToken = null;
        await user.save();

        logger.info("MFA disabled successfully for user:", { userId: user.id });
        res.json({ success: true, msg: "MFA disabled successfully." });
    } catch (err) {
        logger.error("MFA Disable error:", { error: err.message });
        res.status(500).json({ error: "MFA Disable failed" });
    }
});

router.post('/mfa/login', [
    body('userId').trim().escape(),
    body('code').trim().isLength({ min: 6, max: 6 }).isNumeric().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ error: "අවලංගු කේතයකි." });
    }

    const { userId, code } = req.body;
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user identifier" });
        }

        const user = await User.findById(userId);
        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ error: "Invalid user request or MFA is not enabled." });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ error: "වැරදි කේතයකි. කරුණාකර නැවත උත්සාහ කරන්න." });
        }

        const payload = {
            user: { id: user.id, role: user.role }
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        // Save refresh token to user document
        user.refreshToken = refreshToken;
        await user.save();

        // Set HttpOnly Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        logger.info("User logged in successfully via MFA:", { userId: user.id, role: user.role });

        res.json({
            token: accessToken,
            user: {
                _id: user.id,
                fullName: user.fullName,
                nic: user.nic,
                email: user.email,
                role: user.role,
                mobileNumber: user.mobileNumber,
                dateOfBirth: user.dateOfBirth,
                village: user.village,
                city: user.city,
                householdNo: user.householdNo,
                occupation: user.occupation,
                emergencyContact: user.emergencyContact,
                address: user.address,
                gender: user.gender,
                age: user.age,
                district: user.district,
                divisionalSecretariat: user.divisionalSecretariat,
                gnDivision: user.gnDivision,
                mfaEnabled: user.mfaEnabled || false
            }
        });
    } catch (err) {
        logger.error("MFA Login error:", { error: err.message });
        res.status(500).json({ error: "MFA Login failed" });
    }
});

module.exports = router;