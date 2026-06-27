/**
 * Sends a standardized SMS message.
 * 
 * @param {string} mobileNumber - The citizen or officer mobile phone number
 * @param {string} text - The core message body text
 * @returns {Promise<Object>} Results of the simulated transmission
 */
const sendSMS = async (mobileNumber, text) => {
    try {
        if (!mobileNumber) {
            console.log('[SMSService] Cancelled: No destination mobile number provided.');
            return { success: false, error: 'No mobile number' };
        }

        const prefix = '[VillageFlow]';
        let formattedMsg = text.trim();
        
        if (!formattedMsg.startsWith(prefix)) {
            formattedMsg = `${prefix} ${formattedMsg}`;
        }

        console.log('\n=================== MOCK SMS TRANSMISSION ===================');
        console.log(`| TO:      ${mobileNumber}`);
        console.log(`| MESSAGE: ${formattedMsg}`);
        console.log(`| STATUS:  Delivered (Mock Gateway Success)`);
        console.log('=============================================================\n');

        return { 
            success: true, 
            to: mobileNumber, 
            message: formattedMsg,
            timestamp: new Date()
        };
    } catch (error) {
        console.error('[SMSService] SMS transmission failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendSMS
};
