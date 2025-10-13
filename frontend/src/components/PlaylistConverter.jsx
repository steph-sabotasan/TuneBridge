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
  const [autoplay, setAutoplay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [selectedAlternates, setSelectedAlternates] = useState({});
  
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
      const data = await playlistService.convertToYouTube(tracks, url);
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
    
    const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback);
    
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
    const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback);
    const matchedIndex = matchedTracks.findIndex((_, i) => i === index);
    if (matchedIndex !== -1) {
      setCurrentVideoIndex(matchedIndex);
      if (playerRef.current) {
        playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSelectAlternate = (trackIndex, matchIndex) => {
    setSelectedAlternates(prev => ({
      ...prev,
      [trackIndex]: matchIndex
    }));
  };

  const getSelectedVideoId = (trackIndex) => {
    if (!youtubeResults) return null;
    const result = youtubeResults.results[trackIndex];
    if (!result || !result.youtube.matches) return result?.youtube.topMatch?.videoId;
    
    const selectedIndex = selectedAlternates[trackIndex] || 0;
    return result.youtube.matches[selectedIndex]?.videoId || result.youtube.topMatch.videoId;
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
          {/* Playlist Summary Card with Convert Button */}
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex items-start justify-between gap-6">
              {/* Playlist Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Playlist Loaded</h2>
                    <p className="text-gray-600 mt-1">
                      <span className="font-semibold text-purple-600">{tracks.length}</span> tracks ready to convert
                    </p>
                  </div>
                </div>
                
                {/* Quick Preview */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">PREVIEW</p>
                  <div className="space-y-1">
                    {tracks.slice(0, 3).map((track, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{track.name}</span>
                        <span className="text-gray-500"> • {track.artists.join(', ')}</span>
                      </div>
                    ))}
                    {tracks.length > 3 && (
                      <p className="text-xs text-gray-500 italic">+ {tracks.length - 3} more tracks...</p>
                    )}
                  </div>
                </div>

                {/* View on Spotify Link */}
                {platform === 'spotify' && url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    View on Spotify
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Convert Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleConvertToYouTube}
                  disabled={converting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                >
                  {converting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div>
                        <div className="text-sm">Converting...</div>
                        <div className="text-xs opacity-90">Finding on YouTube</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <div>
                        <div className="text-lg">Convert to</div>
                        <div className="text-lg font-bold">YouTube Music</div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* YouTube Results */}
      {youtubeResults && (
        <div>
          {/* Back Button and Share Link */}
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

            {/* Share Link Button */}
            {youtubeResults.playlistId && (
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/playlist/${youtubeResults.playlistId}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied! Share this with your Music League group so everyone can listen.');
                }}
                className="text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Copy Shareable Link
              </button>
            )}
          </div>

          {/* YouTube Player Section */}
          {youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback).length > 0 && (
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
                    {currentVideoIndex + 1} / {youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback).length}
                  </span>
                </div>
              </div>

              {/* Current Track Info */}
              {(() => {
                const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback);
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
                const matchedTracks = youtubeResults.results.filter(r => r.youtube.topMatch && !r.youtube.isFallback);
                const currentTrack = matchedTracks[currentVideoIndex];
                if (!currentTrack) return null;
                
                // Find the original track index to get the selected alternate
                const originalTrackIndex = youtubeResults.results.findIndex(r => 
                  r.original.name === currentTrack.original.name && 
                  r.original.artists.join(',') === currentTrack.original.artists.join(',')
                );
                
                const videoId = getSelectedVideoId(originalTrackIndex);
                
                return (
                  <YouTubePlayer
                    videoId={videoId}
                    onVideoChange={handleVideoChange}
                    autoplay={autoplay}
                  />
                );
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

              {/* Autoplay Toggle */}
              <div className="mt-4 flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Autoplay videos</span>
                </label>
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
            onSelectAlternate={handleSelectAlternate}
          />
        </div>
      )}
    </div>
  );
}

export default PlaylistConverter;
