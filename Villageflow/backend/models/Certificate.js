const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptQueryParams 
} = require('../utils/encryption');

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    certificateType: {
        type: String,
        required: true,
        enum: ['Residency Certificate', 'Character Certificate', 'Income Certificate', 'Birth Certificate Copy']
    },
    applyFor: {
        type: String,
        required: true,
        enum: ['Self', 'Family']
    },
    memberName: {
        type: String,
        required: true
    },
    nic: {
        type: String,
        required: true
    },
    relationship: {
        type: String,
        default: 'Self'
    },
    utilityBill: {
        type: String,
        required: true
    },
    nicImage: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    reviewedDate: {
        type: Date,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank', 'mobile', 'offline', null],
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    paymentAmount: {
        type: Number,
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Encryption and Decryption Hooks 

CertificateSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
});

function decryptCertificate(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
}

CertificateSchema.post('init', function(doc) {
    decryptCertificate(doc);
});

CertificateSchema.post('save', function(doc) {
    decryptCertificate(doc);
});

CertificateSchema.post('findOneAndUpdate', function(doc) {
    decryptCertificate(doc);
});

CertificateSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

CertificateSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

CertificateSchema.pre('findOneAndUpdate', function() {
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

module.exports = mongoose.model('Certificate', CertificateSchema);
