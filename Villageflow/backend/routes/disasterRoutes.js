const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DisasterAlert = require('../models/DisasterAlert');
const SOSRequest = require('../models/SOSRequest');
const Shelter = require('../models/Shelter');
const User = require('../models/User');

// GET all active alerts (public)
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await DisasterAlert.find({ isActive: true }).sort({ createdAt: -1 });
        const mapped = alerts.map(a => {
            const obj = a.toObject();
            obj.disasterType = obj.type;
            return obj;
        });
        res.json({ success: true, data: mapped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all alerts (officer)
router.get('/alerts/all', auth, async (req, res) => {
    try {
        const alerts = await DisasterAlert.find().sort({ createdAt: -1 });
        const mapped = alerts.map(a => {
            const obj = a.toObject();
            obj.disasterType = obj.type;
            return obj;
        });
        res.json({ success: true, data: mapped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create alert (officer only)
router.post('/alerts', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        const alertData = { ...req.body };
        // Map frontend field names to schema field names
        if (alertData.disasterType && !alertData.type) alertData.type = alertData.disasterType;
        if (alertData.message && !alertData.description) alertData.description = alertData.message;
        delete alertData.disasterType;
        delete alertData.message;

        // Validate required fields before saving
        if (!alertData.title) return res.status(400).json({ success: false, message: 'Title is required' });
        if (!alertData.type) return res.status(400).json({ success: false, message: 'Disaster type is required' });
        if (!alertData.description) return res.status(400).json({ success: false, message: 'Description is required' });
        if (!alertData.affectedArea) return res.status(400).json({ success: false, message: 'Affected area is required' });

        const alert = new DisasterAlert({ ...alertData, postedBy: req.user.id });
        await alert.save();
        res.status(201).json({ success: true, message: 'Alert posted successfully', data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update alert (officer only)
router.put('/alerts/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        const alertData = { ...req.body };
        // Map frontend field names to schema field names
        if (alertData.disasterType && !alertData.type) alertData.type = alertData.disasterType;
        if (alertData.message && !alertData.description) alertData.description = alertData.message;
        delete alertData.disasterType;
        delete alertData.message;

        const alert = await DisasterAlert.findByIdAndUpdate(req.params.id, alertData, { new: true, runValidators: true });
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert updated', data: alert });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE alert (officer only)
router.delete('/alerts/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        await DisasterAlert.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Alert deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all SOS (officer)
router.get('/sos', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'officer') {
            query.citizenId = req.user.id;
        }
        const sos = await SOSRequest.find(query).sort({ createdAt: -1 });
        const mapped = sos.map(s => {
            const obj = s.toObject();
            obj.disasterType = obj.helpType;
            return obj;
        });
        res.json({ success: true, data: mapped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST submit SOS (citizen)
router.post('/sos', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const sos = new SOSRequest({
            citizenId: user._id,
            citizenName: user.fullName,
            nic: user.nic,
            mobileNumber: user.mobileNumber || req.body.mobileNumber || 'Not provided',
            location: req.body.location,
            helpType: req.body.helpType || req.body.disasterType || 'Other',
            description: req.body.description || '',
            personsAffected: req.body.personsAffected || 1,
            status: 'Pending'
        });
        await sos.save();
        res.status(201).json({ success: true, message: 'SOS submitted successfully', data: sos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update SOS status (officer)
router.put('/sos/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        const sos = await SOSRequest.findByIdAndUpdate(
            req.params.id,
            { ...req.body, resolvedBy: req.user.id },
            { new: true }
        );
        if (!sos) return res.status(404).json({ success: false, message: 'SOS not found' });
        res.json({ success: true, message: 'SOS updated', data: sos });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET all shelters (public)
router.get('/shelters', async (req, res) => {
    try {
        const shelters = await Shelter.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: shelters });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST add shelter (officer)
router.post('/shelters', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        const shelterData = { ...req.body };
        // Map frontend field names to schema field names
        if (shelterData.location && !shelterData.address) shelterData.address = shelterData.location;
        delete shelterData.location;
        // Convert facilities array to comma-separated string if needed
        if (Array.isArray(shelterData.facilities)) shelterData.facilities = shelterData.facilities.join(', ');

        if (!shelterData.name) return res.status(400).json({ success: false, message: 'Shelter name is required' });
        if (!shelterData.address) return res.status(400).json({ success: false, message: 'Shelter address/location is required' });
        if (!shelterData.capacity) return res.status(400).json({ success: false, message: 'Capacity is required' });

        const shelter = new Shelter({ ...shelterData, addedBy: req.user.id });
        await shelter.save();
        res.status(201).json({ success: true, message: 'Shelter added', data: shelter });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update shelter (officer)
router.put('/shelters/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        const shelterData = { ...req.body };
        // Map frontend field names to schema field names
        if (shelterData.location && !shelterData.address) shelterData.address = shelterData.location;
        delete shelterData.location;
        // Convert facilities array to comma-separated string if needed
        if (Array.isArray(shelterData.facilities)) shelterData.facilities = shelterData.facilities.join(', ');

        const shelter = await Shelter.findByIdAndUpdate(req.params.id, shelterData, { new: true });
        if (!shelter) return res.status(404).json({ success: false, message: 'Shelter not found' });
        res.json({ success: true, message: 'Shelter updated', data: shelter });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE shelter (officer)
router.delete('/shelters/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Officer access only' });
        }
        await Shelter.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Shelter deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/stats', auth, async (req, res) => {
    try {
        const [totalAlerts, activeAlerts, totalSOS, pendingSOS, totalShelters] = await Promise.all([
            DisasterAlert.countDocuments(),
            DisasterAlert.countDocuments({ isActive: true }),
            SOSRequest.countDocuments(),
            SOSRequest.countDocuments({ status: 'Pending' }),
            Shelter.countDocuments({ isActive: true })
        ]);
        res.json({ success: true, data: { totalAlerts, activeAlerts, totalSOS, pendingSOS, totalShelters } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
