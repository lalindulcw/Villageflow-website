const mongoose = require('mongoose');

const DisasterAlertSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['Flood', 'Landslide', 'Fire', 'Drought', 'Cyclone', 'Earthquake', 'Other'],
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    description: { type: String, required: true },
    affectedArea: { type: String, required: true },
    instructions: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('DisasterAlert', DisasterAlertSchema);
