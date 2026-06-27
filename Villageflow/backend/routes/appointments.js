const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { dispatchNotification } = require('../services/notificationDispatcher');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

router.post('/book', auth, [
    body('userId').trim().escape(),
    body('userName').trim().escape(),
    body('nic').trim().toUpperCase().escape(),
    body('reason').trim().escape(),
    body('date').trim().escape(),
    body('time').trim().escape(),
    body('userEmail').trim().normalizeEmail()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ message: "Invalid input fields." });
    }

    try {
        const { userId, userName, nic, reason, date, time, userEmail } = req.body;

        // Verify requesting citizen owns this booking
        if (req.user.id !== userId && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Cannot book appointments for other citizens" });
        }

        // System Config check
        if (req.systemConfig && req.systemConfig.appointment) {
            const dailyCount = await Appointment.countDocuments({ 
                date,
                status: { $ne: 'Rejected' }
            });
            
            const maxAllowed = req.systemConfig.appointment.maxAppointmentsPerDay;
            
            if (dailyCount >= maxAllowed) {
                return res.status(400).json({ 
                    message: `මෙම දිනය සඳහා ගත හැකි උපරිම පත්වීම් ගණන ${maxAllowed} කි` 
                });
            }
        }

        const newAppointment = new Appointment({
            userId,
            userName,
            nic,
            reason,
            date,
            time,
            userEmail,
            status: 'Pending'
        });

        await newAppointment.save();
        logger.info("Appointment booked successfully:", { id: newAppointment._id, userId: req.user.id });

        if (userEmail) {
            try {
                const user = await User.findOne({ $or: [{ _id: userId }, { nic: nic }] });
                const mobile = user ? user.mobileNumber : null;
                
                await dispatchNotification({
                    recipientEmail: userEmail,
                    recipientMobile: mobile,
                    recipientName: userName,
                    type: 'CRITICAL',
                    data: {
                        subject: 'Appointment Booking Request - VillageFlow',
                        title: 'Appointment Request Received',
                        bodyHtml: `
                            <p>Dear <b>${userName}</b>,</p>
                            <p>Your appointment request has been successfully submitted and is currently pending approval.</p>
                            <table style="width: 100%; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                <tr><td><b>NIC:</b></td><td>${nic}</td></tr>
                                <tr><td><b>Date:</b></td><td>${date}</td></tr>
                                <tr><td><b>Time:</b></td><td>${time}</td></tr>
                                <tr><td><b>Reason:</b></td><td>${reason}</td></tr>
                                <tr><td><b>Status:</b></td><td><b style="color: #f59e0b;">Pending</b></td></tr>
                            </table>
                            <p>You will receive another update once the officer reviews and updates the status of your request.</p>
                            <p>Thank you for using the VillageFlow portal.</p>
                        `,
                        smsText: `Your appointment request for ${date} at ${time} has been received. Status: Pending.`
                    }
                });
            } catch (e) {
                logger.error("Appointment notification failed:", { error: e.message });
            }
        }

        res.status(201).json(newAppointment);
    } catch (err) {
        logger.error("Appointment booking error:", { error: err.message });
        res.status(400).json({ message: err.message });
    }
});

router.get('/all', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            query.userId = req.user.id;
        }
        const apps = await Appointment.find(query).sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        logger.error("Get appointments error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.get('/available-slots', auth, async (req, res) => {
    try {
        const slots = req.systemConfig?.appointment?.availableTimeSlots || [
            '9.00 AM - 10.00 AM',
            '10.00 AM - 11.00 AM',
            '11.00 AM - 12.00 PM',
            '1.00 PM - 2.00 PM',
            '2.00 PM - 3.00 PM'
        ];
        
        const { date } = req.query;
        let slotsWithAvailability = slots;
        
        if (date) {
            const bookedAppointments = await Appointment.find({
                date,
                status: { $ne: 'Rejected' }
            });
            
            slotsWithAvailability = slots.map(slot => {
                const bookedCount = bookedAppointments.filter(
                    app => app.time === slot
                ).length;
                
                return {
                    time: slot,
                    available: bookedCount < 1,
                    bookedCount
                };
            });
        }
        
        res.json(slotsWithAvailability);
    } catch (err) {
        logger.error("Get available slots error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.put('/status/:id', auth, auth.authorize(['officer', 'admin']), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const { status } = req.body;
        
        const updated = await Appointment.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { 
                returnDocument: 'after',
                runValidators: true 
            }
        );

        if (!updated) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        logger.info("Appointment status updated:", { id: updated._id, status, officerId: req.user.id });

        if (updated.userEmail) {
            try {
                const user = await User.findOne({ $or: [{ _id: updated.userId }, { nic: updated.nic }] });
                const mobile = user ? user.mobileNumber : null;

                await dispatchNotification({
                    recipientEmail: updated.userEmail,
                    recipientMobile: mobile,
                    recipientName: updated.userName,
                    type: 'CRITICAL',
                    data: {
                        subject: `Appointment Status Update: ${status} - VillageFlow`,
                        title: `Appointment Request Update`,
                        bodyHtml: `
                            <p>Dear <b>${updated.userName}</b>,</p>
                            <p>The status of your appointment request has been updated.</p>
                            <table style="width: 100%; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                <tr><td><b>NIC:</b></td><td>${updated.nic}</td></tr>
                                <tr><td><b>Date:</b></td><td>${updated.date}</td></tr>
                                <tr><td><b>Time:</b></td><td>${updated.time}</td></tr>
                                <tr><td><b>Reason:</b></td><td>${updated.reason}</td></tr>
                                <tr><td><b>Status:</b></td><td><b style="color: ${status === 'Approved' ? '#16a34a' : '#dc2626'};">${status}</b></td></tr>
                            </table>
                            <p>Thank you for using the VillageFlow portal.</p>
                        `,
                        smsText: `Your appointment request has been ${status === 'Approved' ? 'approved' : 'rejected'}. Date: ${updated.date}, Time: ${updated.time}.`
                    }
                });
            } catch (e) {
                logger.error("Status Email Send Error:", { error: e.message });
            }
        }

        res.json(updated);
    } catch (err) {
        logger.error("Update status error:", { error: err.message });
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Verify owner or officer
        if (appointment.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Cannot delete other citizens' appointments" });
        }

        await Appointment.findByIdAndDelete(req.params.id);
        logger.info("Appointment deleted:", { id: req.params.id, deletedBy: req.user.id });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        logger.error("Delete appointment error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.put('/update/:id', auth, [
    body('nic').optional().trim().toUpperCase().escape(),
    body('reason').optional().trim().escape(),
    body('date').optional().trim().escape(),
    body('time').optional().trim().escape()
], async (req, res) => {
    const expressErrors = validationResult(req);
    if (!expressErrors.isEmpty()) {
        return res.status(400).json({ message: "Invalid inputs." });
    }

    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const { nic, reason, date, time } = req.body;

        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify owner or officer
        if (appointment.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Cannot modify other citizens' appointments" });
        }
        
        if (appointment.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only update pending appointments' });
        }
        
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            {
                nic: nic || appointment.nic,
                reason: reason || appointment.reason,
                date: date || appointment.date,
                time: time || appointment.time
            },
            { 
                returnDocument: 'after', 
                runValidators: true 
            }
        );
        
        logger.info("Appointment updated:", { id, updatedBy: req.user.id });

        if (updatedAppointment && updatedAppointment.userEmail) {
            try {
                const user = await User.findOne({ $or: [{ _id: updatedAppointment.userId }, { nic: updatedAppointment.nic }] });
                const mobile = user ? user.mobileNumber : null;

                await dispatchNotification({
                    recipientEmail: updatedAppointment.userEmail,
                    recipientMobile: mobile,
                    recipientName: updatedAppointment.userName,
                    type: 'CRITICAL',
                    data: {
                        subject: 'Your Appointment Has Been Updated - VillageFlow',
                        title: 'Appointment Updated Details',
                        bodyHtml: `
                            <p>Dear <b>${updatedAppointment.userName}</b>,</p>
                            <p>Your appointment details have been successfully updated. Here are the new details:</p>
                            <table style="width: 100%; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                <tr><td><b>NIC:</b></td><td>${updatedAppointment.nic}</td></tr>
                                <tr><td><b>Date:</b></td><td>${updatedAppointment.date}</td></tr>
                                <tr><td><b>Time:</b></td><td>${updatedAppointment.time}</td></tr>
                                <tr><td><b>Reason:</b></td><td>${updatedAppointment.reason}</td></tr>
                                <tr><td><b>Status:</b></td><td><b style="color: #f59e0b;">${updatedAppointment.status}</b></td></tr>
                            </table>
                            <p>Your appointment is still pending approval from an officer.</p>
                            <p>Thank you for using the VillageFlow portal.</p>
                        `,
                        smsText: `Your appointment has been updated to ${updatedAppointment.date} at ${updatedAppointment.time}. Status is pending approval.`
                    }
                });
            } catch (e) {
                logger.error("Update Email Send Error:", { error: e.message });
            }
        }
        
        res.status(200).json({ 
            message: 'Appointment updated successfully', 
            appointment: updatedAppointment 
        });
        
    } catch (error) {
        logger.error('Error updating appointment:', { error: error.message });
        res.status(500).json({ message: 'Error updating appointment', error: error.message });
    }
});

router.get('/advance-days', auth, async (req, res) => {
    try {
        const advanceDays = req.systemConfig?.appointment?.advanceBookingDays || 14;
        res.json({ advanceDays });
    } catch (err) {
        logger.error("Get advance days error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify owner or officer
        if (appointment.userId.toString() !== req.user.id && req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Cannot view other citizens' appointments" });
        }

        res.json(appointment);
    } catch (err) {
        logger.error("Get appointment details error:", { error: err.message });
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;