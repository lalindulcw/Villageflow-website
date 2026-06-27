const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptQueryParams 
} = require('../utils/encryption');

const AppointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    nic: { type: String, required: true },
    reason: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    userEmail: { type: String } 
}, { timestamps: true });

AppointmentSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
    if (this.isModified('userEmail') && this.userEmail) {
        this.userEmail = encryptDeterministic(this.userEmail);
    }
});

function decryptAppointment(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
    if (doc.userEmail) doc.userEmail = decryptDeterministic(doc.userEmail);
}

AppointmentSchema.post('init', function(doc) {
    decryptAppointment(doc);
});

AppointmentSchema.post('save', function(doc) {
    decryptAppointment(doc);
});

AppointmentSchema.post('findOneAndUpdate', function(doc) {
    decryptAppointment(doc);
});

AppointmentSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

AppointmentSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

AppointmentSchema.pre('findOneAndUpdate', function() {
    encryptQueryParams(this.getQuery());
    const update = this.getUpdate();
    if (update) {
        if (update.$set) {
            if (update.$set.nic) update.$set.nic = encryptDeterministic(update.$set.nic);
            if (update.$set.userEmail) update.$set.userEmail = encryptDeterministic(update.$set.userEmail);
        } else {
            if (update.nic) update.nic = encryptDeterministic(update.nic);
            if (update.userEmail) update.userEmail = encryptDeterministic(update.userEmail);
        }
    }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);