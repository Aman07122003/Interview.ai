import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { Admin } from "../models/Admin.js";
import { InterviewSession } from "../models/interviewSession.model.js";
import {
  deleteImageOnCloudinary,
  uploadPhotoOnCloudinary as uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";

// Auth
const generateAccessAndRefreshToken = async (_id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new APIError(400, "Invalid user ID");
    }

    const admin = await Admin.findById(_id);

    if (!admin) {
      throw new APIError(404, "Admin not found");
    }

    const accessToken = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerAdmin = asyncHandler(async (req, res) => {
  // Log incoming registration data for debugging
  console.log('REGISTER BODY:', req.body);
  console.log('REGISTER FILES:', req.files);

  // Getting the data from frontend
  let { username, password, fullName, email, company, position, expertise } = req.body;

  // Validating and formatting the data
  if (
    [username, password, fullName, email, company].some((field) => !field || field?.trim() === "")
  ) {
    throw new APIError(400, "All required fields must be provided");
  }

  // Parse expertise if it's a string
  if (typeof expertise === 'string') {
    try {
      expertise = JSON.parse(expertise);
    } catch (error) {
      expertise = [];
    }
  }

  // checking if admin exists or not
  const adminExist = await Admin.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (adminExist) {
    return res
      .status(400)
      .json(new APIResponse(400, null, "Admin Already Exists"));
  }

  // Handling File
  let avatarLocalPath = "";
  if (req.files && req.files.avatar && req.files.avatar.length > 0) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar image is required");
  }

  // uploading on cloudinary
  let avatarRes = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarRes) {
    throw new APIError(500, "Failed to upload avatar to Cloudinary");
  }
  console.log("Avatar uploaded successfully:", avatarRes);

  // Create new Admin
  const createdAdmin = await Admin.create({
    username: username.toLowerCase(),
    password,
    email: email.toLowerCase(),
    fullName,
    company,
    position: position || "",
    expertise: expertise || [],
    avatar: avatarRes.url,
  });

  // checking if admin is created successfully
  const adminData = await Admin.findById(createdAdmin._id).select(
    "-password -refreshToken"
  );

  if (!adminData) {
    // Clean up the uploaded image if admin creation failed
    await deleteImageOnCloudinary(avatarRes.public_id);
    throw new APIError(500, "Failed to create admin account");
  }

  // Send back data to frontend
  return res
    .status(201)
    .json(new APIResponse(201, adminData, "Account Created Successfully"));
});

const loginAdmin = asyncHandler(async (req, res) => {
  // data <- req.body
  const { email, password, username } = req.body;
  console.log('Login attempt:', { email, username });

  // validate
  if ((!email && !username) || !password) {
    throw new APIError(400, "Username or Email and password are required");
  }

  // find Admin
  const admin = await Admin.findOne({
    $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }],
  });

  if (!admin) {
    return res.status(404).json(new APIResponse(404, null, "Admin not Found"));
  }

  const isCredentialValid = await admin.isPasswordCorrect(password);
  if (!isCredentialValid) {
    return res
      .status(401)
      .json(new APIResponse(401, null, "Invalid Credentials"));
  }

  // generate and store tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    admin._id
  );

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  // Set cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res
    .status(200)
    .json(
      new APIResponse(
        200,
        { admin: loggedInAdmin, accessToken, refreshToken },
        "Logged In Successfully"
      )
    );
});

const logoutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.admin._id,
    {
      $unset: {
        refreshToken: 1,
      },
    }
  );

  // Clear cookies
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });

  return res
    .status(200)
    .json(new APIResponse(200, null, "Logged out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new APIError(401, "Refresh token is required");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const admin = await Admin.findById(decodedRefreshToken._id);

    if (!admin || incomingRefreshToken !== admin.refreshToken) {
      throw new APIError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(
      admin._id
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    return res
      .status(200)
      .json(
        new APIResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new APIError(401, error.message || "Invalid refresh token");
  }
});

// Profile
const getCurrentAdmin = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIResponse(200, req.admin, "Admin fetched Successfully"));
});

const updateAdminProfile = asyncHandler(async (req, res) => {
  try {
    const { fullName, company, position, expertise } = req.body;
    const adminId = req.admin._id;

    // Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (company) updateData.company = company;
    if (position) updateData.position = position;
    if (expertise) {
      updateData.expertise = typeof expertise === 'string' 
        ? JSON.parse(expertise) 
        : expertise;
    }

    // Handle avatar upload if provided
    if (req.files && req.files.avatar && req.files.avatar.length > 0) {
      const avatarLocalPath = req.files.avatar[0].path;
      const avatarRes = await uploadOnCloudinary(avatarLocalPath);
      
      if (avatarRes) {
        // Delete old avatar from Cloudinary if exists
        if (req.admin.avatar) {
          const publicId = req.admin.avatar.split('/').pop().split('.')[0];
          await deleteImageOnCloudinary(publicId);
        }
        updateData.avatar = avatarRes.url;
      }
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new APIResponse(200, updatedAdmin, "Profile updated successfully"));
  } catch (error) {
    console.error("Error updating admin profile:", error);
    throw new APIError(500, "Failed to update profile");
  }
});

const changeAdminPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin._id;

    if (!currentPassword || !newPassword) {
      throw new APIError(400, "Current password and new password are required");
    }

    const admin = await Admin.findById(adminId);
    const isCurrentPasswordValid = await admin.isPasswordCorrect(currentPassword);

    if (!isCurrentPasswordValid) {
      throw new APIError(401, "Current password is incorrect");
    }

    admin.password = newPassword;
    await admin.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new APIResponse(200, null, "Password changed successfully"));
  } catch (error) {
    console.error("Error changing password:", error);
    throw new APIError(500, "Failed to change password");
  }
});

// Interview Sessions
const createInterviewSession = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      participants, // emails from frontend
      expertise,
      scheduledAt,
      questions,
      status,
    } = req.body;

    // Validate required fields
    if (!title || !expertise || !participants || participants.length === 0) {
      return res
        .status(400)
        .json(new APIResponse(400, null, "Title, expertise, and at least one participant email are required"));
    }

    // Validate scheduled date if provided
    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      return res
        .status(400)
        .json(new APIResponse(400, null, "Scheduled date must be in the future"));
    }

    const adminId = req.admin._id;

    // 🔍 Convert participant emails → user IDs
    const users = await User.find({ email: { $in: participants } }).select("_id email");
    if (users.length !== participants.length) {
      return res
        .status(400)
        .json(new APIResponse(400, null, "One or more participant emails are invalid"));
    }

    const participantIds = users.map((u) => u._id);

    // Create the interview session
    const interviewSession = new InterviewSession({
      title,
      description: description || "",
      createdBy: adminId,
      participants: participantIds,
      expertise,
      scheduledAt: scheduledAt || null,
      questions: (questions || []).map((q) => ({ text: q.text })),
      status: status || "upcoming",
    });

    // Save to database
    let savedSession = await interviewSession.save();

    // ✅ Populate createdBy and participants (return email instead of IDs)
    savedSession = await savedSession.populate([
      { path: "createdBy", select: "username email fullName avatar" },
      { path: "participants", select: "email fullName" },
    ]);

    return res
      .status(201)
      .json(new APIResponse(201, savedSession, "Interview session created successfully"));
  } catch (error) {
    console.error("Error creating interview session:", error);
    return res
      .status(500)
      .json(new APIResponse(500, null, "Internal server error while creating interview session"));
  }
});



// Get all interview sessions for an admin
const getAdminInterviewSessions = asyncHandler(async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { createdBy: adminId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sessions = await InterviewSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .populate("createdBy", "username fullName avatar email")
      .populate("participants", "email fullName");

    const total = await InterviewSession.countDocuments(filter);

    return res.status(200).json(
      new APIResponse(
        200,
        {
          sessions,
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          total,
        },
        "Interview sessions retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching interview sessions:", error);
    return res
      .status(500)
      .json(
        new APIResponse(
          500,
          null,
          "Internal server error while fetching interview sessions"
        )
      );
  }
});


// Get single interview session by ID
const getInterviewSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      createdBy: adminId // Changed from interviewer to createdBy to match your schema
    })
    .populate("createdBy", "username fullName avatar expertise")
    .populate("participants", "email fullName");

    if (!session) {
      return res.status(404).json(
        new APIResponse(404, null, "Interview session not found")
      );
    }

    return res.status(200).json(
      new APIResponse(200, session, "Interview session retrieved successfully")
    );

  } catch (error) {
    console.error("Error fetching interview session:", error);
    return res.status(500).json(
      new APIResponse(500, null, "Internal server error while fetching interview session")
    );
  }
});

// Update interview session
const updateInterviewSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id;
    const updates = req.body;

    // Check if session exists and belongs to admin
    const existingSession = await InterviewSession.findOne({
      _id: sessionId,
      interviewer: adminId
    });

    if (!existingSession) {
      return res.status(404).json(
        new APIResponse(404, null, "Interview session not found")
      );
    }

    // Prevent updating certain fields
    delete updates._id;
    delete updates.interviewer;
    delete updates.createdAt;

    const updatedSession = await InterviewSession.findByIdAndUpdate(
      sessionId,
      updates,
      { new: true, runValidators: true }
    ).populate("interviewer", "username fullName avatar");

    return res.status(200).json(
      new APIResponse(200, updatedSession, "Interview session updated successfully")
    );

  } catch (error) {
    console.error("Error updating interview session:", error);
    return res.status(500).json(
      new APIResponse(500, null, "Internal server error while updating interview session")
    );
  }
});

// Delete interview session
const deleteInterviewSession = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id;

    const session = await InterviewSession.findOneAndDelete({
      _id: sessionId,
      interviewer: adminId
    });

    if (!session) {
      return res.status(404).json(
        new APIResponse(404, null, "Interview session not found")
      );
    }

    // Remove from admin's pastSessions
    await Admin.findByIdAndUpdate(
      adminId,
      {
        $pull: {
          pastSessions: { interview: sessionId }
        }
      }
    );

    return res.status(200).json(
      new APIResponse(200, null, "Interview session deleted successfully")
    );

  } catch (error) {
    console.error("Error deleting interview session:", error);
    return res.status(500).json(
      new APIResponse(500, null, "Internal server error while deleting interview session")
    );
  }
});

// Update session status
const updateSessionStatus = asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    const adminId = req.admin._id;

    const validStatuses = ["draft", "scheduled", "in-progress", "completed", "cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json(
        new APIResponse(400, null, "Invalid status value")
      );
    }

    const session = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        interviewer: adminId
      },
      { status },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json(
        new APIResponse(404, null, "Interview session not found")
      );
    }

    return res.status(200).json(
      new APIResponse(200, session, "Session status updated successfully")
    );

  } catch (error) {
    console.error("Error updating session status:", error);
    return res.status(500).json(
      new APIResponse(500, null, "Internal server error while updating session status")
    );
  }
});

// Export all functions
export {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  getCurrentAdmin,
  updateAdminProfile,
  changeAdminPassword,
  createInterviewSession,
  getAdminInterviewSessions,
  getInterviewSession,
  updateInterviewSession,
  deleteInterviewSession,
  updateSessionStatus
};