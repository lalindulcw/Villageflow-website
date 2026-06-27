// models/User.js
const mongoose = require('mongoose');
const { 
    encryptDeterministic, 
    decryptDeterministic, 
    encryptProbabilistic, 
    decryptProbabilistic, 
    encryptQueryParams 
} = require('../utils/encryption');

const UserSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    nic: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: false, 
        sparse: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['citizen', 'officer', 'admin'], 
        default: 'citizen' 
    },

    // Basic Details
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Other', null], 
        default: null 
    },
    dateOfBirth: { 
        type: Date, 
        default: null 
    },
    age: { 
        type: Number, 
        default: null 
    },
    mobileNumber: { 
        type: String, 
        default: null 
    },

    //Address & Residence
    address: { 
        type: String, 
        default: null 
    },
    village: { 
        type: String, 
        default: null 
    },
    city: { 
        type: String, 
        default: null 
    },
    householdNo: { 
        type: String, 
        default: null 
    },

    //Occupation & Others
    occupation: { 
        type: String, 
        default: null 
    },
    emergencyContact: { 
        type: String, 
        default: null 
    },
    agreedToTerms: { 
        type: Boolean, 
        default: false 
    },

    //Proxy Registration
    relationship: {
        type: String,
        enum: [
            "Mother",
            "Father",
            "Son",
            "Daughter",
            "Brother",
            "Sister",
            "Spouse",
            "Relative",
            "Grandfather",
            "Grandmother",
            "Other",
            null
        ],
        default: null
    },

    //Location
    district: { 
        type: String, 
        required: true 
    },
    divisionalSecretariat: { 
        type: String, 
        required: true 
    },
    gnDivision: { 
        type: String, 
        required: true 
    },

    //Administrative
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },

    //Enterprise Security 
    refreshToken: {
        type: String,
        default: null
    },
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaSecret: {
        type: String,
        default: null
    }
}, { timestamps: true });

//Encryption and Decryption Hooks

UserSchema.pre('save', function() {
    if (this.isModified('nic') && this.nic) {
        this.nic = encryptDeterministic(this.nic);
    }
    if (this.isModified('email') && this.email) {
        this.email = encryptDeterministic(this.email);
    }
    if (this.isModified('mobileNumber') && this.mobileNumber) {
        this.mobileNumber = encryptProbabilistic(this.mobileNumber);
    }
});

function decryptUser(doc) {
    if (!doc) return;
    if (doc.nic) doc.nic = decryptDeterministic(doc.nic);
    if (doc.email) doc.email = decryptDeterministic(doc.email);
    if (doc.mobileNumber) doc.mobileNumber = decryptProbabilistic(doc.mobileNumber);
}

UserSchema.post('init', function(doc) {
    decryptUser(doc);
});

UserSchema.post('save', function(doc) {
    decryptUser(doc);
});

UserSchema.post('findOneAndUpdate', function(doc) {
    decryptUser(doc);
});

// Query parsing hooks 
UserSchema.pre('find', function() {
    encryptQueryParams(this.getQuery());
});

UserSchema.pre('findOne', function() {
    encryptQueryParams(this.getQuery());
});

UserSchema.pre('findOneAndUpdate', function() {
    encryptQueryParams(this.getQuery());
    const update = this.getUpdate();
    if (update) {
        if (update.$set) {
            if (update.$set.nic) update.$set.nic = encryptDeterministic(update.$set.nic);
            if (update.$set.email) update.$set.email = encryptDeterministic(update.$set.email);
            if (update.$set.mobileNumber) update.$set.mobileNumber = encryptProbabilistic(update.$set.mobileNumber);
        } else {
            if (update.nic) update.nic = encryptDeterministic(update.nic);
            if (update.email) update.email = encryptDeterministic(update.email);
            if (update.mobileNumber) update.mobileNumber = encryptProbabilistic(update.mobileNumber);
        }
    }
});

module.exports = mongoose.model('User', UserSchema);