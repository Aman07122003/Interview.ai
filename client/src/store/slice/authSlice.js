import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstanceUser from '../../../utils/axiosInstanceUser.js';


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

    export const userRegister = createAsyncThunk('/auth/register', async (userData) => {
        try {
            const response = await axiosInstanceUser.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error.response.data;
        }
    });

    export const userLogin = createAsyncThunk(
        '/auth/login',
        async (userData) => {
          try {
            const response = await axiosInstanceUser.post('/auth/login', userData);
            return response.data;
          } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Login failed' });
          }
        }
      );

    export const userLogout = createAsyncThunk('/auth/logout', async (_, { getState }) => {
        try {
          const token = getState().userAuth.accessToken || localStorage.getItem("userAccessToken");
      
          // Send token in header
          const response = await axiosInstanceUser.post('/auth/logout', null, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return true;
        } catch (error) {
          throw error.response?.data || error.message;
        }
    });
      
    export const refreshUserToken = createAsyncThunk(
        'auth/refreshToken',
        async (_, { getState }) => {
          try {
            const refreshToken = getState().userAuth.refreshToken;
            const response = await axiosInstanceUser.post('/auth/refresh-token', { refreshToken });
            return response.data;
          } catch (error) {
            throw error.response?.data || error.message;
          }
        }
      );
      
    
    export const getCurrentUser = createAsyncThunk('/auth/getCurrentUser', async () => {
        try {
            const response = await axiosInstanceUser.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch user' };
        }
    });

    const userAuthSlice = createSlice({
        name: 'userAuth',
        initialState,
        reducers: {
            clearError: (state) => {
                state.error = null;
              },
              setCredentials: (state, action) => {
                const { user, accessToken, refreshToken } = action.payload;
                state.user = user;
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.isAuthenticated = true;
                
                // Store tokens in localStorage
                if (accessToken) {
                  localStorage.setItem('userAccessToken', accessToken);
                }
                if (refreshToken) {
                  localStorage.setItem('userRefreshToken', refreshToken);
                }
              },
              logout: (state) => {
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.error = null;
                
                // Remove tokens from localStorage
                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
              }
        },
        extraReducers: (builder) => {
            builder 
            .addCase(userRegister.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(userRegister.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
            })

            .addCase(userRegister.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message || 'Registration failed';
            })

            .addCase(userLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(userLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                const { user, accessToken, refreshToken } = action.payload;
                state.user = user;
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.isAuthenticated = true;

                if(accessToken) {
                    localStorage.setItem('userAccessToken', accessToken);
                }

                if(refreshToken) {
                    localStorage.setItem('userRefreshToken', refreshToken);
                }
            })

            .addCase(userLogin.rejected, (state, action) => {
                state.loading = false;
                // safe fallback: check payload first, then action.error.message
                state.error = action.payload?.message || action.error?.message || 'Login failed';
            })     

            .addCase(userLogout.pending, (state) => {
                state.loading = true;
                state.status = false;
                state.error = null;
            })

            .addCase(refreshUserToken.pending, (state) => {
                state.loading = true;
                state.error = null; // Reset error
              })

            .addCase(refreshUserToken.fulfilled, (state, action) => {
                const { accessToken, refreshToken } = action.payload.data;
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.isAuthenticated = true;
              
                if (accessToken) {
                    localStorage.setItem('userAccessToken', accessToken);
                }
                if (refreshToken) {
                localStorage.setItem('userRefreshToken', refreshToken);
                }
              })
              .addCase(refreshUserToken.rejected, (state, action) => {
                state.isAuthenticated = false;
                state.accessToken = null;
                state.refreshToken = null;
              
                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
              })
              

            .addCase(userLogout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.accessToken = null;
                state.refreshToken = null;
                state.error = null;

                localStorage.removeItem('user');
            })

            .addCase(userLogout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload.message || 'Logout failed';
                state.user = null;
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                
                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
            })

            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })

            .addCase(getCurrentUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user';
                state.user = null;
                state.isAuthenticated = false;

                localStorage.removeItem('userAccessToken');
                localStorage.removeItem('userRefreshToken');
            });
        }
    }); 

export default userAuthSlice.reducer;