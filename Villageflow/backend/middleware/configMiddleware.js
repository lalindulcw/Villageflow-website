const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');

const configMiddleware = async (req, res, next) => {
    try {
        const gramaniladhari = await User.findOne({ 
            role: { $in: ['officer', 'gramaniladhari'] } 
        });

        if (gramaniladhari) {
            const config = await SystemConfig.findOne({ gramaNiladhariId: gramaniladhari._id });
            if (config) {
                req.systemConfig = config; 
            }
        }
        next();
    } catch (err) {
        console.error("Config Middleware Error:", err);
        next();
    }
};

module.exports = configMiddleware;