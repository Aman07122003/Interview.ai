// services/api/interviewApi.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const interviewApi = {
  // Start interview session
  startInterview: async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/interviews/start/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  },

  // Save answer
  saveAnswer: async (resultId, questionId, answer, timeTaken) => {
    const response = await fetch(`${API_BASE_URL}/interviews/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ resultId, questionId, answerText: answer, timeTaken })
    });
    return response.json();
  },

  // Finalize interview
  finalizeInterview: async (resultId) => {
    const response = await fetch(`${API_BASE_URL}/interviews/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ resultId })
    });
    return response.json();
  }
};