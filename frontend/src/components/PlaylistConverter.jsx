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

  const handleRetryFailed = async (failedTracks) => {
    if (failedTracks.length === 0) return;

    setConverting(true);
    setError('');

    try {
      // Extract just the original track data for retry
      const tracksToRetry = failedTracks.map(ft => ft.original);
      const retryData = await playlistService.convertToYouTube(tracksToRetry);
      
      // Merge retry results with existing results
      const updatedResults = youtubeResults.results.map(result => {
        // Find if this track was retried
        const retryResult = retryData.results.find(
          retry => retry.original.name === result.original.name && 
                   retry.original.artists.join(',') === result.original.artists.join(',')
        );
        
        // If found and successful, update it
        if (retryResult && retryResult.youtube.topMatch) {
          return retryResult;
        }
        
        return result;
      });

      // Recalculate summary
      const successful = updatedResults.filter(r => r.youtube.topMatch).length;
      const failed = updatedResults.filter(r => !r.youtube.topMatch).length;
      const total = updatedResults.length;
      const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) + '%' : '0%';

      setYoutubeResults({
        results: updatedResults,
        summary: {
          total,
          successful,
          failed,
          successRate
        }
      });
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
          {/* 
            YouTube Brand Compliance: Using our app's purple theme instead of YouTube red.
            The YouTube icon is used only for content attribution (20px), not as branded button styling.
            Per YouTube guidelines: "Do not adopt marks, logos, slogans, or designs that are 
            confusingly similar to YouTube trademarks or that imitate YouTube's trade dress."
          */}
          <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
            <button
              onClick={handleConvertToYouTube}
              disabled={converting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {converting ? (
                <>
                  {/* Icon size: 20px (h-5 w-5) */}
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding on YouTube...
                </>
              ) : (
                <>
                  {/* Icon size: 20px (w-5 h-5) - Using music note icon, NOT YouTube logo per branding guidelines */}
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                  </svg>
                  Open on YouTube
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-gray-600 text-center">
              🎵 Find these tracks on YouTube
            </p>
          </div>
        </>
      )}

      {/* YouTube Results */}
      {youtubeResults && (
        <div>
          <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-xl p-4">
            <button
              onClick={() => setYoutubeResults(null)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Spotify Tracks
            </button>
          </div>
          <TrackList 
            tracks={tracks} 
            youtubeResults={youtubeResults} 
            onRetryFailed={handleRetryFailed}
          />
        </div>
      )}
    </div>
  );
}

export default PlaylistConverter;
