const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { sendBrandedEmail } = require('../services/emailService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup with strict validation
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const randomName = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `cert-${randomName}${ext}`);
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
            cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
        }
    }
});

// Helper function to get certificate fee
const getCertificateFee = (certificateType) => {
    const fees = {
        'Residency Certificate': 250,
        'Character Certificate': 200,
        'Income Certificate': 300,
        'Birth Certificate Copy': 150
    };
    return fees[certificateType] || 250;
};

// Generate unique transaction ID
const generateTransactionId = (prefix) => {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

// 1. CITIZEN CHECK API (officer only)
router.get('/citizens/check/:nic', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const user = await User.findOne({ nic: req.params.nic });
        if (user) {
            res.json({ exists: true, fullName: user.fullName });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        logger.error("Citizen check error:", { error: err.message });
        res.status(500).json({ error: "Server error checking citizen data" });
    }
});

// 2. ANALYTICAL DATA API (officer only)
router.get('/analytics/summary', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const total = await Certificate.countDocuments();
        const approved = await Certificate.countDocuments({ status: 'Approved' });
        const rejected = await Certificate.countDocuments({ status: 'Rejected' });
        const pending = await Certificate.countDocuments({ status: 'Pending' });
        res.json({ total, approved, rejected, pending });
    } catch (err) {
        logger.error("Fetch analytics summary error:", { error: err.message });
        res.status(500).json({ error: "Failed to get analytics data" });
    }
});

router.get('/audit-logs', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        logger.error("Fetch audit-logs error:", { error: err.message });
        res.status(500).json({ error: "Failed to get audit logs" });
    }
});

// 3. READ USER HISTORY (with payment info)
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid User ID format" });
        }

        // Verify ownership or check if officer
        if (req.user.id !== userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: Cannot view other users' application history" });
        }

        const apps = await Certificate.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ appliedDate: -1 });

        const appsWithPayment = await Promise.all(apps.map(async (app) => {
            const appObj = app.toObject();
            const payment = await Payment.findOne({ certificateId: app._id });
            if (payment) {
                appObj.paymentStatus = payment.status;
                appObj.paymentMethod = payment.paymentMethod;
                appObj.paymentAmount = payment.amount;
                appObj.transactionId = payment.transactionId;
                appObj.paymentDate = payment.paymentDate;
            }
            return appObj;
        }));

        res.json(appsWithPayment);
    } catch (err) {
        logger.error("Fetch User History Error:", { error: err.message });
        res.status(500).json({ error: "Failed to get application history" });
    }
});

// 4. VERIFY (QR Code verification - Public)
router.get('/verify/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ valid: false, message: "Invalid ID format" });
        }

        const cert = await Certificate.findById(req.params.id)
            .populate('userId', 'fullName');

        if (!cert) {
            return res.status(404).json({ valid: false, message: "Invalid certificate" });
        }

        if (cert.status !== 'Approved') {
            return res.status(400).json({
                valid: false,
                message: "Certificate exists but not yet approved"
            });
        }

        res.json({
            valid: true,
            data: {
                name: cert.memberName,
                nic: cert.nic,
                type: cert.certificateType,
                date: cert.appliedDate,
                status: cert.status
            }
        });
    } catch (err) {
        logger.error("Verification error:", { error: err.message });
        res.status(500).json({ valid: false, message: "Verification error" });
    }
});

// 5. CREATE APPLICATION (WITH PAYMENT)
router.post('/apply', auth, upload.fields([
    { name: 'utilityBill', maxCount: 1 },
    { name: 'nicImage', maxCount: 1 },
    { name: 'bankSlip', maxCount: 1 }
]), async (req, res) => {
    try {
        const utilityBillFile = req.files && req.files['utilityBill'] ? req.files['utilityBill'][0] : null;
        const nicImageFile = req.files && req.files['nicImage'] ? req.files['nicImage'][0] : null;

        const {
            nic,
            certificateType,
            userId,
            memberName,
            relationship,
            applyFor,
            paymentStatus,
            paymentMethod,
            transactionId,
            paymentAmount
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid User ID format" });
        }

        // Verify requesting citizen owns this application
        if (req.user.id !== userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access Denied: Cannot submit application for another user" });
        }

        if (!utilityBillFile) {
            return res.status(400).json({ error: "Required document (Utility Bill) missing" });
        }

        // Check for duplicate pending application
        const existingPending = await Certificate.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            certificateType,
            nic,
            status: 'Pending'
        });

        if (existingPending) {
            return res.status(400).json({ error: "You already have a pending application for this certificate type" });
        }

        // Store relative file paths safely
        const relativeUtilityBillPath = utilityBillFile.path.replace(/\\/g, '/');
        const relativeNicImagePath = nicImageFile ? nicImageFile.path.replace(/\\/g, '/') : null;

        // Create certificate
        const newApp = new Certificate({
            userId: new mongoose.Types.ObjectId(userId),
            nic,
            certificateType,
            memberName: memberName || "Self",
            relationship: relationship || "Self",
            applyFor: applyFor || "Self",
            utilityBill: relativeUtilityBillPath,
            nicImage: relativeNicImagePath,
            paymentStatus: paymentStatus === 'completed' ? 'completed' : 'pending',
            paymentMethod: paymentMethod || null,
            transactionId: transactionId || null,
            paymentAmount: paymentAmount ? Number(paymentAmount) : null,
            paymentDate: paymentStatus === 'completed' ? new Date() : null,
            status: 'Pending'
        });

        await newApp.save();
        logger.info("Certificate application created:", { appId: newApp._id, userId: req.user.id });

        // CRITICAL: CREATE PAYMENT RECORD
        if (paymentStatus === 'completed' && transactionId) {
            const payment = new Payment({
                userId: new mongoose.Types.ObjectId(userId),
                certificateId: newApp._id,
                certificateType: certificateType,
                amount: paymentAmount ? Number(paymentAmount) : getCertificateFee(certificateType),
                paymentMethod: paymentMethod || 'card',
                transactionId: transactionId,
                status: 'completed',
                paymentDate: new Date(),
                paymentDetails: {
                    paymentDate: new Date(),
                    cardLastFour: req.body.cardLastFour || null,
                    cardType: req.body.cardType || null,
                    cardholderName: req.body.cardholderName || null,
                    mobileNumber: req.body.mobileNumber || null,
                    provider: req.body.provider || null
                }
            });
            await payment.save();
            await Certificate.findByIdAndUpdate(newApp._id, { paymentStatus: 'completed' });

        } else if (paymentMethod === 'bank' || paymentMethod === 'offline') {
            const newTransactionId = transactionId || generateTransactionId(paymentMethod === 'bank' ? 'BNK' : 'OFF');
            const bankSlipFile = req.files && req.files['bankSlip'] ? req.files['bankSlip'][0] : null;
            const bankSlipPath = bankSlipFile ? bankSlipFile.path.replace(/\\/g, '/') : null;

            const payment = new Payment({
                userId: new mongoose.Types.ObjectId(userId),
                certificateId: newApp._id,
                certificateType: certificateType,
                amount: paymentAmount ? Number(paymentAmount) : getCertificateFee(certificateType),
                paymentMethod: paymentMethod,
                transactionId: newTransactionId,
                status: 'pending_verification',
                paymentDate: new Date(),
                paymentDetails: {
                    paymentDate: new Date(),
                    bankName: req.body.bankName || null,
                    accountLastFour: req.body.accountLastFour || null,
                    accountHolderName: req.body.accountHolderName || null,
                    branchCode: req.body.branchCode || null,
                    referenceNumber: req.body.referenceNumber || null,
                    receiptNumber: req.body.receiptNumber || null,
                    receiptSlip: bankSlipPath
                }
            });
            await payment.save();
            
            if (!transactionId) {
                await Certificate.findByIdAndUpdate(newApp._id, { transactionId: newTransactionId });
            }
        }

        res.status(201).json({
            msg: "Application submitted successfully!",
            appId: newApp._id
        });
    } catch (err) {
        logger.error("Apply Error:", { error: err.message });
        res.status(500).json({ error: "Failed to submit application: " + err.message });
    }
});

// 6. UPDATE APPLICATION STATUS (WITH PAYMENT UPDATE)
router.put('/update/:id', auth, upload.fields([
    { name: 'utilityBill', maxCount: 1 },
    { name: 'bankSlip', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }

        const existingApp = await Certificate.findById(id);
        if (!existingApp) {
            return res.status(404).json({ error: "Application not found" });
        }

        const updateData = { ...req.body };

        // Verify authorization/ownership
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            if (existingApp.userId.toString() !== req.user.id) {
                return res.status(403).json({ error: "Access Denied: You do not own this application" });
            }
            // Block status and review modifications by citizens
            delete updateData.status;
            delete updateData.rejectionReason;
            delete updateData.reviewedDate;
            delete updateData.paymentStatus;
        }

        if (req.files && req.files['utilityBill']) {
            updateData.utilityBill = req.files['utilityBill'][0].path.replace(/\\/g, '/');
        }

        if (updateData.status && updateData.status !== 'Rejected') {
            updateData.rejectionReason = "";
        }

        // Handle payment when approving
        if (req.body.status === 'Approved') {
            updateData.reviewedDate = new Date();

            const existingPayment = await Payment.findOne({ certificateId: id });

            if (existingPayment && existingPayment.status === 'pending_verification') {
                await Payment.findByIdAndUpdate(existingPayment._id, {
                    status: 'completed',
                    'paymentDetails.verifiedAt': new Date(),
                    'paymentDetails.verifiedBy': req.body.officerName || 'Grama Niladhari'
                });
                updateData.paymentStatus = 'completed';
            } else if (!existingPayment) {
                const newPayment = new Payment({
                    userId: existingApp.userId,
                    certificateId: id,
                    certificateType: existingApp.certificateType,
                    amount: getCertificateFee(existingApp.certificateType),
                    paymentMethod: 'offline',
                    transactionId: generateTransactionId('OFF'),
                    status: 'completed',
                    paymentDate: new Date(),
                    paymentDetails: {
                        verifiedBy: req.body.officerName || 'Grama Niladhari',
                        verifiedAt: new Date(),
                        notes: 'Payment processed by GN Officer'
                    }
                });
                await newPayment.save();
                updateData.paymentStatus = 'completed';
                updateData.paymentMethod = 'offline';
                updateData.transactionId = newPayment.transactionId;
                updateData.paymentAmount = newPayment.amount;
            }
        }

        // Handle refund when rejecting
        if (req.body.status === 'Rejected') {
            const existingPayment = await Payment.findOne({ certificateId: id });
            if (existingPayment && existingPayment.status === 'completed') {
                await Payment.findByIdAndUpdate(existingPayment._id, {
                    status: 'refunded',
                    'paymentDetails.notes': `Refunded due to rejection: ${req.body.rejectionReason || 'No reason provided'}`
                });
                updateData.paymentStatus = 'refunded';
            }
        }

        const updatedApp = await Certificate.findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
            .populate('userId', 'email fullName mobileNumber');

        // Log the action
        if (req.body.status && req.body.status !== existingApp.status) {
            const newLog = new AuditLog({
                action: `${updatedApp.certificateType} certificate was ${req.body.status}`,
                officerName: req.body.officerName || "Grama Niladhari",
                targetNic: updatedApp.nic
            });
            await newLog.save();
            logger.info(`Certificate application status updated: ${id} -> ${req.body.status}`);

            // Send notification
            if (updatedApp.userId && updatedApp.userId.email) {
                try {
                    const statusText = req.body.status === 'Approved' ? 'Approved' : 'Rejected';
                    const rejectionReason = req.body.rejectionReason || 'Incomplete data';
                    
                    await dispatchNotification({
                        recipientEmail: updatedApp.userId.email,
                        recipientMobile: updatedApp.userId.mobileNumber,
                        recipientName: updatedApp.userId.fullName,
                        type: 'CRITICAL',
                        data: {
                            subject: `Certificate Application Status: ${statusText} - VillageFlow`,
                            title: `Certificate ${statusText}`,
                            bodyHtml: `
                                <p>Dear <b>${updatedApp.userId.fullName}</b>,</p>
                                <p>Your <b>${updatedApp.certificateType}</b> application status has been updated to: <b>${statusText}</b></p>
                                ${req.body.status === 'Rejected' ? `
                                    <p style="color: #dc2626; font-weight: bold;">Reason: ${rejectionReason}</p>
                                    <p><b>Note:</b> Your payment will be refunded shortly.</p>
                                ` : `
                                    <p>Your application is approved. You can now download your digital certificate from the portal.</p>
                                `}
                                <p>Thank you for using the VillageFlow portal.</p>
                            `,
                            smsText: `Your ${updatedApp.certificateType} certificate has been ${statusText.toLowerCase()}.${req.body.status === 'Rejected' ? ` Reason: ${rejectionReason}` : ''}`
                        }
                    });
                } catch (e) {
                    logger.error("Email notification failed:", { error: e.message });
                }
            }
        }

        res.json({ msg: "Update successful!", updatedApp });
    } catch (err) {
        logger.error("Update Error:", { error: err.message });
        res.status(500).json({ error: "Update failed: " + err.message });
    }
});

// 7. GET ALL APPLICATIONS (officer only)
router.get('/all', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const apps = await Certificate.find()
            .populate('userId', 'fullName email')
            .sort({ appliedDate: -1 });
        res.json(apps);
    } catch (err) {
        logger.error("Get all applications error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// 8. DELETE APPLICATION (officer only)
router.delete('/delete/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid application ID format" });
        }
        await Payment.deleteOne({ certificateId: req.params.id });
        await Certificate.findByIdAndDelete(req.params.id);
        logger.info("Certificate application deleted:", { appId: req.params.id, deletedBy: req.user.id });
        res.json({ msg: "Application deleted successfully" });
    } catch (err) {
        logger.error("Delete application error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// 9. SEND PDF VIA EMAIL (officer only)
router.post('/send-pdf-email', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    const { email, pdfBase64, nic, certType } = req.body;
    try {
        const base64Data = pdfBase64.includes("base64,") ? pdfBase64.split("base64,")[1] : pdfBase64;
        
        await sendBrandedEmail({
            to: email,
            subject: `Your ${certType} Certificate - VillageFlow`,
            title: `Your Digital Certificate is Ready`,
            bodyHtml: `
                <p>Hello,</p>
                <p>Please find attached your requested <b>${certType}</b> certificate from the VillageFlow administration portal.</p>
                <p>Thank you for using our services.</p>
            `,
            attachments: [{ filename: `${certType}_${nic}.pdf`, content: base64Data, encoding: 'base64' }]
        });
        
        res.json({ success: true });
    } catch (err) {
        logger.error("PDF Email Error:", { error: err.message });
        res.status(500).json({ error: "Email sending failed" });
    }
});

// 10. GET CERTIFICATE BY ID (WITH PAYMENT INFO)
router.get('/certificate/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const certificate = await Certificate.findById(req.params.id).populate('userId', 'fullName email phone');
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

        // Verify ownership or check if officer
        if (certificate.userId._id.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: You do not own this application' });
        }

        const payment = await Payment.findOne({ certificateId: certificate._id });
        const result = certificate.toObject();

        if (payment) {
            result.paymentInfo = {
                id: payment._id,
                status: payment.status,
                method: payment.paymentMethod,
                amount: payment.amount,
                transactionId: payment.transactionId,
                date: payment.paymentDate
            };
        }

        res.json(result);
    } catch (error) {
        logger.error("Get certificate by id error:", { error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
});

// 11. GET PAYMENT BY CERTIFICATE ID
router.get('/payment/:certificateId', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.certificateId)) {
            return res.status(400).json({ message: 'Invalid certificate ID format' });
        }

        const cert = await Certificate.findById(req.params.certificateId);
        if (!cert) return res.status(404).json({ message: "Certificate not found" });

        // Verify ownership or role
        if (cert.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: Cannot fetch payment details' });
        }

        const payment = await Payment.findOne({ certificateId: req.params.certificateId });
        if (!payment) {
            return res.json({ exists: false, message: 'No payment found' });
        }
        res.json(payment);
    } catch (error) {
        logger.error("Get payment by cert error:", { error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
});

// 12. VERIFY OFFLINE PAYMENT (GN OFFICER only)
router.post('/verify-payment', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const { certificateId, receiptNumber, verifiedBy } = req.body;

        const payment = await Payment.findOne({ certificateId: certificateId });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = 'completed';
        payment.paymentDetails.receiptNumber = receiptNumber;
        payment.paymentDetails.verifiedBy = verifiedBy;
        payment.paymentDetails.verifiedAt = new Date();
        await payment.save();

        await Certificate.findByIdAndUpdate(certificateId, {
            paymentStatus: 'completed'
        });

        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        logger.error("Verify payment error:", { error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
});

// 13. GET PENDING PAYMENTS (GN OFFICER only)
router.get('/pending-payments', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        const payments = await Payment.find({
            status: 'pending_verification'
        }).populate('userId', 'fullName nic email');
        res.json(payments);
    } catch (error) {
        logger.error("Get pending payments error:", { error: error.message });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;