import express from 'express';
import { getPlaylistTracks } from '../platforms/spotify.js';

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

export default router;
