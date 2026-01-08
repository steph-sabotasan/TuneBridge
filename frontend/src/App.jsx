import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlaylistConverter from './components/PlaylistConverter';
import Footer from './components/Footer';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 flex-1">
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
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
