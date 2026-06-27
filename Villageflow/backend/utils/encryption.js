const crypto = require('crypto');

// Symmetric Key source for database encryption. Must be loaded from env in production.
const keySource = process.env.DB_ENCRYPTION_KEY;
if (!keySource && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: DB_ENCRYPTION_KEY environment variable is required in production mode!');
}
const encryptionKeySource = keySource || 'SL_GOV_VILLAGE_FLOW_DB_ENC_2026_!';

// Deriving a 32-byte key from keySource using SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(encryptionKeySource).digest();
const IV_LENGTH = 16; 

// Deterministic encryption/decryption (for indexable/queryable fields like nic and email)
// Always returns the same ciphertext for a given plaintext, allowing findOne lookups.
function encryptDeterministic(text) {
    if (text === null || text === undefined) return text;
    const strText = String(text).trim();
    if (strText.startsWith('det:')) return strText; // Already encrypted
    
    try {
        const iv = Buffer.alloc(IV_LENGTH, 0); // 16 bytes of zeros for static IV
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(strText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `det:${encrypted}`;
    } catch (err) {
        console.error("Deterministic encryption failed:", err);
        return text;
    }
}

function decryptDeterministic(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('det:')) {
        return ciphertext;
    }
    
    try {
        const encryptedText = ciphertext.substring(4);
        const iv = Buffer.alloc(IV_LENGTH, 0);
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error("Deterministic decryption failed:", err);
        return ciphertext;
    }
}

// Probabilistic encryption/decryption (for non-searchable sensitive fields like mobileNumber)
// Generates a random IV for every encryption, producing distinct ciphertexts for security.
function encryptProbabilistic(text) {
    if (text === null || text === undefined) return text;
    const strText = String(text).trim();
    if (strText.startsWith('prob:')) return strText; // Already encrypted
    
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(strText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `prob:${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
        console.error("Probabilistic encryption failed:", err);
        return text;
    }
}

function decryptProbabilistic(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('prob:')) {
        return ciphertext;
    }
    
    try {
        const parts = ciphertext.split(':');
        if (parts.length < 3) return ciphertext;
        
        const iv = Buffer.from(parts[1], 'hex');
        const encryptedText = parts[2];
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error("Probabilistic decryption failed:", err);
        return ciphertext;
    }
}

// Mongoose query helper to intercept queries and encrypt search keys (for backward compatibility)
// We scan the query filter for nic and email, and replace them with $in: [plainText, encryptedText]
function encryptQueryParams(query) {
    if (!query || typeof query !== 'object') return;
    
    for (let key in query) {
        if (key === 'nic' || key === 'email' || key === 'userEmail') {
            const val = query[key];
            if (typeof val === 'string' && !val.startsWith('det:')) {
                const plainVal = val.trim();
                const encVal = encryptDeterministic(plainVal);
                query[key] = { $in: [plainVal, encVal] };
            } else if (val && typeof val === 'object' && val.$or) {
                encryptQueryParams(val);
            }
        } else if (key === '$or' || key === '$and') {
            if (Array.isArray(query[key])) {
                query[key].forEach(item => encryptQueryParams(item));
            }
        } else if (typeof query[key] === 'object' && query[key] !== null) {
            encryptQueryParams(query[key]);
        }
    }
}

module.exports = {
    encryptDeterministic,
    decryptDeterministic,
    encryptProbabilistic,
    decryptProbabilistic,
    encryptQueryParams
};
