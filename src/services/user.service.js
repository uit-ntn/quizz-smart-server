const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
};

// Register new user
const register = async (userData) => {
    try {
        const user = new User(userData);
        await user.save();
        const token = generateToken(user._id);
        return { user, token };
    } catch (error) {
        throw error;
    }
};

// Login user
const login = async (email, password) => {
    try {
        const user = await User.findOne({ email, status: 'active' });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = generateToken(user._id);
        return { user, token };
    } catch (error) {
        throw error;
    }
};

// Get all users
const getAllUsers = async (filters = {}) => {
    try {
        const query = { ...filters };
        return await User.find(query);
    } catch (error) {
        throw error;
    }
};

// Get user by ID
const getUserById = async (id) => {
    try {
        return await User.findById(id);
    } catch (error) {
        throw error;
    }
};

// Update user
const updateUser = async (id, updateData) => {
    try {
        // Don't allow password update through this method
        delete updateData.password_hash;
        
        return await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};

// Change password
const changePassword = async (id, currentPassword, newPassword) => {
    try {
        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new Error('Current password is incorrect');
        }

        user.password_hash = newPassword;
        await user.save();
        return user;
    } catch (error) {
        throw error;
    }
};

// Delete user (soft delete by changing status)
const deleteUser = async (id) => {
    try {
        return await User.findByIdAndUpdate(
            id,
            { status: 'inactive' },
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};

// Search users
const searchUsers = async (searchTerm) => {
    try {
        return await User.find({
            $or: [
                { username: { $regex: searchTerm, $options: 'i' } },
                { full_name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ]
        });
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateToken,
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    changePassword,
    deleteUser,
    searchUsers
};