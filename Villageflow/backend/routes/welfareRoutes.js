const express = require('express');
const router = express.Router();
const Welfare = require('../models/Welfare');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { dispatchNotification } = require('../services/notificationDispatcher');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const sendStatusEmail = async (userEmail, userName, type, status) => {
    try {
        const statusText = status === 'Active' ? 'අනුමත කර (Active) ඇත ✅' : 'තාවකාලිකව අත්හිටුවා (Suspended) ඇත ❌';
        const user = await User.findOne({ email: userEmail });
        const mobile = user ? user.mobileNumber : null;
        
        await dispatchNotification({
            recipientEmail: userEmail,
            recipientMobile: mobile,
            recipientName: userName,
            type: 'STANDARD',
            data: {
                subject: `Welfare Application Status Update - ${type}`,
                title: `Welfare Application Status Update`,
                bodyHtml: `
                    <p>Hello <b>${userName}</b>,</p>
                    <p>There is an update regarding your <b>${type}</b> welfare application.</p>
                    <p style="font-size: 16px; font-weight: bold; margin: 15px 0;">Current Status: <span style="color: ${status === 'Active' ? '#16a34a' : '#dc2626'};">${statusText}</span></p>
                    <p>Thank you for using the VillageFlow portal.</p>
                `,
                smsText: `Your ${type} welfare status has been updated to: ${statusText}`
            }
        });
        logger.info("Status Email Sent Successfully to:", { email: userEmail });
        return true;
    } catch (error) {
        logger.error("Email Sending Failed:", { error: error.message });
        return false;
    }
};

// Multer Configuration with strict validation
const uploadDir = 'uploads/welfare';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const randomName = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `welfare-${randomName}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;
        
        if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed.'));
        }
    }
});

// GET all beneficiaries (officer only)
router.get('/all', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const beneficiaries = await Welfare.find().populate('userId', 'email');
        res.json(beneficiaries);
    } catch (err) {
        logger.error("Get all beneficiaries error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// POST add new (officer only)
router.post('/add', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const newEntry = new Welfare(req.body);
        await newEntry.save();
        logger.info("Welfare record added by officer:", { id: newEntry._id, officerId: req.user.id });
        res.status(201).json(newEntry);
    } catch (err) {
        logger.error("Welfare add error:", { error: err.message });
        res.status(500).json({ error: "ඇතුළත් කිරීම අසාර්ථකයි" });
    }
});

// PUT update (officer only)
router.put('/update/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }
        const updated = await Welfare.findByIdAndUpdate(req.params.id, req.body, { new: true });
        logger.info("Welfare record updated by officer:", { id: req.params.id, officerId: req.user.id });
        res.json(updated);
    } catch (err) {
        logger.error("Welfare update error:", { error: err.message });
        res.status(500).json({ error: "යාවත්කාලීන කිරීම අසාර්ථකයි" });
    }
});

// DELETE (officer only)
router.delete('/delete/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        const welfare = await Welfare.findById(req.params.id);
        
        if (welfare && welfare.paySlip) {
            const filePath = path.join(__dirname, '..', welfare.paySlip);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await Welfare.findByIdAndDelete(req.params.id);
        logger.info("Welfare application deleted by officer:", { id: req.params.id, officerId: req.user.id });
        res.json({ message: "සාර්ථකව ඉවත් කළා" });
    } catch (err) {
        logger.error("Welfare delete error:", { error: err.message });
        res.status(500).json({ error: "ඉවත් කිරීම අසාර්ථකයි" });
    }
});

// Apply for welfare (Citizen)
router.post('/apply', auth, upload.fields([
    { name: 'paySlip', maxCount: 1 },
    { name: 'nicImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const { fullName, nic, householdNo, type, monthlyIncome, userId } = req.body;
        
        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid User ID format" });
        }

        // Verify citizen matches requested application identity
        if (userId && req.user.id !== userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: Cannot submit application for another user" });
        }

        const paySlipFile = req.files && req.files['paySlip'] ? req.files['paySlip'][0] : null;
        const nicImageFile = req.files && req.files['nicImage'] ? req.files['nicImage'][0] : null;
        
        if (!monthlyIncome) {
            return res.status(400).json({ error: "මාසික ආදායම ඇතුළත් කිරීම අනිවාර්යයි" });
        }

        const existingApplication = await Welfare.findOne({ nic, type });
        if (existingApplication) {
            return res.status(400).json({ 
                error: "ඔබ දැනටමත් මෙම සහනාධාර වර්ගයට අයදුම් කර ඇත" 
            });
        }

        let userEmail = null;
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.email) {
                userEmail = user.email;
            }
        }

        const relativePaySlipPath = paySlipFile ? paySlipFile.path.replace(/\\/g, '/') : null;
        const relativeNicImagePath = nicImageFile ? nicImageFile.path.replace(/\\/g, '/') : null;

        const newApplication = new Welfare({
            fullName,
            nic,
            householdNo,
            type,
            income: monthlyIncome,
            amount: 0,
            paySlip: relativePaySlipPath,
            nicImage: relativeNicImagePath,
            userId: userId || null,
            userEmail: userEmail,
            status: 'Pending',
            editHistory: [{
                editedAt: new Date(),
                editedBy: userId || req.user.id,
                changes: { action: 'created' }
            }]
        });
        
        await newApplication.save();
        logger.info("New welfare application submitted:", { appId: newApplication._id, userId: req.user.id });
        res.status(201).json({ 
            message: "ඉල්ලුම්පත සාර්ථකව යොමු කළා",
            application: newApplication 
        });
        
    } catch (err) {
        logger.error('Welfare application error:', { error: err.message });
        res.status(500).json({ error: "දත්ත ඇතුළත් කිරීමේ දෝෂයකි" });
    }
});

// Get settings
router.get('/settings', auth, async (req, res) => {
    try {
        const settings = {
            incomeVerificationRequired: req.systemConfig?.welfare?.incomeVerificationRequired || true,
            requiredDocuments: req.systemConfig?.welfare?.requiredDocuments || ['nic', 'paySlip'],
            maxApplicationsPerMonth: req.systemConfig?.welfare?.maxApplicationsPerMonth || 50
        };
        res.json(settings);
    } catch (err) {
        logger.error("Welfare settings fetch error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// Get user applications
router.get('/user-applications/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify requesting user is owner or has officer role
        if (req.user.id !== userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
            const currentUser = await User.findById(req.user.id).lean();
            if (!currentUser || currentUser.nic !== userId) {
                return res.status(403).json({ error: "Access Denied: Cannot view other users' applications" });
            }
        }

        const applications = await Welfare.find({ 
            $or: [{ userId: userId }, { nic: userId }]
        }).sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        logger.error("Welfare user applications fetch error:", { error: err.message });
        res.status(500).json({ error: "දත්ත ලබා ගැනීමේ දෝෂයකි" });
    }
});

// User Edit route
router.put('/user-edit/:id', auth, upload.single('paySlip'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }

        const { fullName, householdNo, monthlyIncome, userId } = req.body;
        
        const application = await Welfare.findById(id);
        if (!application) return res.status(404).json({ error: "අයදුම්පත හමු නොවීය" });

        // Verify citizen owns this application
        if (application.userId && application.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: You do not own this application" });
        }
        
        if (application.status !== 'Pending') {
            return res.status(400).json({ error: "අනුමත වූ හෝ අත්හිටුවන ලද අයදුම්පත් සංස්කරණය කළ නොහැක" });
        }
        
        const updateData = {
            fullName: fullName || application.fullName,
            householdNo: householdNo || application.householdNo,
            income: monthlyIncome || application.income
        };
        
        if (req.file) {
            if (application.paySlip) {
                const oldFilePath = path.join(__dirname, '..', application.paySlip);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
            updateData.paySlip = req.file.path.replace(/\\/g, '/');
        }
        
        const updated = await Welfare.findByIdAndUpdate(
            id, 
            { $set: updateData, $push: { editHistory: { editedAt: new Date(), editedBy: req.user.id, changes: updateData } } }, 
            { new: true }
        );
        logger.info("Welfare application updated by citizen:", { appId: id, userId: req.user.id });
        res.json({ message: "අයදුම්පත සාර්ථකව යාවත්කාලීන කළා", application: updated });
    } catch (err) {
        logger.error("Welfare edit error:", { error: err.message });
        res.status(500).json({ error: "යාවත්කාලීන කිරීම අසාර්ථකයි" });
    }
});

// User Delete route
router.delete('/user-delete/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }

        const application = await Welfare.findById(id);
        if (!application) return res.status(404).json({ error: "අයදුම්පත හමු නොවීය" });

        // Verify citizen owns this application
        if (application.userId && application.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: You do not own this application" });
        }

        if (application.status !== 'Pending') return res.status(400).json({ error: "මකා දැමිය නොහැක" });
        
        if (application.paySlip) {
            const filePath = path.join(__dirname, '..', application.paySlip);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Welfare.findByIdAndDelete(id);
        logger.info("Welfare application deleted by citizen:", { appId: id, userId: req.user.id });
        res.json({ message: "අයදුම්පත සාර්ථකව මකා දමන ලදී" });
    } catch (err) {
        logger.error("Welfare delete error:", { error: err.message });
        res.status(500).json({ error: "මකා දැමීම අසාර්ථකයි" });
    }
});

// Officer approve/suspend route WITH EMAIL (officer only)
router.put('/approve/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }

        const { status } = req.body;
        const application = await Welfare.findById(req.params.id).populate('userId');
        
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }
        
        application.status = status;
        application.editHistory.push({
            editedAt: new Date(),
            editedBy: req.user.id,
            changes: { status: status }
        });
        
        await application.save();
        logger.info("Welfare application status updated:", { id: req.params.id, status, officerId: req.user.id });
        
        let userEmail = null;
        let userName = application.fullName;
        
        if (application.userId && application.userId.email) {
            userEmail = application.userId.email;
        } else if (application.userEmail) {
            userEmail = application.userEmail;
        } else if (application.userId) {
            const user = await User.findById(application.userId);
            if (user && user.email) {
                userEmail = user.email;
            }
        }
        
        if (userEmail) {
            await sendStatusEmail(userEmail, userName, application.type, status);
        }
        
        res.json({ 
            message: `සහනාධාරය ${status === 'Active' ? 'අනුමත කළා' : 'අත්හිටුවා ඇත'}`,
            application: application 
        });
        
    } catch (err) {
        logger.error('Approve error:', { error: err.message });
        res.status(500).json({ error: "යාවත්කාලීන කිරීම අසාර්ථකයි" });
    }
});

// Get welfare by ID
router.get('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const welfare = await Welfare.findById(req.params.id).populate('userId', 'email');
        if (!welfare) {
            return res.status(404).json({ error: "Not found" });
        }

        // Verify ownership or check if officer
        if (welfare.userId && welfare.userId._id.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: You do not own this application" });
        }

        res.json(welfare);
    } catch (err) {
        logger.error("Welfare fetch by ID error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// Filter by income (officer only)
router.get('/filter/income/:maxIncome', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const maxIncome = parseInt(req.params.maxIncome);
        const beneficiaries = await Welfare.find({ income: { $lte: maxIncome } });
        res.json(beneficiaries);
    } catch (err) {
        logger.error("Welfare income filtering error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// Check existing application
router.get('/check/:nic/:type', auth, async (req, res) => {
    try {
        // Enforce user checking own NIC unless they are an officer
        if (req.user.nic !== req.params.nic && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: Cannot verify records of other citizens" });
        }

        const existing = await Welfare.findOne({ nic: req.params.nic, type: req.params.type });
        res.json({ exists: !!existing });
    } catch (err) {
        logger.error("Welfare validation check error:", { error: err.message });
        res.status(500).json({ error: "පරීක්ෂා කිරීමේ දෝෂයකි" });
    }
});

// Get pay slip file (secured)
router.get('/pay-slip/:filename', auth, async (req, res) => {
    try {
        const { filename } = req.params;
        const cleanFilename = path.basename(filename);
        
        // Find if this pay slip belongs to the current user, or if user is officer
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            const searchPattern = new RegExp(cleanFilename + '$');
            const welfare = await Welfare.findOne({
                $or: [{ paySlip: searchPattern }, { nicImage: searchPattern }]
            }).lean();

            if (!welfare) {
                return res.status(404).json({ error: "File record not found or access denied" });
            }

            const isOwner = (welfare.userId && welfare.userId.toString() === req.user.id);
            const currentUser = await User.findById(req.user.id).lean();
            const matchesNic = (currentUser && currentUser.nic === welfare.nic);

            if (!isOwner && !matchesNic) {
                return res.status(403).json({ error: "Access Denied: You do not own this document" });
            }
        }

        const filepath = path.join(__dirname, '..', 'uploads', 'welfare', cleanFilename);
        if (fs.existsSync(filepath)) {
            res.sendFile(filepath);
        } else {
            res.status(404).json({ error: "File not found" });
        }
    } catch (err) {
        logger.error("Pay slip access error:", { error: err.message });
        res.status(500).json({ error: "Server error retrieving file" });
    }
});

module.exports = router;