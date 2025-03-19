import { connectDatabase, disconnectDatabase } from './database';
import { User } from '../models/user.model';
import { SessionManager } from '../utils/session';
import { AuthErrorType } from '../utils/error-handler';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testAuth = async () => {
  try {
    console.log('Starting Authentication Tests...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Clean up any existing test user
    await User.deleteOne({ email: TEST_USER.email });
    console.log('✅ Cleaned up existing test data\n');

    // 1. Test Signup Process
    console.log('1. Testing Signup Process...');
    
    // Test invalid signup (missing fields)
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        email: TEST_USER.email
      });
      console.log('❌ Should have failed with missing fields');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid signup data');
      }
    }

    // Test valid signup
    try {
      const signupResponse = await axios.post(`${API_URL}/auth/signup`, TEST_USER);
      if (signupResponse.data.success) {
        console.log('✅ Successfully created new user');
      }
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }

    // Test duplicate signup
    try {
      await axios.post(`${API_URL}/auth/signup`, TEST_USER);
      console.log('❌ Should have failed with duplicate email');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected duplicate signup');
      }
    }

    console.log('\n2. Testing Login Process...');

    // Test login with incorrect password
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER.email,
        password: 'WrongPassword123!'
      });
      console.log('❌ Should have failed with incorrect password');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected invalid credentials');
      }
    }

    // Test successful login
    let authTokens;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      if (loginResponse.data.success) {
        console.log('✅ Successfully logged in');
        authTokens = loginResponse.headers['set-cookie'];
      }
    } catch (error) {
      console.error('❌ Failed to login:', error);
      throw error;
    }

    console.log('\n3. Testing Protected Routes...');

    // Test accessing protected route without auth
    try {
      await axios.get(`${API_URL}/resumes`);
      console.log('❌ Should have failed without auth token');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request');
      }
    }

    // Test accessing protected route with auth
    try {
      const response = await axios.get(`${API_URL}/resumes`, {
        headers: {
          Cookie: authTokens?.join('; ')
        }
      });
      if (response.status === 200) {
        console.log('✅ Successfully accessed protected route');
      }
    } catch (error) {
      console.error('❌ Failed to access protected route:', error);
    }

    console.log('\n4. Testing Password Reset Flow...');

    // Test password reset request
    try {
      const resetResponse = await axios.post(`${API_URL}/auth/reset-password`, {
        email: TEST_USER.email
      });
      if (resetResponse.data.success) {
        console.log('✅ Successfully requested password reset');
      }
    } catch (error) {
      console.error('❌ Failed to request password reset:', error);
    }

    // Get the reset token from the database (in real world this would be sent via email)
    const user = await User.findOne({ email: TEST_USER.email });
    const resetToken = user?.resetPasswordToken;

    if (resetToken) {
      // Test password reset with valid token
      try {
        const response = await axios.post(`${API_URL}/auth/reset-password/${resetToken}`, {
          newPassword: 'NewPassword123!'
        });
        if (response.data.success) {
          console.log('✅ Successfully reset password');
        }
      } catch (error) {
        console.error('❌ Failed to reset password:', error);
      }

      // Test password reset with used token
      try {
        await axios.post(`${API_URL}/auth/reset-password/${resetToken}`, {
          newPassword: 'NewPassword123!'
        });
        console.log('❌ Should have failed with used token');
      } catch (error: any) {
        if (error.response?.status === 400) {
          console.log('✅ Correctly rejected used reset token');
        }
      }
    }

    console.log('\n5. Testing Token Validation and Expiration...');

    // Test refresh token
    try {
      const refreshResponse = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        {
          headers: {
            Cookie: authTokens?.join('; ')
          }
        }
      );
      if (refreshResponse.data.success) {
        console.log('✅ Successfully refreshed token');
      }
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
    }

    // Test logout
    try {
      const logoutResponse = await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          headers: {
            Cookie: authTokens?.join('; ')
          }
        }
      );
      if (logoutResponse.data.success) {
        console.log('✅ Successfully logged out');
      }
    } catch (error) {
      console.error('❌ Failed to logout:', error);
    }

    // Clean up
    await User.deleteOne({ email: TEST_USER.email });
    console.log('\n✅ Cleaned up test data');

    await disconnectDatabase();
    console.log('✅ Disconnected from database');
    console.log('\nAuthentication tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Authentication tests failed:', error);
    process.exit(1);
  }
};

// Run the tests
testAuth(); 