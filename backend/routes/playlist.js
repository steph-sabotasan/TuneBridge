import express from 'express';
import { getPlaylistTracks } from '../platforms/spotify.js';
import { convertTracksToYouTube } from '../platforms/youtube.js';

const router = express.Router();

// Get playlist tracks from a platform
router.post('/fetch', async (req, res) => {
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

// Convert Spotify tracks to YouTube matches
router.post('/youtube/convert', async (req, res) => {
  try {
    const { tracks } = req.body;

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

    // Convert tracks to YouTube matches
    const results = await convertTracksToYouTube(tracks);

    // Calculate success rate
    const successfulMatches = results.filter(r => r.youtube.topMatch !== null).length;
    const totalTracks = results.length;
    const successRate = totalTracks > 0 ? (successfulMatches / totalTracks * 100).toFixed(1) : 0;

    res.json({ 
      results,
      summary: {
        total: totalTracks,
        successful: successfulMatches,
        failed: totalTracks - successfulMatches,
        successRate: `${successRate}%`
      }
    });
  } catch (error) {
    console.error('Error converting tracks to YouTube:', error);
    res.status(500).json({ error: error.message || 'Failed to convert tracks to YouTube' });
  }
});

export default router;
