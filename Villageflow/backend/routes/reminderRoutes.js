const express = require('express');
const router = express.Router();
const MaintenanceReminder = require('../models/MaintenanceReminder');
const Asset = require('../models/Asset');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Enforce officer/admin access globally for all reminder routes
router.use(auth);
router.use(auth.authorize(['officer', 'admin']));

router.get('/all', async (req, res) => {
    try {
        const reminders = await MaintenanceReminder.find().sort({ reminderDate: 1 });
        res.json(reminders);
    } catch (err) {
        logger.error("Fetch all reminders error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

router.get('/pending', async (req, res) => {
    try {
        const pending = await MaintenanceReminder.find({ isSent: false }).sort({ reminderDate: 1 });
        res.json(pending);
    } catch (err) {
        logger.error("Fetch pending reminders error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

router.put('/mark-sent/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid reminder ID format" });
        }
        const reminder = await MaintenanceReminder.findByIdAndUpdate(
            req.params.id, 
            { isSent: true, sentDate: new Date() }, 
            { new: true }
        );
        if (!reminder) {
            return res.status(404).json({ error: "Reminder not found" });
        }
        logger.info("Reminder marked as sent:", { id: req.params.id, officerId: req.user.id });
        res.json(reminder);
    } catch (err) {
        logger.error("Mark sent reminder error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

router.post('/auto-check', async (req, res) => {
    try {
        const assets = await Asset.find();
        const today = new Date();
        const newReminders = [];
        for (const asset of assets) {
            const lastService = new Date(asset.lastServiceDate || asset.addedDate);
            const daysSinceService = Math.ceil((today - lastService) / (1000 * 60 * 60 * 24));
            if (daysSinceService > 180 && asset.condition !== 'Damaged') {
                const existingReminder = await MaintenanceReminder.findOne({ assetId: asset._id, reminderType: 'Service Due', isSent: false });
                if (!existingReminder) {
                    const reminder = new MaintenanceReminder({ 
                        assetId: asset._id, 
                        assetName: asset.itemName, 
                        reminderDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 
                        reminderType: 'Service Due', 
                        notes: `Last service was on ${(asset.lastServiceDate || asset.addedDate).toLocaleDateString()} (${daysSinceService} days ago)` 
                    });
                    await reminder.save();
                    newReminders.push(reminder);
                }
            }
        }
        logger.info("Auto-check reminders run successfully:", { newRemindersCount: newReminders.length, officerId: req.user.id });
        res.json({ message: `${newReminders.length} new reminders created`, reminders: newReminders });
    } catch (err) {
        logger.error("Auto-check reminders error:", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;