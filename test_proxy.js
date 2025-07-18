const axios = require('axios');

async function testProxy() {
  try {
    console.log('Testing Vite proxy...');

    // Test the proxy by making a request to the Vite dev server
    const response = await axios.get('http://localhost:5173/api/v1/auth/status');
    console.log('✅ Proxy is working!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('❌ Proxy test failed:');
    console.error('Error:', error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);

    if (error.code === 'ECONNREFUSED') {
      console.error('Vite dev server is not running on port 5173');
    }
  }
}

testProxy();
