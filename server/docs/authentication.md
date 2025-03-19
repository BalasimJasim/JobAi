# Authentication System Documentation

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [JWT Token Structure](#jwt-token-structure)
3. [Protected Routes](#protected-routes)
4. [Error Handling](#error-handling)
5. [Security Overview](#security-overview)

## Authentication Endpoints

### Sign Up
- **Endpoint**: `POST /api/auth/signup`
- **Purpose**: Register a new user account
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Purpose**: Authenticate user and create session
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: Sets secure HTTP-only cookies and returns:
  ```json
  {
    "success": true,
    "message": "Logged in successfully",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
  ```

### Google OAuth
- **Endpoint**: `GET /api/auth/google`
- **Purpose**: Initiate Google OAuth flow
- **Response**: Redirects to Google login

### Google OAuth Callback
- **Endpoint**: `GET /api/auth/google/callback`
- **Purpose**: Handle Google OAuth response
- **Query Parameters**: `code` (authorization code)
- **Response**: Sets session cookies and redirects to dashboard

### Refresh Token
- **Endpoint**: `POST /api/auth/refresh`
- **Purpose**: Refresh expired access token
- **Requirements**: Valid refresh token in cookies
- **Response**: New access token in cookies

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Purpose**: End user session
- **Response**: Clears session cookies

### Password Reset Request
- **Endpoint**: `POST /api/auth/reset-password`
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```
- **Response**: Sends reset email

### Password Reset
- **Endpoint**: `POST /api/auth/reset-password/:token`
- **Request Body**:
  ```json
  {
    "newPassword": "string"
  }
  ```
- **Response**: Confirms password change

## JWT Token Structure

### Access Token
```javascript
{
  "userId": "string",
  "email": "string",
  "type": "access",
  "tokenVersion": number,
  "iat": number,
  "exp": number
}
```
- **Expiration**: 15 minutes
- **Purpose**: API authentication
- **Storage**: HTTP-only cookie

### Refresh Token
```javascript
{
  "userId": "string",
  "email": "string",
  "type": "refresh",
  "tokenVersion": number,
  "iat": number,
  "exp": number
}
```
- **Expiration**: 7 days
- **Purpose**: Obtain new access tokens
- **Storage**: HTTP-only cookie, restricted path

## Protected Routes

### Middleware Usage
```typescript
router.use(requireAuth);  // Apply to all routes in router
```

### Example Protected Route
```typescript
router.get('/resumes', requireAuth, async (req, res) => {
  // Access authenticated user via req.user
  const userId = req.user._id;
  // ... handle request
});
```

### CSRF Protection
```typescript
router.post('/update-profile', csrfProtection, requireAuth, async (req, res) => {
  // Route is protected by both authentication and CSRF
});
```

## Error Handling

### Error Types
```typescript
enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  RATE_LIMITED = 'RATE_LIMITED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

### Common Error Responses
- **401 Unauthorized**:
  - Invalid credentials
  - Missing or expired token
  - Invalid token type
- **403 Forbidden**:
  - Invalid CSRF token
  - Rate limited
  - Account locked
- **400 Bad Request**:
  - Validation errors
  - Invalid request format
- **500 Internal Server Error**:
  - Server-side errors

## Security Overview

### Authentication Features
1. **Session Management**
   - Dual token system (access + refresh)
   - Token versioning for invalidation
   - Secure HTTP-only cookies
   - CSRF protection

2. **Password Security**
   - Bcrypt hashing
   - Password complexity requirements
   - Secure reset mechanism
   - Rate limiting on attempts

3. **OAuth Integration**
   - Google OAuth 2.0 support
   - Email verification
   - Profile linking

### Security Measures
1. **Rate Limiting**
   - 5 attempts per 15 minutes
   - IP-based tracking
   - Account locking mechanism

2. **CSRF Protection**
   - Double submit cookie pattern
   - Required for state-changing operations
   - Unique token per session

3. **Cookie Security**
   - HTTP-only flags
   - Secure flag in production
   - SameSite policy
   - Path restrictions

4. **Token Security**
   - Short-lived access tokens
   - Versioning for invalidation
   - Refresh token rotation
   - Secure storage

### Best Practices Implemented
1. **Error Handling**
   - Generic error messages
   - Detailed internal logging
   - No sensitive data exposure

2. **Input Validation**
   - Request validation
   - Sanitization
   - Type checking

3. **Session Management**
   - Secure session termination
   - Multiple device handling
   - Activity tracking

4. **Monitoring**
   - Failed attempt logging
   - Suspicious activity detection
   - Error tracking

### Production Considerations
1. **Environment**
   - Secure environment variables
   - Production configurations
   - SSL/TLS requirement

2. **Deployment**
   - Secure headers
   - CORS configuration
   - Resource protection

3. **Maintenance**
   - Regular security updates
   - Token cleanup
   - Session monitoring 