import { useState } from 'react';
import { playlistService } from '../services/api';
import TrackList from './TrackList';

function PlaylistConverter() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('spotify');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a playlist URL');
      return;
    }

    setLoading(true);
    setError('');
    setTracks([]);

    try {
      const data = await playlistService.fetchPlaylist(url, platform);
      setTracks(data.tracks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Form Card */}
      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
        <form onSubmit={handleFetch} className="space-y-4">
          {/* Platform Selector */}
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
              Source Platform
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="spotify">Spotify</option>
              <option value="apple-music" disabled>Apple Music (Coming Soon)</option>
            </select>
          </div>

          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Playlist URL
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching Playlist...
              </>
            ) : (
              'Fetch Playlist'
            )}
          </button>
        </form>
      </div>

      {/* Track List */}
      {tracks.length > 0 && <TrackList tracks={tracks} />}
    </div>
  );
}

export default PlaylistConverter;
