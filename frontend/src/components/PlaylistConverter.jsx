import { useState } from 'react';
import { playlistService } from '../services/api';
import TrackList from './TrackList';

function PlaylistConverter() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('spotify');
  const [tracks, setTracks] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
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
    setYoutubeResults(null);

    try {
      const data = await playlistService.fetchPlaylist(url, platform);
      setTracks(data.tracks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToYouTube = async () => {
    if (tracks.length === 0) return;

    setConverting(true);
    setError('');

    try {
      const data = await playlistService.convertToYouTube(tracks);
      setYoutubeResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
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
            {platform === 'spotify' && (
              <p className="mt-2 text-sm text-gray-600">
                ℹ️ Note: Only user-created public playlists are supported. Spotify curated playlists (Discover Weekly, Top 50, etc.) require user authentication.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-line">
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
      {tracks.length > 0 && !youtubeResults && (
        <>
          <TrackList tracks={tracks} />
          
          {/* Convert to YouTube Button */}
          <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
            <button
              onClick={handleConvertToYouTube}
              disabled={converting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {converting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Converting to YouTube Music...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Convert to YouTube Music
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-gray-600 text-center">
              🎵 Find these tracks on YouTube Music
            </p>
          </div>
        </>
      )}

      {/* YouTube Results */}
      {youtubeResults && (
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              YouTube Music Results
            </h2>
            <button
              onClick={() => setYoutubeResults(null)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Spotify Tracks
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{youtubeResults.summary.total}</div>
              <div className="text-xs text-gray-600 mt-1">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{youtubeResults.summary.successful}</div>
              <div className="text-xs text-gray-600 mt-1">Matched</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{youtubeResults.summary.failed}</div>
              <div className="text-xs text-gray-600 mt-1">Failed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{youtubeResults.summary.successRate}</div>
              <div className="text-xs text-gray-600 mt-1">Success</div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {youtubeResults.results.map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Original Track Info */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.original.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result.original.artists.join(', ')}
                  </p>
                </div>

                {/* YouTube Match */}
                {result.youtube.topMatch ? (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* Thumbnail */}
                      <img
                        src={result.youtube.topMatch.thumbnail}
                        alt={result.youtube.topMatch.title}
                        className="w-24 h-24 rounded object-cover flex-shrink-0"
                      />
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {result.youtube.topMatch.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          📺 {result.youtube.topMatch.channelTitle}
                        </p>
                        <a
                          href={result.youtube.topMatch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Open on YouTube
                        </a>
                        {result.youtube.matches.length > 1 && (
                          <p className="text-xs text-gray-500 mt-2">
                            +{result.youtube.matches.length - 1} more matches found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                    {result.youtube.error ? (
                      <>
                        <p className="text-sm">❌ {result.youtube.error}</p>
                      </>
                    ) : (
                      <p className="text-sm">No YouTube match found</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistConverter;
