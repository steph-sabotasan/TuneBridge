/**
 * Rate Limiting Configuration
 * 
 * Adjust these values to control abuse prevention.
 * Higher values = more permissive, Lower values = stricter
 */

export const rateLimitConfig = {
  // Conversion rate limit (most expensive operation)
  conversion: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 conversions per 15 minutes per IP
    message: {
      error: 'Too many conversion requests. Please wait 15 minutes before trying again.',
      retryAfter: '15 minutes'
    }
  },

  // Playlist fetch rate limit (less expensive)
  fetch: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 fetches per 15 minutes per IP
    message: {
      error: 'Too many playlist fetch requests. Please wait before trying again.',
      retryAfter: '15 minutes'
    }
  },

  // General API rate limit (catch-all)
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 minutes per IP
    message: {
      error: 'Too many requests. Please slow down.',
      retryAfter: '15 minutes'
    }
  },

  // Shared playlist access (very permissive - reading from cache is cheap)
  sharedPlaylist: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 shared playlist views per 15 minutes per IP
    message: {
      error: 'Too many requests. Please wait before accessing more playlists.',
      retryAfter: '15 minutes'
    }
  }
};

/**
 * Tips for Adjusting Limits:
 * 
 * For Development (more permissive):
 * - conversion.max = 50
 * - fetch.max = 100
 * 
 * For Production with Redis (recommended):
 * - conversion.max = 10 (protects YouTube quota)
 * - fetch.max = 20 (prevents Spotify API abuse)
 * - sharedPlaylist.max = 100+ (reading cache is cheap)
 * 
 * For Public Beta (stricter):
 * - conversion.max = 5
 * - fetch.max = 10
 * - windowMs = 60 * 60 * 1000 (1 hour)
 * 
 * For Music League (balance):
 * - conversion.max = 10 (enough for round setup)
 * - sharedPlaylist.max = 200 (allow 30+ players to access)
 * 
 * Note: Each IP address is tracked separately.
 * Behind a proxy/CDN, make sure to trust proxy headers.
 */
