const { emailTemplates, sendMail } = require('../config/mail');

// Send OTP email for registration verification
const sendRegistrationOTP = async (email, otp, fullName) => {
    try {
        const template = emailTemplates.registrationOTP(fullName, otp);
        await sendMail(email, template);
        console.log('✅ Registration OTP email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send registration OTP email:', error);
        throw new Error('Failed to send verification email');
    }
};

// Send OTP email for forgot password
const sendForgotPasswordOTP = async (email, otp, fullName) => {
    try {
        const template = emailTemplates.forgotPasswordOTP(fullName, otp);
        await sendMail(email, template);
        console.log('✅ Forgot password OTP email sent successfully to:', email);
        return true;
    } catch (error) {
        console.error('❌ Failed to send forgot password OTP email:', error);
        throw new Error('Failed to send reset password email');
    }
};

module.exports = {
    sendRegistrationOTP,
    sendForgotPasswordOTP
};
