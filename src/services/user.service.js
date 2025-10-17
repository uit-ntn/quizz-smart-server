const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UserService {
    // Generate JWT token
    generateToken(userId) {
        return jwt.sign(
            { userId }, 
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
    }

    // Register new user
    async register(userData) {
        try {
            const user = new User(userData);
            await user.save();
            const token = this.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const user = await User.findOne({ email, status: 'active' });
            if (!user) {
                throw new Error('Invalid credentials');
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            const token = this.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw error;
        }
    }

    // Get all users
    async getAllUsers(filters = {}) {
        try {
            const query = { ...filters };
            return await User.find(query);
        } catch (error) {
            throw error;
        }
    }

    // Get user by ID
    async getUserById(id) {
        try {
            return await User.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Update user
    async updateUser(id, updateData) {
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
    }

    // Change password
    async changePassword(id, currentPassword, newPassword) {
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
    }

    // Delete user (soft delete by changing status)
    async deleteUser(id) {
        try {
            return await User.findByIdAndUpdate(
                id,
                { status: 'inactive' },
                { new: true }
            );
        } catch (error) {
            throw error;
        }
    }

    // Search users
    async searchUsers(searchTerm) {
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
    }
}

module.exports = new UserService();