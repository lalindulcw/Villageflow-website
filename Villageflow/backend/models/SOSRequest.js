const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptProbabilistic, 
    decryptProbabilistic, 
    encryptQueryParams 
} = require('../utils/encryption');

const SOSRequestSchema = new mongoose.Schema({
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    citizenName: { type: String, required: true },
    nic: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    location: { type: String, required: true },
    helpType: {
        type: String,
        enum: ['Rescue', 'Food', 'Shelter', 'Medical', 'Other'],
        required: true
    },
    personsAffected: { type: Number, default: 1 },
    description: { type: String, default: '' },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    },
    resolvedNote: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

//Encryption and Decryption Hooks

SOSRequestSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
    if (this.isModified('mobileNumber') && this.mobileNumber) {
        this.mobileNumber = encryptProbabilistic(this.mobileNumber);
    }
});

function decryptSOSRequest(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
    if (doc.mobileNumber) doc.mobileNumber = decryptProbabilistic(doc.mobileNumber);
}

SOSRequestSchema.post('init', function(doc) {
    decryptSOSRequest(doc);
});

SOSRequestSchema.post('save', function(doc) {
    decryptSOSRequest(doc);
});

SOSRequestSchema.post('findOneAndUpdate', function(doc) {
    decryptSOSRequest(doc);
});

SOSRequestSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

SOSRequestSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

SOSRequestSchema.pre('findOneAndUpdate', function() {
    encryptQueryParams(this.getQuery());
    const update = this.getUpdate();
    if (update) {
        if (update.$set) {
            if (update.$set.nic) update.$set.nic = encryptDeterministic(update.$set.nic);
            if (update.$set.mobileNumber) update.$set.mobileNumber = encryptProbabilistic(update.$set.mobileNumber);
        } else {
            if (update.nic) update.nic = encryptDeterministic(update.nic);
            if (update.mobileNumber) update.mobileNumber = encryptProbabilistic(update.mobileNumber);
        }
    }
});

module.exports = mongoose.model('SOSRequest', SOSRequestSchema);
