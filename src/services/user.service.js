const User = require('../models/User');

// Get all users
const getAllUsers = async (filters = {}) => {
    const query = { ...filters };
    return await User.find(query).select('-password');
};

// Search users
const searchUsers = async (searchTerm) => {
    const query = {
        $or: [
            { full_name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { username: { $regex: searchTerm, $options: 'i' } }
        ]
    };
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
const hardDeleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

const softDeleteUser = async (id) => {
    return await User.findByIdAndUpdate(id, { is_deleted: true });
};

module.exports = {
    getAllUsers,
    searchUsers,
    getUserById,
    updateUser,
    updatePassword,
    hardDeleteUser,
    softDeleteUser,
};
