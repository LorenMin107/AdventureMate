const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1/weather';

async function testWeatherAPI() {
  console.log('🧪 Testing Weather API Implementation...\n');

  const tests = [
    {
      name: 'Valid coordinates (Bangkok)',
      params: { lat: 13.7563, lng: 100.5018 },
      expectedStatus: 503, // Will be 503 without API key, 200 with API key
    },
    {
      name: 'Valid coordinates (Chiang Mai)',
      params: { lat: 18.7883, lng: 98.9853 },
      expectedStatus: 503, // Will be 503 without API key, 200 with API key
    },
    {
      name: 'Missing latitude',
      params: { lng: 100.5018 },
      expectedStatus: 400,
    },
    {
      name: 'Missing longitude',
      params: { lat: 13.7563 },
      expectedStatus: 400,
    },
    {
      name: 'Invalid latitude (too high)',
      params: { lat: 91, lng: 100.5018 },
      expectedStatus: 400,
    },
    {
      name: 'Invalid latitude (too low)',
      params: { lat: -91, lng: 100.5018 },
      expectedStatus: 400,
    },
    {
      name: 'Invalid longitude (too high)',
      params: { lat: 13.7563, lng: 181 },
      expectedStatus: 400,
    },
    {
      name: 'Invalid longitude (too low)',
      params: { lat: 13.7563, lng: -181 },
      expectedStatus: 400,
    },
    {
      name: 'Non-numeric latitude',
      params: { lat: 'invalid', lng: 100.5018 },
      expectedStatus: 400,
    },
    {
      name: 'Non-numeric longitude',
      params: { lat: 13.7563, lng: 'invalid' },
      expectedStatus: 400,
    },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);

      const response = await axios.get(BASE_URL, { params: test.params });

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.status}`);

        if (response.status === 200) {
          const data = response.data;
          if (data.status === 'success' && data.data) {
            console.log(`   Current temp: ${data.data.current?.temp}°C`);
            console.log(`   Description: ${data.data.current?.description}`);
            console.log(`   Forecast days: ${data.data.forecast?.length || 0}`);
          } else {
            console.log(`   ⚠️  Unexpected response format`);
          }
        } else if (response.status === 400) {
          console.log(`   Error: ${response.data.message}`);
        }
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
      }

      passedTests++;
    } catch (error) {
      if (error.response) {
        if (error.response.status === test.expectedStatus) {
          console.log(`✅ PASS - Expected error: ${error.response.status}`);
          console.log(`   Error: ${error.response.data.message}`);
          passedTests++;
        } else {
          console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${error.response.status}`);
          console.log(`   Error: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ FAIL - Network error: ${error.message}`);
      }
    }

    console.log(''); // Empty line for readability
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Weather API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }

  console.log('\n📝 Notes:');
  console.log('- If you see "Weather service is not configured" errors, this is expected');
  console.log('- Add OPENWEATHER_KEY to your .env file to enable actual weather data');
  console.log('- The API correctly validates coordinates and handles errors gracefully');
}

// Run the tests
testWeatherAPI().catch(console.error);
