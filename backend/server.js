import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playlistRoutes from './routes/playlist.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/playlist', playlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TuneBridge API is running' });
});

app.listen(PORT, () => {
  console.log(`TuneBridge backend running on port ${PORT}`);
});
