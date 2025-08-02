import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Admin Schema - Administrative users for the technical interview platform
 * 
 * This model represents administrative users who can manage questions,
 * users, and platform settings. Admins have elevated privileges and
 * can perform administrative operations.
 */
const AdminSchema = new mongoose.Schema({
  // Admin username (unique identifier)
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"],
    index: true
  },

  // Admin email address
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"],
    index: true
  },

  // Admin password (hashed)
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false // Exclude from queries by default
  },

  // Admin's full name
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"]
  },

  // Admin role (restricted to "admin" only)
  role: {
    type: String,
    default: "admin",
    enum: {
      values: ["admin"],
      message: "Admin role can only be 'admin'"
    },
    required: true,
    index: true
  },

  // Admin avatar/profile picture
  avatar: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function(value) {
        // Allow null or valid URL
        return value === null || /^https?:\/\/.+/.test(value);
      },
      message: "Avatar must be a valid URL"
    }
  },

  // Admin permissions (array of permission strings)
  permissions: {
    type: [String],
    default: [],
    validate: {
      validator: function(permissions) {
        // Validate each permission is a valid string
        return permissions.every(permission => 
          typeof permission === 'string' && permission.trim().length > 0
        );
      },
      message: "All permissions must be non-empty strings"
    }
  },

  // Admin status (active/inactive)
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Last login timestamp
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true,
  
  // Configure JSON transformation
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from object output
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Virtual field to check if admin has a specific permission
 */
AdminSchema.virtual('hasPermission').get(function() {
  return function(permission) {
    return this.permissions.includes(permission);
  };
});

/**
 * Virtual field to get admin's display name
 */
AdminSchema.virtual('displayName').get(function() {
  return this.fullName || this.username;
});

/**
 * Pre-save middleware to hash password before saving
 */
AdminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-save middleware to ensure role is always "admin"
 */
AdminSchema.pre('save', function(next) {
  this.role = "admin";
  next();
});

/**
 * Instance method to compare password with hashed password
 */
AdminSchema.methods.isPasswordCorrect = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance method to generate access token
 */
AdminSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      permissions: this.permissions
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1d' }
  );
};

/**
 * Instance method to generate refresh token
 */
AdminSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

/**
 * Instance method to check if admin has specific permission
 */
AdminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

/**
 * Instance method to add permission
 */
AdminSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

/**
 * Instance method to remove permission
 */
AdminSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

/**
 * Static method to find active admins
 */
AdminSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

/**
 * Static method to find admin by username or email
 */
AdminSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() }
    ]
  });
};

// Create indexes for better query performance
AdminSchema.index({ username: 1, email: 1 });
AdminSchema.index({ role: 1, isActive: 1 });
AdminSchema.index({ createdAt: -1 });

// Export the Admin model
export const Admin = mongoose.model("Admin", AdminSchema);
