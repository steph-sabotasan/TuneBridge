import axios from 'axios';

// Extract playlist ID from Spotify URL
function extractPlaylistId(url) {
  // Supports: https://open.spotify.com/playlist/{id}
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error('Invalid Spotify playlist URL');
  }
  return match[1];
}

// Get Spotify access token
async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
  }

  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      }
    }
  );

  return response.data.access_token;
}

// Fetch playlist tracks from Spotify
export async function getPlaylistTracks(url) {
  try {
    const playlistId = extractPlaylistId(url);
    const accessToken = await getAccessToken();

    // Fetch playlist data
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    // Transform to standardized format
    const tracks = response.data.tracks.items
      .filter(item => item.track) // Filter out null tracks
      .map(item => ({
        name: item.track.name,
        artists: item.track.artists.map(artist => artist.name),
        album: item.track.album.name,
        durationMs: item.track.duration_ms,
        isrc: item.track.external_ids?.isrc || null
      }));

    return tracks;
  } catch (error) {
    if (error.response) {
      throw new Error(`Spotify API error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw error;
  }
}
