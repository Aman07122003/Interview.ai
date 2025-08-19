import mongoose from "mongoose";

export const PLAN_PRICES = {
  free: 0,
  basic: 19,
  premium: 49,
  enterprise: 100
};

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true
  },

  plan: {
    type: String,
    required: [true, "Plan is required"],
    enum: ["free", "basic", "premium", "enterprise"],
    index: true
  },

  status: {
    type: String,
    enum: ["active", "inactive", "cancelled", "expired"],
    default: "active",
    required: true,
    index: true
  },

  amount: {
    type: Number,
    min: [0, "Amount cannot be negative"],
    default: 0,
    immutable: true // 🔒 prevents manual override
  },

  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "INR"]
  },

  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  startedAt: {
    type: Date,
    default: Date.now
  },

  paymentMethod: {
    type: String,
    enum: ["stripe", "paypal", "razorpay", "manual", "free"],
    default: "free"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "completed"
  },

  paymentReference: {
    type: String,
    select: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  autoRenew: {
    type: Boolean,
    default: false
  },

  cancelledAt: {
    type: Date,
    default: null
  },

  cancellationReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔑 Set amount & expiresAt automatically
SubscriptionSchema.pre("validate", function (next) {
  const now = new Date();

  if (this.plan && PLAN_PRICES[this.plan] !== undefined) {
    this.amount = PLAN_PRICES[this.plan];
  }

  if (!this.expiresAt && this.plan) {
    if (this.plan === "free") {
      this.expiresAt = new Date(now.setFullYear(now.getFullYear() + 10));
    } else {
      this.expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    }
  }

  next();
});

// 🔎 Virtuals
SubscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && this.expiresAt > new Date();
});

SubscriptionSchema.virtual("isExpired").get(function () {
  return this.expiresAt <= new Date();
});

SubscriptionSchema.virtual("daysUntilExpiry").get(function () {
  const now = new Date();
  const diff = this.expiresAt - now;
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});

SubscriptionSchema.virtual("effectiveStatus").get(function () {
  if (this.status === "active" && this.expiresAt <= new Date()) {
    return "expired";
  }
  return this.status;
});

// 📌 Indexes
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ status: 1, expiresAt: 1 });
SubscriptionSchema.index({ plan: 1, status: 1 });
SubscriptionSchema.index({ createdBy: 1, createdAt: -1 });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);
