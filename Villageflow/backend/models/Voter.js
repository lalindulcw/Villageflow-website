const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptQueryParams 
} = require('../utils/encryption');

const VoterSchema = new mongoose.Schema({
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fullName: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    address: { type: String, required: true },
    gnDivision: { type: String, required: true },
    pollingStation: { type: String, default: '' },
    pollingStationAddress: { type: String, default: '' },
    voterIdNumber: { type: String, default: '' },
    isRegistered: { type: Boolean, default: true },
    registrationStatus: {
        type: String,
        enum: ['Active', 'Pending', 'Inactive'],
        default: 'Active'
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Encryption and Decryption Hooks 

VoterSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
});

function decryptVoter(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
}

VoterSchema.post('init', function(doc) {
    decryptVoter(doc);
});

VoterSchema.post('save', function(doc) {
    decryptVoter(doc);
});

VoterSchema.post('findOneAndUpdate', function(doc) {
    decryptVoter(doc);
});

VoterSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

VoterSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

VoterSchema.pre('findOneAndUpdate', function() {
    encryptQueryParams(this.getQuery());
    const update = this.getUpdate();
    if (update) {
        if (update.$set && update.$set.nic) {
            update.$set.nic = encryptDeterministic(update.$set.nic);
        } else if (update.nic) {
            update.nic = encryptDeterministic(update.nic);
        }
    }
});

module.exports = mongoose.model('Voter', VoterSchema);

