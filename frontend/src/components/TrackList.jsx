function TrackList({ tracks }) {
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

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
