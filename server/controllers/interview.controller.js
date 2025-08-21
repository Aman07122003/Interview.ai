import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Result } from "../models/result.model.js";
import { User } from "../models/User.js";
import { InterviewSession } from "../models/interviewSession.model.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const startInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  // 1. Find the interview session
  const session = await InterviewSession.findById(sessionId)
    .populate("createdBy", "_id username email fullName avatar")
    .populate("participants", "_id email fullName");

  if (!session) {
    throw new APIError(404, "Interview session not found");
  }

  // 2. Check if user is a participant
  const isParticipant = session.participants.some(
    participant => participant._id.toString() === userId.toString()
  );
  
  if (!isParticipant) {
    throw new APIError(403, "You are not a participant of this interview session");
  }

  // 3. Check if result already exists
  const existingResult = await Result.findOne({
    interview: sessionId,
    candidate: userId,
    status: { $in: ["in-progress", "completed"] }
  });

  if (existingResult) {
    return res.status(200).json(
      new APIResponse(
        200,
        {
          resultId: existingResult._id,
          interviewId: session._id,
          title: session.title,
          description: session.description,
          createdBy: session.createdBy,
          expertise: session.expertise,
          type: session.type,
          scheduledAt: session.scheduledAt,
          questions: session.questions.map((q) => ({
            questionId: q._id,
            text: q.text,
          })),
          status: existingResult.status
        },
        existingResult.status === "in-progress" 
          ? "Resuming existing interview" 
          : "Interview already completed"
      )
    );
  }

  // 4. Prepare responses from session questions
  const responses = session.questions.map((q) => ({
    question: q.text,
    questionId: q._id,
    answer: "",
    maxMarks: 10,
    obtainedMarks: 0,
    feedback: "",
    timeTaken: 0
  }));

  // 5. Create result doc for this interview attempt
  const result = await Result.create({
    interview: session._id,
    candidate: userId,
    conductedBy: session.createdBy._id,
    responses,
    status: "in-progress"
  });

  // 6. Link result to user's interview history
  await User.findByIdAndUpdate(userId, {
    $push: {
      interviewHistory: {
        interview: session._id,
        result: result._id,
        date: new Date()
      },
    },
  });

  // 7. Send back interview to start
  return res.status(201).json(
    new APIResponse(
      201,
      {
        resultId: result._id,
        interviewId: session._id,
        title: session.title,
        description: session.description,
        createdBy: session.createdBy,
        expertise: session.expertise,
        type: session.type,
        scheduledAt: session.scheduledAt,
        questions: session.questions.map((q) => ({
          questionId: q._id,
          text: q.text,
        })),
        status: "in-progress"
      },
      "Interview started successfully"
    )
  );
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { resultId, questionId, answerText, timeTaken } = req.body;

  if (!resultId || !questionId || !answerText) {
    throw new APIError(400, "resultId, questionId, and answerText are required");
  }

  // 1. Fetch result doc for this candidate
  const result = await Result.findOne({
    _id: resultId,
    candidate: userId,
    status: "in-progress"
  });

  if (!result) {
    throw new APIError(404, "Active interview session not found");
  }

  // 2. Find the question entry by questionId
  const questionEntry = result.responses.find(
    (response) => response.questionId.toString() === questionId
  );

  if (!questionEntry) {
    throw new APIError(404, "Question not found in this interview");
  }

  // 3. Update the answer and time taken
  questionEntry.answer = answerText;
  questionEntry.timeTaken = timeTaken || 0;

  await result.save();

  // 4. Check if all questions are answered
  const allAnswered = result.responses.every(response => 
    response.answer && response.answer.trim() !== ""
  );

  return res.status(200).json(
    new APIResponse(
      200,
      {
        resultId: result._id,
        questionId,
        answer: questionEntry.answer,
        allQuestionsAnswered: allAnswered,
        progress: `${result.responses.filter(r => r.answer.trim() !== "").length}/${result.responses.length}`
      },
      "Answer submitted successfully"
    )
  );
});

export const submitInterview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { resultId } = req.body;

  if (!resultId) {
    throw new APIError(400, "Result ID is required");
  }

  // 1. Find the result doc
  const result = await Result.findOne({
    _id: resultId,
    candidate: userId,
    status: "in-progress"
  }).populate("interview");

  if (!result) {
    throw new APIError(404, "Active interview session not found");
  }

  // 2. Ensure all questions are answered
  const unanswered = result.responses.filter((r) => !r.answer || r.answer.trim() === "");
  if (unanswered.length > 0) {
    throw new APIError(400, "All questions must be answered before submission");
  }

  // 3. Update status to completed before AI evaluation
  result.status = "completed";
  await result.save();

  try {
    // 4. Build prompt for ChatGPT
    const messages = [
      {
        role: "system",
        content: `You are an expert technical interviewer evaluating coding interview responses.
Evaluate each answer on:
1. Technical accuracy (0-10)
2. Code quality and best practices (0-10)
3. Problem-solving approach (0-10)
4. Communication clarity (0-10)

For each question, provide:
- score (average of above criteria, 0-10)
- specific feedback
- suggestions for improvement

Return ONLY valid JSON in this exact format:
{
  "evaluations": [
    { 
      "question": "question text", 
      "answer": "answer text", 
      "score": 7.5, 
      "feedback": "specific feedback",
      "improvements": ["suggestion1", "suggestion2"]
    }
  ],
  "overallFeedback": "Comprehensive overall feedback",
  "areasOfImprovement": ["area1", "area2", "area3"],
  "strengths": ["strength1", "strength2", "strength3"]
}`
      },
      {
        role: "user",
        content: `Please evaluate this technical interview:

Interview Topic: ${result.interview.expertise}
Questions and Answers:
${JSON.stringify(result.responses.map(r => ({
  question: r.question,
  answer: r.answer
})), null, 2)}`
      },
    ];

    // 5. Call ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error("AI response parse error:", err);
      throw new APIError(500, "Failed to parse AI evaluation response");
    }

    // 6. Update each response with score + feedback
    result.responses.forEach((response) => {
      const evaluation = aiResponse.evaluations.find(
        (e) => e.question === response.question && e.answer === response.answer
      );
      
      if (evaluation) {
        response.obtainedMarks = Math.min(10, Math.max(0, evaluation.score));
        response.feedback = evaluation.feedback;
      }
    });

    // 7. Save overall feedback
    result.overallFeedback = aiResponse.overallFeedback || "";
    result.areasOfImprovement = aiResponse.areasOfImprovement || [];
    result.strengths = aiResponse.strengths || [];
    result.status = "evaluated";

    await result.save();

    // 8. Send back final response
    return res.status(200).json(
      new APIResponse(
        200,
        {
          resultId: result._id,
          totalObtained: result.totalObtained,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          overallFeedback: result.overallFeedback,
          areasOfImprovement: result.areasOfImprovement,
          strengths: result.strengths,
          responses: result.responses.map(r => ({
            question: r.question,
            answer: r.answer,
            score: r.obtainedMarks,
            feedback: r.feedback
          }))
        },
        "Interview submitted and evaluated successfully"
      )
    );

  } catch (error) {
    console.error("ChatGPT evaluation error:", error);
    
    // If ChatGPT fails, still mark as completed but with error note
    result.status = "completed";
    result.overallFeedback = "Evaluation pending - system error";
    await result.save();
    
    throw new APIError(500, "AI evaluation failed, but interview was submitted");
  }
});

// Additional utility function
export const getInterviewResult = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { resultId } = req.params;

  const result = await Result.findOne({
    _id: resultId,
    $or: [
      { candidate: userId },
      { conductedBy: userId }
    ]
  })
  .populate("candidate", "fullName email avatar")
  .populate("conductedBy", "fullName email avatar")
  .populate("interview", "title description expertise");

  if (!result) {
    throw new APIError(404, "Result not found");
  }

  return res.status(200).json(
    new APIResponse(
      200,
      result,
      "Interview result retrieved successfully"
    )
  );
});