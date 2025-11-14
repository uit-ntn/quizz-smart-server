const nodemailer = require('nodemailer');

// Mail configuration
const mailConfig = {
    service: 'gmail', // You can change to other services like 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
    }
};

// Create and configure transporter
const createTransporter = () => {
    return nodemailer.createTransporter(mailConfig);
};

// Email templates
const emailTemplates = {
    // Registration OTP template
    registrationOTP: (fullName, otp) => ({
        subject: 'Quiz Smart - Xác thực email đăng ký',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .otp-box { background: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; border: 2px solid #007bff; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Quiz Smart</h1>
                        <h2>Xác thực email đăng ký</h2>
                    </div>
                    <div class="content">
                        <h3>Xin chào ${fullName || 'bạn'}!</h3>
                        <p>Chào mừng bạn đến với Quiz Smart. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới:</p>
                        
                        <div class="otp-box">
                            <p>Mã xác thực của bạn:</p>
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <p><strong>Lưu ý:</strong></p>
                        <ul>
                            <li>Mã OTP này có hiệu lực trong 10 phút</li>
                            <li>Không chia sẻ mã này với bất kỳ ai khác</li>
                            <li>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này</li>
                        </ul>
                        
                        <p>Cảm ơn bạn đã chọn Quiz Smart!</p>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    // Forgot Password OTP template
    forgotPasswordOTP: (fullName, otp) => ({
        subject: 'Quiz Smart - Đặt lại mật khẩu',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .otp-box { background: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; border: 2px solid #dc3545; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Quiz Smart</h1>
                        <h2>Đặt lại mật khẩu</h2>
                    </div>
                    <div class="content">
                        <h3>Xin chào ${fullName || 'bạn'}!</h3>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>
                        
                        <div class="otp-box">
                            <p>Mã đặt lại mật khẩu:</p>
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <div class="warning">
                            <p><strong>⚠️ Lưu ý bảo mật:</strong></p>
                            <ul>
                                <li>Mã OTP này có hiệu lực trong 10 phút</li>
                                <li>Không chia sẻ mã này với bất kỳ ai khác</li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                                <li>Sau khi đặt lại mật khẩu, hãy đăng nhập và thay đổi mật khẩu ngay</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

// Mail sender utility
const sendMail = async (to, template) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@quizsmart.com',
            to: to,
            subject: template.subject,
            html: template.html
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
        throw new Error('Failed to send email');
    }
};

module.exports = {
    mailConfig,
    createTransporter,
    emailTemplates,
    sendMail
};
