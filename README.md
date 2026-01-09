# TuneBridge 🎵

A full-stack application to convert playlists between music streaming platforms. Supports Spotify → YouTube Music conversion with intelligent track matching.

## Features

- 🎧 Fetch playlist tracks from Spotify
- � Convert Spotify tracks to YouTube Music matches
- �📋 Display standardized track information (name, artists, album, duration, ISRC)
- 🎯 Intelligent search using YouTube Data API v3
- 🎨 Responsive, modern UI built with React and Tailwind CSS
- ⚡ Fast and efficient backend powered by Node.js and Express
- 🔌 Modular architecture for easy platform integration

## Tech Stack

### Backend
- **Node.js** with Express
- **Axios** for HTTP requests
- **Spotify Web API** integration
- **YouTube Data API v3** integration via googleapis
- Modular platform architecture in `/backend/platforms/`

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- Responsive design
- Loading states and error handling

## Prerequisites

- Node.js (v18 or higher)
- Spotify Developer Account ([Sign up here](https://developer.spotify.com/dashboard))
- Google Cloud Account with YouTube Data API v3 enabled ([Get started here](https://console.cloud.google.com))

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

# Edit .env and add your API credentials
```

#### Getting Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Paste them into your `.env` file

#### Getting YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable YouTube Data API v3
4. Go to Credentials and create an API Key
5. (Optional but recommended) Restrict the key to YouTube Data API v3
6. Paste the API key into your `.env` file

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

### Fetching Spotify Playlists

1. Open http://localhost:3000 in your browser
2. Select "Spotify" as the source platform
3. Paste a Spotify playlist URL (e.g., `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`)
4. Click "Fetch Playlist"
5. View the playlist tracks with detailed information

### Converting to YouTube Music

Use the API endpoint directly or integrate into your frontend:

```bash
# Example: Convert Spotify tracks to YouTube matches
curl -X POST http://localhost:3001/api/playlist/youtube/convert \
  -H "Content-Type: application/json" \
  -d '{
    "tracks": [
      {
        "name": "Bohemian Rhapsody",
        "artists": ["Queen"],
        "album": "A Night at the Opera"
      }
    ]
  }'
```

## Project Structure

```
TuneBridge/
├── backend/
│   ├── platforms/        # Platform-specific modules
│   │   ├── spotify.js    # Spotify API integration
│   │   └── youtube.js    # YouTube Data API integration
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

### `POST /api/playlist/youtube/convert`

Convert Spotify track data to YouTube Music matches.

**Request Body:**
```json
{
  "tracks": [
    {
      "name": "Bohemian Rhapsody",
      "artists": ["Queen"],
      "album": "A Night at the Opera",
      "durationMs": 354000,
      "isrc": "GBUM71029604"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "original": {
        "name": "Bohemian Rhapsody",
        "artists": ["Queen"],
        "album": "A Night at the Opera",
        "durationMs": 354000,
        "isrc": "GBUM71029604"
      },
      "youtube": {
        "matches": [
          {
            "videoId": "fJ9rUzIMcZQ",
            "title": "Queen – Bohemian Rhapsody (Official Video)",
            "channelTitle": "Queen Official",
            "channelId": "UCiMhD4jzUqG-IgPzUmmytRQ",
            "thumbnail": "https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg",
            "publishedAt": "2008-08-01T09:25:15Z",
            "url": "https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
          }
        ],
        "topMatch": { /* same as first match */ }
      }
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "successRate": "100.0%"
  }
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

## YouTube Integration Notes

### API Quota

YouTube Data API v3 has daily quota limits (default: 10,000 units per day). Each search request costs approximately 100 units. Monitor your usage at [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas).

### Matching Strategy

The current implementation:
1. Searches YouTube using track name + artist names
2. Filters for music category videos
3. Orders by relevance
4. Returns top 5 matches per track
5. Provides the top match as the primary suggestion

### Future OAuth Implementation

The codebase includes a placeholder for OAuth-based playlist creation. This will enable:
- Creating playlists in user's YouTube Music account
- Adding tracks to playlists
- Managing user playlists

## Future Enhancements

- [x] YouTube Music search integration
- [ ] YouTube Music OAuth and playlist creation
- [ ] Apple Music API integration
- [ ] Improved track matching with duration comparison
- [ ] Batch conversion with progress tracking
- [ ] User authentication
- [ ] Save conversion history
- [ ] Download playlist as CSV/JSON
- [ ] Frontend UI for YouTube conversion

## Legal & Compliance

### YouTube Data API Services

TuneBridge uses YouTube Data API Services. By using TuneBridge, you agree to the following:

- [YouTube Terms of Service](https://www.youtube.com/t/terms)
- [Google Privacy Policy](https://policies.google.com/privacy)

### Privacy & Terms

- **Privacy Policy:** Available at `/privacy` when running the application
- **Terms of Service:** Available at `/terms` when running the application

### Contact

For questions, concerns, or inquiries about TuneBridge:

📧 **Email:** [tunebridge.contact@gmail.com](mailto:tunebridge.contact@gmail.com)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
