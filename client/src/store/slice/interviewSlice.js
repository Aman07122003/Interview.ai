import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstanceUser from '../../../utils/axiosInstanceUser.js';

// Start an interview session
export const startInterviewSession = createAsyncThunk(
  'interview/startSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await axiosInstanceUser.post(`/interview/start/${sessionId}`);
      return response.data.data; // assuming API returns { data: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch interviews for current user
export const fetchInterviews = createAsyncThunk(
  'interview/fetchInterviews',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Use token from Redux store or fallback to localStorage
      const token = getState().userAuth?.accessToken || localStorage.getItem('userAccessToken');

      const response = await axiosInstanceUser.get('/user/interviews', {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      return response.data.data || []; // ensure it's an array
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch interviews'
      );
    }
  }
);

const initialState = {
  interviews: [],
  currentSession: null,
  loading: false,
  error: null,
  resultId: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    clearInterview: (state) => {
      state.currentSession = null;
      state.resultId = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start interview session
      .addCase(startInterviewSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startInterviewSession.fulfilled, (state, action) => {
        state.loading = false;
        state.resultId = action.payload._id;
        state.currentSession = action.payload;
      })
      .addCase(startInterviewSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch interviews
      .addCase(fetchInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.interviews = action.payload; // always an array
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.interviews = []; // reset on error
      });
  },
});

export default interviewSlice.reducer;
