const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.signedCookies && req.signedCookies.token) {
        token = req.signedCookies.token;
    }
    
    if (!token) {
        return res.status(401).json({ error: 'සත්‍යාපනය අවශ්‍යයි - Token එක නැත' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is missing in production!');
        }
        const secretKey = secret || 'SL_GOV_VILLAGE_FLOW_2026';
        const decoded = jwt.verify(token, secretKey);
        
        req.user = decoded.user; 
        
        console.log("✅ [AUTH] User verified:", req.user.id);
        next();
    } catch (err) {
        console.error("❌ [AUTH] Token Error:", err.message);
        res.status(401).json({ error: 'වලංගු නොවන token එකකි' });
    }
};

// Add helper for role authorization (e.g., auth.authorize(['officer', 'admin']))
auth.authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'සත්‍යාපනය අවශ්‍යයි - Unauthorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'මෙම ක්‍රියාව සඳහා අවසර නැත - Forbidden' });
        }
        next();
    };
};

module.exports = auth;