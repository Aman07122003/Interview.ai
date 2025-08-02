import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as interviewApi from '../../services/api/interview';

// Thunks
export const startInterview = createAsyncThunk(
  'interview/start',
  async (options, { rejectWithValue }) => {
    try {
      const data = await interviewApi.startInterview(options);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const fetchInterview = createAsyncThunk(
  'interview/fetch',
  async (interviewId, { rejectWithValue }) => {
    try {
      const data = await interviewApi.getInterview(interviewId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'interview/submitAnswer',
  async ({ interviewId, answerData }, { rejectWithValue }) => {
    try {
      const data = await interviewApi.submitAnswer(interviewId, answerData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const submitInterview = createAsyncThunk(
  'interview/submit',
  async ({ interviewId, submissionData }, { rejectWithValue }) => {
    try {
      const data = await interviewApi.submitInterview(interviewId, submissionData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const pauseInterview = createAsyncThunk(
  'interview/pause',
  async ({ interviewId, pauseData }, { rejectWithValue }) => {
    try {
      const data = await interviewApi.pauseInterview(interviewId, pauseData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const resumeInterview = createAsyncThunk(
  'interview/resume',
  async ({ interviewId, resumeData }, { rejectWithValue }) => {
    try {
      const data = await interviewApi.resumeInterview(interviewId, resumeData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

const initialState = {
  current: null, // current interview session object
  status: 'idle', // 'idle' | 'loading' | 'in-progress' | 'paused' | 'submitting' | 'completed' | 'failed'
  error: null,
  submissionStatus: 'idle', // 'idle' | 'submitting' | 'succeeded' | 'failed'
  submissionError: null,
  isMidInterview: false, // for route guards/resume logic
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    resetInterviewState: (state) => {
      state.current = null;
      state.status = 'idle';
      state.error = null;
      state.submissionStatus = 'idle';
      state.submissionError = null;
      state.isMidInterview = false;
    },
    setInterviewSession: (state, action) => {
      state.current = action.payload;
      state.isMidInterview = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start interview
      .addCase(startInterview.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.isMidInterview = false;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.status = 'in-progress';
        state.current = action.payload;
        state.error = null;
        state.isMidInterview = true;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to start interview';
        state.isMidInterview = false;
      })
      // Fetch interview
      .addCase(fetchInterview.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.status = action.payload.status || 'in-progress';
        state.current = action.payload;
        state.error = null;
        state.isMidInterview = true;
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch interview';
        state.isMidInterview = false;
      })
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.status = 'in-progress';
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        // Optionally update current with feedback/nextQuestion
        if (state.current && action.payload.nextQuestion) {
          state.current.questions = state.current.questions.map(q =>
            q.id === action.payload.nextQuestion.id ? action.payload.nextQuestion : q
          );
        }
        state.error = null;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.status = 'in-progress';
        state.error = action.payload || 'Failed to submit answer';
      })
      // Submit interview
      .addCase(submitInterview.pending, (state) => {
        state.submissionStatus = 'submitting';
        state.submissionError = null;
      })
      .addCase(submitInterview.fulfilled, (state, action) => {
        state.submissionStatus = 'succeeded';
        state.status = 'completed';
        state.submissionError = null;
        state.isMidInterview = false;
      })
      .addCase(submitInterview.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.submissionError = action.payload || 'Failed to submit interview';
      })
      // Pause interview
      .addCase(pauseInterview.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(pauseInterview.fulfilled, (state) => {
        state.status = 'paused';
        state.isMidInterview = false;
      })
      .addCase(pauseInterview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to pause interview';
      })
      // Resume interview
      .addCase(resumeInterview.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(resumeInterview.fulfilled, (state, action) => {
        state.status = 'in-progress';
        state.current = action.payload.interview;
        state.isMidInterview = true;
      })
      .addCase(resumeInterview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to resume interview';
      });
  },
});

export const { resetInterviewState, setInterviewSession } = interviewSlice.actions;
export default interviewSlice.reducer; 