const userService = require('../services/user.service');
const testService = require('../services/test.service');
const testResultService = require('../services/testResult.service');

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

// Hard delete user
const hardDeleteUser = async (req, res) => {
    try {
        // First get user info before deleting
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Xoá tất cả các test của user
        const testsResponse = await testService.getAllTests({ created_by: user._id }, user._id, 'admin');
        const tests = testsResponse.tests || [];
        for (const test of tests) {
            await testService.hardDeleteTest(test._id);
        }
        
        // Xoá tất cả các test result của user  
        const testResults = await testResultService.getTestResultsByUser(user._id);
        for (const testResult of testResults) {
            await testResultService.hardDeleteTestResult(testResult._id);
        }
        
        // Xoá user
        await userService.hardDeleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Alias for default delete (uses soft delete)
const deleteUser = softDeleteUser;

module.exports = {
    getAllUsers,
    searchUsers,
    getUserById,
    getProfile,
    updateUser,
    updateProfile,
    updatePassword,
    deleteUser,        // Default delete (soft delete)
    softDeleteUser,
    hardDeleteUser,
};
