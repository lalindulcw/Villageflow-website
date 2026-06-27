const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const InfraComplaint = require('../models/InfraComplaint');
const User = require('../models/User');
const { dispatchNotification } = require('../services/notificationDispatcher');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads/infra directory if not exists
const uploadDir = 'uploads/infra';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const randomName = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `infra-${randomName}${ext}`);
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

// GET all complaints for citizen (own) or officer (all)
router.get('/complaints', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'officer') {
            query.citizenId = req.user.id;
        }
        const complaints = await InfraComplaint.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: complaints });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST submit complaint (citizen)
router.post('/complaints', auth, upload.single('photo'), async (req, res) => {
    try {
        const photoPath = req.file ? req.file.path.replace(/\\/g, '/') : null;
        const complaint = new InfraComplaint({
            ...req.body,
            photo: photoPath,
            citizenId: req.user.id
        });
        await complaint.save();
        res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: complaint });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update complaint status (officer)
router.put('/complaints/:id', auth, async (req, res) => {
    try {
        const complaint = await InfraComplaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        // Citizens can only update rating on their own complaint
        if (req.user.role !== 'officer') {
            if (complaint.citizenId.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
            complaint.rating = req.body.rating;
        } else {
            // Officer updates status, priority, note, assignedTo
            const oldStatus = complaint.status;
            Object.assign(complaint, req.body);
            if (req.body.status === 'Resolved') {
                complaint.resolvedDate = new Date();
            }

            // Send notification if status has changed
            if (req.body.status && req.body.status !== oldStatus) {
                const citizen = await User.findById(complaint.citizenId);
                const email = citizen ? citizen.email : null;
                const mobile = complaint.mobileNumber || (citizen ? citizen.mobileNumber : null);
                
                await dispatchNotification({
                    recipientEmail: email,
                    recipientMobile: mobile,
                    recipientName: complaint.citizenName,
                    type: 'CRITICAL',
                    data: {
                        subject: `Complaint Status: ${complaint.status} - VillageFlow`,
                        title: `Infrastructure Complaint Update`,
                        bodyHtml: `
                            <p>Dear <b>${complaint.citizenName}</b>,</p>
                            <p>The status of your infrastructure complaint has been updated.</p>
                            <table style="width: 100%; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                <tr><td><b>Category:</b></td><td>${complaint.category}</td></tr>
                                <tr><td><b>Title:</b></td><td>${complaint.title}</td></tr>
                                <tr><td><b>Location:</b></td><td>${complaint.location}</td></tr>
                                <tr><td><b>Status:</b></td><td><b style="color: ${complaint.status === 'Resolved' ? '#16a34a' : complaint.status === 'Rejected' ? '#dc2626' : '#d97706'};">${complaint.status}</b></td></tr>
                                ${complaint.officerNote ? `<tr><td><b>Officer Note:</b></td><td>${complaint.officerNote}</td></tr>` : ''}
                            </table>
                            <p>Thank you for using the VillageFlow portal.</p>
                        `,
                        smsText: `Your complaint (${complaint.category}) has been updated to ${complaint.status}. Ref: #${complaint._id.toString().substring(18)}`
                    }
                });
            }
        }
        await complaint.save();
        res.json({ success: true, message: 'Complaint updated', data: complaint });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE complaint (officer only)
router.delete('/complaints/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        }
        await InfraComplaint.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Complaint deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET stats (officer)
router.get('/stats', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const [total, submitted, inProgress, resolved, rejected] = await Promise.all([
            InfraComplaint.countDocuments(),
            InfraComplaint.countDocuments({ status: 'Submitted' }),
            InfraComplaint.countDocuments({ status: 'In Progress' }),
            InfraComplaint.countDocuments({ status: 'Resolved' }),
            InfraComplaint.countDocuments({ status: 'Rejected' })
        ]);
        // Category breakdown
        const categories = ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Drainage', 'Bridge', 'Other'];
        const categoryStats = {};
        for (const cat of categories) {
            categoryStats[cat] = await InfraComplaint.countDocuments({ category: cat });
        }
        res.json({ success: true, data: { total, submitted, inProgress, resolved, rejected, categoryStats } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
