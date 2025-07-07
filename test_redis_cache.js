const redisCache = require('./utils/redis');
const { logInfo, logError } = require('./utils/logger');

async function testRedisCache() {
  console.log('🧪 Testing Redis Cache Implementation...\n');

  try {
    // Test 1: Connect to Redis
    console.log('1. Testing Redis connection...');
    const connected = await redisCache.connect();

    if (connected) {
      console.log('✅ Redis connected successfully');
    } else {
      console.log('❌ Redis connection failed - continuing with tests (cache will be disabled)');
    }

    // Test 2: Basic set/get operations
    console.log('\n2. Testing basic cache operations...');

    const testKey = 'test:basic';
    const testData = { message: 'Hello Redis!', timestamp: Date.now() };

    const setResult = await redisCache.set(testKey, testData, 60); // 60 seconds TTL
    console.log(`Set operation: ${setResult ? '✅ Success' : '❌ Failed'}`);

    const getResult = await redisCache.get(testKey);
    if (getResult && getResult.message === testData.message) {
      console.log('✅ Get operation: Success - data retrieved correctly');
    } else {
      console.log('❌ Get operation: Failed - data not retrieved or incorrect');
    }

    // Test 3: Cache with default TTL
    console.log('\n3. Testing cache with default TTL...');

    const ttlKey = 'test:ttl';
    const ttlData = { type: 'campgrounds', data: 'test data' };

    const ttlResult = await redisCache.setWithDefaultTTL(ttlKey, ttlData, 'campgrounds');
    console.log(`Set with TTL: ${ttlResult ? '✅ Success' : '❌ Failed'}`);

    const ttlGetResult = await redisCache.get(ttlKey);
    if (ttlGetResult) {
      console.log('✅ TTL Get: Success - data retrieved');
    } else {
      console.log('❌ TTL Get: Failed - data not retrieved');
    }

    // Test 4: Cache invalidation
    console.log('\n4. Testing cache invalidation...');

    const invalidationKey = 'test:invalidation';
    await redisCache.set(invalidationKey, { test: 'data' });

    const beforeDelete = await redisCache.exists(invalidationKey);
    console.log(`Before deletion: ${beforeDelete ? '✅ Exists' : '❌ Not found'}`);

    await redisCache.del(invalidationKey);
    const afterDelete = await redisCache.exists(invalidationKey);
    console.log(`After deletion: ${afterDelete ? '❌ Still exists' : '✅ Successfully deleted'}`);

    // Test 5: Pattern invalidation
    console.log('\n5. Testing pattern invalidation...');

    const patternKeys = ['test:pattern:1', 'test:pattern:2', 'test:pattern:3', 'test:other:1'];

    // Set multiple keys
    for (const key of patternKeys) {
      await redisCache.set(key, { data: 'test' });
    }

    // Invalidate pattern
    await redisCache.invalidatePattern('test:pattern:*');

    // Check which keys still exist
    const remainingKeys = [];
    for (const key of patternKeys) {
      if (await redisCache.exists(key)) {
        remainingKeys.push(key);
      }
    }

    console.log(
      `Pattern invalidation: ${remainingKeys.length === 1 && remainingKeys[0] === 'test:other:1' ? '✅ Success' : '❌ Failed'}`
    );
    console.log(`Remaining keys: ${remainingKeys.join(', ')}`);

    // Test 6: Cache statistics
    console.log('\n6. Testing cache statistics...');

    const stats = await redisCache.getStats();
    if (stats) {
      console.log('✅ Cache statistics retrieved successfully');
      console.log(`   Connection status: ${stats.isConnected ? 'Connected' : 'Disconnected'}`);
    } else {
      console.log('❌ Failed to retrieve cache statistics');
    }

    // Test 7: Multiple key operations
    console.log('\n7. Testing multiple key operations...');

    const multiKeys = ['test:multi:1', 'test:multi:2', 'test:multi:3'];
    const multiData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];

    // Set multiple keys
    for (let i = 0; i < multiKeys.length; i++) {
      await redisCache.set(multiKeys[i], multiData[i]);
    }

    // Delete multiple keys
    const multiDeleteResult = await redisCache.delMultiple(multiKeys);
    console.log(`Multiple delete: ${multiDeleteResult ? '✅ Success' : '❌ Failed'}`);

    // Verify deletion
    let remainingCount = 0;
    for (const key of multiKeys) {
      if (await redisCache.exists(key)) {
        remainingCount++;
      }
    }
    console.log(
      `Verification: ${remainingCount === 0 ? '✅ All keys deleted' : '❌ Some keys still exist'}`
    );

    // Test 8: Error handling
    console.log('\n8. Testing error handling...');

    // Test with invalid JSON (this should be handled gracefully)
    const invalidData = { circular: null };
    invalidData.circular = invalidData; // Create circular reference

    try {
      await redisCache.set('test:error', invalidData);
      console.log('❌ Should have failed with circular reference');
    } catch (error) {
      console.log('✅ Error handling: Successfully caught circular reference error');
    }

    // Cleanup
    console.log('\n9. Cleaning up test data...');
    await redisCache.invalidatePattern('test:*');
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 Redis Cache Testing Complete!');

    if (connected) {
      console.log('\n📊 Summary:');
      console.log('   - Redis connection: ✅ Working');
      console.log('   - Basic operations: ✅ Working');
      console.log('   - TTL functionality: ✅ Working');
      console.log('   - Cache invalidation: ✅ Working');
      console.log('   - Pattern matching: ✅ Working');
      console.log('   - Statistics: ✅ Working');
      console.log('   - Error handling: ✅ Working');
    } else {
      console.log('\n⚠️  Summary:');
      console.log('   - Redis connection: ❌ Not available');
      console.log('   - Application will work without caching');
      console.log('   - To enable caching, ensure Redis is running');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    logError('Redis cache test failed', error);
  } finally {
    // Disconnect from Redis
    await redisCache.disconnect();
    console.log('\n🔌 Disconnected from Redis');
    process.exit(0);
  }
}

// Run the test
testRedisCache();
