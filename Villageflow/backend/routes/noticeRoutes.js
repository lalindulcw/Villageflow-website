const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const User = require('../models/User'); 
const { dispatchNotification } = require('../services/notificationDispatcher');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

router.get('/all', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ postedDate: -1 }); 
        res.json(notices);
    } catch (err) {
        logger.error("Get notices error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.post('/add', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    const notice = new Notice({
        title: req.body.title,
        desc_si: req.body.desc_si,
        desc_ta: req.body.desc_ta,
        desc_en: req.body.desc_en,
        category: req.body.category,
        priority: req.body.priority
    });

    try {
        const newNotice = await notice.save();
        logger.info("New notice posted:", { id: newNotice._id, title: newNotice.title, officerId: req.user.id });

        const citizens = await User.find({ role: 'citizen' }).select('email mobileNumber fullName');

        if (citizens.length > 0) {
            const isHighPriority = req.body.priority === 'High' || req.body.priority === 'Critical';
            
            for (const citizen of citizens) {
                try {
                    await dispatchNotification({
                        recipientEmail: citizen.email,
                        recipientMobile: citizen.mobileNumber,
                        recipientName: citizen.fullName,
                        type: isHighPriority ? 'CRITICAL' : 'STANDARD',
                        data: {
                            subject: `New Notice: ${req.body.title} - VillageFlow`,
                            title: `Notice Board Announcement`,
                            bodyHtml: `
                                <h3 style="color: #800000; margin: 0 0 10px 0;">${req.body.title}</h3>
                                <p><b>සිංහල:</b> ${req.body.desc_si}</p>
                                ${req.body.desc_ta ? `<p><b>දෙමළ:</b> ${req.body.desc_ta}</p>` : ''}
                                ${req.body.desc_en ? `<p><b>English:</b> ${req.body.desc_en}</p>` : ''}
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0 10px 0;" />
                                <p style="font-size: 11px; color: #64748b;">Category: ${req.body.category} | Date: ${new Date().toLocaleDateString()}</p>
                            `,
                            smsText: `[Notice] ${req.body.title}. Visit the noticeboard portal for full details.`
                        }
                    });
                } catch (innerErr) {
                    logger.error(`Failed to notify citizen ${citizen.fullName}:`, { error: innerErr.message });
                }
            }
        }

        res.status(201).json(newNotice);
    } catch (err) {
        logger.error("Notice addition error:", { error: err.message });
        res.status(400).json({ message: err.message });
    }
});

router.put('/update/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid notice ID format" });
        }

        const updatedNotice = await Notice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!updatedNotice) {
            return res.status(404).json({ message: "Notice not found" });
        }

        logger.info("Notice updated:", { id: req.params.id, officerId: req.user.id });
        res.json(updatedNotice);
    } catch (err) {
        logger.error("Notice update error:", { error: err.message });
        res.status(400).json({ message: err.message });
    }
});

router.delete('/delete/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid notice ID format" });
        }

        const notice = await Notice.findByIdAndDelete(req.params.id);
        if (!notice) {
            return res.status(404).json({ message: "Notice not found" });
        }

        logger.info("Notice deleted:", { id: req.params.id, officerId: req.user.id });
        res.json({ message: "නිවේදනය සාර්ථකව මකා දැමුවා" });
    } catch (err) {
        logger.error("Notice deletion error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;