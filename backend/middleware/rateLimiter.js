import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config/rateLimits.js';

// Rate limiting middleware
// Limit conversions (the expensive operation)
export const conversionLimiter = rateLimit({
  ...rateLimitConfig.conversion,
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit playlist fetches (less expensive but still should be limited)
export const fetchLimiter = rateLimit({
  ...rateLimitConfig.fetch,
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter (catch-all for other endpoints)
export const generalLimiter = rateLimit({
  ...rateLimitConfig.general,
  standardHeaders: true,
  legacyHeaders: false,
});

// Shared playlist access limiter (very permissive)
export const sharedPlaylistLimiter = rateLimit({
  ...rateLimitConfig.sharedPlaylist,
  standardHeaders: true,
  legacyHeaders: false,
});
