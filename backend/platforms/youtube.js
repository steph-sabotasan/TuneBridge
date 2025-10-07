import { google } from 'googleapis';
import NodeCache from 'node-cache';

// Initialize YouTube Data API v3
const youtube = google.youtube('v3');

// Initialize cache with 24-hour TTL (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Throttle delay in milliseconds
const THROTTLE_DELAY_MS = 150;

/**
 * Delay execution for throttling API calls
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a cache key for a track search
 * @param {string} trackName - The name of the track
 * @param {string[]} artists - Array of artist names
 * @returns {string} Cache key
 */
function getCacheKey(trackName, artists) {
  const artistsString = artists.join(' ').toLowerCase();
  return `${trackName.toLowerCase()}_${artistsString}`;
}

/**
 * Search YouTube for a track by name and artist
 * @param {string} trackName - The name of the track
 * @param {string[]} artists - Array of artist names
 * @param {number} maxResults - Maximum number of results to return (default: 5)
 * @returns {Promise<Object[]>} Array of YouTube video matches
 */
async function searchTrack(trackName, artists, maxResults = 5) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in .env');
  }

  try {
    // Construct search query: "track name artist1 artist2"
    const artistsString = artists.join(' ');
    const query = `${trackName} ${artistsString}`;

    // Search for videos
    const response = await youtube.search.list({
      key: apiKey,
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: maxResults,
      safeSearch: 'none',
      order: 'relevance'
    });

    // Transform results to standardized format
    const results = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return results;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data.error?.message || error.response.statusText;
      
      // Provide helpful error messages based on status code
      if (status === 400) {
        throw new Error(`YouTube API error: Invalid request - ${errorMessage}`);
      } else if (status === 403) {
        throw new Error(
          'YouTube API quota exceeded or access forbidden. ' +
          'Please check your API key and quota limits at https://console.cloud.google.com'
        );
      } else if (status === 404) {
        throw new Error('YouTube API endpoint not found. Please check the API configuration.');
      }
      
      throw new Error(`YouTube API error (${status}): ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Search YouTube for a track with caching
 * @param {string} trackName - The name of the track
 * @param {string[]} artists - Array of artist names
 * @param {number} maxResults - Maximum number of results to return (default: 5)
 * @returns {Promise<Object[]>} Array of YouTube video matches
 */
async function searchTrackCached(trackName, artists, maxResults = 5) {
  // Generate cache key
  const cacheKey = getCacheKey(trackName, artists);
  
  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult !== undefined) {
    console.log(`Cache hit for: ${trackName} by ${artists.join(', ')}`);
    return cachedResult;
  }
  
  // Cache miss - fetch from API with throttling
  console.log(`Cache miss for: ${trackName} by ${artists.join(', ')} - fetching from API`);
  await delay(THROTTLE_DELAY_MS);
  
  // Fetch from YouTube API
  const results = await searchTrack(trackName, artists, maxResults);
  
  // Store in cache
  cache.set(cacheKey, results);
  
  return results;
}

/**
 * Convert multiple tracks from Spotify format to YouTube matches
 * @param {Object[]} tracks - Array of track objects from Spotify
 * @returns {Promise<Object[]>} Array of tracks with YouTube matches
 */
export async function convertTracksToYouTube(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('Tracks array is required and must not be empty');
  }

  const results = [];

  // Process tracks sequentially to avoid rate limiting
  for (const track of tracks) {
    try {
      const youtubeMatches = await searchTrackCached(track.name, track.artists, 5);
      
      results.push({
        original: {
          name: track.name,
          artists: track.artists,
          album: track.album,
          durationMs: track.durationMs,
          isrc: track.isrc
        },
        youtube: {
          matches: youtubeMatches,
          topMatch: youtubeMatches[0] || null
        }
      });
    } catch (error) {
      // Log error but continue processing other tracks
      console.error(`Error searching YouTube for "${track.name}" by ${track.artists.join(', ')}:`, error.message);
      
      results.push({
        original: {
          name: track.name,
          artists: track.artists,
          album: track.album,
          durationMs: track.durationMs,
          isrc: track.isrc
        },
        youtube: {
          matches: [],
          topMatch: null,
          error: error.message
        }
      });
    }
  }

  return results;
}

/**
 * Get video details including duration for better matching
 * (Prepared for future enhancements)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details
 */
export async function getVideoDetails(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in .env');
  }

  try {
    const response = await youtube.videos.list({
      key: apiKey,
      part: 'snippet,contentDetails,statistics',
      id: videoId
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = response.data.items[0];
    
    return {
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      thumbnail: video.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${video.id}`
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data.error?.message || error.response.statusText;
      throw new Error(`YouTube API error (${status}): ${errorMessage}`);
    }
    throw error;
  }
}

// TODO: Future OAuth implementation for playlist creation
/**
 * Create a YouTube Music playlist (requires OAuth)
 * This is a placeholder for future implementation
 */
export async function createPlaylist(accessToken, title, description, tracks) {
  throw new Error('YouTube playlist creation not yet implemented. OAuth flow required.');
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Clear the cache
 */
export function clearCache() {
  cache.flushAll();
}

/**
 * Export the cached search function for use in routes
 */
export { searchTrackCached };
