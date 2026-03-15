const User = require('../models/User');


// Create user (admin only)
const createUser = async (userData) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Create new user
    const user = new User({
        email: userData.email,
        password: userData.password, // Will be hashed by pre-save hook
        full_name: userData.full_name,
        role: userData.role || 'user',
        avatar_url: userData.avatar_url || null,
        email_verified: userData.email_verified || false,
        authProvider: 'local'
    });

    await user.save();
    return user.toJSON(); // Returns user without password
};

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

// Admin update user password (no old password required)
const adminUpdatePassword = async (id, newPassword) => {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
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

// Get 7 newest users (updated for FE requirement)
const getLatestUsers = async (limit = 7) => {
    return await User.find()
        .select('-password')
        .sort({ created_at: -1 })
        .limit(limit);
};

// Get top contributors (users who created the most tests)
const getTopContributors = async (limit = 5) => {
    const Test = require('../models/Test');
    
    const pipeline = [
        {
            $match: {
                status: { $ne: 'deleted' }
            }
        },
        {
            $group: {
                _id: '$created_by',
                total_tests: { $sum: 1 },
                vocabulary_tests: {
                    $sum: { $cond: [{ $eq: ['$test_type', 'vocabulary'] }, 1, 0] }
                },
                multiple_choice_tests: {
                    $sum: { $cond: [{ $eq: ['$test_type', 'multiple_choice'] }, 1, 0] }
                },
                grammar_tests: {
                    $sum: { $cond: [{ $eq: ['$test_type', 'grammar'] }, 1, 0] }
                },
                tests: {
                    $push: {
                        test_id: '$_id',
                        test_title: '$test_title',
                        test_type: '$test_type',
                        main_topic: '$main_topic',
                        sub_topic: '$sub_topic',
                        created_at: '$created_at'
                    }
                }
            }
        },
        {
            $sort: { total_tests: -1 }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user_info'
            }
        },
        {
            $unwind: '$user_info'
        },
        {
            $project: {
                _id: 0,
                user_id: '$_id',
                full_name: '$user_info.full_name',
                email: '$user_info.email',
                avatar_url: '$user_info.avatar_url',
                created_at: '$user_info.created_at',
                total_tests: 1,
                vocabulary_tests: 1,
                multiple_choice_tests: 1,
                grammar_tests: 1,
                tests: {
                    $slice: ['$tests', 10] // Giới hạn 10 bài test gần nhất
                }
            }
        }
    ];
    
    return await Test.aggregate(pipeline);
};

// Get system overview statistics
const getSystemOverview = async () => {
    const User = require('../models/User');
    const Test = require('../models/Test');
    const TestResult = require('../models/TestResult');
    
    const [
        totalUsers,
        totalTests,
        totalTestResults,
        activeUsers,
        testsThisWeek,
        testResultsThisWeek
    ] = await Promise.all([
        User.countDocuments(),
        Test.countDocuments({ status: { $ne: 'deleted' } }),
        TestResult.countDocuments({ status: 'active' }),
        User.countDocuments({ 
            updated_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
        }),
        Test.countDocuments({ 
            status: { $ne: 'deleted' },
            created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        TestResult.countDocuments({ 
            status: 'active',
            created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    ]);

    // Test breakdown by type
    const testsByType = await Test.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $group: { _id: '$test_type', count: { $sum: 1 } } }
    ]);

    // Average test completion rate
    const avgCompletionRate = await TestResult.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
    ]);

    // ✅ NEW: Get detailed topic statistics from Topic collection
    const Topic = require('../models/Topic');
    const [topicStats] = await Topic.aggregate([
        { $match: { active: true } },
        {
            $group: {
                _id: null,
                total_main_topics: { $sum: 1 },
                total_sub_topics: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: '$sub_topics',
                                cond: { $eq: ['$$this.active', true] }
                            }
                        }
                    }
                },
                total_views: { $sum: '$views' },
                avg_subtopics_per_topic: {
                    $avg: {
                        $size: {
                            $filter: {
                                input: '$sub_topics',
                                cond: { $eq: ['$$this.active', true] }
                            }
                        }
                    }
                }
            }
        }
    ]);

    // Get topics with most subtopics
    const topTopicsWithSubtopics = await Topic.aggregate([
        { $match: { active: true } },
        {
            $project: {
                name: 1,
                views: 1,
                active_subtopics_count: {
                    $size: {
                        $filter: {
                            input: '$sub_topics',
                            cond: { $eq: ['$$this.active', true] }
                        }
                    }
                }
            }
        },
        { $sort: { active_subtopics_count: -1 } },
        { $limit: 5 }
    ]);

    return {
        users: {
            total: totalUsers,
            active_last_30_days: activeUsers
        },
        tests: {
            total: totalTests,
            created_this_week: testsThisWeek,
            by_type: testsByType.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        },
        topics: {
            total_main_topics: topicStats?.total_main_topics || 0,
            total_sub_topics: topicStats?.total_sub_topics || 0,
            total_views: topicStats?.total_views || 0,
            avg_subtopics_per_topic: Math.round(topicStats?.avg_subtopics_per_topic || 0),
            top_topics_with_subtopics: topTopicsWithSubtopics
        },
        test_results: {
            total: totalTestResults,
            completed_this_week: testResultsThisWeek,
            average_score: Math.round(avgCompletionRate[0]?.avgPercentage || 0)
        }
    };
};

module.exports = {
    createUser,
    getAllUsers,
    searchUsers,
    getUserById,
    updateUser,
    updatePassword,
    adminUpdatePassword,
    hardDeleteUser,
    softDeleteUser,
    getLatestUsers,
    getTopContributors,
    getSystemOverview,
};
