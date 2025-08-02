import React from 'react'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { tokenManager } from '../../services/api/config';
import * as authApi from '../../services/api/auth';


// Define initial state
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('accessToken') || false,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null,
    status: false, 
    }                                                      

    export const register = createAsyncThunk('/auth/register', async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    });

    export const login = createAsyncThunk('/auth/login', async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/login', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    });

    export const logout = createAsyncThunk('/auth/logout', async (_, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/logout');
            return true;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    });

    export const getCurrentUser = createAsyncThunk('/auth/getCurrentUser', async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.getCurrentUser();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch user' });
        }
    });

    const authSlice = createSlice({
        name: 'auth',
        initialState,
        reducers: {},
        extraReducers: (builder) => {
            builder 
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                const { user, accessToken, refreshToken } = action.payload.data;
                state.loading = false;
                state.user = action.payload.data.user;
                state.isAuthenticated = true;
                state.accessToken = action.payload.data.accessToken;
                state.refreshToken = action.payload.data.refreshToken;

                localStorage.setItem('user', JSON.stringify(user));
                tokenManager.setTokens({ accessToken, refreshToken });
            })

            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message || 'Registration failed';
            })

            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(login.fulfilled, (state, action) => {
                const { user, accessToken, refreshToken } = action.payload.data;
                state.loading = false;
                state.user = action.payload.data.user;
                state.isAuthenticated = true;
                state.accessToken = action.payload.data.accessToken;
                state.refreshToken = action.payload.data.refreshToken;

                localStorage.setItem('user', JSON.stringify(user));
                tokenManager.setTokens({ accessToken, refreshToken });
            })

            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message || 'Login failed';
            })

            .addCase(logout.pending, (state) => {
                state.loading = true;
                state.status = false;
                state.error = null;
            })

            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.accessToken = null;
                state.refreshToken = null;

                localStorage.removeItem('user');
                tokenManager.clearTokens();
            })

            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message || 'Logout failed';
            })

            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                // Update localStorage with user data
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            })

            .addCase(getCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user';
                // If we can't get current user, they might not be authenticated
                state.user = null;
                state.isAuthenticated = false;
                localStorage.removeItem('user');
            });
        }
    }); 

export default authSlice.reducer;