import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playlistRoutes from './routes/playlist.js';
import { generalLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Routes with specific rate limiters
app.use('/api/playlist', playlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TuneBridge API is running' });
});

app.listen(PORT, () => {
  console.log(`TuneBridge backend running on port ${PORT}`);
  console.log('🛡️  Rate limiting enabled:');
  console.log('   - Conversions: 10 per 15 minutes per IP');
  console.log('   - Fetches: 20 per 15 minutes per IP');
  console.log('   - General: 100 requests per 15 minutes per IP');
});
