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

