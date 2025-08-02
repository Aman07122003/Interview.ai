# API Service Architecture

## Overview
This directory contains a well-structured API service layer with proper separation of concerns and production-grade features.

## File Structure

### Core Configuration
- **`config.js`** - Main API configuration and Axios instance
  - Production-grade Axios setup with interceptors
  - Token refresh logic
  - Error handling with custom `ApiError` class
  - Request/response logging
  - Security best practices

### Service Modules
- **`auth.js`** - Authentication-related API calls
- **`user.js`** - User management API calls
- **`interview.js`** - Interview-related API calls
- **`question.js`** - Question management API calls
- **`admin.js`** - Admin-specific API calls
- **`subscription.js`** - Subscription management API calls
- **`utility.js`** - Utility API functions

### Index File
- **`index.js`** - Central export point for all API services

## Key Features

### 1. Centralized Configuration (`config.js`)
- Single source of truth for API configuration
- Environment-based settings
- Automatic token management
- Error handling and retry logic

### 2. Token Management
```javascript
import { tokenManager } from './config.js';

// Get tokens
const accessToken = tokenManager.getAccessToken();
const refreshToken = tokenManager.getRefreshToken();

// Set tokens
tokenManager.setTokens({ accessToken, refreshToken });

// Clear tokens
tokenManager.clearTokens();
```

### 3. Error Handling
```javascript
import { handleApiError } from './config.js';

try {
  const response = await api.get('/some-endpoint');
} catch (error) {
  const errorInfo = handleApiError(error);
  console.log(errorInfo.message);
}
```

### 4. Usage in Components
```javascript
import * as authApi from '../services/api/auth';
import * as userApi from '../services/api/user';

// Use in async thunks or components
const response = await authApi.login(credentials);
const userData = await userApi.getProfile();
```

## Benefits of This Architecture

1. **Consistency**: All API calls use the same configuration
2. **Maintainability**: Changes to API behavior only need to be made in one place
3. **Security**: Centralized token management and security practices
4. **Debugging**: Built-in logging and error tracking
5. **Scalability**: Easy to add new API services following the same pattern

## Migration Notes

- The old `api.js` file has been removed to eliminate confusion
- All imports now use `config.js` for the Axios instance
- Token management is now handled through the `tokenManager` utility

# API Services Documentation

This directory contains a production-grade, modular API service layer for the AI Interview Coach frontend. The services are built with enterprise-grade features including error handling, token management, retry logic, and comprehensive logging.

## 🏗️ Architecture

```
src/services/api/
├── config.js          # Core Axios configuration and interceptors
├── auth.js            # Authentication and user management
├── user.js            # User profile and account operations
├── interview.js       # Interview session management
├── question.js        # Question management and retrieval
├── admin.js           # Administrative functions
├── subscription.js    # Subscription and billing
├── utility.js         # System utilities and health checks
├── index.js           # Main export file
└── README.md          # This documentation
```

## 🚀 Quick Start

### Basic Usage

```javascript
// Import specific services
import { auth, user, interview } from '@/services/api';

// Or import all services
import apiServices from '@/services/api';

// Use individual functions
const loginUser = async () => {
  try {
    const result = await auth.login({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('Login successful:', result);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

### Error Handling

```javascript
import { handleApiError } from '@/services/api';

const handleUserAction = async () => {
  try {
    const profile = await user.getProfile();
    return profile;
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`Error ${apiError.status}: ${apiError.message}`);
    
    // Handle specific error types
    if (apiError.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
  }
};
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development

# Production settings
NODE_ENV=production
```

### Token Management

The API automatically handles JWT tokens:

```javascript
import { tokenManager } from '@/services/api';

// Manual token management (if needed)
tokenManager.setTokens({
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token'
});

// Check authentication status
const isLoggedIn = tokenManager.getAccessToken() !== null;
```

## 📚 Service Examples

### Authentication

```javascript
import { auth } from '@/services/api';

// Register new user
const registerUser = async (userData) => {
  const result = await auth.register({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securepassword',
    fullName: 'John Doe'
  });
  return result;
};

// Login user
const loginUser = async (credentials) => {
  const result = await auth.login({
    email: 'john@example.com',
    password: 'securepassword'
  });
  return result;
};

// Logout user
const logoutUser = async () => {
  await auth.logout();
  // User will be redirected to login page automatically
};
```

### User Management

```javascript
import { user } from '@/services/api';

// Get user profile
const getProfile = async () => {
  const profile = await user.getProfile();
  return profile;
};

// Update profile
const updateProfile = async (profileData) => {
  const updated = await user.updateProfile({
    fullName: 'John Smith',
    bio: 'Software Engineer',
    location: 'San Francisco'
  });
  return updated;
};

// Upload avatar
const uploadAvatar = async (file) => {
  const result = await user.uploadAvatar(file);
  return result.avatarUrl;
};
```

### Interview Management

```javascript
import { interview } from '@/services/api';

// Start new interview
const startInterview = async () => {
  const interviewSession = await interview.startInterview({
    category: 'javascript',
    questionCount: 10,
    difficulty: 'medium'
  });
  return interviewSession;
};

// Submit answer
const submitAnswer = async (interviewId, questionId, answer) => {
  const result = await interview.submitAnswer(interviewId, {
    questionId,
    answer: 'My answer here...',
    timeSpent: 120 // seconds
  });
  return result;
};

// Get interview history
const getHistory = async () => {
  const history = await interview.getInterviewHistory({
    page: 1,
    limit: 20,
    status: 'completed'
  });
  return history;
};
```

### Question Management

```javascript
import { question } from '@/services/api';

// Get questions with filters
const getQuestions = async () => {
  const questions = await question.getQuestions({
    category: 'javascript',
    difficulty: 'medium',
    limit: 50
  });
  return questions;
};

// Get categories
const getCategories = async () => {
  const categories = await question.getCategories({
    includeStats: true
  });
  return categories;
};

// Search questions
const searchQuestions = async (query) => {
  const results = await question.searchQuestions({
    query: 'React hooks',
    filters: {
      difficulty: 'medium',
      category: 'frontend'
    }
  });
  return results;
};
```

### Admin Functions

```javascript
import { admin } from '@/services/api';

// Get system statistics
const getStats = async () => {
  const stats = await admin.getSystemStats({
    period: 'month'
  });
  return stats;
};

// Manage users
const manageUsers = async () => {
  const users = await admin.getUsers({
    page: 1,
    limit: 50,
    status: 'active'
  });
  return users;
};

// System maintenance
const clearCache = async () => {
  const result = await admin.clearCache({
    types: ['user', 'interview']
  });
  return result;
};
```

## 🔒 Security Features

### Automatic Token Refresh

The API automatically handles token refresh when requests return 401:

```javascript
// This will automatically refresh tokens if needed
const profile = await user.getProfile();
```

### Secure Logging

Sensitive data is automatically redacted in logs:

```javascript
// Tokens are redacted in development logs
// Request: Authorization: [REDACTED]
// Response: 200 OK (150ms)
```

### CSRF Protection

When using cookies in production:

```javascript
// withCredentials is automatically set in production
// CSRF tokens are handled automatically
```

## 🛠️ Development Features

### Request/Response Logging

In development mode, all requests and responses are logged:

```
🚀 API Request [POST] /auth/login
✅ API Response [200] /auth/login (245ms)
❌ API Error [401] /user/profile (89ms)
```

### Error Mapping

HTTP status codes are mapped to user-friendly messages:

```javascript
// 400: "Bad Request - Please check your input"
// 401: "Unauthorized - Please log in again"
// 403: "Forbidden - You don't have permission to access this resource"
// 404: "Not Found - The requested resource was not found"
// 500: "Internal Server Error - Please try again later"
```

## 📝 TypeScript Support

The services are designed to be TypeScript-ready. Add type definitions:

```typescript
// types/api.ts
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

export interface InterviewSession {
  id: string;
  category: string;
  status: 'in-progress' | 'completed' | 'paused';
  questions: Question[];
}

// Usage with types
import { user } from '@/services/api';
import type { User } from '@/types/api';

const profile: User = await user.getProfile();
```

## 🧪 Testing

### Mock API for Testing

```javascript
// tests/mocks/api.js
import { jest } from '@jest/globals';

export const mockApi = {
  auth: {
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock-token',
      user: { id: '1', email: 'test@example.com' }
    })
  },
  user: {
    getProfile: jest.fn().mockResolvedValue({
      id: '1',
      fullName: 'Test User'
    })
  }
};

// In your test
jest.mock('@/services/api', () => mockApi);
```

## 🚨 Error Handling Best Practices

### Component Error Handling

```javascript
import React, { useState, useEffect } from 'react';
import { user, handleApiError } from '@/services/api';

const ProfileComponent = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await user.getProfile();
        setProfile(data);
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;

  return <div>Welcome, {profile.fullName}!</div>;
};
```

### Global Error Handler

```javascript
// utils/errorHandler.js
import { handleApiError } from '@/services/api';

export const globalErrorHandler = (error) => {
  const apiError = handleApiError(error);
  
  // Log error for debugging
  console.error('API Error:', apiError);
  
  // Show user-friendly message
  showNotification(apiError.message, 'error');
  
  // Handle specific error types
  switch (apiError.status) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      // Show access denied message
      showNotification('Access denied', 'warning');
      break;
    case 500:
      // Show generic error
      showNotification('Something went wrong. Please try again.', 'error');
      break;
  }
};
```

## 🔄 Migration from Old API

### Before (Old API)

```javascript
// Old way
import api from '@/services/api.js';

const login = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    return response.data;
  } catch (error) {
    console.log('Login error', error);
    throw error;
  }
};
```

### After (New API)

```javascript
// New way
import { auth } from '@/services/api';

const login = async (credentials) => {
  try {
    const result = await auth.login(credentials);
    return result;
  } catch (error) {
    // Error is already handled and formatted
    throw error;
  }
};
```

## 📋 Environment Setup

### Required Environment Variables

```env
# Development
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development

# Production
REACT_APP_API_URL=https://api.yourapp.com/api
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
```

### Optional Environment Variables

```env
# Custom timeout (default: 30000ms)
REACT_APP_API_TIMEOUT=45000

# Enable detailed logging
REACT_APP_API_DEBUG=true

# Custom error messages
REACT_APP_API_ERROR_MESSAGES=true
```

## 🤝 Contributing

When adding new API endpoints:

1. Add the function to the appropriate service module
2. Include JSDoc documentation
3. Add proper error handling
4. Update this README with examples
5. Add TypeScript types if applicable

## 📞 Support

For questions or issues:

1. Check the error logs in browser console
2. Verify environment variables are set correctly
3. Ensure the backend API is running and accessible
4. Check network connectivity and CORS settings 