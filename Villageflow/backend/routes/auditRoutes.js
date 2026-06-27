const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

router.get('/all', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Audit logs ලබා ගැනීමට නොහැකි විය." });
    }
});

module.exports = router;