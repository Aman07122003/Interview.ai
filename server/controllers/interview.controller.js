// controllers/interview.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { APIResponse } from "../utils/APIResponse.js";
import { APIError } from "../utils/APIError.js";
import { evaluateAnswerWithAI } from "../utils/aiEvaluator.js";
import mongoose from "mongoose";

export const startInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category } = req.body;

  if (!category) {
    throw new APIError(400, "Category is required to start an interview");
  }

  // 1. Get 10 random questions from the category
  const questions = await Question.aggregate([
    { $match: { category } },
    { $sample: { size: 10 } },
    {
      $project: {
        _id: 1,
        questionText: 1,
      },
    },
  ]);

  if (!questions.length || questions.length < 10) {
    throw new APIError(
      404,
      `Not enough questions found for category "${category}". At least 10 are required.`
    );
  }

  // 2. Format for interview schema
  const formattedQuestions = questions.map((q) => ({
    questionId: q._id,
    questionText: q.questionText,
    answerText: null,
    aiFeedback: null,
    score: null,
  }));

  // 3. Create interview session
  const interview = await Interview.create({
    user: userId,
    category,
    questions: formattedQuestions,
    status: "in-progress",
  });

  // 4. Link interview to user's history
  await User.findByIdAndUpdate(userId, {
    $push: {
      interviewHistory: {
        interview: interview._id,
      },
    },
  });

  // 5. Return interview session (excluding answers, feedback, scores)
  return res
    .status(201)
    .json(
      new APIResponse(
        201,
        {
          interviewId: interview._id,
          category: interview.category,
          questions: interview.questions.map((q) => ({
            questionId: q.questionId,
            questionText: q.questionText,
          })),
        },
        "Interview started successfully"
      )
    );
});


export const submitAnswer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { interviewId, questionId, answerText } = req.body;

  if (!interviewId || !questionId || !answerText) {
    throw new APIError(400, "interviewId, questionId, and answerText are required");
  }

  // 1. Fetch the interview and validate ownership
  const interview = await Interview.findOne({
    _id: interviewId,
    user: userId,
    status: "in-progress",
  });

  if (!interview) {
    throw new APIError(404, "Interview not found or already completed");
  }

  // 2. Find the question entry inside interview
  const questionEntry = interview.questions.find(
    (q) => q.questionId.toString() === questionId
  );

  if (!questionEntry) {
    throw new APIError(404, "Question not found in interview");
  }

  if (questionEntry.answerText) {
    throw new APIError(400, "Answer for this question has already been submitted");
  }

  // TODO: Sanitize user input to prevent prompt injection attacks when interacting with AI
  // 3. Evaluate answer via AI (placeholder logic)
  const { score, feedback } = await evaluateAnswerWithAI(
    questionEntry.questionText,
    answerText
  );

  // 4. AI response safety check
  if (score === null || score === undefined || feedback === null || feedback === undefined) {
    throw new APIError(500, "AI failed to evaluate the answer");
  }

  // 5. Save answer, feedback, and score
  questionEntry.answerText = answerText;
  questionEntry.aiFeedback = feedback;
  questionEntry.score = score;

  await interview.save();

  // 6. Respond to frontend
  return res.status(200).json(
    new APIResponse(200, {
      questionId,
      score,
      aiFeedback: feedback,
    }, "Answer submitted and evaluated successfully")
  );
});

export const submitInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { interviewId } = req.body;

  if (!interviewId) {
    throw new APIError(400, "Interview ID is required");
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    user: userId,
    status: "in-progress",
  });

  if (!interview) {
    throw new APIError(404, "Interview not found or already completed");
  }

  // Ensure all questions have answers
  const unanswered = interview.questions.filter((q) => !q.answerText);
  if (unanswered.length > 0) {
    throw new APIError(400, "All questions must be answered before submission");
  }

  // Compute average score
  const totalScore = interview.questions.reduce((sum, q) => sum + (q.score || 0), 0);
  const avgScore = parseFloat((totalScore / interview.questions.length).toFixed(2));

  // Generate AI summary report
  const finalReport = await generateFinalReportWithAI(interview.questions);

  // Finalize interview
  interview.status = "completed";
  interview.score = avgScore;
  interview.finalReport = finalReport;
  interview.completedAt = new Date();
  await interview.save();

  return res.status(200).json(
    new APIResponse(200, {
      score: avgScore,
      finalReport,
      questions: interview.questions.map((q) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        answerText: q.answerText,
        score: q.score,
        aiFeedback: q.aiFeedback,
      })),
    }, "Interview submitted and detailed report generated")
  );
});

export const getInterviewReport = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new APIError(400, "Invalid interview ID");
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    user: req.user._id,
    status: "completed",
  }).lean();

  if (!interview) {
    throw new APIError(404, "Completed interview not found");
  }

  // Return full interview details (safe parts)
  return res.status(200).json(
    new APIResponse(200, {
      interviewId: interview._id,
      category: interview.category,
      questions: interview.questions.map((q, index) => ({
        questionNo: index + 1,
        questionText: q.questionText,
        answerText: q.answerText,
        aiFeedback: q.aiFeedback,
        score: q.score,
      })),
      finalScore: Math.round(
        interview.questions.reduce((acc, q) => acc + q.score, 0) / interview.questions.length
      ),
      finalReport: interview.finalReport,
      completedAt: interview.updatedAt,
    }, "Interview Report Fetched Successfully")
  );
});

export const deleteInterview = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new APIError(400, "Invalid interview ID");
  }

  // Find and delete the interview (only if it belongs to the user)
  const interview = await Interview.findOneAndDelete({
    _id: interviewId,
    user: req.user._id
  });

  if (!interview) {
    throw new APIError(404, "Interview not found or not authorized");
  }

  // Remove from user's interview history
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { interviewHistory: { interview: interviewId } }
  });

  return res.status(200).json(
    new APIResponse(200, {}, "Interview deleted successfully")
  );
});

export const getInterviewById = asyncHandler(async (req, res) => {
  const { interviewId } = req.params;

  if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new APIError(400, "Invalid interview ID");
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    user: req.user._id
  }).lean();

  if (!interview) {
    throw new APIError(404, "Interview not found");
  }

  return res.status(200).json(
    new APIResponse(200, { interview }, "Interview fetched successfully")
  );
});

export const getInterviewHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const interviews = await Interview.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new APIResponse(200, { interviews }, "Interview history fetched successfully")
  );
});

export const pauseInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { interviewId } = req.body;

  if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new APIError(400, "Invalid interview ID");
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    user: userId,
    status: "in-progress"
  });

  if (!interview) {
    throw new APIError(404, "Interview not found or not in progress");
  }

  interview.status = "paused";
  await interview.save();

  return res.status(200).json(
    new APIResponse(200, {}, "Interview paused successfully")
  );
});

export const resumeInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { interviewId } = req.body;

  if (!interviewId || !mongoose.Types.ObjectId.isValid(interviewId)) {
    throw new APIError(400, "Invalid interview ID");
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    user: userId,
    status: "paused"
  });

  if (!interview) {
    throw new APIError(404, "Interview not found or not paused");
  }

  interview.status = "in-progress";
  await interview.save();

  return res.status(200).json(
    new APIResponse(200, {}, "Interview resumed successfully")
  );
});
