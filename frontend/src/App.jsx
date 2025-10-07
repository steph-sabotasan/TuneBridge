import { useState } from 'react';
import PlaylistConverter from './components/PlaylistConverter';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎵 TuneBridge
          </h1>
          <p className="text-xl text-gray-300">
            Convert playlists between music platforms
          </p>
        </header>
        <PlaylistConverter />
      </div>
    </div>
  );
}

export default App;
