const nodemailer = require('nodemailer');

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'villageflow6@gmail.com',
        pass: process.env.EMAIL_PASS || 'jcpwnzwionobbeey'
    }
});

/**
 * Sends a standardized branded email using the VillageFlow template.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address or array of addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.title - Branded header title for the email body
 * @param {string} options.bodyHtml - Main email message body (supports HTML tags)
 * @param {string} [options.buttonText] - Text for Optional Call-To-Action button
 * @param {string} [options.buttonUrl] - URL for Optional Call-To-Action button
 * @param {Array} [options.attachments] - Optional attachments array for Nodemailer
 */
const sendBrandedEmail = async ({ to, subject, title, bodyHtml, buttonText, buttonUrl, attachments }) => {
    try {
        const fromEmail = process.env.EMAIL_USER || 'villageflow6@gmail.com';
        
        // Define the standardized enterprise HTML template
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; -webkit-font-smoothing: antialiased;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border-top: 6px solid #800000; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden;">
                                <!-- HEADER -->
                                <tr>
                                    <td align="center" style="padding: 25px 20px 20px 20px; background-color: #ffffff; border-bottom: 1px solid #f0f0f0;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #800000; letter-spacing: 1px;">
                                            Village<span style="color: #fbc531;">Flow</span>
                                        </h1>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-weight: 700;">
                                            Government Digital Access Portal
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- CONTENT HEADER -->
                                <tr>
                                    <td style="padding: 30px 40px 10px 40px;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: left;">
                                            ${title}
                                        </h2>
                                    </td>
                                </tr>
                                
                                <!-- BODY -->
                                <tr>
                                    <td style="padding: 10px 40px 30px 40px; font-size: 15px; line-height: 1.6; color: #475569; text-align: left;">
                                        ${bodyHtml}
                                        
                                        <!-- BUTTON -->
                                        ${buttonText && buttonUrl ? `
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 25px; margin-bottom: 10px;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${buttonUrl}" target="_blank" style="display: inline-block; padding: 12px 30px; background-color: #800000; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 6px; box-shadow: 0 4px 6px rgba(128,0,0,0.15); border: 2px solid #800000; transition: all 0.2s ease;">
                                                            ${buttonText}
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        ` : ''}
                                    </td>
                                </tr>
                                
                                <!-- FOOTER -->
                                <tr>
                                    <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                                            VillageFlow Administrative Services
                                        </p>
                                        <p style="margin: 0 0 15px 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                                            This is an automated notification. Please do not reply directly to this email. For assistance, contact your divisional Grama Niladhari officer.
                                        </p>
                                        <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                                            &copy; 2026 VillageFlow. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"VillageFlow Portal" <${fromEmail}>`,
            to,
            subject,
            html: emailTemplate,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully to ${to}. Response: ${info.response}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBrandedEmail
};
