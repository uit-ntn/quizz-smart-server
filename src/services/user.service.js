const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
const register = async (userData) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const user = new User(userData);
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'Nhan123456',
        { expiresIn: '7d' }
    );

    return { user, token };
};

// Login user
const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
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

// Get all users
const getAllUsers = async (filters = {}) => {
    const query = { ...filters };
    return await User.find(query).select('-password');
};

// Get user by ID
const getUserById = async (id) => {
    return await User.findById(id).select('-password');
};

// Update user
const updateUser = async (id, updateData) => {
    // Don't allow password update through this method
    delete updateData.password;
    
    return await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    ).select('-password');
};

// Update password
const updatePassword = async (id, oldPassword, newPassword) => {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    
    return { message: 'Password updated successfully' };
};

// Delete user
const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

// Search users
const searchUsers = async (searchTerm) => {
    return await User.find({
        $or: [
            { full_name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
        ]
    }).select('-password');
};

// Get user profile
const getUserProfile = async (id) => {
    return await User.findById(id).select('-password');
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
            avatar_url: profile.photos[0]?.value
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
            await user.save();
            return user;
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            full_name: profile.displayName,
            authProvider: 'google',
            avatar_url: profile.photos[0]?.value
        });

        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    updatePassword,
    deleteUser,
    searchUsers,
    getUserProfile,
    googleAuth,
    findOrCreateGoogleUser
};
