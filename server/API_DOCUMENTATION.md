# Mock Interview Platform API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT Bearer token:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
- Global: 1000 requests per minute
- Authentication: 5 attempts per 15 minutes
- File uploads: 5 uploads per hour
- Admin actions: Varies by endpoint

---

## 🔐 Authentication Routes (`/auth`)

### Public Endpoints

#### Register User
```http
POST /api/auth/register
```
**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

#### Login User
```http
POST /api/auth/login
```
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
```
**Body:**
```json
{
  "refreshToken": "string"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
```
**Body:**
```json
{
  "email": "string"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```
**Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
```
**Body:**
```json
{
  "token": "string"
}
```

### Private Endpoints

#### Get Current User
```http
GET /api/auth/me
```

#### Logout
```http
POST /api/auth/logout
```

#### Change Password
```http
POST /api/auth/change-password
```
**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

#### Resend Verification Email
```http
POST /api/auth/resend-verification
```

---

## 👤 User Routes (`/user`)

All endpoints require authentication.

#### Get Profile
```http
GET /api/user/profile
```

#### Update Profile
```http
PUT /api/user/profile
```
**Body:**
```json
{
  "fullName": "string",
  "bio": "string",
  "location": "string"
}
```

#### Upload Avatar
```http
POST /api/user/avatar
```
**Body:** `multipart/form-data` with `avatar` file

#### Delete Avatar
```http
DELETE /api/user/avatar
```

#### Get User Stats
```http
GET /api/user/stats
```

#### Get Interview History
```http
GET /api/user/interviews
GET /api/user/interviews/:interviewId
```

#### Deactivate Account
```http
POST /api/user/deactivate
```

#### Reactivate Account
```http
POST /api/user/reactivate
```

#### Delete Account
```http
DELETE /api/user/account
```

#### Export User Data
```http
GET /api/user/export
```

---

## 🎯 Interview Routes (`/interview`)

All endpoints require authentication.

#### Start Interview
```http
POST /api/interview/start
```
**Body:**
```json
{
  "category": "string"
}
```

#### Submit Answer
```http
POST /api/interview/:interviewId/answer
```
**Body:**
```json
{
  "questionId": "string",
  "answerText": "string"
}
```

#### Submit Interview
```http
POST /api/interview/:interviewId/submit
```

#### Get Interview Details
```http
GET /api/interview/:interviewId
```

#### Get Interview Report
```http
GET /api/interview/:interviewId/report
```

#### Get Interview History
```http
GET /api/interview/history
```

#### Pause Interview
```http
POST /api/interview/:interviewId/pause
```

#### Resume Interview
```http
POST /api/interview/:interviewId/resume
```

#### Delete Interview
```http
DELETE /api/interview/:interviewId
```

---

## ❓ Question Routes (`/questions`)

### Public Endpoints

#### Get All Questions
```http
GET /api/questions?category=string&page=number&limit=number&sortBy=string&sortOrder=string
```

#### Get Question Categories
```http
GET /api/questions/categories
```

#### Get Questions by Category
```http
GET /api/questions/category/:category
```

#### Get Question by ID
```http
GET /api/questions/:id
```

### Admin Only Endpoints

#### Create Question
```http
POST /api/questions
```
**Body:**
```json
{
  "category": "string",
  "questionText": "string",
  "difficulty": "string",
  "tags": ["string"]
}
```

#### Bulk Create Questions
```http
POST /api/questions/bulk
```
**Body:**
```json
{
  "questions": [
    {
      "category": "string",
      "questionText": "string"
    }
  ]
}
```

#### Update Question
```http
PUT /api/questions/:id
```
**Body:**
```json
{
  "category": "string",
  "questionText": "string"
}
```

#### Delete Question
```http
DELETE /api/questions/:id
```

#### Get Question Stats
```http
GET /api/questions/stats/overview
```

#### Export Questions
```http
GET /api/questions/export
```

---

## 👨‍💼 Admin Routes (`/admin`)

All endpoints require admin authentication.

#### Get Admin Stats
```http
GET /api/admin/stats
```

#### Get System Stats
```http
GET /api/admin/stats/system
```

#### Get Interview Stats
```http
GET /api/admin/stats/interviews
```

#### Get Question Stats
```http
GET /api/admin/stats/questions
```

#### Get Subscription Stats
```http
GET /api/admin/stats/subscriptions
```

#### Get Recent Activity
```http
GET /api/admin/activity
```

#### Get All Users
```http
GET /api/admin/users?page=number&limit=number&search=string&role=string
```

#### Get User Details
```http
GET /api/admin/users/:id
```

#### Update User Role
```http
PUT /api/admin/users/:id/role
```
**Body:**
```json
{
  "role": "string"
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
```

#### Export User Data
```http
GET /api/admin/users/:id/export
```

#### Update System Settings
```http
PUT /api/admin/settings
```
**Body:**
```json
{
  "setting": "value"
}
```

#### Get System Logs
```http
GET /api/admin/logs
```

#### Clear System Cache
```http
POST /api/admin/cache/clear
```

#### Backup Database
```http
POST /api/admin/backup
```

---

## 💳 Subscription Routes (`/subscriptions`)

### User Endpoints (Authentication Required)

#### Get My Subscription
```http
GET /api/subscriptions/my
```

#### Upgrade Subscription
```http
POST /api/subscriptions/upgrade
```
**Body:**
```json
{
  "plan": "string"
}
```

#### Downgrade Subscription
```http
POST /api/subscriptions/downgrade
```
**Body:**
```json
{
  "plan": "string"
}
```

#### Cancel Subscription
```http
POST /api/subscriptions/cancel
```

#### Reactivate Subscription
```http
POST /api/subscriptions/reactivate
```

#### Process Payment
```http
POST /api/subscriptions/payment
```
**Body:**
```json
{
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string"
}
```

#### Get Payment History
```http
GET /api/subscriptions/payment/history
```

### Admin Only Endpoints

#### Create Subscription
```http
POST /api/subscriptions
```
**Body:**
```json
{
  "userId": "string",
  "plan": "string",
  "expiresAt": "date"
}
```

#### Get All Subscriptions
```http
GET /api/subscriptions?userId=string&plan=string&status=string
```

#### Get Subscription by ID
```http
GET /api/subscriptions/:id
```

#### Update Subscription
```http
PUT /api/subscriptions/:id
```
**Body:**
```json
{
  "plan": "string",
  "status": "string",
  "expiresAt": "date"
}
```

#### Delete Subscription
```http
DELETE /api/subscriptions/:id
```

#### Get Subscription Stats
```http
GET /api/subscriptions/stats/overview
```

#### Refund Payment
```http
POST /api/subscriptions/payment/:id/refund
```

#### Export Subscription Data
```http
GET /api/subscriptions/export
```

---

## 🏥 Health & System Routes

#### Health Check
```http
GET /api/health
```

#### API Version
```http
GET /api/version
```

---

## 📊 Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Pagination Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 🔒 Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 📝 Notes

1. **Authentication**: Include `Authorization: Bearer <token>` header for protected routes
2. **Rate Limiting**: Respect rate limits to avoid 429 errors
3. **File Uploads**: Use `multipart/form-data` for file uploads
4. **Pagination**: Use `page` and `limit` query parameters for paginated endpoints
5. **Filtering**: Use query parameters for filtering data
6. **Sorting**: Use `sortBy` and `sortOrder` parameters for sorting

---

## 🚀 Getting Started

1. Start the server: `npm start`
2. Base URL: `http://localhost:5000/api`
3. Health check: `GET /api/health`
4. Register: `POST /api/auth/register`
5. Login: `POST /api/auth/login`
6. Use the returned access token for authenticated requests 