import NodeCache from 'node-cache';
import { createClient } from 'redis';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PLAYLIST_TTL = 86400 * 7; // 7 days in seconds

// In-memory cache for local development
const memoryCache = new NodeCache({ 
  stdTTL: PLAYLIST_TTL,
  checkperiod: 3600
});

// Redis client for production (Upstash or any Redis provider)
let redisClient = null;
let useRedis = false;

// Initialize Redis if URL is provided
async function initRedis() {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          tls: true,
          rejectUnauthorized: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return retries * 100; // Exponential backoff
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        useRedis = false;
      });

      redisClient.on('connect', () => {
        console.log('✅ Connected to Redis (persistent cache enabled)');
      });

      await redisClient.connect();
      useRedis = true;
      console.log('🚀 Using Redis for persistent playlist storage');
    } catch (error) {
      console.warn('⚠️  Redis unavailable, falling back to in-memory cache:', error.message);
      useRedis = false;
    }
  } else {
    console.log('💡 No REDIS_URL found - using in-memory cache (development mode)');
  }
}

// Initialize on module load
initRedis().catch(console.error);

/**
 * Generate a unique ID for a playlist
 * @param {string} spotifyUrl - The Spotify playlist URL
 * @returns {string} Unique playlist ID
 */
export function generatePlaylistId(spotifyUrl) {
  const hash = crypto.createHash('md5').update(spotifyUrl).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Save a converted playlist
 * @param {string} playlistId - Unique playlist ID
 * @param {Object} data - Converted playlist data
 * @param {string} spotifyUrl - Original Spotify URL
 */
export async function savePlaylist(playlistId, data, spotifyUrl) {
  const playlistData = {
    ...data,
    spotifyUrl,
    createdAt: new Date().toISOString()
  };
  
  try {
    if (useRedis && redisClient) {
      // Store in Redis with TTL
      await redisClient.setEx(
        `playlist:${playlistId}`,
        PLAYLIST_TTL,
        JSON.stringify(playlistData)
      );
      console.log(`💾 Saved playlist ${playlistId} to Redis (expires in 7 days)`);
    } else {
      // Fallback to in-memory cache
      memoryCache.set(playlistId, playlistData);
      console.log(`💾 Saved playlist ${playlistId} to memory (expires in 7 days)`);
    }
  } catch (error) {
    console.error('❌ Error saving playlist:', error.message);
    // Fallback to memory cache on error
    memoryCache.set(playlistId, playlistData);
    console.log(`💾 Saved playlist ${playlistId} to memory (fallback)`);
  }
}

/**
 * Get a saved playlist
 * @param {string} playlistId - Unique playlist ID
 * @returns {Object|null} Playlist data or null if not found
 */
export async function getPlaylist(playlistId) {
  try {
    if (useRedis && redisClient) {
      // Get from Redis
      const data = await redisClient.get(`playlist:${playlistId}`);
      if (data) {
        console.log(`✅ Retrieved playlist ${playlistId} from Redis`);
        return JSON.parse(data);
      } else {
        console.log(`❌ Playlist ${playlistId} not found in Redis`);
        return null;
      }
    } else {
      // Get from memory cache
      const data = memoryCache.get(playlistId);
      if (data) {
        console.log(`✅ Retrieved playlist ${playlistId} from memory`);
        return data;
      } else {
        console.log(`❌ Playlist ${playlistId} not found in memory`);
        return null;
      }
    }
  } catch (error) {
    console.error('❌ Error retrieving playlist:', error.message);
    // Fallback to memory cache
    const data = memoryCache.get(playlistId);
    return data || null;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export async function getStats() {
  if (useRedis && redisClient) {
    try {
      const info = await redisClient.info('stats');
      const keys = await redisClient.keys('playlist:*');
      return {
        backend: 'redis',
        totalKeys: keys.length,
        info: info
      };
    } catch (error) {
      console.error('Error getting Redis stats:', error.message);
    }
  }
  
  const stats = memoryCache.getStats();
  return {
    backend: 'memory',
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redisClient) {
    await redisClient.quit();
  }
});
