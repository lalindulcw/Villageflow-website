const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptQueryParams 
} = require('../utils/encryption');

const WelfareSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    nic: { type: String, required: true },
    householdNo: { type: String, required: true },
    type: { type: String, enum: ['Aswasuma', 'Samurdhi', 'Elderly Allowance'], required: true },
    amount: { type: Number, default: 0 },
    income: { type: Number, required: true, default: 0 },
    status: { 
        type: String, 
        enum: ['Active', 'Suspended', 'Pending'], 
        default: 'Pending' 
    },
    paySlip: { type: String, default: null },
    nicImage: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    userEmail: { type: String, default: null },
    editHistory: [{
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: String },
        changes: { type: Object }
    }]
}, { timestamps: true });

WelfareSchema.index({ nic: 1, type: 1 }, { unique: true });

//Encryption and Decryption Hooks

WelfareSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
    if (this.isModified('userEmail') && this.userEmail) {
        this.userEmail = encryptDeterministic(this.userEmail);
    }
});

function decryptWelfare(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
    if (doc.userEmail) doc.userEmail = decryptDeterministic(doc.userEmail);
}

WelfareSchema.post('init', function(doc) {
    decryptWelfare(doc);
});

WelfareSchema.post('save', function(doc) {
    decryptWelfare(doc);
});

WelfareSchema.post('findOneAndUpdate', function(doc) {
    decryptWelfare(doc);
});

WelfareSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

WelfareSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

WelfareSchema.pre('findOneAndUpdate', function() {
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

module.exports = mongoose.model('Welfare', WelfareSchema);
