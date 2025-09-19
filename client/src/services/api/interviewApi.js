// services/api/interviewApi.js
import axiosInstanceUser from "../../../utils/axiosInstanceUser.js";

export const interviewApi = {
  // ✅ Start interview session - FIXED ENDPOINT
  startInterview: async (sessionId) => {
    try {
      const res = await axiosInstanceUser.post(`/api/interviews/start/${sessionId}`);
      console.log("Interview started:", res.data);
      return res.data;
    } catch (err) {
      console.error("Error starting interview:", err.response?.data || err.message);
      throw err;
    }
  },

  // ✅ Save answer - FIXED ENDPOINT
  saveAnswer: async (resultId, questionId, answer, timeTaken) => {
    try {
      const res = await axiosInstanceUser.post(`/api/interviews/answer`, {
        resultId,
        questionId,
        answerText: answer,
        timeTaken,
      });
      return res.data;
    } catch (err) {
      console.error("Error saving answer:", err.response?.data || err.message);
      throw err;
    }
  },

  // ✅ Finalize interview - FIXED ENDPOINT
  finalizeInterview: async (resultId) => {
    try {
      const res = await axiosInstanceUser.post(`/api/interviews/submit`, { resultId });
      return res.data;
    } catch (err) {
      console.error("Error finalizing interview:", err.response?.data || err.message);
      throw err;
    }
  },

  // ✅ Get interview result - ADDED THIS
  getResult: async (resultId) => {
    try {
      const res = await axiosInstanceUser.get(`/api/interviews/result/${resultId}`);
      return res.data;
    } catch (err) {
      console.error("Error getting result:", err.response?.data || err.message);
      throw err;
    }
  }
};