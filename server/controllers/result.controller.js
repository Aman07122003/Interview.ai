import { Result } from "../models/result.model.js";
import { InterviewSession } from "../models/interviewSession.model.js";

// 1️⃣ Start or Resume Interview
export const startInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const candidateId = req.user._id; // 👈 from Redux/Auth middleware

    // Check if interview session exists
    const session = await InterviewSession.findById(sessionId).populate("createdBy participants");
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    // Check if candidate is allowed
    if (!session.participants.some(p => p._id.toString() === candidateId.toString())) {
      return res.status(403).json({ message: "You are not a participant of this interview" });
    }

    // If already started, return that result
    let result = await Result.findOne({ interview: sessionId, candidate: candidateId });
    if (result) {
      return res.status(200).json({ message: "Interview resumed", data: result });
    }

    // Create fresh result doc
    result = await Result.create({
      interview: sessionId,
      candidate: candidateId,
      conductedBy: session.createdBy._id, // admin who created it
      responses: []
    });

    return res.status(201).json({ message: "Interview started", data: result });
  } catch (err) {
    console.error("Start Interview Error:", err);
    return res.status(500).json({ message: "Failed to start interview" });
  }
};

// 2️⃣ Save Answer for a Question
export const saveAnswer = async (req, res) => {
  try {
    const { resultId } = req.params;
    const { questionId, answer } = req.body;

    const result = await Result.findById(resultId).populate("interview");
    if (!result) return res.status(404).json({ message: "Result not found" });

    const session = await InterviewSession.findById(result.interview).lean();
    if (!session) return res.status(404).json({ message: "Interview session not found" });

    // Get current question
    const currentQ = session.questions.find(q => q._id.toString() === questionId);
    if (!currentQ) return res.status(400).json({ message: "Invalid question" });

    // Append response
    result.responses.push({
      question: currentQ.text,
      answer,
      maxMarks: 10
    });

    await result.save();

    // Check if it was last question
    const isLast = result.responses.length === session.questions.length;

    return res.status(200).json({
      message: isLast ? "Last question answered, ready for final submit" : "Answer saved",
      data: result,
      isLast
    });
  } catch (err) {
    console.error("Save Answer Error:", err);
    return res.status(500).json({ message: "Failed to save answer" });
  }
};

// 3️⃣ Final Submit (lock + later evaluate)
export const finalizeInterview = async (req, res) => {
  try {
    const { resultId } = req.params;

    let result = await Result.findById(resultId).populate("interview candidate conductedBy");
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Check all questions answered
    const totalQuestions = result.interview.questions.length;
    if (result.responses.length < totalQuestions) {
      return res.status(400).json({ message: "Please answer all questions before submitting" });
    }

    // Mark interview as submitted
    result.feedback = "Pending Evaluation"; // later replaced by AI/utility
    await result.save();

    return res.status(200).json({ message: "Interview submitted successfully", data: result });
  } catch (err) {
    console.error("Finalize Interview Error:", err);
    return res.status(500).json({ message: "Failed to finalize interview" });
  }
};
