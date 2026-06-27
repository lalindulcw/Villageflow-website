const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    party: { type: String, required: true },
    partyShort: { type: String, default: '' },
    gnDivision: { type: String, required: true },
    electionType: {
        type: String,
        enum: ['Presidential', 'Parliamentary', 'Provincial', 'Local Government', 'Referendum', 'Other'],
        default: 'Local Government'
    },
    photoUrl: { type: String, default: null },
    manifesto: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    votes: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
