// controllers/subscriptionController.js
import Razorpay from 'razorpay';
import asyncHandler from '../utils/asyncHandler.js';
import { APIResponse } from '../utils/APIResponse.js';
import { APIError } from '../utils/APIError.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc Create Razorpay order and initiate subscription
 * @route POST /api/subscription/create
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const { plan, amount, currency = 'INR', userId } = req.body;

  if (!userId || !plan || !amount) {
    throw new APIError('Missing required subscription details', 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new APIError('User not found', 404);

  const order = await razorpay.orders.create({
    amount: amount * 100, // in paise
    currency,
    receipt: `receipt_${Date.now()}`,
  });

  const newSub = await Subscription.create({
    user: user._id,
    plan,
    status: 'active',
    amount,
    currency,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    paymentReference: order.id,
    createdBy: user._id,
  });

  res.status(201).json(
    new APIResponse({
      order,
      subscriptionId: newSub._id,
    }, 'Subscription and payment order created')
  );
});
