const userService = require('../services/user.service');
const testService = require('../services/test.service');
const testResultService = require('../services/testResult.service');

// Create user (admin only)
const createUser = async (req, res) => {
    try {
        const { email, password, full_name, role, avatar_url, email_verified } = req.body;

        // Validation
        if (!email || !password || !full_name) {
            return res.status(400).json({ 
                message: 'Email, password, and full_name are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters' 
            });
        }

        const user = await userService.createUser({
            email,
            password,
            full_name,
            role: role || 'user',
            avatar_url,
            email_verified: email_verified || false
        });

        res.status(201).json({
            message: 'User created successfully',
            user
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const filters = {};
        if (req.query.role) filters.role = req.query.role;

        const users = await userService.getAllUsers(filters);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search users (admin only)
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search term is required' });
        }

        const users = await userService.searchUsers(q);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update current user profile
const updateProfile = async (req, res) => {
    try {
        const user = await userService.updateUser(req.user.userId, req.body);
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update password
const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const result = await userService.updatePassword(req.user.userId, oldPassword, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Admin update user password (no old password required)
const adminUpdatePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password is required and must be at least 6 characters' 
            });
        }
        
        const result = await userService.adminUpdatePassword(req.params.id, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Soft delete user
const softDeleteUser = async (req, res) => {
    try {
        const user = await userService.softDeleteUser(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete user only (không xóa tests - RECOMMENDED)
const deleteUserOnly = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Chỉ xóa user, GIỮ LẠI tất cả tests và test results
        await userService.hardDeleteUser(req.params.id);
        res.json({ message: 'User deleted successfully (tests preserved)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Hard delete user WITHOUT CASCADE (không xóa tests - SAFE)
const hardDeleteUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // CHỈ xóa user, KHÔNG xóa tests và test results
        await userService.hardDeleteUser(req.params.id);
        res.json({ message: 'User deleted successfully (tests preserved)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Alias for default delete (uses soft delete)
const deleteUser = softDeleteUser;

// Get 5 newest users
const getLatestUsers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const users = await userService.getLatestUsers(limit);
        res.json({
            success: true,
            message: 'Latest users fetched successfully',
            count: users.length,
            users
        });
    } catch (error) {
        console.error('❌ Error in getLatestUsers:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// Get top contributors
const getTopContributors = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const contributors = await userService.getTopContributors(limit);
        res.json({
            success: true,
            message: 'Top contributors fetched successfully',
            count: contributors.length,
            contributors
        });
    } catch (error) {
        console.error('❌ Error in getTopContributors:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    searchUsers,
    getUserById,
    getProfile,
    updateUser,
    updateProfile,
    updatePassword,
    adminUpdatePassword,
    deleteUser,        // Default delete (soft delete)
    softDeleteUser,
    hardDeleteUser,
    getLatestUsers,
    getTopContributors,

    // Get system overview statistics
    getSystemOverview: async (req, res) => {
        try {
            const stats = await userService.getSystemOverview();
            res.json({
                success: true,
                message: 'System overview fetched successfully',
                stats
            });
        } catch (error) {
            console.error('❌ Error in getSystemOverview:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },
};
