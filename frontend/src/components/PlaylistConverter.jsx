import { useState, useRef, useEffect } from 'react';
import { playlistService } from '../services/api';
import TrackList from './TrackList';
import YouTubePlayer from './YouTubePlayer';

function PlaylistConverter() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('spotify');
  const [tracks, setTracks] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  
  const playerRef = useRef(null);

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
      setCurrentVideoIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  // Auto-scroll to player when YouTube results load
  useEffect(() => {
    if (youtubeResults && playerRef.current) {
      setTimeout(() => {
        playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [youtubeResults]);

  const handleVideoChange = (direction) => {
    if (!youtubeResults) return;
    
    const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch);
    
    if (direction === 'next') {
      setCurrentVideoIndex((prev) => 
        prev < matchedTracks.length - 1 ? prev + 1 : 0
      );
    } else if (direction === 'prev') {
      setCurrentVideoIndex((prev) => 
        prev > 0 ? prev - 1 : matchedTracks.length - 1
      );
    }
  };

  const handleTrackSelect = (index) => {
    const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch);
    const matchedIndex = matchedTracks.findIndex((_, i) => i === index);
    if (matchedIndex !== -1) {
      setCurrentVideoIndex(matchedIndex);
      if (playerRef.current) {
        playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
        <div>
          {/* Back Button */}
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

          {/* YouTube Player Section */}
          {youtubeResults.results.filter(r => r.youtube.topMatch).length > 0 && (
            <div ref={playerRef} className="mb-6 bg-white rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Now Playing
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {currentVideoIndex + 1} / {youtubeResults.results.filter(r => r.youtube.topMatch).length}
                  </span>
                </div>
              </div>

              {/* Current Track Info */}
              {(() => {
                const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch);
                const currentTrack = matchedTracks[currentVideoIndex];
                return currentTrack ? (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">{currentTrack.original.name}</h3>
                    <p className="text-sm text-gray-600">{currentTrack.original.artists.join(', ')}</p>
                  </div>
                ) : null;
              })()}

              {/* YouTube Player */}
              {(() => {
                const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch);
                const currentTrack = matchedTracks[currentVideoIndex];
                return currentTrack ? (
                  <YouTubePlayer
                    videoId={currentTrack.youtube.topMatch.videoId}
                    onVideoChange={handleVideoChange}
                  />
                ) : null;
              })()}

              {/* Player Controls */}
              <div className="mt-4 flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleVideoChange('prev')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => handleVideoChange('next')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                  Next
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Track List */}
          <TrackList 
            tracks={tracks} 
            youtubeResults={youtubeResults} 
            onRetryFailed={handleRetryFailed}
            onTrackSelect={handleTrackSelect}
            currentVideoIndex={currentVideoIndex}
          />
        </div>
      )}
    </div>
  );
}

export default PlaylistConverter;
