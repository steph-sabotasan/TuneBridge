/**
 * Example: Using YouTube Caching and Throttling
 * 
 * This file demonstrates how to use the cached YouTube search functionality
 * and monitor cache performance.
 */

import dotenv from 'dotenv';
import { 
  searchTrackCached, 
  getCacheStats, 
  clearCache,
  convertTracksToYouTube 
} from './platforms/youtube.js';

dotenv.config();

// Example 1: Basic cached search
async function basicExample() {
  console.log('=== Example 1: Basic Cached Search ===\n');
  
  // First search - will hit the API (cache miss)
  const results1 = await searchTrackCached('Imagine', ['John Lennon'], 5);
  console.log(`First search returned ${results1.length} results`);
  
  // Second search - will use cache (cache hit)
  const results2 = await searchTrackCached('Imagine', ['John Lennon'], 5);
  console.log(`Second search returned ${results2.length} results (from cache)`);
}

// Example 2: Batch conversion with automatic caching
async function batchConversionExample() {
  console.log('\n=== Example 2: Batch Conversion ===\n');
  
  const tracks = [
    { name: 'Bohemian Rhapsody', artists: ['Queen'] },
    { name: 'Hotel California', artists: ['Eagles'] },
    { name: 'Stairway to Heaven', artists: ['Led Zeppelin'] },
    { name: 'Bohemian Rhapsody', artists: ['Queen'] } // Duplicate - will use cache
  ];
  
  // convertTracksToYouTube automatically uses searchTrackCached
  const results = await convertTracksToYouTube(tracks);
  
  console.log(`Converted ${results.length} tracks`);
  console.log('Note: The duplicate "Bohemian Rhapsody" used cached data');
}

// Example 3: Monitoring cache performance
async function cacheMonitoringExample() {
  console.log('\n=== Example 3: Cache Monitoring ===\n');
  
  // Clear cache to start fresh
  clearCache();
  console.log('Cache cleared');
  
  // Initial stats
  console.log('Initial stats:', getCacheStats());
  
  // Perform some searches
  await searchTrackCached('Yesterday', ['The Beatles'], 5);
  await searchTrackCached('Let It Be', ['The Beatles'], 5);
  await searchTrackCached('Yesterday', ['The Beatles'], 5); // Cache hit
  
  // Check stats
  const stats = getCacheStats();
  console.log('\nCache Statistics:');
  console.log(`- Total hits: ${stats.hits}`);
  console.log(`- Total misses: ${stats.misses}`);
  console.log(`- Cached keys: ${stats.keys}`);
  console.log(`- Hit rate: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`);
}

// Example 4: Playlist conversion workflow
async function playlistWorkflowExample() {
  console.log('\n=== Example 4: Playlist Conversion Workflow ===\n');
  
  // Simulated Spotify playlist tracks
  const spotifyTracks = [
    {
      name: 'Shape of You',
      artists: ['Ed Sheeran'],
      album: '÷ (Divide)',
      durationMs: 233713
    },
    {
      name: 'Blinding Lights',
      artists: ['The Weeknd'],
      album: 'After Hours',
      durationMs: 200040
    },
    {
      name: 'Someone Like You',
      artists: ['Adele'],
      album: '21',
      durationMs: 285467
    }
  ];
  
  console.log(`Converting ${spotifyTracks.length} tracks from Spotify to YouTube...`);
  
  const startTime = Date.now();
  const converted = await convertTracksToYouTube(spotifyTracks);
  const duration = Date.now() - startTime;
  
  console.log(`\n✓ Conversion completed in ${duration}ms`);
  console.log(`Average time per track: ${(duration / spotifyTracks.length).toFixed(0)}ms`);
  
  // Show results summary
  const successful = converted.filter(t => t.youtube.topMatch !== null).length;
  console.log(`\nResults: ${successful}/${spotifyTracks.length} tracks matched successfully`);
  
  // If you run this again, it will be much faster due to caching!
  console.log('\nRun this function again to see caching performance improvement!');
}

// Example 5: Custom cache management
async function cacheManagementExample() {
  console.log('\n=== Example 5: Cache Management ===\n');
  
  // Get current cache state
  const initialStats = getCacheStats();
  console.log('Current cache state:');
  console.log(`- Keys in cache: ${initialStats.keys}`);
  console.log(`- Total hits: ${initialStats.hits}`);
  console.log(`- Total misses: ${initialStats.misses}`);
  
  // Clear cache if needed (e.g., after major updates)
  if (initialStats.keys > 100) {
    console.log('\nCache has many entries, clearing...');
    clearCache();
    console.log('Cache cleared successfully');
  }
  
  // Verify cache was cleared
  const afterStats = getCacheStats();
  console.log('\nAfter clearing:');
  console.log(`- Keys in cache: ${afterStats.keys}`);
}

// Run all examples (comment out if you want to run individually)
async function runAllExamples() {
  try {
    // Note: These examples will fail if YouTube API quota is exceeded
    // But they demonstrate proper usage patterns
    
    await basicExample();
    await batchConversionExample();
    await cacheMonitoringExample();
    await playlistWorkflowExample();
    await cacheManagementExample();
    
  } catch (error) {
    console.error('\nError running examples:', error.message);
    console.log('\nNote: These examples require a valid YOUTUBE_API_KEY with available quota');
  }
}

// Uncomment to run all examples:
// runAllExamples();

// Or export for use in other modules:
export {
  basicExample,
  batchConversionExample,
  cacheMonitoringExample,
  playlistWorkflowExample,
  cacheManagementExample
};
