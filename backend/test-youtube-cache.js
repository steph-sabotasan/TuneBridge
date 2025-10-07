import dotenv from 'dotenv';
import { searchTrackCached, getCacheStats, clearCache } from './platforms/youtube.js';

// Load environment variables
dotenv.config();

async function testCaching() {
  console.log('🧪 Testing YouTube caching and throttling...\n');

  // Clear cache to start fresh
  clearCache();
  console.log('✓ Cache cleared\n');

  const testTrack = {
    name: 'Imagine',
    artists: ['John Lennon']
  };

  try {
    console.log('📊 Initial cache stats:', getCacheStats());
    console.log('\n--- First search (should be a cache miss) ---');
    const startTime1 = Date.now();
    const results1 = await searchTrackCached(testTrack.name, testTrack.artists, 3);
    const duration1 = Date.now() - startTime1;
    console.log(`✓ Search completed in ${duration1}ms`);
    console.log(`Found ${results1.length} results`);
    console.log('📊 Cache stats after first search:', getCacheStats());

    console.log('\n--- Second search (should be a cache hit) ---');
    const startTime2 = Date.now();
    const results2 = await searchTrackCached(testTrack.name, testTrack.artists, 3);
    const duration2 = Date.now() - startTime2;
    console.log(`✓ Search completed in ${duration2}ms`);
    console.log(`Found ${results2.length} results`);
    console.log('📊 Cache stats after second search:', getCacheStats());

    console.log('\n--- Performance comparison ---');
    console.log(`First search (no cache): ${duration1}ms`);
    console.log(`Second search (cached): ${duration2}ms`);
    console.log(`Speed improvement: ${(duration1 / duration2).toFixed(2)}x faster`);

    console.log('\n--- Testing throttling with multiple tracks ---');
    const tracks = [
      { name: 'Bohemian Rhapsody', artists: ['Queen'] },
      { name: 'Stairway to Heaven', artists: ['Led Zeppelin'] },
      { name: 'Hotel California', artists: ['Eagles'] }
    ];

    const throttleStartTime = Date.now();
    for (const track of tracks) {
      console.log(`Searching: ${track.name} by ${track.artists.join(', ')}`);
      await searchTrackCached(track.name, track.artists, 3);
    }
    const throttleDuration = Date.now() - throttleStartTime;
    console.log(`\n✓ All searches completed in ${throttleDuration}ms`);
    console.log(`Average time per search: ${(throttleDuration / tracks.length).toFixed(0)}ms`);
    console.log('📊 Final cache stats:', getCacheStats());

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testCaching();
