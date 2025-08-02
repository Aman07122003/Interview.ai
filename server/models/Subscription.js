import mongoose from "mongoose";

/**
 * Subscription Schema - User subscription plans and billing
 * 
 * This model represents user subscriptions to different plans
 * with expiration tracking and payment history.
 */
const SubscriptionSchema = new mongoose.Schema({
  // Reference to the user who owns this subscription
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true
  },

  // Subscription plan type
  plan: {
    type: String,
    required: [true, "Plan is required"],
    enum: {
      values: ["free", "basic", "premium", "enterprise"],
      message: "Invalid plan type"
    },
    index: true
  },

  // Subscription status
  status: {
    type: String,
    required: [true, "Status is required"],
    enum: {
      values: ["active", "inactive", "cancelled", "expired"],
      message: "Invalid subscription status"
    },
    default: "active",
    index: true
  },

  // Subscription amount/price
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0, "Amount cannot be negative"],
    default: 0
  },

  // Currency for the subscription
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "INR"]
  },

  // When the subscription expires
  expiresAt: {
    type: Date,
    required: [true, "Expiration date is required"],
    index: true
  },

  // When the subscription started
  startedAt: {
    type: Date,
    default: Date.now
  },

  // Payment method used
  paymentMethod: {
    type: String,
    enum: ["stripe", "paypal", "manual", "free"],
    default: "free"
  },

  // Payment status
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "completed"
  },

  // External payment reference (Stripe/PayPal ID)
  paymentReference: {
    type: String,
    select: false // Exclude from queries by default
  },

  // Who created this subscription (admin or user)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator reference is required"]
  },

  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: false
  },

  // Cancellation details
  cancelledAt: {
    type: Date,
    default: null
  },

  // Cancellation reason
  cancellationReason: {
    type: String,
    maxlength: [500, "Cancellation reason cannot exceed 500 characters"]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual field to check if subscription is active
 */
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === "active" && this.expiresAt > new Date();
});

/**
 * Virtual field to check if subscription is expired
 */
SubscriptionSchema.virtual('isExpired').get(function() {
  return this.expiresAt <= new Date();
});

/**
 * Virtual field to get days until expiration
 */
SubscriptionSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

/**
 * Pre-save middleware to set startedAt if not set
 */
SubscriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.startedAt) {
    this.startedAt = new Date();
  }
  next();
});

/**
 * Static method to find active subscriptions
 */
SubscriptionSchema.statics.findActive = function() {
  return this.find({
    status: "active",
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Static method to find expired subscriptions
 */
SubscriptionSchema.statics.findExpired = function() {
  return this.find({
    status: "active",
    expiresAt: { $lte: new Date() }
  });
};

/**
 * Instance method to cancel subscription
 */
SubscriptionSchema.methods.cancel = function(reason = null) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  if (reason) this.cancellationReason = reason;
  return this.save();
};

// Create indexes for better query performance
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ status: 1, expiresAt: 1 });
SubscriptionSchema.index({ plan: 1, status: 1 });
SubscriptionSchema.index({ createdBy: 1, createdAt: -1 });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);