import { useState } from 'react';

function TrackList({ tracks, youtubeResults, onRetryFailed }) {
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
          YouTube Results
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
              <div className="text-sm text-green-800 mt-1 font-medium">Matched</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border border-red-200">
              <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-red-800 mt-1 font-medium">Failed</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{summary.successRate}</div>
              <div className="text-sm text-purple-800 mt-1 font-medium">Success Rate</div>
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
              {/* Icon size: 20px (w-5 h-5) */}
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

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white flex flex-col"
              >
                {/* Original Track Info */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                    {result.original.name}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                    {result.original.artists.join(', ')}
                  </p>
                </div>

                {/* YouTube Match */}
                {result.youtube.topMatch ? (
                  <div className="flex-1 flex flex-col">
                    {/* Top Match */}
                    <a
                      href={result.youtube.topMatch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${result.youtube.topMatch.videoId}/mqdefault.jpg`}
                          alt={result.youtube.topMatch.title}
                          className="w-full h-48 object-cover group-hover:opacity-75 group-hover:scale-105 transition-all duration-200"
                          loading="lazy"
                        />
                        {/* 
                          Play overlay - Using neutral styling (NOT YouTube red).
                          YouTube Brand Compliance: We use a simple play icon with our app's 
                          neutral colors. Per YouTube guidelines, we must not imitate YouTube's 
                          trade dress or distinctive color combinations.
                        */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="rounded-full p-4 bg-black/70">
                            {/* Simple play triangle icon - not YouTube branded */}
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                        {/* Success Badge */}
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          ✓ Matched
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {result.youtube.topMatch.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          📺 {result.youtube.topMatch.channelTitle}
                        </p>
                      </div>
                    </a>

                    {/* Alternate Matches */}
                    {hasAlternates && (
                      <div className="border-t border-gray-200 mt-auto">
                        <button
                          onClick={() => toggleExpanded(index)}
                          className="w-full px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center"
                        >
                          {isExpanded ? (
                            <>
                              {/* Icon size: 16px (w-4 h-4) */}
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Hide alternates
                            </>
                          ) : (
                            <>
                              {/* Icon size: 16px (w-4 h-4) */}
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
                                  <p className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-purple-600">
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
