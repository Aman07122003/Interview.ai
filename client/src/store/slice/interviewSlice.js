import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstanceUser from '../../../utils/axiosInstanceUser.js';

// Fetch interviews for current user with pagination
export const fetchInterviews = createAsyncThunk(
  'interview/fetchInterviews',
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await axiosInstanceUser.get(`/user/interviews?page=${page}`);
      console.log('Redux fetch response:', response.data);
      
      return response.data; // Return the entire response
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch interviews'
      );
    }
  }
);

const initialState = {
  interviews: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalDocs: 0,
    hasNext: false,
    hasPrev: false,
  }
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    clearInterviewError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch interviews
      .addCase(fetchInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.interviews = action.payload.docs || [];
        
        // Store pagination info
        state.pagination = {
          page: action.payload.page || 1,
          totalPages: action.payload.totalPages || 1,
          totalDocs: action.payload.totalDocs || 0,
          hasNext: action.payload.hasNextPage || false,
          hasPrev: action.payload.hasPrevPage || false,
        };
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.interviews = [];
      });
  },
});

export const { clearInterviewError, setPage } = interviewSlice.actions;
export default interviewSlice.reducer;