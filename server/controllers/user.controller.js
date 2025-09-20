import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/User.js";
import {
  deleteImageOnCloudinary,
  uploadPhotoOnCloudinary as uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { InterviewSession } from "../models/interviewSession.model.js";


const generateAccessAndRefreshToken = async (_id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        throw new APIError(400, "Invalid user ID");
      }
  
      const user = await User.findById(_id);
  
      if (!user) {
        throw new APIError(404, "User not found");
      }
  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { refreshToken, accessToken };
    } catch (error) {
      throw new APIError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
  };
  
  const registerUser = asyncHandler(async (req, res) => {
    // Log incoming registration data for debugging
    console.log('REGISTER BODY:', req.body);
    console.log('REGISTER FILES:', req.files);
  
    // Get the data from frontend
    // Validate the data - Check if empty or not
    // check if user exists or not
    // Handle file uploads
    // upload files in cloudinary
    // create user
    // check if user created successfully
    // send back the response
  
    // Getting the data from frontend
    let { username, password, fullName, email } = req.body;
  
    // Validating and formating the data
    if (
      [username, password, fullName, email].some((field) => field?.trim() === "")
    ) {
      throw new APIError(400, `all fields are required!!!`);
    }
  
    // checking if user exists or not
    const userExist = await User.findOne({
      $or: [{ username }, { email }],
    });
  
    if (userExist) {
      // throw new APIError(400, "User Already Exists...");
      return res
        .status(400)
        .json(new APIResponse(400, [], "User Already Exists..."));
    }
  
    // Handling File
  
    let avatarLocalPath = "";
    if (req.files && req.files.avatar && req.files?.avatar.length > 0) {
      avatarLocalPath = req.files?.avatar[0]?.path;
    }
  
    if (!avatarLocalPath) {
      throw new APIError(400, "avatar Image is Required");
    }
  
    // uploading on cloudinary
  
    let avatarRes = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarRes)
      throw new APIError(500, "Internal Server Error!!! Files Unable to Upload");
    console.log("Avatar uploaded successfully:", avatarRes);
  
    // Create new user
    const createdUser = await User.create({
      username: username.toLowerCase(),
      password,
      email,
      fullName,
      avatar: avatarRes.url,
    });
  
    // checking if user is created successfully
  
    const userData = await User.findById(createdUser._id).select(
      "-password -refreshToken"
    );
  
    if (!userData) {
      throw new APIError(500, "Something went wrong while registering the user");
    }
  
    // Send back data to frontend
    return res
      .status(201)
      .json(new APIResponse(200, userData, "Account Created Successfully"));
  });
  
  const loginUser = asyncHandler(async (req, res) => {
    // data <- req.body
    // validate data
    // find User
    // generate tokens
    // store tokens in database
    // set tokens in cookie
    // send response
  
    // data <- req.body
  
    let { email, password, username } = req.body;
    console.log(email, password, username)
  
    // validate
    if ((!email && !username) || !password) {
      throw new APIError(400, "Username or Email is required");
    }
  
    // find User
    const user = await User.findOne({
      $or: [{ email }, { username }],
    });
  
    if (!user) {
      // throw new APIError(404, "User not Found");
      return res.status(404).json(new APIResponse(404, [], "User not Found"));
    }
  
    const isCredentialValid = await user.isPasswordCorrect(password);
    if (!isCredentialValid) {
      // throw new APIError(401, "Credential Invalid");
      return res
        .status(401)
        .json(new APIResponse(401, [], "Invalid Credentials"));
    }
  
    // generate and store tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
  
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -watchHistory"
    );
  
    // set tokens in cookie and send response
    // const cookieOptions = {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    //   Partitioned: true,
    // };
  
    res.setHeader(
      "Set-Cookie",
      `accessToken=${accessToken}; Max-Age=${1 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
    );
  
    // res.setHeader(
    //   "Set-Cookie",
    //   `__Host-refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
    // );
  
    return res
      .status(200)
      .json(
        new APIResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "Logged In Successfully"
        )
      );
  });
  
  const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
  
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
  
    res.setHeader(
      "Set-Cookie",
      `accessToken=; Max-Age=-1; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
    );
  
    // .clearCookie("accessToken", {
    //   ...cookieOptions,
    //   maxAge: 1 * 24 * 60 * 60 * 1000,
    // })
    // .clearCookie("refreshToken", {
    //   ...cookieOptions,
    //   maxAge: 10 * 24 * 60 * 60 * 1000,
    // })
  
    return res
      .status(200)
      .json(new APIResponse(200, {}, "Logged out Successfully"));
  });
  
  const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingRefreshToken) {
      throw new APIError(401, "unauthorized request");
    }
  
    try {
      const decodedRefreshToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
  
      const user = await User.findById(decodedRefreshToken?._id);
  
      if (!user) {
        throw new APIError(401, "Invalid Refresh Token");
      }
  
      if (incomingRefreshToken !== user.refreshToken) {
        throw new APIError(401, "Refresh token is expired or used");
      }
  
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
      );
  
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        Partitioned: true,
      };
  
      res.setHeader(
        "Set-Cookie",
        `accessToken=${accessToken}; Max-Age=${1 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
      );
  
      // res.setHeader(
      //   "Set-Cookie",
      //   `refreshToken=${refreshToken}; Max-Age=${10 * 24 * 60 * 60 * 1000}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned`
      // );
  
      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            { accessToken, newRefreshToken: refreshToken },
            "Access Token Granted Successfully"
          )
        );
    } catch (error) {
      throw new APIError(401, error?.message || "Invalid refresh token");
    }
  });
  
  const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
  
    // Caution
    if (!oldPassword || !newPassword) {
      throw new APIError(400, "All Fields Required");
    }
  
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  
    if (!isPasswordCorrect) {
      throw new APIError(401, "Old Password is not Correct");
    }
  
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
  
    return res
      .status(200)
      .json(new APIResponse(200, {}, "Password Changed Successfully"));
  });
  
  const getCurrentUser = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new APIResponse(201, req.user, "User fetched Successfully"));
  });
  
  const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, phone, linkedin, bio, accountType } = req.body;
  
    if (!fullName && !phone && !linkedin && !bio && !accountType) {
      throw new APIError(400, "At least one field is required for update");
    }
  
    const user = await User.findById(req.user._id);
  
    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (linkedin) user.linkedin = linkedin;
    if (bio) user.bio = bio;
  
    // Validate account type if provided
    if (accountType) user.accountType = accountType;
  
  
    await user.save();
  
    const updatedUser = await User.findById(user._id).select("-password -refreshToken");
  
    return res.status(200).json(
      new APIResponse(200, { user: updatedUser }, "Profile updated successfully")
    );
  });
  
  const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
  
    if (!avatarLocalPath) {
      throw new APIError(400, "File required");
    }
  
    const avatarImg = await uploadOnCloudinary(avatarLocalPath);
  
    if (!avatarImg) {
      throw new APIError(500, "Error Accured While uploading File");
    }
  
    await deleteImageOnCloudinary(req.user?.avatar);
  
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { avatar: avatarImg.url },
      },
      {
        new: true,
      }
    ).select("-password");
  
    if (!updatedUser) {
      new APIError(500, "Error while Updating database");
    }
  
    return res
      .status(200)
      .json(new APIResponse(200, updatedUser, "avatar updated Successfully"));
  });
  
  const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .select("-password -refreshToken")
      .lean();
  
    // Get user interview statistics
    const interviewStats = await Interview.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(req.user._id) }
      },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          completedInterviews: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          averageScore: { $avg: "$score" },
          totalQuestionsAnswered: {
            $sum: {
              $size: {
                $filter: {
                  input: "$questions",
                  cond: { $ne: ["$$this.answerText", null] }
                }
              }
            }
          }
        }
      }
    ]);
  
    const stats = interviewStats[0] || {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0,
      totalQuestionsAnswered: 0
    };
  
    // Get recent interviews
    const recentInterviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("category status score completedAt")
      .lean();
  
    return res.status(200).json(
      new APIResponse(200, {
        user,
        stats: {
          ...stats,
          averageScore: parseFloat(stats.averageScore.toFixed(2)) || 0
        },
        recentInterviews
      }, "User profile retrieved successfully")
    );
  });

  const getNewInterviewHistory = asyncHandler(async (req, res) => {
    const userInterviewHistory = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types(req.user._id),
        },
      },
      {
        $project: { interviewHistory: 1 },
      },
      {
        $unwind: {
          path: "$interviewHistory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          "interviewHistory.createdAt": -1,
        },
      },
      {
        $addFields: {
          "interviewHistory.dateGroup": {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$interviewHistory.createdAt",
            },
          },
        },
      },
      {
        $lookup: {
          from: "interviews",
          localField: "interviewHistory.interview",
          foreignField: "_id",
          as: "interviewHistory.interview",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "coach",
                foreignField: "_id",
                as: "coach",
                pipeline: [
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                coach: { $first: "$coach" },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          "interviewHistory.interview": {
            $first: "$interviewHistory.interview",
          },
        },
      },
      {
        $group: {
          _id: "$interviewHistory.dateGroup",
          interviews: {
            $push: "$interviewHistory",
          },
        },
      },
    ]);
  
    return res
      .status(200)
      .json(new APIResponse(200, userInterviewHistory, "Interview history grouped by date"));
  });
  
  const getInterviewHistory = asyncHandler(async (req, res) => {
    const userInterviewHistory = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
      },
      {
        $unwind: "$interviewHistory"
      },
      {
        $lookup: {
          from: "interviews",
          localField: "interviewHistory.interview",
          foreignField: "_id",
          as: "interview",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "coach",
                foreignField: "_id",
                as: "coach",
                pipeline: [
                  { $project: { username: 1, fullName: 1, avatar: 1 } }
                ]
              }
            },
            { $addFields: { coach: { $first: "$coach" } } }
          ]
        }
      },
      {
        $addFields: {
          interview: { $first: "$interview" }
        }
      },
      {
        $project: {
          _id: "$interviewHistory._id",
          createdAt: "$interviewHistory.createdAt",
          interview: 1
        }
      },
      { $sort: { createdAt: -1 } } // reverse order, latest first
    ]);
  
    return res
      .status(200)
      .json(new APIResponse(200, userInterviewHistory, "Interview history fetched successfully"));
  });
  
  const uploadAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
  
    if (!avatarLocalPath) {
      throw new APIError(400, "Avatar file is required");
    }
  
    // Upload to cloudinary
    const avatarImg = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarImg) {
      throw new APIError(500, "Error occurred while uploading avatar");
    }
  
    // Delete old avatar if exists
    if (req.user?.avatar) {
      await deleteImageOnCloudinary(req.user.avatar);
    }
  
    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarImg.url },
      { new: true }
    ).select("-password");
  
    if (!updatedUser) {
      throw new APIError(500, "Error while updating avatar in database");
    }
  
    return res.status(200).json(
      new APIResponse(200, { user: updatedUser }, "Avatar updated successfully")
    );
  });
  
  const getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  
    // Get comprehensive user statistics
    const [
      interviewStats,
      categoryStats,
      weeklyProgress,
      recentActivity
    ] = await Promise.all([
      // Overall interview statistics
      Interview.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalInterviews: { $sum: 1 },
            completedInterviews: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
            },
            averageScore: { $avg: "$score" },
            totalTimeSpent: { $sum: "$duration" },
            bestScore: { $max: "$score" },
            lastInterviewDate: { $max: "$createdAt" }
          }
        }
      ]),
  
      // Performance by category
      Interview.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            averageScore: { $avg: "$score" },
            bestScore: { $max: "$score" }
          }
        },
        { $sort: { count: -1 } }
      ]),
  
      // Weekly progress (last 4 weeks)
      Interview.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              week: { $week: "$createdAt" }
            },
            interviews: { $sum: 1 },
            averageScore: { $avg: "$score" }
          }
        },
        { $sort: { "_id.year": 1, "_id.week": 1 } }
      ]),
  
      // Recent activity (last 10 interviews)
      Interview.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("category status score completedAt duration")
        .lean()
    ]);
  
    const stats = interviewStats[0] || {
      totalInterviews: 0,
      completedInterviews: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      bestScore: 0,
      lastInterviewDate: null
    };
  
    return res.status(200).json(
      new APIResponse(200, {
        overview: {
          ...stats,
          averageScore: parseFloat(stats.averageScore.toFixed(2)) || 0,
          completionRate: stats.totalInterviews > 0 
            ? parseFloat(((stats.completedInterviews / stats.totalInterviews) * 100).toFixed(2))
            : 0
        },
        categoryPerformance: categoryStats.map(cat => ({
          category: cat._id,
          interviews: cat.count,
          averageScore: parseFloat(cat.averageScore.toFixed(2)) || 0,
          bestScore: cat.bestScore || 0
        })),
        weeklyProgress: weeklyProgress.map(week => ({
          week: `${week._id.year}-W${week._id.week}`,
          interviews: week.interviews,
          averageScore: parseFloat(week.averageScore.toFixed(2)) || 0
        })),
        recentActivity
      }, "User statistics retrieved successfully")
    );
  });
  
  const getUserInterviews = async (req, res) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
  
      const aggregate = InterviewSession.aggregate([
        {
          $match: {
            participants: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "admins", // because createdBy is Admin
            localField: "createdBy",
            foreignField: "_id",
            as: "createdBy",
          },
        },
        { $unwind: "$createdBy" },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            status: 1,
            scheduledAt: 1,
            createdAt: 1,
            updatedAt: 1,
            "createdBy._id": 1,
            "createdBy.fullName": 1,
            "createdBy.email": 1,
            "createdBy.avatar": 1,
            "participants._id": 1,
            "participants.fullName": 1,
            "participants.email": 1,
          },
        },
        { $sort: { scheduledAt: 1 } },
      ]);
  
      const result = await InterviewSession.aggregatePaginate(aggregate, {
        page,
        limit,
      });
  
      res.status(200).json({
        success: true,
        ...result,
        message: "User interviews fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching user interviews:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user interviews",
        error: error.message,
      });
    }
  };

  export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateUserProfile,
    getCurrentUser,
    updateUserAvatar,
    getUserProfile,
    getNewInterviewHistory,
    getInterviewHistory,
    uploadAvatar,
    getUserStats,
    getUserInterviews,
  };