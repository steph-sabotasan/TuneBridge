import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playlistService } from '../services/api';
import TrackList from './TrackList';
import YouTubePlayer from './YouTubePlayer';

function SharedPlaylist() {
  const { playlistId } = useParams();
  const [youtubeResults, setYoutubeResults] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlternates, setSelectedAlternates] = useState({});
  
  const playerRef = useRef(null);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await playlistService.getPlaylistById(playlistId);
        setYoutubeResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      loadPlaylist();
    }
  }, [playlistId]);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <svg className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Playlist Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Convert a New Playlist
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with back link */}
      <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <Link
          to="/"
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Convert Another Playlist
        </Link>
      </div>

      {/* Playlist Info */}
      {youtubeResults.spotifyUrl && (
        <div className="mb-4 bg-white rounded-lg shadow-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Shared Playlist</p>
            <p className="text-xs text-gray-500 mt-1">Converted from Spotify</p>
          </div>
          <a
            href={youtubeResults.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            View on Spotify
          </a>
        </div>
      )}

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

          {/* Navigation Controls */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => handleVideoChange('prev')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
              Previous
            </button>
            <button
              onClick={() => handleVideoChange('next')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
            >
              Next
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="scale(-1, 1) translate(-24, 0)"/>
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
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Autoplay videos</span>
            </label>
          </div>
        </div>
      )}

      {/* Track List */}
      <TrackList 
        youtubeResults={youtubeResults}
        onTrackSelect={handleTrackSelect}
        currentVideoIndex={currentVideoIndex}
        onSelectAlternate={handleSelectAlternate}
      />
    </div>
  );
}

export default SharedPlaylist;
