import express from 'express';
import { getPlaylistTracks } from '../platforms/spotify.js';
import { convertTracksToYouTube, resetQuotaTracking, getCacheStats } from '../platforms/youtube.js';
import { generatePlaylistId, savePlaylist, getPlaylist } from '../storage/playlists.js';
import { conversionLimiter, fetchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get playlist tracks from a platform (with rate limiting)
router.post('/fetch', fetchLimiter, async (req, res) => {
  try {
    const { url, platform } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    let tracks = [];

    switch (platform.toLowerCase()) {
      case 'spotify':
        tracks = await getPlaylistTracks(url);
        break;
      case 'apple-music':
        return res.status(501).json({ error: 'Apple Music not yet implemented' });
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    res.json({ tracks, count: tracks.length });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch playlist' });
  }
});

// Convert Spotify tracks to YouTube matches (with stricter rate limiting)
router.post('/youtube/convert', conversionLimiter, async (req, res) => {
  try {
    const { tracks, spotifyUrl } = req.body;

    if (!tracks) {
      return res.status(400).json({ error: 'Tracks array is required' });
    }

    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Tracks must be an array' });
    }

    if (tracks.length === 0) {
      return res.status(400).json({ error: 'Tracks array cannot be empty' });
    }

    // Validate track structure
    for (const track of tracks) {
      if (!track.name || !track.artists) {
        return res.status(400).json({ 
          error: 'Each track must have "name" and "artists" fields' 
        });
      }
    }

    // Convert tracks to YouTube matches (now returns object with results and summary)
    const data = await convertTracksToYouTube(tracks);

    // Generate playlist ID and save if spotifyUrl provided
    let playlistId = null;
    if (spotifyUrl) {
      playlistId = generatePlaylistId(spotifyUrl);
      await savePlaylist(playlistId, data, spotifyUrl);
    }

    // Return data with playlist ID for shareable link
    res.json({
      ...data,
      playlistId
    });
  } catch (error) {
    console.error('Error converting tracks to YouTube:', error);
    res.status(500).json({ error: error.message || 'Failed to convert tracks to YouTube' });
  }
});

// Get YouTube API quota status
router.get('/youtube/quota/status', async (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      quotaUsed: stats.quotaUsed,
      quotaLimit: stats.quotaLimit,
      quotaRemaining: stats.quotaLimit - stats.quotaUsed,
      quotaExceeded: stats.quotaExceeded,
      lastResetDate: stats.lastResetDate,
      searchesUsed: Math.floor(stats.quotaUsed / 100),
      searchesRemaining: 20 - Math.floor(stats.quotaUsed / 100)
    });
  } catch (error) {
    console.error('Error getting quota status:', error);
    res.status(500).json({ error: error.message || 'Failed to get quota status' });
  }
});

// Manually reset YouTube API quota tracking (for testing/admin)
router.post('/youtube/quota/reset', async (req, res) => {
  try {
    const result = resetQuotaTracking();
    res.json(result);
  } catch (error) {
    console.error('Error resetting quota:', error);
    res.status(500).json({ error: error.message || 'Failed to reset quota' });
  }
});

// Get a saved playlist by ID
router.get('/youtube/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }

    const playlist = await getPlaylist(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found or expired' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error retrieving playlist:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve playlist' });
  }
});

export default router;
