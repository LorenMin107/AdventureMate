const axios = require('axios');

// Test the profile update endpoint
async function testProfileUpdate() {
  try {
    console.log('Testing profile update endpoint...');

    // First, try to login to get a token
    const loginResponse = await axios.post('http://localhost:5173/api/v1/auth/login', {
      email: 'lorenmin69@gmail.com',
      password: 'asdf!',
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, got token');

    // Test the profile update endpoint with a duplicate username
    const updateResponse = await axios.put(
      'http://localhost:5173/api/v1/users/profile',
      {
        username: 'admin', // This should already exist
        profileName: 'Test User',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Profile update successful');
    console.log('Response:', updateResponse.data);
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    console.error('Error response data:', error.response?.data);
    console.error('Error message:', error.response?.data?.error || error.message);
  }
}

testProfileUpdate();
