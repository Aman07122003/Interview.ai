import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateProfile } from '../../services/api/user';
import { uploadAvatar, removeAvatar } from '../../services/api/user';


// Thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userApi.getProfile();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/profile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await updateProfile(profileData);
      return data;
      console.log(data);
    } catch (error) {
      return rejectWithValue(error.message || error); 
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'user/avatar',
  async (file, { rejectWithValue }) => {
    try {
      const data = await uploadAvatar(file);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);



export const deleteAvatar = createAsyncThunk(
  'user/deleteAvatar',
  async (_, { rejectWithValue }) => {
    try {
      const data = await removeAvatar();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || error);
    }
  }
);

const initialState = {
  profile: null, // { name, email, avatar, bio, ... }
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  avatarStatus: 'idle', // for avatar upload/delete
  avatarError: null,
  updateStatus: 'idle', // for profile update
  updateError: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.profile = null;
      state.status = 'idle';
      state.error = null;
      state.avatarStatus = 'idle';
      state.avatarError = null;
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setUserProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch profile';
      })
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.profile = { ...state.profile, ...action.payload };
        state.updateError = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload || 'Failed to update profile';
      })
      // Upload avatar
      .addCase(uploadUserAvatar.pending, (state) => {
        state.avatarStatus = 'loading';
        state.avatarError = null;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.avatarStatus = 'succeeded';
        if (state.profile) state.profile.avatar = action.payload.avatar;
        state.avatarError = null;
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.avatarStatus = 'failed';
        state.avatarError = action.payload || 'Failed to upload avatar';
      })
      // Delete avatar
      .addCase(deleteAvatar.pending, (state) => {
        state.avatarStatus = 'loading';
        state.avatarError = null;
      })
      .addCase(deleteAvatar.fulfilled, (state) => {
        state.avatarStatus = 'succeeded';
        if (state.profile) state.profile.avatar = null;
        state.avatarError = null;
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.avatarStatus = 'failed';
        state.avatarError = action.payload || 'Failed to delete avatar';
      });
  },
});

export const { resetUserState, setUserProfile } = userSlice.actions;
export default userSlice.reducer; 