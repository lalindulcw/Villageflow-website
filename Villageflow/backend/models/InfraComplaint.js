const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptProbabilistic, 
    decryptProbabilistic, 
    encryptQueryParams 
} = require('../utils/encryption');

const InfraComplaintSchema = new mongoose.Schema({
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    citizenName: { type: String, required: true },
    nic: { type: String, required: true },
    mobileNumber: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Drainage', 'Bridge', 'Other'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    photo: { type: String, default: null },
    status: {
        type: String,
        enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Submitted'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    officerNote: { type: String, default: '' },
    rating: { type: Number, default: null, min: 1, max: 5 },
    assignedTo: { type: String, default: '' },
    resolvedDate: { type: Date, default: null }
}, { timestamps: true });

//Encryption and Decryption Hooks

InfraComplaintSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
    if (this.isModified('mobileNumber') && this.mobileNumber) {
        this.mobileNumber = encryptProbabilistic(this.mobileNumber);
    }
});

function decryptInfraComplaint(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
    if (doc.mobileNumber) doc.mobileNumber = decryptProbabilistic(doc.mobileNumber);
}

InfraComplaintSchema.post('init', function(doc) {
    decryptInfraComplaint(doc);
});

InfraComplaintSchema.post('save', function(doc) {
    decryptInfraComplaint(doc);
});

InfraComplaintSchema.post('findOneAndUpdate', function(doc) {
    decryptInfraComplaint(doc);
});

InfraComplaintSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

InfraComplaintSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

InfraComplaintSchema.pre('findOneAndUpdate', function() {
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

module.exports = mongoose.model('InfraComplaint', InfraComplaintSchema);
