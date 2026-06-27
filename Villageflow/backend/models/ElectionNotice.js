const mongoose = require('mongoose');

const ElectionNoticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    electionType: {
        type: String,
        enum: ['Presidential', 'Parliamentary', 'Provincial', 'Local Government', 'Referendum', 'Other'],
        default: 'Local Government'
    },
    electionDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ElectionNotice', ElectionNoticeSchema);
