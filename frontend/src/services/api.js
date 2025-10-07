import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const playlistService = {
  async fetchPlaylist(url, platform) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlist/fetch`, {
        url,
        platform
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Failed to fetch playlist'
      );
    }
  },

  async convertToYouTube(tracks) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlist/youtube/convert`, {
        tracks
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Failed to convert tracks to YouTube'
      );
    }
  }
};
