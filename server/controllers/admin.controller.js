import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Question } from "../models/Question.js";
import { Interview } from "../models/Interview.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import mongoose from "mongoose";

/**
 * @route   GET /api/admin/stats
 * @method  GET
 * @access  Admin Only
 * @desc    Get admin dashboard statistics
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  // Get all statistics in parallel for better performance
  const [
    totalUsers,
    totalQuestions,
    totalInterviews,
    completedInterviews,
    recentUsers,
    recentInterviews,
    categoryStats
  ] = await Promise.all([
    // Total counts
    User.countDocuments(),
    Question.countDocuments(),
    Interview.countDocuments(),
    Interview.countDocuments({ status: "completed" }),
    
    // Recent activity (last 7 days)
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    Interview.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    
    // Questions by category
    Question.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])
  ]);

  // Calculate completion rate
  const completionRate = totalInterviews > 0 
    ? parseFloat(((completedInterviews / totalInterviews) * 100).toFixed(2))
    : 0;

  // Format category stats
  const formattedCategoryStats = categoryStats.map(cat => ({
    category: cat._id,
    questionCount: cat.count
  }));

  return res.status(200).json(
    new APIResponse(200, {
      overview: {
        totalUsers,
        totalQuestions,
        totalInterviews,
        completedInterviews,
        completionRate: `${completionRate}%`
      },
      recentActivity: {
        newUsersThisWeek: recentUsers,
        newInterviewsThisWeek: recentInterviews
      },
      categoryBreakdown: formattedCategoryStats,
      lastUpdated: new Date().toISOString()
    }, "Admin dashboard statistics retrieved successfully")
  );
});

/**
 * @route   GET /api/admin/users
 * @method  GET
 * @access  Admin Only
 * @desc    List all users with basic information
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search = "", 
    role = "", 
    sortBy = "createdAt", 
    sortOrder = "desc" 
  } = req.query;

  // Validate pagination parameters
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    throw new APIError(400, "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100");
  }

  // Build filter object
  const filter = {};
  
  // Search filter (search in username, email, and fullName)
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { fullName: { $regex: search, $options: "i" } }
    ];
  }

  // Role filter
  if (role && ["user", "admin"].includes(role)) {
    filter.role = role;
  }

  // Validate sort parameters
  const validSortFields = ["createdAt", "username", "email", "fullName", "accountType"];
  const validSortOrders = ["asc", "desc"];
  
  if (!validSortFields.includes(sortBy)) {
    throw new APIError(400, `Invalid sort field. Must be one of: ${validSortFields.join(", ")}`);
  }
  
  if (!validSortOrders.includes(sortOrder)) {
    throw new APIError(400, "Invalid sort order. Must be 'asc' or 'desc'");
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate skip value for pagination
  const skip = (pageNum - 1) * limitNum;

  // Execute query with pagination
  const users = await User.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .select("_id username email fullName role accountType createdAt")
    .lean();

  // Get total count for pagination metadata
  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / limitNum);

  return res.status(200).json(
    new APIResponse(200, {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }, "Users retrieved successfully")
  );
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @method  PUT
 * @access  Admin Only
 * @desc    Update a user's role
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid user ID format");
  }

  // Validate role
  if (!role || !["user", "admin"].includes(role)) {
    throw new APIError(400, "Role must be either 'user' or 'admin'");
  }

  // Prevent admin from removing their own admin role
  if (id === req.user._id.toString() && role === "user") {
    throw new APIError(400, "Cannot remove your own admin privileges");
  }

  // Find and update the user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { 
      new: true, // Return the updated document
      runValidators: true // Run schema validators
    }
  ).select("_id username email fullName role accountType updatedAt");

  if (!updatedUser) {
    throw new APIError(404, "User not found");
  }

  return res.status(200).json(
    new APIResponse(200, {
      user: updatedUser,
    }, `User role updated to ${role} successfully`)
  );
});

/**
 * @route   DELETE /api/admin/users/:id
 * @method  DELETE
 * @access  Admin Only
 * @desc    Delete a user and cascade delete their interviews
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid user ID format");
  }

  // Prevent admin from deleting themselves
  if (id === req.user._id.toString()) {
    throw new APIError(400, "Cannot delete your own account");
  }

  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Use a transaction to ensure data consistency
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all interviews created by this user
    const deletedInterviews = await Interview.deleteMany(
      { user: id },
      { session }
    );

    // Remove user from interview history in other users' records
    await User.updateMany(
      { "interviewHistory.interview": { $in: deletedInterviews.map(i => i._id) } },
      { $pull: { interviewHistory: { interview: { $in: deletedInterviews.map(i => i._id) } } } },
      { session }
    );

    // Delete the user
    await User.findByIdAndDelete(id, { session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).json(
      new APIResponse(200, {
        deletedUserId: id,
        deletedInterviewsCount: deletedInterviews.length,
      }, "User and associated data deleted successfully")
    );

  } catch (error) {
    // Rollback the transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @method  GET
 * @access  Admin Only
 * @desc    Get detailed user information including interview history
 */
export const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid user ID format");
  }

  // Find user with populated interview history
  const user = await User.findById(id)
    .select("-password -refreshToken")
    .populate({
      path: "interviewHistory.interview",
      select: "category status score completedAt createdAt",
      options: { sort: { createdAt: -1 } }
    })
    .lean();

  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Calculate user statistics
  const interviewStats = {
    totalInterviews: user.interviewHistory.length,
    completedInterviews: user.interviewHistory.filter(h => h.interview?.status === "completed").length,
    averageScore: 0,
    recentActivity: user.interviewHistory.filter(h => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return h.createdAt >= weekAgo;
    }).length
  };

  // Calculate average score from completed interviews
  const completedInterviews = user.interviewHistory.filter(h => h.interview?.status === "completed");
  if (completedInterviews.length > 0) {
    const totalScore = completedInterviews.reduce((sum, h) => sum + (h.interview?.score || 0), 0);
    interviewStats.averageScore = parseFloat((totalScore / completedInterviews.length).toFixed(2));
  }

  return res.status(200).json(
    new APIResponse(200, {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        accountType: user.accountType,
        avatar: user.avatar,
        description: user.description,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      interviewStats,
      recentInterviews: user.interviewHistory.slice(0, 5) // Last 5 interviews
    }, "User details retrieved successfully")
  );
});

/**
 * @route   GET /api/admin/backup
 * @method  GET
 * @access  Admin Only
 * @desc    Export all users, questions, and interviews as JSON for backup
 */
export const backupDatabase = asyncHandler(async (req, res) => {
  const users = await User.find().lean();
  const questions = await Question.find().lean();
  const interviews = await Interview.find().lean();

  const backup = {
    users,
    questions,
    interviews,
    backupDate: new Date().toISOString()
  };

  res.setHeader('Content-Disposition', 'attachment; filename="backup.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(backup, null, 2));
});

/**
 * @route   POST /api/admin/clear-cache
 * @method  POST
 * @access  Admin Only
 * @desc    Clear system cache (simulate or clear Redis if available)
 */
export const clearSystemCache = asyncHandler(async (req, res) => {
  // If using Redis, clear all keys (simulate here)
  // If you have a Redis client, you can use: await redisClient.flushall();
  // For now, just simulate
  // TODO: Integrate with actual cache if present

  return res.status(200).json(
    new APIResponse(200, {}, "System cache cleared successfully (simulated)")
  );
});

/**
 * @route   GET /api/admin/users/:id/export
 * @method  GET
 * @access  Admin Only
 * @desc    Export a specific user's data as JSON
 */
export const exportUserData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid user ID format");
  }

  const user = await User.findById(id).select('-password -refreshToken').lean();
  if (!user) {
    throw new APIError(404, "User not found");
  }

  const interviews = await Interview.find({ user: id }).lean();

  const exportData = {
    user,
    interviews
  };

  res.setHeader('Content-Disposition', `attachment; filename="user_${id}_data.json"`);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(exportData, null, 2));
});

/**
 * @route   GET /api/admin/stats/system
 * @method  GET
 * @access  Admin Only
 * @desc    Get system performance statistics (stub)
 */
export const getSystemStats = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      cpuUsage: '5%',
      memoryUsage: '512MB',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }, "System stats (simulated)")
  );
});

/**
 * @route   GET /api/admin/activity
 * @method  GET
 * @access  Admin Only
 * @desc    Get recent system activity (stub)
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      activities: [
        { type: 'login', user: 'admin', timestamp: new Date().toISOString() },
        { type: 'user_created', user: 'user1', timestamp: new Date().toISOString() }
      ]
    }, "Recent activity (simulated)")
  );
});

/**
 * @route   GET /api/admin/stats/interviews
 * @method  GET
 * @access  Admin Only
 * @desc    Get interview-specific statistics (stub)
 */
export const getInterviewStats = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      totalInterviews: 100,
      averageScore: 75,
      completed: 80,
      inProgress: 20
    }, "Interview stats (simulated)")
  );
});

/**
 * @route   GET /api/admin/stats/subscriptions
 * @method  GET
 * @access  Admin Only
 * @desc    Get subscription-specific statistics (stub)
 */
export const getSubscriptionStats = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      totalSubscriptions: 50,
      active: 40,
      expired: 10
    }, "Subscription stats (simulated)")
  );
});

/**
 * @route   PUT /api/admin/settings
 * @method  PUT
 * @access  Admin Only
 * @desc    Update system settings (stub)
 */
export const updateSystemSettings = asyncHandler(async (req, res) => {
  // Accept settings in req.body, simulate update
  return res.status(200).json(
    new APIResponse(200, { updated: true, settings: req.body }, "System settings updated (simulated)")
  );
});

/**
 * @route   GET /api/admin/logs
 * @method  GET
 * @access  Admin Only
 * @desc    Get system logs (stub)
 */
export const getSystemLogs = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      logs: [
        { level: 'info', message: 'System started', timestamp: new Date().toISOString() },
        { level: 'warn', message: 'High memory usage', timestamp: new Date().toISOString() }
      ]
    }, "System logs (simulated)")
  );
});

/**
 * @route   GET /api/admin/stats/questions
 * @method  GET
 * @access  Admin Only
 * @desc    Get question-specific statistics (stub)
 */
export const getQuestionStats = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new APIResponse(200, {
      totalQuestions: 1000,
      averageScore: 75,
      completed: 800,
      inProgress: 200
    }, "Question stats (simulated)")
  );
});
