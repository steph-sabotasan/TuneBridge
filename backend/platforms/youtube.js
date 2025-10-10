import { google } from 'googleapis';
import NodeCache from 'node-cache';

// Initialize YouTube Data API v3
const youtube = google.youtube('v3');

// Initialize cache with 24-hour TTL (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

// Throttle delay in milliseconds - reduced since we batch requests
const THROTTLE_DELAY_MS = 50;

// Quota tracking
let quotaExceeded = false;
let estimatedUnitsUsed = 0;
let lastResetDate = new Date().toDateString(); // Track the last reset date
const DAILY_QUOTA_LIMIT = 10000; // YouTube API default daily quota
const SEARCH_COST = 100; // Each search.list call costs 100 units
const MAX_SEARCHES_PER_SESSION = 30; // Limit searches to conserve quota (30 searches = 3000 units, allows 3 full playlists/day)

/**
 * Reset quota tracking if it's a new day (Pacific Time to match YouTube's reset)
 * YouTube quota resets at midnight Pacific Time
 */
function checkAndResetQuota() {
  const now = new Date();
  const currentDate = now.toDateString();
  
  // Check if we've crossed into a new day
  if (currentDate !== lastResetDate) {
    console.log(`🔄 New day detected! Resetting YouTube API quota tracking`);
    console.log(`   Previous date: ${lastResetDate}`);
    console.log(`   Current date: ${currentDate}`);
    estimatedUnitsUsed = 0;
    quotaExceeded = false;
    lastResetDate = currentDate;
    console.log(`✅ Quota reset complete. Fresh quota available!`);
  }
}

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
  const artistsString = artists.join(' ').toLowerCase().trim();
  return `${trackName.toLowerCase().trim()}_${artistsString}`;
}

/**
 * Normalize track identifier for deduplication
 * @param {string} trackName - The name of the track
 * @param {string[]} artists - Array of artist names
 * @returns {string} Normalized identifier
 */
function normalizeTrackId(trackName, artists) {
  return `${trackName.toLowerCase().trim()}|${artists.join('|').toLowerCase().trim()}`;
}

/**
 * Check if quota is exceeded or session limit reached
 * @returns {boolean} True if quota is exceeded
 */
function isQuotaExceeded() {
  checkAndResetQuota(); // Check if we need to reset for a new day
  const searchCount = Math.floor(estimatedUnitsUsed / SEARCH_COST);
  return quotaExceeded || estimatedUnitsUsed >= DAILY_QUOTA_LIMIT || searchCount >= MAX_SEARCHES_PER_SESSION;
}

/**
 * Log quota usage
 * @param {number} units - Units consumed
 */
function logQuotaUsage(units) {
  estimatedUnitsUsed += units;
  console.log(`📊 YouTube API units used: ${units} | Total: ${estimatedUnitsUsed}/${DAILY_QUOTA_LIMIT}`);
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

    // Log quota usage
    logQuotaUsage(SEARCH_COST);

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
      
      // Check for quota exceeded
      if (status === 403 || errorMessage.toLowerCase().includes('quota')) {
        quotaExceeded = true;
        console.error('🚫 YouTube API quota exceeded! Switching to cached results only.');
        throw new Error(
          'YouTube API quota exceeded. Using cached results only. ' +
          'Please check your quota at https://console.cloud.google.com'
        );
      }
      
      // Provide helpful error messages based on status code
      if (status === 400) {
        throw new Error(`YouTube API error: Invalid request - ${errorMessage}`);
      } else if (status === 404) {
        throw new Error('YouTube API endpoint not found. Please check the API configuration.');
      }
      
      throw new Error(`YouTube API error (${status}): ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Search YouTube for a track with caching and quota awareness
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
    console.log(`✅ Cache hit for: ${trackName} by ${artists.join(', ')}`);
    return cachedResult;
  }
  
  // If quota exceeded, throw specific error
  if (isQuotaExceeded()) {
    console.log(`⚠️ Quota exceeded - skipping search for: ${trackName} by ${artists.join(', ')}`);
    throw new Error('QUOTA_EXCEEDED');
  }
  
  // Cache miss - fetch from API with throttling
  console.log(`🔍 Cache miss for: ${trackName} by ${artists.join(', ')} - fetching from API`);
  await delay(THROTTLE_DELAY_MS);
  
  try {
    // Fetch from YouTube API
    const results = await searchTrack(trackName, artists, maxResults);
    
    // Store in cache
    cache.set(cacheKey, results);
    
    return results;
  } catch (error) {
    // If quota exceeded, cache empty result and throw specific error
    if (error.message.includes('quota')) {
      cache.set(cacheKey, []);
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
}

/**
 * Batch search multiple tracks (up to 5) using OR operator
 * Note: YouTube API doesn't support true batching, but we can optimize by using OR queries
 * @param {Array<{name: string, artists: string[]}>} tracks - Array of track objects
 * @param {number} maxResults - Maximum results per track
 * @returns {Promise<Object>} Map of track keys to results
 */
async function batchSearchTracks(tracks, maxResults = 5) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set YOUTUBE_API_KEY in .env');
  }

  if (tracks.length === 0 || tracks.length > 5) {
    throw new Error('Batch size must be between 1 and 5 tracks');
  }

  // Build OR query with all tracks
  const queries = tracks.map(track => {
    const artistsString = track.artists.join(' ');
    return `"${track.name}" ${artistsString}`;
  });
  
  const combinedQuery = queries.join(' | ');
  
  try {
    // Single API call for multiple tracks
    const response = await youtube.search.list({
      key: apiKey,
      part: 'snippet',
      q: combinedQuery,
      type: 'video',
      videoCategoryId: '10',
      maxResults: maxResults * tracks.length, // Get enough results for all tracks
      safeSearch: 'none',
      order: 'relevance'
    });

    logQuotaUsage(SEARCH_COST);

    // Transform and distribute results
    const allResults = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title.toLowerCase(),
      originalTitle: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    // Distribute results to each track based on title matching
    const resultMap = {};
    
    for (const track of tracks) {
      const trackKey = normalizeTrackId(track.name, track.artists);
      const trackNameLower = track.name.toLowerCase();
      
      // Find results that match this track
      const matchingResults = allResults
        .filter(result => {
          // Check if track name or artist appears in video title
          const titleMatches = result.title.includes(trackNameLower);
          const artistMatches = track.artists.some(artist => 
            result.title.includes(artist.toLowerCase())
          );
          return titleMatches || artistMatches;
        })
        .slice(0, maxResults)
        .map(r => ({
          videoId: r.videoId,
          title: r.originalTitle,
          channelTitle: r.channelTitle,
          channelId: r.channelId,
          thumbnail: r.thumbnail,
          publishedAt: r.publishedAt,
          url: r.url
        }));
      
      resultMap[trackKey] = matchingResults.length > 0 ? matchingResults : [];
    }

    return resultMap;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data.error?.message || error.response.statusText;
      
      if (status === 403 || errorMessage.toLowerCase().includes('quota')) {
        quotaExceeded = true;
        console.error('🚫 YouTube API quota exceeded during batch search!');
      }
    }
    throw error;
  }
}

/**
 * Convert multiple tracks from Spotify format to YouTube matches with optimization
 * @param {Object[]} tracks - Array of track objects from Spotify
 * @returns {Promise<Object[]>} Array of tracks with YouTube matches
 */
export async function convertTracksToYouTube(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('Tracks array is required and must not be empty');
  }

  console.log(`\n🎵 Starting conversion of ${tracks.length} tracks...`);
  console.log(`📊 Current quota usage: ${estimatedUnitsUsed}/${DAILY_QUOTA_LIMIT} units`);
  console.log(`🔍 Search limit: ${MAX_SEARCHES_PER_SESSION} searches per session\n`);

  // Deduplicate tracks
  const uniqueTracksMap = new Map();
  const trackIndexMap = new Map(); // Maps normalized ID to original indices
  
  tracks.forEach((track, index) => {
    const trackId = normalizeTrackId(track.name, track.artists);
    
    if (!uniqueTracksMap.has(trackId)) {
      uniqueTracksMap.set(trackId, track);
      trackIndexMap.set(trackId, [index]);
    } else {
      // Track duplicate indices
      trackIndexMap.get(trackId).push(index);
    }
  });

  const uniqueTracks = Array.from(uniqueTracksMap.values());
  const duplicateCount = tracks.length - uniqueTracks.length;
  
  if (duplicateCount > 0) {
    console.log(`🔄 Deduplicated ${duplicateCount} duplicate track(s)`);
  }

  const results = new Array(tracks.length);
  const uncachedTracks = [];
  const uncachedIndices = [];

  // First pass: Check cache for all unique tracks
  for (let i = 0; i < uniqueTracks.length; i++) {
    const track = uniqueTracks[i];
    const trackId = normalizeTrackId(track.name, track.artists);
    const cacheKey = getCacheKey(track.name, track.artists);
    const cachedResult = cache.get(cacheKey);

    if (cachedResult !== undefined) {
      console.log(`✅ Cache hit: ${track.name} by ${track.artists.join(', ')}`);
      
      // Fill results for all indices that map to this track
      const indices = trackIndexMap.get(trackId);
      const resultObject = {
        original: {
          name: track.name,
          artists: track.artists,
          album: track.album,
          durationMs: track.durationMs,
          isrc: track.isrc
        },
        youtube: {
          matches: cachedResult,
          topMatch: cachedResult[0] || null
        }
      };
      
      indices.forEach(idx => {
        results[idx] = resultObject;
      });
    } else {
      uncachedTracks.push(track);
      uncachedIndices.push(trackId);
    }
  }

  console.log(`\n📦 Cache hits: ${uniqueTracks.length - uncachedTracks.length}/${uniqueTracks.length}`);
  console.log(`🔍 Tracks to search: ${uncachedTracks.length}`);
  
  // Calculate how many searches we can afford
  const searchesAvailable = MAX_SEARCHES_PER_SESSION - Math.floor(estimatedUnitsUsed / SEARCH_COST);
  const canSearchCount = Math.min(uncachedTracks.length, searchesAvailable);
  
  if (uncachedTracks.length > canSearchCount) {
    console.log(`⚠️  Quota limit: Will search first ${canSearchCount} tracks, rest will use fallback\n`);
  } else {
    console.log(``);
  }

  // Second pass: Process uncached tracks with strict quota awareness
  if (uncachedTracks.length > 0 && !isQuotaExceeded()) {
    const searchesAvailable = MAX_SEARCHES_PER_SESSION - Math.floor(estimatedUnitsUsed / SEARCH_COST);
    const tracksToSearch = uncachedTracks.slice(0, searchesAvailable);
    const tracksToSkip = uncachedTracks.slice(searchesAvailable);
    
    console.log(`🔍 Searching ${tracksToSearch.length} tracks (${searchesAvailable} searches available)...\n`);
    
    // Search allowed tracks in parallel batches of 5 for speed
    const BATCH_SIZE = 5;
    let searchIndex = 0;
    
    while (searchIndex < tracksToSearch.length) {
      // Check quota before starting batch
      if (isQuotaExceeded()) {
        console.log(`⚠️ Quota limit reached during search.`);
        tracksToSkip.push(...tracksToSearch.slice(searchIndex));
        break;
      }
      
      const batch = tracksToSearch.slice(searchIndex, searchIndex + BATCH_SIZE);
      
      // Process batch in parallel
      await Promise.all(batch.map(async (track) => {
        try {
          const youtubeMatches = await searchTrackCached(track.name, track.artists, 5);
          const trackId = normalizeTrackId(track.name, track.artists);
          const indices = trackIndexMap.get(trackId);
          
          const resultObject = {
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
          };
          
          indices.forEach(idx => {
            results[idx] = resultObject;
          });
          
          console.log(`✅ ${track.name}: ${youtubeMatches.length} matches found`);
        } catch (error) {
          const trackId = normalizeTrackId(track.name, track.artists);
          const indices = trackIndexMap.get(trackId);
        
          // If quota exceeded or any error, generate fallback
          if (error.message === 'QUOTA_EXCEEDED' || error.message.includes('quota')) {
            console.log(`⚡ ${track.name}: Quota exceeded - generating fallback`);
            
            const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')} official audio`);
            const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
            
            const fallbackMatch = {
              videoId: null,
              title: `Search: ${track.name} by ${track.artists.join(', ')}`,
              channelTitle: 'YouTube Search',
              channelId: null,
              thumbnail: null,
              publishedAt: null,
              url: fallbackUrl,
              isFallback: true
            };
            
            const resultObject = {
              original: {
                name: track.name,
                artists: track.artists,
                album: track.album,
                durationMs: track.durationMs,
                isrc: track.isrc
              },
              youtube: {
                matches: [fallbackMatch],
                topMatch: fallbackMatch,
                isFallback: true,
                fallbackReason: 'API quota reached'
              }
            };
            
            indices.forEach(idx => {
              results[idx] = resultObject;
            });
          } else {
            // Other errors - still provide fallback but log the error
            console.error(`❌ Error: ${track.name} - ${error.message} (generating fallback)`);
            
            const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')} official audio`);
            const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
            
            const fallbackMatch = {
              videoId: null,
              title: `Search: ${track.name} by ${track.artists.join(', ')}`,
              channelTitle: 'YouTube Search',
              channelId: null,
              thumbnail: null,
              publishedAt: null,
              url: fallbackUrl,
              isFallback: true
            };
            
            const resultObject = {
              original: {
                name: track.name,
                artists: track.artists,
                album: track.album,
                durationMs: track.durationMs,
                isrc: track.isrc
              },
              youtube: {
                matches: [fallbackMatch],
                topMatch: fallbackMatch,
                isFallback: true,
                fallbackReason: 'API quota reached'
              }
            };
            
            indices.forEach(idx => {
              results[idx] = resultObject;
            });
          }
        }
      }));
      
      searchIndex += BATCH_SIZE;
    }
    
    // Handle skipped tracks - use smart fallback URL generation
    if (tracksToSkip.length > 0) {
      console.log(`\n⚡ Generating fallback URLs for ${tracksToSkip.length} tracks (quota-saving mode)...`);
      
      for (const track of tracksToSkip) {
        const trackId = normalizeTrackId(track.name, track.artists);
        const indices = trackIndexMap.get(trackId);
        
        // Generate a likely YouTube search URL as fallback
        const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')} official audio`);
        const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        // Create a fallback result with a direct link to YouTube search
        const fallbackMatch = {
          videoId: null,
          title: `Search: ${track.name} by ${track.artists.join(', ')}`,
          channelTitle: 'YouTube Search',
          channelId: null,
          thumbnail: null,
          publishedAt: null,
          url: fallbackUrl,
          isFallback: true
        };
        
        const resultObject = {
          original: {
            name: track.name,
            artists: track.artists,
            album: track.album,
            durationMs: track.durationMs,
            isrc: track.isrc
          },
          youtube: {
            matches: [fallbackMatch],
            topMatch: fallbackMatch,
            isFallback: true,
            fallbackReason: 'API quota reached'
          }
        };
        
        indices.forEach(idx => {
          results[idx] = resultObject;
        });
        
        console.log(`⚡ ${track.name}: Generated search link`);
      }
    }
  } else if (uncachedTracks.length > 0) {
    // Quota already exceeded - all uncached tracks get fallback
    console.log(`\n⚠️ Quota exceeded - generating search links for all ${uncachedTracks.length} uncached tracks...\n`);
    
    for (const track of uncachedTracks) {
      const trackId = normalizeTrackId(track.name, track.artists);
      const indices = trackIndexMap.get(trackId);
      
      const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')} official audio`);
      const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      const fallbackMatch = {
        videoId: null,
        title: `Search: ${track.name} by ${track.artists.join(', ')}`,
        channelTitle: 'YouTube Search',
        channelId: null,
        thumbnail: null,
        publishedAt: null,
        url: fallbackUrl,
        isFallback: true
      };
      
      const resultObject = {
        original: {
          name: track.name,
          artists: track.artists,
          album: track.album,
          durationMs: track.durationMs,
          isrc: track.isrc
        },
        youtube: {
          matches: [fallbackMatch],
          topMatch: fallbackMatch,
          isFallback: true,
          fallbackReason: 'API quota reached'
        }
      };
      
      indices.forEach(idx => {
        results[idx] = resultObject;
      });
      
      console.log(`⚡ ${track.name}: Generated search link`);
    }
  }

  // Calculate summary
  const successful = results.filter(r => r && r.youtube.topMatch && !r.youtube.isFallback).length;
  const fallbackCount = results.filter(r => r && r.youtube.topMatch && r.youtube.isFallback).length;
  const failed = results.filter(r => r && !r.youtube.topMatch).length;
  
  // If there are any failed (no topMatch at all), convert them to fallbacks
  if (failed > 0) {
    console.log(`\n⚠️ Converting ${failed} failed tracks to fallback links...`);
    for (let i = 0; i < results.length; i++) {
      if (results[i] && !results[i].youtube.topMatch) {
        const track = results[i].original;
        const searchQuery = encodeURIComponent(`${track.name} ${track.artists.join(' ')} official audio`);
        const fallbackUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        const fallbackMatch = {
          videoId: null,
          title: `Search: ${track.name} by ${track.artists.join(', ')}`,
          channelTitle: 'YouTube Search',
          channelId: null,
          thumbnail: null,
          publishedAt: null,
          url: fallbackUrl,
          isFallback: true
        };
        
        results[i].youtube.matches = [fallbackMatch];
        results[i].youtube.topMatch = fallbackMatch;
        results[i].youtube.isFallback = true;
        results[i].youtube.fallbackReason = 'API quota reached';
      }
    }
  }
  
  const actualSuccessful = results.filter(r => r && r.youtube.topMatch && !r.youtube.isFallback).length;
  const actualFallback = results.filter(r => r && r.youtube.topMatch && r.youtube.isFallback).length;
  const totalMatched = actualSuccessful + actualFallback;
  const actualFailed = results.filter(r => r && !r.youtube.topMatch).length;
  const successRate = tracks.length > 0 ? ((actualSuccessful / tracks.length) * 100).toFixed(1) + '%' : '0%';

  console.log(`\n✨ Conversion complete!`);
  console.log(`📊 Results: ${actualSuccessful} matched, ${actualFallback} fallback links, ${actualFailed} failed (${successRate} API success rate)`);
  console.log(`📈 Total API units used: ${estimatedUnitsUsed}/${DAILY_QUOTA_LIMIT}\n`);

  return {
    results,
    summary: {
      total: tracks.length,
      successful: totalMatched, // All tracks with results (API matches + fallback links)
      failed: actualFailed, // Should be 0 with our fallback system
      successRate,
      quotaUsed: estimatedUnitsUsed,
      quotaLimit: DAILY_QUOTA_LIMIT
    }
  };
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
  checkAndResetQuota(); // Check for daily reset
  return {
    ...cache.getStats(),
    quotaUsed: estimatedUnitsUsed,
    quotaLimit: DAILY_QUOTA_LIMIT,
    quotaExceeded: quotaExceeded,
    lastResetDate: lastResetDate
  };
}

/**
 * Manually reset quota tracking (for testing or manual reset)
 * @returns {Object} Reset confirmation
 */
export function resetQuotaTracking() {
  const previousUsage = estimatedUnitsUsed;
  estimatedUnitsUsed = 0;
  quotaExceeded = false;
  lastResetDate = new Date().toDateString();
  console.log(`🔄 Manual quota reset! Previous usage: ${previousUsage} units`);
  return {
    message: 'Quota tracking reset successfully',
    previousUsage,
    newUsage: 0,
    resetDate: lastResetDate
  };
}

/**
 * Clear the cache
 */
export function clearCache() {
  cache.flushAll();
  console.log('🗑️ Cache cleared');
}

/**
 * Reset quota counter (useful for daily reset or testing)
 */
export function resetQuota() {
  estimatedUnitsUsed = 0;
  quotaExceeded = false;
  console.log('🔄 Quota counter reset');
}

/**
 * Export the cached search function for use in routes
 */
export { searchTrackCached };
