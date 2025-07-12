const mapboxCache = require('./utils/mapboxCache');
const cloudinaryCache = require('./utils/cloudinaryCache');
const redisCache = require('./utils/redis');
const { logInfo, logError } = require('./utils/logger');

async function testMapboxCloudinaryCache() {
  console.log('🧪 Testing Mapbox & Cloudinary Cache Implementation...\n');

  // Ensure Redis is connected
  console.log('🔌 Connecting to Redis...');
  try {
    await redisCache.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.log('❌ Redis connection failed, continuing without cache');
  }

  // Test 1: Mapbox Geocoding Performance
  console.log('\n1. Testing Mapbox Geocoding Performance...');
  const testAddresses = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
  ];

  for (const address of testAddresses) {
    console.log(`\n   Geocoding: "${address}"`);

    // First call (cache miss)
    const start1 = Date.now();
    try {
      const result1 = await mapboxCache.geocode(address);
      const time1 = Date.now() - start1;
      console.log(`   First call: ${time1}ms (${result1.features.length} results)`);

      // Second call (cache hit)
      const start2 = Date.now();
      const result2 = await mapboxCache.geocode(address);
      const time2 = Date.now() - start2;
      console.log(`   Second call: ${time2}ms (cached)`);

      const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
      console.log(`   Performance improvement: ${improvement}%`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 2: Mapbox Reverse Geocoding
  console.log('\n2. Testing Mapbox Reverse Geocoding...');
  const testCoordinates = [
    { lng: -74.006, lat: 40.7128 }, // New York
    { lng: -118.2437, lat: 34.0522 }, // Los Angeles
    { lng: -87.6298, lat: 41.8781 }, // Chicago
  ];

  for (const coords of testCoordinates) {
    console.log(`\n   Reverse geocoding: [${coords.lng}, ${coords.lat}]`);

    const start1 = Date.now();
    try {
      const result1 = await mapboxCache.reverseGeocode(coords.lng, coords.lat);
      const time1 = Date.now() - start1;
      console.log(`   First call: ${time1}ms`);

      const start2 = Date.now();
      const result2 = await mapboxCache.reverseGeocode(coords.lng, coords.lat);
      const time2 = Date.now() - start2;
      console.log(`   Second call: ${time2}ms (cached)`);

      const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
      console.log(`   Performance improvement: ${improvement}%`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 3: Mapbox Search Suggestions
  console.log('\n3. Testing Mapbox Search Suggestions...');
  const testQueries = ['New', 'Los', 'Chi'];

  for (const query of testQueries) {
    console.log(`\n   Suggestions for: "${query}"`);

    const start1 = Date.now();
    try {
      const result1 = await mapboxCache.getSuggestions(query, { limit: 5 });
      const time1 = Date.now() - start1;
      console.log(`   First call: ${time1}ms (${result1.suggestions.length} suggestions)`);

      const start2 = Date.now();
      const result2 = await mapboxCache.getSuggestions(query, { limit: 5 });
      const time2 = Date.now() - start2;
      console.log(`   Second call: ${time2}ms (cached)`);

      const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
      console.log(`   Performance improvement: ${improvement}%`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 4: Cloudinary URL Generation
  console.log('\n4. Testing Cloudinary URL Generation...');
  const testImages = ['MyanCamp/campground1', 'MyanCamp/campground2', 'MyanCamp/campground3'];

  for (const publicId of testImages) {
    console.log(`\n   Generating URLs for: "${publicId}"`);

    // Test optimized URL
    const start1 = Date.now();
    try {
      const url1 = await cloudinaryCache.getOptimizedUrl(publicId, { width: 800, height: 600 });
      const time1 = Date.now() - start1;
      console.log(`   Optimized URL: ${time1}ms`);

      const start2 = Date.now();
      const url2 = await cloudinaryCache.getOptimizedUrl(publicId, { width: 800, height: 600 });
      const time2 = Date.now() - start2;
      console.log(`   Cached URL: ${time2}ms`);

      const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
      console.log(`   Performance improvement: ${improvement}%`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 5: Cloudinary Responsive URLs
  console.log('\n5. Testing Cloudinary Responsive URLs...');
  const testImage = 'MyanCamp/campground1';

  console.log(`\n   Generating responsive URLs for: "${testImage}"`);

  const start1 = Date.now();
  try {
    const urls1 = await cloudinaryCache.getResponsiveUrls(testImage, {
      sizes: [320, 640, 768, 1024],
    });
    const time1 = Date.now() - start1;
    console.log(`   First call: ${time1}ms (${Object.keys(urls1).length} sizes)`);

    const start2 = Date.now();
    const urls2 = await cloudinaryCache.getResponsiveUrls(testImage, {
      sizes: [320, 640, 768, 1024],
    });
    const time2 = Date.now() - start2;
    console.log(`   Second call: ${time2}ms (cached)`);

    const improvement = (((time1 - time2) / time1) * 100).toFixed(1);
    console.log(`   Performance improvement: ${improvement}%`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 6: Cache Statistics
  console.log('\n6. Cache Statistics...');

  try {
    const mapboxStats = await mapboxCache.getCacheStats();
    console.log(`   Mapbox Cache:`, mapboxStats);

    const cloudinaryStats = await cloudinaryCache.getCacheStats();
    console.log(`   Cloudinary Cache:`, cloudinaryStats);
  } catch (error) {
    console.log(`   ❌ Error getting stats: ${error.message}`);
  }

  // Test 7: Verify cache keys in Redis
  console.log('\n7. Verifying Cache Keys in Redis...');
  try {
    const mapboxKeys = await redisCache.client.keys('mapbox:*');
    const cloudinaryKeys = await redisCache.client.keys('cloudinary:*');

    console.log(`   Mapbox keys: ${mapboxKeys.length}`);
    console.log(`   Cloudinary keys: ${cloudinaryKeys.length}`);
    console.log(`   Total cache keys: ${mapboxKeys.length + cloudinaryKeys.length}`);
  } catch (error) {
    console.log(`   ❌ Error checking keys: ${error.message}`);
  }

  console.log('\n🎉 Mapbox & Cloudinary Cache Testing Complete!');
  console.log('\n📊 Expected Benefits:');
  console.log('   - Mapbox API calls reduced by ~80-95%');
  console.log('   - Cloudinary URL generation 10-50x faster');
  console.log('   - Reduced API costs and rate limit issues');
  console.log('   - Better user experience with faster responses');
  console.log('   - Graceful degradation when Redis is unavailable');

  // Cleanup and disconnect
  try {
    await mapboxCache.invalidateCache('mapbox:*');
    await cloudinaryCache.invalidateAllCache();
    await redisCache.disconnect();
    console.log('\n🔌 Disconnected from Redis');
  } catch (error) {
    console.log(`\n❌ Cleanup error: ${error.message}`);
  }
}

// Run the test
testMapboxCloudinaryCache().catch((error) => {
  logError('Mapbox & Cloudinary cache test failed', error);
  console.error('Test failed:', error.message);
});
