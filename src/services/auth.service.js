const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailService = require('./email.service');
const otpService = require('./otp.service');

// Register new user (step 1 - send OTP)
const register = async (userData) => {
    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser && existingUser.email_verified) {
        throw new Error('User already exists');
    }

    let user;
    if (existingUser && !existingUser.email_verified) {
        // Update existing unverified user
        user = existingUser;
        Object.assign(user, userData);
    } else {
        // Create new user (not verified yet)
        user = new User({ ...userData, email_verified: false });
    }

    // Save user first
    await user.save();
    
    // Generate and store OTP in memory (not database for security)
    const otp = otpService.storeOTP(user.email, 'registration');
    
    // Send OTP email
    await emailService.sendRegistrationOTP(user.email, otp, user.full_name);

    return { 
        message: 'OTP sent to your email. Please verify to complete registration.',
        email: user.email,
        userId: user._id
    };
};

// Login user
const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check if email is verified (only for local auth)
    if (user.authProvider === 'local' && !user.email_verified) {
        throw new Error('Please verify your email before logging in');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'Nhan123456',
        { expiresIn: '7d' }
    );

    return { user, token };
};

// Google OAuth login/register
const googleAuth = async (profile) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || 'Nhan123456',
                { expiresIn: '7d' }
            );
            return { user, token, isNewUser: false };
        }

        // Check if user exists with this email (from local registration)
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authProvider = 'google';
            user.avatar_url = profile.photos[0]?.value || user.avatar_url;
            user.email_verified = true; // Google accounts are verified
            await user.save();
            
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || 'Nhan123456',
                { expiresIn: '7d' }
            );
            return { user, token, isNewUser: false };
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            full_name: profile.displayName,
            authProvider: 'google',
            avatar_url: profile.photos[0]?.value,
            email_verified: true // Google accounts are already verified
        });

        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'Nhan123456',
            { expiresIn: '7d' }
        );
        
        return { user, token, isNewUser: true };
    } catch (error) {
        throw new Error('Google authentication failed');
    }
};

// Find or create user from Google profile
const findOrCreateGoogleUser = async (profile) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            return user;
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.authProvider = 'google';
            user.avatar_url = profile.photos[0]?.value || user.avatar_url;
            user.email_verified = true; // Google accounts are verified
            await user.save();
            return user;
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            full_name: profile.displayName,
            authProvider: 'google',
            avatar_url: profile.photos[0]?.value,
            email_verified: true // Google accounts are already verified
        });

        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};

// Verify registration OTP (complete registration)
const verifyRegistrationOTP = async (email, otp) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    // Verify OTP using memory storage
    const otpResult = otpService.verifyOTP(email, otp);
    if (!otpResult.success) {
        throw new Error(otpResult.error);
    }

    // Complete registration
    user.email_verified = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'Nhan123456',
        { expiresIn: '7d' }
    );

    return { 
        user, 
        token, 
        message: 'Email verified successfully. Registration completed.' 
    };
};

// Resend registration OTP
const resendRegistrationOTP = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    if (user.email_verified) {
        throw new Error('Email is already verified');
    }

    // Generate new OTP in memory
    const otp = otpService.storeOTP(user.email, 'registration');
    
    // Send OTP email
    await emailService.sendRegistrationOTP(user.email, otp, user.full_name);

    return { 
        message: 'New OTP sent to your email.',
        email: user.email
    };
};

// Forgot password - send OTP
const forgotPassword = async (email) => {
    const user = await User.findOne({ email, email_verified: true });
    if (!user) {
        throw new Error('User not found or email not verified');
    }

    // Only for local auth users
    if (user.authProvider !== 'local') {
        throw new Error('Password reset is only available for email/password accounts');
    }

    // Generate OTP in memory for security
    const otp = otpService.storeOTP(user.email, 'forgot-password');
    
    // Send OTP email
    await emailService.sendForgotPasswordOTP(user.email, otp, user.full_name);

    return { 
        message: 'Password reset OTP sent to your email.',
        email: user.email
    };
};

// Reset password with OTP (simplified - one step)
const resetPasswordWithOTP = async (email, otp, newPassword) => {
    const user = await User.findOne({ email, email_verified: true });
    if (!user) {
        throw new Error('User not found');
    }

    // Verify OTP using memory storage
    const otpResult = otpService.verifyOTP(email, otp);
    if (!otpResult.success) {
        throw new Error(otpResult.error);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password reset successfully' };
};

module.exports = {
    register,
    login,
    googleAuth,
    findOrCreateGoogleUser,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    forgotPassword,
    resetPasswordWithOTP
};
