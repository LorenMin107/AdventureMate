const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_ENDPOINTS = [
  '/api/v1/campgrounds',
  '/api/v1/users',
  '/api/v1/bookings',
  '/campgrounds',
  '/',
];

async function testCompression() {
  console.log('🧪 Testing API Response Compression...\n');

  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`📡 Testing endpoint: ${endpoint}`);

      // Test with compression enabled (default)
      const responseWithCompression = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
        validateStatus: () => true, // Don't throw on non-2xx status codes
      });

      // Test with compression disabled
      const responseWithoutCompression = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'Accept-Encoding': 'identity',
          'x-no-compression': 'true',
        },
        validateStatus: () => true,
      });

      const hasCompression = responseWithCompression.headers['content-encoding'] === 'gzip';
      const originalSize = responseWithoutCompression.headers['content-length'];
      const compressedSize = responseWithCompression.headers['content-length'];

      console.log(`   Status: ${responseWithCompression.status}`);
      console.log(
        `   Content-Encoding: ${responseWithCompression.headers['content-encoding'] || 'none'}`
      );
      console.log(`   Original Size: ${originalSize ? `${originalSize} bytes` : 'unknown'}`);
      console.log(`   Compressed Size: ${compressedSize ? `${compressedSize} bytes` : 'unknown'}`);

      if (originalSize && compressedSize) {
        const compressionRatio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(
          1
        );
        console.log(`   Compression Ratio: ${compressionRatio}%`);
      }

      if (hasCompression) {
        console.log(`   ✅ Compression working for ${endpoint}`);
      } else {
        console.log(`   ⚠️  No compression for ${endpoint} (may be too small or not compressible)`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing ${endpoint}: ${error.message}`);
    }

    console.log('');
  }

  // Test specific compression scenarios
  console.log('🔍 Testing specific compression scenarios...\n');

  // Test JSON API response
  try {
    console.log('📊 Testing JSON API compression:');
    const jsonResponse = await axios.get(`${BASE_URL}/api/v1/campgrounds`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: 'application/json',
      },
    });

    console.log(`   Content-Type: ${jsonResponse.headers['content-type']}`);
    console.log(`   Content-Encoding: ${jsonResponse.headers['content-encoding'] || 'none'}`);
    console.log(`   Content-Length: ${jsonResponse.headers['content-length']} bytes`);

    if (jsonResponse.headers['content-encoding'] === 'gzip') {
      console.log('   ✅ JSON API compression working');
    } else {
      console.log('   ⚠️  JSON API not compressed (may be too small)');
    }
  } catch (error) {
    console.log(`   ❌ Error testing JSON compression: ${error.message}`);
  }

  console.log('\n🎉 Compression testing completed!');
  console.log('\n📝 Notes:');
  console.log('   - Compression is applied to responses larger than 1KB');
  console.log('   - Compression level is set to 6 (good balance of size vs speed)');
  console.log('   - Use "x-no-compression: true" header to disable compression');
  console.log('   - Supported content types: text, JSON, XML, CSS, JS, SVG');
}

// Run the test
testCompression().catch(console.error);
