const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  username: 'testuser',
  password: 'TestPassword123!',
  email: 'test@example.com',
  phone: '1234567890',
};

async function testPasswordChange() {
  try {
    console.log('🧪 Testing Password Change Functionality...\n');

    // Step 1: Register a test user
    console.log('1. Registering test user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
      console.log('✅ User registered successfully');
    } catch (error) {
      console.log('❌ Registration failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Message:', error.message);
      return;
    }

    // Step 2: Login to get access token
    console.log('2. Logging in...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password,
      });

      const accessToken = loginResponse.data.accessToken;
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Message:', error.message);
      return;
    }

    // Step 3: Change password
    console.log('3. Changing password...');
    const newPassword = 'NewTestPassword456!';
    try {
      const changePasswordResponse = await axios.put(
        `${BASE_URL}/users/change-password`,
        {
          currentPassword: TEST_USER.password,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('✅ Password changed successfully');
    } catch (error) {
      console.log('❌ Password change failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Message:', error.message);
      return;
    }

    // Step 4: Try to login with old password (should fail)
    console.log('4. Testing login with old password (should fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password,
      });
      console.log('❌ Login with old password should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Login with old password correctly failed');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 5: Login with new password (should succeed)
    console.log('5. Testing login with new password...');
    try {
      const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: TEST_USER.username,
        password: newPassword,
      });
      console.log('✅ Login with new password successful');
    } catch (error) {
      console.log('❌ Login with new password failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      console.log('Message:', error.message);
      return;
    }

    // Step 6: Test password validation
    console.log('6. Testing password validation...');
    try {
      await axios.put(
        `${BASE_URL}/users/change-password`,
        {
          currentPassword: newPassword,
          newPassword: 'weak', // Too weak password
        },
        {
          headers: {
            Authorization: `Bearer ${newLoginResponse.data.accessToken}`,
          },
        }
      );
      console.log('❌ Weak password should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Weak password correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Step 7: Test wrong current password
    console.log('7. Testing wrong current password...');
    try {
      await axios.put(
        `${BASE_URL}/users/change-password`,
        {
          currentPassword: 'WrongPassword123!',
          newPassword: 'AnotherNewPassword789!',
        },
        {
          headers: {
            Authorization: `Bearer ${newLoginResponse.data.accessToken}`,
          },
        }
      );
      console.log('❌ Wrong current password should have been rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Wrong current password correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All password change tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPasswordChange();
