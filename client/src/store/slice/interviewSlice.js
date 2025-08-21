// interviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to start interview session
export const startInterviewSession = createAsyncThunk(
  'interview/startSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/interview/start/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    currentSession: null,
    currentQuestionIndex: 0,
    answers: [],
    loading: false,
    error: null,
    resultId: null
  },
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestionIndex = action.payload;
    },
    saveAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      const existingAnswerIndex = state.answers.findIndex(a => a.questionId === questionId);
      
      if (existingAnswerIndex >= 0) {
        state.answers[existingAnswerIndex].answer = answer;
      } else {
        state.answers.push({ questionId, answer });
      }
    },
    clearInterview: (state) => {
      state.currentSession = null;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.loading = false;
      state.error = null;
      state.resultId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startInterviewSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startInterviewSession.fulfilled, (state, action) => {
        state.loading = false;
        state.resultId = action.payload._id;
        state.currentSession = action.payload.interview;
      })
      .addCase(startInterviewSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setCurrentQuestion, saveAnswer, clearInterview } = interviewSlice.actions;
export default interviewSlice.reducer;