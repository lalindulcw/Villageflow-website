const { sendBrandedEmail } = require('./emailService');
const { sendSMS } = require('./smsService');

/**
 * Dispatches notifications based on the central rule engine:
 * - EMERGENCY: SMS immediately + Email fallback
 * - CRITICAL: SMS + Email
 * - STANDARD: Email only
 * - MINOR: In-app / Console logging only
 * 
 * @param {Object} options
 * @param {string} [options.recipientEmail] - Recipient's email address
 * @param {string} [options.recipientMobile] - Recipient's mobile number
 * @param {string} [options.recipientName] - Recipient's name
 * @param {string} options.type - Notification severity: 'EMERGENCY', 'CRITICAL', 'STANDARD', 'MINOR'
 * @param {Object} options.data - Notification details
 * @param {string} options.data.subject - Subject line for email
 * @param {string} options.data.title - Title for email body
 * @param {string} options.data.bodyHtml - HTML email content
 * @param {string} options.data.smsText - Standardized plain text message for SMS
 * @param {string} [options.data.buttonText] - Option CTA button text
 * @param {string} [options.data.buttonUrl] - Optional CTA button URL
 * @param {Array} [options.data.attachments] - Optional email attachments
 */
const dispatchNotification = async ({ recipientEmail, recipientMobile, recipientName, type, data }) => {
    console.log(`[NotificationDispatcher] Dispatching ${type} notification for ${recipientName || 'User'}...`);
    
    switch (type) {
        case 'EMERGENCY':
            // Emergency events: SMS immediately + Email fallback
            const smsRes = await sendSMS(recipientMobile, data.smsText);
            if (recipientEmail) {
                // Secondary send/fallback to email to guarantee delivery
                await sendBrandedEmail({
                    to: recipientEmail,
                    subject: data.subject,
                    title: data.title,
                    bodyHtml: data.bodyHtml,
                    buttonText: data.buttonText,
                    buttonUrl: data.buttonUrl,
                    attachments: data.attachments
                });
            }
            break;
            
        case 'CRITICAL':
            // Critical updates: SMS + Email
            if (recipientMobile) {
                await sendSMS(recipientMobile, data.smsText);
            }
            if (recipientEmail) {
                await sendBrandedEmail({
                    to: recipientEmail,
                    subject: data.subject,
                    title: data.title,
                    bodyHtml: data.bodyHtml,
                    buttonText: data.buttonText,
                    buttonUrl: data.buttonUrl,
                    attachments: data.attachments
                });
            }
            break;
            
        case 'STANDARD':
            // Standard updates: Email only
            if (recipientEmail) {
                await sendBrandedEmail({
                    to: recipientEmail,
                    subject: data.subject,
                    title: data.title,
                    bodyHtml: data.bodyHtml,
                    buttonText: data.buttonText,
                    buttonUrl: data.buttonUrl,
                    attachments: data.attachments
                });
            }
            break;
            
        case 'MINOR':
        default:
            // Minor updates: Log/in-app only
            console.log(`[NotificationDispatcher] Minor in-app notification logged: ${data.smsText}`);
            break;
    }
};

module.exports = {
    dispatchNotification
};
