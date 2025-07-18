const axios = require('axios');

// Test the profile update endpoint with error handling
async function testProfileErrorHandling() {
  try {
    console.log('Testing profile update error handling...');

    // First, try to login to get a token
    const loginResponse = await axios.post('http://localhost:5173/api/v1/auth/login', {
      email: 'lorenmin69@gmail.com',
      password: 'asdf!',
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful, got token');

    // Test with a duplicate username (should fail)
    console.log('\n🔍 Testing duplicate username error...');
    try {
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
      console.log('❌ Expected error but got success:', updateResponse.data);
    } catch (error) {
      console.log('✅ Got expected error for duplicate username');
      console.log('Status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Validation errors:', error.response?.data?.data?.errors);
    }

    // Test with a valid username but invalid display name
    console.log('\n🔍 Testing invalid display name error...');
    try {
      const updateResponse = await axios.put(
        'http://localhost:5173/api/v1/users/profile',
        {
          username: 'testuser123',
          profileName: 'A', // Too short
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('❌ Expected error but got success:', updateResponse.data);
    } catch (error) {
      console.log('✅ Got expected error for invalid display name');
      console.log('Status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Validation errors:', error.response?.data?.data?.errors);
    }

    console.log('\n✅ Profile error handling test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProfileErrorHandling();
