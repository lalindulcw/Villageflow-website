const mongoose = require('mongoose');

const ShelterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    contactNumber: { type: String, default: '' },
    facilities: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Shelter', ShelterSchema);
