const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Voter = require('../models/Voter');
const ElectionNotice = require('../models/ElectionNotice');
const Candidate = require('../models/Candidate');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Helper to check if role is officer or admin
const isOfficerOrAdmin = (req) => {
    return req.user && (req.user.role === 'officer' || req.user.role === 'admin');
};

// GET all active notices (public)
router.get('/notices', async (req, res) => {
    try {
        const notices = await ElectionNotice.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: notices });
    } catch (err) {
        logger.error("Fetch election notices error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all notices (officer)
router.get('/notices/all', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const notices = await ElectionNotice.find().sort({ createdAt: -1 });
        res.json({ success: true, data: notices });
    } catch (err) {
        logger.error("Fetch all election notices error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create notice (officer)
router.post('/notices', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const notice = new ElectionNotice({ ...req.body, postedBy: req.user.id });
        await notice.save();
        logger.info("Election notice created:", { id: notice._id, officerId: req.user.id });
        res.status(201).json({ success: true, message: 'Election notice posted', data: notice });
    } catch (err) {
        logger.error("Create election notice error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update notice (officer)
router.put('/notices/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const notice = await ElectionNotice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
        logger.info("Election notice updated:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Election notice updated', data: notice });
    } catch (err) {
        logger.error("Update election notice error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE notice (officer)
router.delete('/notices/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const notice = await ElectionNotice.findByIdAndDelete(req.params.id);
        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
        logger.info("Election notice deleted:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Election notice deleted' });
    } catch (err) {
        logger.error("Delete election notice error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET check voter registration (secured - own only unless officer/admin)
router.get('/voters/check/:nic', auth, async (req, res) => {
    try {
        const targetNic = req.params.nic.trim().toUpperCase();
        if (req.user.nic !== targetNic && !isOfficerOrAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Access Denied: Cannot check voter registration of other citizens' });
        }

        const voter = await Voter.findOne({ nic: targetNic });
        if (!voter) return res.json({ success: true, registered: false, data: null });
        res.json({ success: true, registered: true, data: voter });
    } catch (err) {
        logger.error("Voter check error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all voters (officer)
router.get('/voters', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const voters = await Voter.find().sort({ fullName: 1 });
        res.json({ success: true, data: voters });
    } catch (err) {
        logger.error("Fetch voters error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST add voter (officer)
router.post('/voters', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const existing = await Voter.findOne({ nic: req.body.nic });
        if (existing) return res.status(400).json({ success: false, message: 'Voter with this NIC already exists' });
        
        const voter = new Voter({ ...req.body, addedBy: req.user.id });
        await voter.save();
        logger.info("Voter added to elector roll:", { id: voter._id, officerId: req.user.id });
        res.status(201).json({ success: true, message: 'Voter added to electoral roll', data: voter });
    } catch (err) {
        logger.error("Add voter error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update voter (officer)
router.put('/voters/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const voter = await Voter.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!voter) return res.status(404).json({ success: false, message: 'Voter not found' });
        logger.info("Voter updated:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Voter updated', data: voter });
    } catch (err) {
        logger.error("Update voter error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE voter (officer)
router.delete('/voters/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const voter = await Voter.findByIdAndDelete(req.params.id);
        if (!voter) return res.status(404).json({ success: false, message: 'Voter not found' });
        logger.info("Voter deleted:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Voter removed from electoral roll' });
    } catch (err) {
        logger.error("Delete voter error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all candidates (public)
router.get('/candidates', async (req, res) => {
    try {
        const candidates = await Candidate.find({ isActive: true }).sort({ fullName: 1 });
        res.json({ success: true, data: candidates });
    } catch (err) {
        logger.error("Fetch candidates error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all candidates (officer)
router.get('/candidates/all', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const candidates = await Candidate.find().sort({ fullName: 1 });
        res.json({ success: true, data: candidates });
    } catch (err) {
        logger.error("Fetch all candidates error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST add candidate (officer)
router.post('/candidates', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const candidate = new Candidate({ ...req.body, addedBy: req.user.id });
        await candidate.save();
        logger.info("Candidate registered:", { id: candidate._id, officerId: req.user.id });
        res.status(201).json({ success: true, message: 'Candidate registered', data: candidate });
    } catch (err) {
        logger.error("Add candidate error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update candidate (officer)
router.put('/candidates/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
        logger.info("Candidate updated:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Candidate updated', data: candidate });
    } catch (err) {
        logger.error("Update candidate error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE candidate (officer)
router.delete('/candidates/:id', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        const candidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
        logger.info("Candidate removed:", { id: req.params.id, officerId: req.user.id });
        res.json({ success: true, message: 'Candidate removed' });
    } catch (err) {
        logger.error("Delete candidate error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

//ELECTION STATS (officer)
router.get('/stats', auth, async (req, res) => {
    try {
        if (!isOfficerOrAdmin(req)) return res.status(403).json({ success: false, message: 'Officer/Admin access only' });
        const [totalVoters, activeVoters, totalCandidates, totalNotices] = await Promise.all([
            Voter.countDocuments(),
            Voter.countDocuments({ registrationStatus: 'Active' }),
            Candidate.countDocuments({ isActive: true }),
            ElectionNotice.countDocuments({ isActive: true })
        ]);
        res.json({ success: true, data: { totalVoters, activeVoters, totalCandidates, totalNotices } });
    } catch (err) {
        logger.error("Fetch election stats error:", { error: err.message });
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
