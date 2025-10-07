import axios from 'axios';

// Spotify playlist ID is always 22 characters long
const SPOTIFY_PLAYLIST_ID_LENGTH = 22;
const PLAYLIST_ID_REGEX = /^[a-zA-Z0-9]{22}$/;

// Extract playlist ID from Spotify URL
function extractPlaylistId(url) {
  // Supports: https://open.spotify.com/playlist/{id}
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error('Invalid Spotify playlist URL');
  }
  
  const playlistId = match[1];
  
  // Additional validation: ensure playlist ID is alphanumeric and correct length
  if (!PLAYLIST_ID_REGEX.test(playlistId)) {
    throw new Error('Invalid Spotify playlist ID format');
  }
  
  return playlistId;
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
  let playlistId;
  
  try {
    // Extract and validate playlist ID (ensures only alphanumeric characters)
    playlistId = extractPlaylistId(url);
    const accessToken = await getAccessToken();

    // Construct API URL - playlistId is validated to be alphanumeric only
    const apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;

    // Fetch playlist data
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

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
      const status = error.response.status;
      const errorMessage = error.response.data.error?.message || error.response.statusText;
      
      // Provide helpful error messages based on status code
      if (status === 404) {
        // Check if it's likely a Spotify curated playlist
        if (playlistId && playlistId.startsWith('37i9dQ')) {
          throw new Error(
            'This Spotify playlist cannot be accessed with your current authentication. ' +
            'Spotify editorial/curated playlists (like Discover Weekly, Top 50, etc.) require user authentication. ' +
            'Please try with a user-created public playlist instead.'
          );
        }
        throw new Error(
          'Playlist not found. Please check that:\n' +
          '1. The playlist URL is correct\n' +
          '2. The playlist is public (not private)\n' +
          '3. The playlist exists and hasn\'t been deleted'
        );
      } else if (status === 401) {
        throw new Error('Spotify authentication failed. Please check your API credentials.');
      } else if (status === 403) {
        throw new Error('Access forbidden. This playlist may be private or region-restricted.');
      } else if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      throw new Error(`Spotify API error (${status}): ${errorMessage}`);
    }
    throw error;
  }
}
