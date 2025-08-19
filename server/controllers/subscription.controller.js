import asyncHandler from "../utils/asyncHandler.js";
import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import { PLAN_PRICES } from "../models/Subscription.js";  
import mongoose from "mongoose";
import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @route   POST /api/subscriptions
 * @desc    Create a new subscription with Razorpay
 * @access  Admin or user (self only)
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    plan,
    amount,
    currency = "INR",
    durationInDays = 30,
    status = "active",
  } = req.body;

  // Validate input
  const validPlans = ["free", "basic", "premium", "enterprise"];
  const validStatuses = ["active", "inactive", "cancelled", "expired"];

  if (!plan || !amount) {
    throw new APIError(400, "Plan and amount are required");
  }

  if (!validPlans.includes(plan)) {
    throw new APIError(400, `Invalid plan. Must be one of: ${validPlans.join(", ")}`);
  }

  if (!validStatuses.includes(status)) {
    throw new APIError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new APIError(400, "Invalid user ID format");
  }

  const user = await User.findById(userId).select("_id username email");
  if (!user) throw new APIError(404, "User not found");

  // Authorization: self or admin
  if (req.user.role !== "admin" && req.user._id.toString() !== userId.toString()) {
    throw new APIError(403, "Unauthorized: Cannot create subscription for another user");
  }

  // Check for existing active subscription
  const existing = await Subscription.findOne({
    user: userId,
    status: "active",
    expiresAt: { $gt: new Date() },
  });

  if (existing) {
    throw new APIError(400, "User already has an active subscription");
  }

  // 🧾 Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay requires amount in paise
    currency,
    receipt: `receipt_${Date.now()}`,
  });

  // 🧾 Create subscription record
  const subscription = await Subscription.create({
    user: userId,
    plan,
    status,
    amount,
    currency,
    expiresAt: new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000),
    paymentMethod: "razorpay",
    paymentStatus: "pending",
    paymentReference: order.id,
    createdBy: req.user._id,
  });

  await subscription.populate("user", "username email fullName");

  return res.status(201).json(
    new APIResponse(201, {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        expiresAt: subscription.expiresAt,
        createdAt: subscription.createdAt,
        user: subscription.user,
      },
      razorpayOrder: order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID, // for frontend use
    }, "Subscription and Razorpay order created successfully")
  );
});


/**
 * @desc Get all available subscription plans
 * @route GET /api/plans
 * @access Public
 */
export const getAllPlans = (req, res) => {
  // Define plan metadata
  const planDetails = [
    {
      id: "free",
      name: "Free Plan",
      features: [
        "Access to basic content",
        "Limited downloads",
        "Email support",
        "1 user account"
      ],
      duration: "10 years",
      buttonText: "Get Started Free"
    },
    {
      id: "basic",
      name: "Basic Plan",
      features: [
        "Access to basic content",
        "Limited downloads",
        "Email support",
        "1 user account"
      ],
      duration: "month",
      buttonText: "Get Started Free"
    },
    {
      id: "premium",
      name: "Premium Plan",
      features: [
        "Full content access",
        "Unlimited downloads",
        "Priority support",
        "Up to 3 user accounts",
        "Advanced analytics"
      ],
      duration: "month",
      buttonText: "Subscribe Now"
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      features: [
        "All premium features",
        "Dedicated account manager",
        "Custom integrations",
        "Unlimited user accounts",
        "API access"
      ],
      duration: "month",
      buttonText: "Contact Sales"
    }
  ];

  // Attach price from PLAN_PRICES
  const plans = planDetails.map(plan => ({
    ...plan,
    price: PLAN_PRICES[plan.id] || 0
  }));

  return res.json({
    success: true,
    plans
  });
};


/**
 * @route   GET /api/subscriptions
 * @method  GET
 * @access  Admin Only
 * @desc    Get all subscriptions with optional filtering
 */
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const { 
    userId, 
    plan, 
    status, 
    page = 1, 
    limit = 20, 
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
  
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new APIError(400, "Invalid user ID format");
    }
    filter.user = userId;
  }

  if (plan) {
    const validPlans = ["free", "basic", "premium", "enterprise"];
    if (!validPlans.includes(plan)) {
      throw new APIError(400, `Invalid plan filter. Must be one of: ${validPlans.join(", ")}`);
    }
    filter.plan = plan;
  }

  if (status) {
    const validStatuses = ["active", "inactive", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      throw new APIError(400, `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`);
    }
    filter.status = status;
  }

  // Validate sort parameters
  const validSortFields = ["createdAt", "expiresAt", "plan", "status"];
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

  // Execute query with pagination and population
  const subscriptions = await Subscription.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate("user", "username email fullName")
    .populate("createdBy", "username fullName")
    .lean();

  // Get total count for pagination metadata
  const totalSubscriptions = await Subscription.countDocuments(filter);
  const totalPages = Math.ceil(totalSubscriptions / limitNum);

  return res.status(200).json(
    new APIResponse(200, {
      subscriptions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalSubscriptions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }, "Subscriptions retrieved successfully")
  );
});

/**
 * @route   GET /api/subscriptions/:id
 * @method  GET
 * @access  Admin or Subscription Owner
 * @desc    Get a specific subscription by ID
 */
export const getSubscriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid subscription ID format");
  }

  // Find the subscription with populated user details
  const subscription = await Subscription.findById(id)
    .populate("user", "username email fullName")
    .populate("createdBy", "username fullName")
    .lean();

  if (!subscription) {
    throw new APIError(404, "Subscription not found");
  }

  // Authorization check: Only admin or the subscription owner can view
  if (req.user.role !== "admin" && req.user._id.toString() !== subscription.user._id.toString()) {
    throw new APIError(403, "Access denied. You can only view your own subscriptions");
  }

  return res.status(200).json(
    new APIResponse(200, { subscription }, "Subscription retrieved successfully")
  );
});

/**
 * @route   PUT /api/subscriptions/:id
 * @method  PUT
 * @access  Admin Only
 * @desc    Update a subscription
 */
export const updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { plan, expiresAt, status } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid subscription ID format");
  }

  // Check if at least one field is provided for update
  if (!plan && !expiresAt && !status) {
    throw new APIError(400, "At least one field (plan, expiresAt, or status) is required for update");
  }

  // Validate plan if provided
  if (plan) {
    const validPlans = ["free", "basic", "premium", "enterprise"];
    if (!validPlans.includes(plan)) {
      throw new APIError(400, `Invalid plan. Must be one of: ${validPlans.join(", ")}`);
    }
  }

  // Validate status if provided
  if (status) {
    const validStatuses = ["active", "inactive", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      throw new APIError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
  }

  // Validate expiresAt if provided
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      throw new APIError(400, "Invalid expiry date format");
    }
  }

  // Build update object
  const updateData = {};
  if (plan) updateData.plan = plan;
  if (status) updateData.status = status;
  if (expiresAt) updateData.expiresAt = new Date(expiresAt);

  // Find and update the subscription
  const updatedSubscription = await Subscription.findByIdAndUpdate(
    id,
    updateData,
    { 
      new: true, // Return the updated document
      runValidators: true // Run schema validators
    }
  )
  .populate("user", "username email fullName")
  .populate("createdBy", "username fullName");

  if (!updatedSubscription) {
    throw new APIError(404, "Subscription not found");
  }

  return res.status(200).json(
    new APIResponse(200, {
      subscription: updatedSubscription,
    }, "Subscription updated successfully")
  );
});

/**
 * @route   DELETE /api/subscriptions/:id
 * @method  DELETE
 * @access  Admin Only
 * @desc    Delete a subscription by ID
 */
export const deleteSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid subscription ID format");
  }

  // Check if subscription exists before deletion
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw new APIError(404, "Subscription not found");
  }

  // Check if subscription is active (optional business logic)
  if (subscription.status === "active") {
    throw new APIError(400, "Cannot delete an active subscription. Please cancel it first.");
  }

  // Delete the subscription
  await Subscription.findByIdAndDelete(id);

  return res.status(200).json(
    new APIResponse(200, {
      deletedSubscriptionId: id,
    }, "Subscription deleted successfully")
  );
});

/**
 * @route   GET /api/subscriptions/user/:userId
 * @method  GET
 * @access  User (own subscriptions) or Admin (any user)
 * @desc    Get all subscriptions for a specific user
 */
export const getUserSubscriptions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { 
    status, 
    page = 1, 
    limit = 20, 
    sortBy = "createdAt", 
    sortOrder = "desc" 
  } = req.query;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new APIError(400, "Invalid user ID format");
  }

  // Check if user exists
  const user = await User.findById(userId).select("_id username email fullName");
  if (!user) {
    throw new APIError(404, "User not found");
  }

  // Authorization check: Only admin or the user themselves can view subscriptions
  if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
    throw new APIError(403, "You can only view your own subscriptions");
  }

  // Validate pagination parameters
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    throw new APIError(400, "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100");
  }

  // Build filter object
  const filter = { user: userId };
  
  if (status) {
    const validStatuses = ["active", "inactive", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      throw new APIError(400, `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`);
    }
    filter.status = status;
  }

  // Validate sort parameters
  const validSortFields = ["createdAt", "expiresAt", "plan", "status"];
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
  const subscriptions = await Subscription.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate("createdBy", "username fullName")
    .lean();

  // Get total count for pagination metadata
  const totalSubscriptions = await Subscription.countDocuments(filter);
  const totalPages = Math.ceil(totalSubscriptions / limitNum);

  // Calculate subscription statistics
  const subscriptionStats = await Subscription.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
        },
        totalSpent: { $sum: "$amount" }
      }
    }
  ]);

  const stats = subscriptionStats[0] || {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalSpent: 0
  };

  return res.status(200).json(
    new APIResponse(200, {
      user,
      subscriptions,
      stats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalSubscriptions,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    }, "User subscriptions retrieved successfully")
  );
});

/**
 * @route   GET /api/subscriptions/stats/overview
 * @method  GET
 * @access  Admin Only
 * @desc    Get subscription statistics overview
 */
export const getSubscriptionStats = asyncHandler(async (req, res) => {
  const [
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    planBreakdown,
    monthlyStats
  ] = await Promise.all([
    // Total subscriptions
    Subscription.countDocuments(),
    
    // Active subscriptions
    Subscription.countDocuments({ status: "active" }),
    
    // Expired subscriptions
    Subscription.countDocuments({ 
      status: "active", 
      expiresAt: { $lt: new Date() } 
    }),
    
    // Plan breakdown
    Subscription.aggregate([
      {
        $group: {
          _id: "$plan",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]),
    
    // Monthly subscription growth (last 6 months)
    Subscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ])
  ]);

  // Calculate renewal rate
  const renewalRate = totalSubscriptions > 0 
    ? parseFloat(((activeSubscriptions / totalSubscriptions) * 100).toFixed(2))
    : 0;

  return res.status(200).json(
    new APIResponse(200, {
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        renewalRate: `${renewalRate}%`
      },
      planBreakdown: planBreakdown.map(plan => ({
        plan: plan._id,
        count: plan.count
      })),
      monthlyGrowth: monthlyStats.map(month => ({
        period: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
        newSubscriptions: month.count
      })),
      lastUpdated: new Date().toISOString()
    }, "Subscription statistics retrieved successfully")
  );
});

/**
 * @route   POST /api/subscriptions/:id/cancel
 * @method  POST
 * @access  Admin or Subscription Owner
 * @desc    Cancel a subscription
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, "Invalid subscription ID format");
  }

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    throw new APIError(404, "Subscription not found");
  }

  // Only admin or the owner can cancel
  if (req.user.role !== "admin" && subscription.user.toString() !== req.user._id.toString()) {
    throw new APIError(403, "You are not authorized to cancel this subscription");
  }

  if (subscription.status === "cancelled") {
    return res.status(200).json(
      new APIResponse(200, { subscription }, "Subscription is already cancelled")
    );
  }

  subscription.status = "cancelled";
  await subscription.save();

  return res.status(200).json(
    new APIResponse(200, { subscription }, "Subscription cancelled successfully")
  );
});

// Get a single subscription for a user (singular)
export const getUserSubscription = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  // Find the most recent active subscription for the user
  const subscription = await Subscription.findOne({ user: userId, status: "active" })
    .populate("plan")
    .populate("createdBy", "username fullName");
  if (!subscription) {
    throw new APIError(404, "No active subscription found for this user");
  }
  return res.status(200).json(new APIResponse(200, { subscription }, "Active subscription retrieved successfully"));
});

// Reactivate a cancelled or inactive subscription
export const reactivateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new APIError(404, "Subscription not found");
  if (subscription.status === "active") {
    return res.status(200).json(new APIResponse(200, { subscription }, "Subscription is already active"));
  }
  subscription.status = "active";
  await subscription.save();
  return res.status(200).json(new APIResponse(200, { subscription }, "Subscription reactivated successfully"));
});

// Upgrade a subscription plan
export const upgradeSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPlan } = req.body;
  const validPlans = ["free", "basic", "premium", "enterprise"];
  if (!validPlans.includes(newPlan)) throw new APIError(400, "Invalid plan");
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new APIError(404, "Subscription not found");
  if (validPlans.indexOf(newPlan) <= validPlans.indexOf(subscription.plan)) {
    throw new APIError(400, "New plan must be higher than current plan");
  }
  subscription.plan = newPlan;
  await subscription.save();
  return res.status(200).json(new APIResponse(200, { subscription }, "Subscription upgraded successfully"));
});

// Downgrade a subscription plan
export const downgradeSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPlan } = req.body;
  const validPlans = ["free", "basic", "premium", "enterprise"];
  if (!validPlans.includes(newPlan)) throw new APIError(400, "Invalid plan");
  const subscription = await Subscription.findById(id);
  if (!subscription) throw new APIError(404, "Subscription not found");
  if (validPlans.indexOf(newPlan) >= validPlans.indexOf(subscription.plan)) {
    throw new APIError(400, "New plan must be lower than current plan");
  }
  subscription.plan = newPlan;
  await subscription.save();
  return res.status(200).json(new APIResponse(200, { subscription }, "Subscription downgraded successfully"));
});

// Process a payment for a subscription (stub)
export const processPayment = asyncHandler(async (req, res) => {
  // Payment logic would go here (integrate with payment gateway)
  return res.status(200).json(new APIResponse(200, { paymentStatus: "success" }, "Payment processed (stub)"));
});

// Get payment history for a user (stub)
export const getPaymentHistory = asyncHandler(async (req, res) => {
  // Payment history logic would go here
  return res.status(200).json(new APIResponse(200, { payments: [] }, "Payment history retrieved (stub)"));
});

// Refund a payment (stub)
export const refundPayment = asyncHandler(async (req, res) => {
  // Refund logic would go here
  return res.status(200).json(new APIResponse(200, { refundStatus: "success" }, "Payment refunded (stub)"));
});

// Export subscription data (stub)
export const exportSubscriptionData = asyncHandler(async (req, res) => {
  // Export logic would go here
  return res.status(200).json(new APIResponse(200, { export: [] }, "Subscription data exported (stub)"));
});
