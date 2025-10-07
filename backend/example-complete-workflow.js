/**
 * Example: Complete Spotify to YouTube Music Conversion Workflow
 * 
 * This example demonstrates how to:
 * 1. Fetch a Spotify playlist
 * 2. Convert the tracks to YouTube Music matches
 * 3. Display the results
 * 
 * Prerequisites:
 * - Backend server running on port 3001
 * - SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env
 * - YOUTUBE_API_KEY in .env
 * 
 * Usage: node example-complete-workflow.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Example Spotify playlist URL - you can change this to any public playlist
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';

async function completeWorkflow() {
  console.log('🎵 TuneBridge - Complete Workflow Example');
  console.log('=' .repeat(70));
  console.log(`\nSource: Spotify Playlist`);
  console.log(`Target: YouTube Music\n`);
  
  try {
    // Step 1: Fetch Spotify Playlist
    console.log('📥 Step 1: Fetching Spotify playlist...');
    console.log(`   URL: ${SPOTIFY_PLAYLIST_URL}`);
    
    const fetchResponse = await axios.post(`${API_URL}/api/playlist/fetch`, {
      url: SPOTIFY_PLAYLIST_URL,
      platform: 'spotify'
    });
    
    const spotifyTracks = fetchResponse.data.tracks;
    console.log(`   ✓ Fetched ${spotifyTracks.length} tracks from Spotify`);
    
    // Display first 3 tracks
    console.log('\n   Preview (first 3 tracks):');
    spotifyTracks.slice(0, 3).forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.name} - ${track.artists.join(', ')}`);
    });
    
    if (spotifyTracks.length > 3) {
      console.log(`   ... and ${spotifyTracks.length - 3} more tracks`);
    }
    
    // Step 2: Convert to YouTube Music
    console.log('\n📤 Step 2: Converting tracks to YouTube Music...');
    console.log('   (This may take a moment depending on playlist size)');
    
    // For this example, convert only first 5 tracks to avoid quota limits
    const tracksToConvert = spotifyTracks.slice(0, 5);
    console.log(`   Converting ${tracksToConvert.length} tracks (limited for demo)`);
    
    const convertResponse = await axios.post(`${API_URL}/api/playlist/youtube/convert`, {
      tracks: tracksToConvert
    });
    
    const { results, summary } = convertResponse.data;
    
    // Step 3: Display Results
    console.log('\n📊 Conversion Results:');
    console.log('=' .repeat(70));
    console.log(`   Total tracks processed: ${summary.total}`);
    console.log(`   Successful matches: ${summary.successful}`);
    console.log(`   Failed matches: ${summary.failed}`);
    console.log(`   Success rate: ${summary.successRate}`);
    
    console.log('\n🎯 YouTube Music Matches:');
    console.log('=' .repeat(70));
    
    results.forEach((result, index) => {
      const track = result.original;
      const youtube = result.youtube;
      
      console.log(`\n${index + 1}. ${track.name}`);
      console.log(`   Artists: ${track.artists.join(', ')}`);
      console.log(`   Album: ${track.album}`);
      
      if (youtube.topMatch) {
        console.log(`   ✓ YouTube Match Found:`);
        console.log(`     Title: ${youtube.topMatch.title}`);
        console.log(`     Channel: ${youtube.topMatch.channelTitle}`);
        console.log(`     URL: ${youtube.topMatch.url}`);
        console.log(`     Alternative matches: ${youtube.matches.length - 1} more`);
      } else if (youtube.error) {
        console.log(`   ✗ Error: ${youtube.error}`);
      } else {
        console.log(`   ✗ No YouTube match found`);
      }
    });
    
    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('✅ Workflow completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   - Integrate OAuth to create playlists in YouTube Music');
    console.log('   - Add frontend UI for easier conversion');
    console.log('   - Implement duration matching for better accuracy');
    console.log('   - Add user preferences and conversion history\n');
    
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data.error);
      
      // Provide helpful hints
      if (error.response.status === 500) {
        if (error.config?.url?.includes('spotify')) {
          console.error('\n💡 Hint: Check your Spotify API credentials in .env');
        } else if (error.config?.url?.includes('youtube')) {
          console.error('\n💡 Hint: Check your YouTube API key in .env');
          console.error('   Also verify that YouTube Data API v3 is enabled');
        }
      } else if (error.response.status === 404) {
        console.error('\n💡 Hint: The Spotify playlist might be private or deleted');
        console.error('   Try a different public playlist URL');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hint: Backend server is not running');
      console.error('   Start it with: cd backend && npm start');
    }
    
    console.log();
    process.exit(1);
  }
}

// Run the complete workflow
completeWorkflow();
