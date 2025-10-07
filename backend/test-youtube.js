/**
 * Test script for YouTube Music integration
 * 
 * This script tests the YouTube conversion endpoint with sample Spotify track data.
 * 
 * Usage:
 *   1. Make sure YOUTUBE_API_KEY is set in .env
 *   2. Start the backend server: npm start
 *   3. Run this test: node test-youtube.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Sample track data (as if fetched from Spotify)
const sampleTracks = [
  {
    name: 'Bohemian Rhapsody',
    artists: ['Queen'],
    album: 'A Night at the Opera',
    durationMs: 354000,
    isrc: 'GBUM71029604'
  },
  {
    name: 'Stairway to Heaven',
    artists: ['Led Zeppelin'],
    album: 'Led Zeppelin IV',
    durationMs: 482000,
    isrc: 'USMO17100501'
  },
  {
    name: 'Imagine',
    artists: ['John Lennon'],
    album: 'Imagine',
    durationMs: 187000,
    isrc: 'GBAYE0601700'
  }
];

async function testYouTubeConversion() {
  console.log('🧪 Testing YouTube Music Integration\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Health check
    console.log('\n📡 Test 1: Health Check');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✓ Backend is running:', healthResponse.data.message);
    
    // Test 2: Convert tracks to YouTube
    console.log('\n📡 Test 2: Converting Tracks to YouTube');
    console.log(`Converting ${sampleTracks.length} tracks...`);
    
    const convertResponse = await axios.post(`${API_URL}/api/playlist/youtube/convert`, {
      tracks: sampleTracks
    });
    
    const { results, summary } = convertResponse.data;
    
    console.log('\n📊 Conversion Summary:');
    console.log(`   Total tracks: ${summary.total}`);
    console.log(`   Successful matches: ${summary.successful}`);
    console.log(`   Failed matches: ${summary.failed}`);
    console.log(`   Success rate: ${summary.successRate}`);
    
    console.log('\n🎵 Track Matches:');
    console.log('=' .repeat(60));
    
    results.forEach((result, index) => {
      const track = result.original;
      const youtube = result.youtube;
      
      console.log(`\n${index + 1}. ${track.name} - ${track.artists.join(', ')}`);
      
      if (youtube.topMatch) {
        console.log(`   ✓ YouTube Match: ${youtube.topMatch.title}`);
        console.log(`     Channel: ${youtube.topMatch.channelTitle}`);
        console.log(`     URL: ${youtube.topMatch.url}`);
        console.log(`     Total matches found: ${youtube.matches.length}`);
      } else if (youtube.error) {
        console.log(`   ✗ Error: ${youtube.error}`);
      } else {
        console.log(`   ✗ No matches found`);
      }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data.error);
      
      // Provide helpful hints for common errors
      if (error.response.status === 500) {
        console.error('\n💡 Hint: Make sure YOUTUBE_API_KEY is set in your .env file');
        console.error('   Get your API key from: https://console.cloud.google.com/apis/credentials');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Make sure the backend server is running on port 3001');
      console.error('   Start it with: npm start');
    }
    
    console.log();
    process.exit(1);
  }
}

// Test 3: Error handling
async function testErrorHandling() {
  console.log('\n📡 Test 3: Error Handling');
  
  try {
    // Test empty tracks array
    await axios.post(`${API_URL}/api/playlist/youtube/convert`, {
      tracks: []
    });
    console.log('✗ Should have failed with empty tracks array');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected empty tracks array');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }
  
  try {
    // Test missing tracks field
    await axios.post(`${API_URL}/api/playlist/youtube/convert`, {});
    console.log('✗ Should have failed with missing tracks field');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected missing tracks field');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }
  
  try {
    // Test invalid track structure
    await axios.post(`${API_URL}/api/playlist/youtube/convert`, {
      tracks: [{ name: 'Test' }] // Missing artists
    });
    console.log('✗ Should have failed with invalid track structure');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected invalid track structure');
    } else {
      console.log('✗ Unexpected error:', error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  await testYouTubeConversion();
  await testErrorHandling();
}

runAllTests();
