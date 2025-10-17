const userService = require('../services/user.service');

class UserController {
    // Register new user
    async register(req, res) {
        try {
            const { user, token } = await userService.register(req.body);
            res.status(201).json({ user, token });
        } catch (error) {
            if (error.code === 11000) {
                res.status(400).json({ message: 'Username or email already exists' });
            } else {
                res.status(400).json({ message: error.message });
            }
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token } = await userService.login(email, password);
            res.json({ user, token });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    // Get current user profile
    async getProfile(req, res) {
        try {
            res.json(req.user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get all users (admin only)
    async getAllUsers(req, res) {
        try {
            const filters = {};
            if (req.query.role) filters.role = req.query.role;
            if (req.query.status) filters.status = req.query.status;

            const users = await userService.getAllUsers(filters);
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get user by ID
    async getUserById(req, res) {
        try {
            const user = await userService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Update user
    async updateUser(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Update own profile
    async updateProfile(req, res) {
        try {
            const user = await userService.updateUser(req.user._id, req.body);
            res.json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            await userService.changePassword(req.user._id, currentPassword, newPassword);
            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Delete user (admin only)
    async deleteUser(req, res) {
        try {
            const user = await userService.deleteUser(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Search users
    async searchUsers(req, res) {
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
    }
}

module.exports = new UserController();