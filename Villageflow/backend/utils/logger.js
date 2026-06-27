const winston = require('winston');
const path = require('path');

// Helper to mask PII fields
const maskPII = (info) => {
    const piiFields = ['password', 'email', 'mobileNumber', 'nic', 'token', 'userEmail', 'mobile'];
    
    const cleanObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = Array.isArray(obj) ? [...obj] : { ...obj };
        
        for (const key in copy) {
            if (piiFields.includes(key) && typeof copy[key] === 'string') {
                copy[key] = '***MASKED***';
            } else if (typeof copy[key] === 'object') {
                copy[key] = cleanObject(copy[key]);
            }
        }
        return copy;
    };

    if (info.message && typeof info.message === 'object') {
        info.message = cleanObject(info.message);
    }

    if (info.metadata) {
        info.metadata = cleanObject(info.metadata);
    }
    
    for (const key in info) {
        if (piiFields.includes(key) && typeof info[key] === 'string') {
            info[key] = '***MASKED***';
        }
    }

    return info;
};

const maskFormat = winston.format((info) => {
    return maskPII(info);
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        maskFormat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, '..', 'logs', 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, '..', 'logs', 'combined.log') 
        })
    ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
