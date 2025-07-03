const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const attemptRoutes = require('./src/routes/attemptRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
dotenv.config();

// Routes
app.get('/', (req, res) => {
  res.send('Quiz API is running');
});

app.use('/auth', authRoutes);
app.use('/quiz', quizRoutes);
app.use('/attempt', attemptRoutes);
app.use('/ai', aiRoutes);

// Start server
app.listen(port, () => {
  console.log(`Quiz API server listening at http://localhost:${port}`);
});
