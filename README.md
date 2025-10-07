# TuneBridge 🎵

A full-stack application to convert playlists between music streaming platforms. Current MVP supports Spotify → Apple Music conversion.

## Features

- 🎧 Fetch playlist tracks from Spotify
- 📋 Display standardized track information (name, artists, album, duration, ISRC)
- 🎨 Responsive, modern UI built with React and Tailwind CSS
- ⚡ Fast and efficient backend powered by Node.js and Express
- 🔌 Modular architecture for easy platform integration

## Tech Stack

### Backend
- **Node.js** with Express
- **Axios** for HTTP requests
- **Spotify Web API** integration
- Modular platform architecture in `/backend/platforms/`

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- Responsive design
- Loading states and error handling

## Prerequisites

- Node.js (v18 or higher)
- Spotify Developer Account ([Sign up here](https://developer.spotify.com/dashboard))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/steph-sabotasan/TuneBridge.git
cd TuneBridge
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your Spotify credentials:
# SPOTIFY_CLIENT_ID=your_client_id
# SPOTIFY_CLIENT_SECRET=your_client_secret
```

#### Getting Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Paste them into your `.env` file

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

### Start Frontend Development Server

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## Usage

1. Open http://localhost:3000 in your browser
2. Select "Spotify" as the source platform
3. Paste a Spotify playlist URL (e.g., `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`)
4. Click "Fetch Playlist"
5. View the playlist tracks with detailed information

## Project Structure

```
TuneBridge/
├── backend/
│   ├── platforms/        # Platform-specific modules
│   │   └── spotify.js    # Spotify API integration
│   ├── routes/           # Express routes
│   │   └── playlist.js   # Playlist endpoints
│   ├── server.js         # Express server setup
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── PlaylistConverter.jsx
│   │   │   └── TrackList.jsx
│   │   ├── services/     # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### `POST /api/playlist/fetch`

Fetch playlist tracks from a streaming platform.

**Request Body:**
```json
{
  "url": "https://open.spotify.com/playlist/...",
  "platform": "spotify"
}
```

**Response:**
```json
{
  "tracks": [
    {
      "name": "Song Title",
      "artists": ["Artist 1", "Artist 2"],
      "album": "Album Name",
      "durationMs": 240000,
      "isrc": "USUM71234567"
    }
  ],
  "count": 1
}
```

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "TuneBridge API is running"
}
```

## Standardized Track Object

All tracks are returned in a standardized format:

- **name** (string): Track title
- **artists** (array): List of artist names
- **album** (string): Album name
- **durationMs** (number): Track duration in milliseconds
- **isrc** (string | null): International Standard Recording Code

## Future Enhancements

- [ ] Apple Music API integration
- [ ] YouTube Music support
- [ ] Playlist creation on target platform
- [ ] Batch conversion
- [ ] User authentication
- [ ] Save conversion history
- [ ] Download playlist as CSV/JSON

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.