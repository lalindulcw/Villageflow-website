require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const path = require("path");
const fs = require('fs');
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

const app = express();

// Enable trust proxy for Render/Cloud environments (required for rate-limiting)
app.set('trust proxy', 1);

if (!process.env.MONGO_URI) {
  logger.error("❌ MONGO_URI is missing. Check .env file + variable name.");
  process.exit(1);
}

// Configured robustly according to OWASP guidelines
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://*"],
            connectSrc: ["'self'", "https://*"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' }
})); 

// Restrict CORS to trusted origins defined in environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 200
}));

// Body limits protection
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || "SL_GOV_VILLAGE_FLOW_COOKIE_SECRET_2026"));

// Simple double-submit CSRF protection for cookie-based sessions
const csrfCheck = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        // If cookies are sent, verify that standard request header is also present
        const hasTokenCookie = req.cookies?.refreshToken || req.signedCookies?.refreshToken;
        if (hasTokenCookie) {
            const hasCsrfHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'] || req.headers['authorization'];
            if (!hasCsrfHeader) {
                return res.status(403).json({ error: "CSRF Validation Failed: Missing verification header" });
            }
        }
    }
    next();
};
app.use(csrfCheck);

// 2. Static Folder & Uploads Check
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info("📁 'uploads' folder created successfully.");
}

const JWT_SECRET = process.env.JWT_SECRET || "SL_GOV_VILLAGE_FLOW_2026";

// Secure File serving middleware checking token authentication & ownership
const secureFileServe = async (req, res, next) => {
    const token = req.query.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
        return res.status(403).json({ error: "Access Denied: Authentication required for documents" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Officers and Admins can access all files
    if (['officer', 'admin'].includes(userRole?.toLowerCase())) {
        return next();
    }

    // Citizens can only access documents they own
    const relativePath = req.path;
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    // Prevent directory traversal and path manipulation
    if (relativePath !== cleanPath) {
        return res.status(400).json({ error: "Bad Request: Invalid file path" });
    }

    try {
        const filename = path.basename(cleanPath);
        const searchPattern = new RegExp(filename + '$');

        // Check Certificates
        const Certificate = require('./models/Certificate');
        const cert = await Certificate.findOne({
            $or: [{ utilityBill: searchPattern }, { nicImage: searchPattern }]
        }).lean();

        if (cert) {
            if (cert.userId.toString() === userId) {
                return next();
            }
            return res.status(403).json({ error: "Access Denied: You do not own this document" });
        }

        // Check Welfare
        const Welfare = require('./models/Welfare');
        const welfare = await Welfare.findOne({
            $or: [{ paySlip: searchPattern }, { nicImage: searchPattern }]
        }).lean();

        if (welfare) {
            if (welfare.userId && welfare.userId.toString() === userId) {
                return next();
            }
            const User = require('./models/User');
            const currentUser = await User.findById(userId).lean();
            if (currentUser && currentUser.nic === welfare.nic) {
                return next();
            }
            return res.status(403).json({ error: "Access Denied: You do not own this document" });
        }

        // Check InfraComplaints
        const InfraComplaint = require('./models/InfraComplaint');
        const complaint = await InfraComplaint.findOne({
            photo: searchPattern
        }).lean();

        if (complaint) {
            if (complaint.citizenId.toString() === userId) {
                return next();
            }
            return res.status(403).json({ error: "Access Denied: You do not own this document" });
        }

        // Deny access if no record links the file to the citizen
        return res.status(403).json({ error: "Access Denied: File ownership not verified" });

    } catch (err) {
        logger.error("File authorization check error:", { error: err.message });
        return res.status(500).json({ error: "Internal server error authorizing file access" });
    }
};

app.use('/uploads', secureFileServe, express.static(uploadDir));

// System Config Middleware
const SystemConfig = require('./models/SystemConfig');
const User = require('./models/User');

const DEFAULT_CONFIG = {
    appointment: {
        maxAppointmentsPerDay: 20,
        availableTimeSlots: ['9.00 AM - 10.00 AM', '10.00 AM - 11.00 AM', '11.00 AM - 12.00 PM', '1.00 PM - 2.00 PM', '2.00 PM - 3.00 PM'],
        advanceBookingDays: 14
    },
    welfare: {
        incomeVerificationRequired: true,
        requiredDocuments: ['nic', 'paySlip'],
        maxApplicationsPerMonth: 50
    },
    general: {
        officeHours: '8.30 AM - 4.15 PM'
    }
};

const configMiddleware = async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        req.systemConfig = DEFAULT_CONFIG;
        return next();
    }
    
    try {
        const gramaniladhari = await User.findOne({ 
            role: { $in: ['officer', 'gramaniladhari'] } 
        }).lean().maxTimeMS(2000);

        const searchId = req.user ? req.user._id : (gramaniladhari ? gramaniladhari._id : null);
        let config = null;

        if (searchId) {
            config = await SystemConfig.findOne({ gramaNiladhariId: searchId }).lean().maxTimeMS(2000);
        }

        req.systemConfig = config || DEFAULT_CONFIG;
        next();
    } catch (err) {
        req.systemConfig = DEFAULT_CONFIG;
        next();
    }
};

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running successfully!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rate Limiting (Brute Force Protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Too many attempts, please try again after 15 minutes."
});

// 3. Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth')); 

app.use(configMiddleware); 

app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/certificates', require('./routes/certificateRoutes')); 
app.use('/api/citizens', require('./routes/citizenRoutes')); 
app.use('/api/assets', require('./routes/assets')); 
app.use('/api/welfare', require('./routes/welfareRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/system', require('./routes/systemConfigRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/disaster', require('./routes/disasterRoutes'));
app.use('/api/infra', require('./routes/infraRoutes'));
app.use('/api/election', require('./routes/electionRoutes'));

const chatbotRoutes = require('./server/chatbot');
app.use('/api/chatbot', chatbotRoutes);

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.originalUrl} not found`
    });
});

// Centralized Error Handling Middleware (prevents raw stack traces & database error leaks)
app.use((err, req, res, next) => {
    logger.error("Internal Server Error caught by middleware:", { error: err.message, stack: err.stack });
    res.status(err.status || 500).json({
        success: false,
        message: "පද්ධති දෝෂයක් සිදුවී ඇත. කරුණාකර පසුව නැවත උත්සාහ කරන්න. (An internal server error occurred.)"
    });
});

// 4. Database Connection & Server Start
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.json({ 
    message: "VillageFlow Backend Running Successfully with Atlas!",
    version: "1.0.0",
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    endpoints: {
        health: "/api/health",
        assets: "/api/assets",
        certificates: "/api/certificates"
    }
}));

app.listen(PORT, () => {
  logger.info(`🚀 Server started on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
});

// Connect to DB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxPoolSize: 10,
    retryWrites: true
  })
  .then(() => {
    logger.info("✅ MongoDB Atlas connected successfully");
  })
  .catch((err) => {
    logger.error("❌ DB initial connection error:", { error: err.message });
  });

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting reconnect...');
});
mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully');
});
mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', { error: err.message });
});