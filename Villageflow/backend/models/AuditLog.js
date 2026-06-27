const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: { 
        type: String, 
        required: true 
    }, 
    
    officerName: { 
        type: String, 
        required: true 
    },
    
    targetNic: { 
        type: String 
    },
    
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);