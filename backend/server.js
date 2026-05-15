const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
// Configured to allow full communication with your Lovable frontend
app.use(cors({
  origin: '*', // Allows access from any port (like Lovable's Vite server)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
// Note: Added '/api' prefix. Lovable's code will likely expect URLs like http://localhost:5000/api/tasks
app.use('/api/tasks', require('./routes/taskRoutes'));
// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Task Management API is running smoothly' });
});

// Error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✨ MongoDB connected successfully');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });