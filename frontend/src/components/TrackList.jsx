import { useState } from 'react';

function TrackList({ tracks, youtubeResults, onRetryFailed, onTrackSelect, currentVideoIndex }) {
  const [expandedTracks, setExpandedTracks] = useState(new Set());

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedTracks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTracks(newExpanded);
  };

  // If YouTube results are provided, show YouTube results view
  if (youtubeResults) {
    const { summary, results } = youtubeResults;
    const successPercentage = parseFloat(summary.successRate.replace('%', ''));
    const failedTracks = results.filter(r => !r.youtube.topMatch);

    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          YouTube Music Results
        </h2>

        {/* Summary Stats */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-blue-800 mt-1 font-medium">Total Tracks</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-600">{summary.successful}</div>
              <div className="text-sm text-green-800 mt-1 font-medium">Available</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{results.filter(r => r.youtube.isFallback).length}</div>
              <div className="text-sm text-orange-800 mt-1 font-medium">Search Links</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{summary.successRate}</div>
              <div className="text-sm text-purple-800 mt-1 font-medium">API Success</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${successPercentage}%` }}
            >
              {successPercentage > 10 && (
                <span className="text-xs font-semibold text-white">{summary.successRate}</span>
              )}
            </div>
          </div>
        </div>

        {/* Retry Failed Tracks Button */}
        {failedTracks.length > 0 && onRetryFailed && (
          <div className="mb-6">
            <button
              onClick={() => onRetryFailed(failedTracks)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry {failedTracks.length} Failed Track{failedTracks.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => {
            const isExpanded = expandedTracks.has(index);
            const hasAlternates = result.youtube.matches && result.youtube.matches.length > 1;
            
            // Check if this is the currently playing track (only for non-fallback tracks)
            const matchedTracks = results.filter(r => r.youtube.topMatch && !r.youtube.isFallback);
            const matchedIndex = matchedTracks.findIndex(mt => 
              mt.original.name === result.original.name && 
              mt.original.artists.join(',') === result.original.artists.join(',')
            );
            const isCurrentlyPlaying = matchedIndex === currentVideoIndex && matchedIndex !== -1 && !result.youtube.isFallback;

            return (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white flex flex-col ${
                  isCurrentlyPlaying ? 'border-red-500 border-2 ring-2 ring-red-200' : 'border-gray-200'
                }`}
              >
                {/* Original Track Info */}
                <div className={`p-4 border-b border-gray-200 ${
                  isCurrentlyPlaying ? 'bg-gradient-to-r from-red-50 to-pink-50' : 'bg-gradient-to-r from-purple-50 to-pink-50'
                }`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                    {result.original.name}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                    {result.original.artists.join(', ')}
                  </p>
                  {isCurrentlyPlaying && (
                    <div className="mt-2 flex items-center text-red-600 text-xs font-semibold">
                      <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Now Playing
                    </div>
                  )}
                </div>

                {/* YouTube Match */}
                {result.youtube.topMatch ? (
                  <div className="flex-1 flex flex-col">
                    {/* Top Match */}
                    <div 
                      className={`block group ${result.youtube.isFallback ? '' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!result.youtube.isFallback && onTrackSelect && matchedIndex !== -1) {
                          onTrackSelect(matchedIndex);
                        }
                      }}
                    >
                      {/* Thumbnail or Fallback */}
                      {result.youtube.isFallback ? (
                        <a 
                          href={result.youtube.topMatch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="relative bg-gradient-to-br from-orange-50 to-yellow-50 h-48 flex items-center justify-center hover:from-orange-100 hover:to-yellow-100 transition-all duration-200 border-b-2 border-orange-200">
                            <div className="text-center p-4">
                              <svg className="w-16 h-16 mx-auto mb-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                              <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block shadow-md mb-2">
                                ⚡ Search Link
                              </div>
                              <p className="text-xs text-gray-600 font-medium">Click to search on YouTube</p>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="relative overflow-hidden bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${result.youtube.topMatch.videoId}/mqdefault.jpg`}
                          alt={result.youtube.topMatch.title}
                          className="w-full h-48 object-cover group-hover:opacity-75 group-hover:scale-105 transition-all duration-200"
                          loading="lazy"
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-red-600 rounded-full p-4">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                        {/* Success Badge */}
                        {!result.youtube.isFallback && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            ✓ Matched
                          </div>
                        )}
                      </div>
                      )}

                      {/* Video Info */}
                      <div className="p-3">
                        <h4 className={`font-medium text-sm line-clamp-2 transition-colors ${
                          result.youtube.isFallback 
                            ? 'text-gray-800' 
                            : 'text-gray-900 group-hover:text-red-600'
                        }`}>
                          {result.youtube.isFallback 
                            ? `${result.original.name} - ${result.original.artists.join(', ')}`
                            : result.youtube.topMatch.title
                          }
                        </h4>
                        {result.youtube.isFallback ? (
                          <p className="text-xs text-orange-600 mt-2 font-semibold flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            {result.youtube.fallbackReason || 'API quota reached'}
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              📺 {result.youtube.topMatch.channelTitle}
                            </p>
                            <a
                              href={result.youtube.topMatch.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open in YouTube →
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Alternate Matches */}
                    {hasAlternates && (
                      <div className="border-t border-gray-200 mt-auto">
                        <button
                          onClick={() => toggleExpanded(index)}
                          className="w-full px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Hide alternates
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              + {result.youtube.matches.length - 1} more match{result.youtube.matches.length - 1 !== 1 ? 'es' : ''}
                            </>
                          )}
                        </button>

                        {/* Expanded Alternates */}
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2 bg-gray-50">
                            {result.youtube.matches.slice(1).map((match, matchIndex) => (
                              <a
                                key={matchIndex}
                                href={match.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start space-x-2 p-2 rounded hover:bg-white border border-gray-200 hover:border-purple-300 transition-all group"
                              >
                                <img
                                  src={`https://img.youtube.com/vi/${match.videoId}/default.jpg`}
                                  alt={match.title}
                                  className="w-16 h-12 rounded object-cover flex-shrink-0"
                                  loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-red-600">
                                    {match.title}
                                  </p>
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    {match.channelTitle}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
                    <div className="text-center">
                      <div className="text-4xl mb-2">❌</div>
                      <p className="text-sm font-medium text-gray-700 mb-1">No Match Found</p>
                      {result.youtube.error && (
                        <p className="text-xs text-red-600 line-clamp-2">{result.youtube.error}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Spotify tracks view
  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Playlist Tracks ({tracks.length})
      </h2>
      
      <div className="space-y-3">
        {tracks.map((track, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {track.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {track.artists.join(', ')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {track.album}
                </p>
                {track.isrc && (
                  <p className="text-xs text-gray-400 mt-1">
                    ISRC: {track.isrc}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 text-sm text-gray-500">
                {formatDuration(track.durationMs)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackList;
