const express  = require('express');
const cors     = require('cors');
const passport = require('./config/passport');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Studyverse API is running',
    version: '1.0.0'
  });
});



const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const otpRoutes = require('./routes/otpRoutes');
app.use('/api/otp', otpRoutes);

const { requireAuth, validateUrlUser } = require('./middleware/auth');

const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student/:userId', requireAuth, validateUrlUser, studentRoutes);

const facultyRoutes = require('./routes/facultyRoutes');
app.use('/api/faculty/:userId', requireAuth, validateUrlUser, facultyRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin/:userId', requireAuth, validateUrlUser, adminRoutes);

const fileRoutes = require('./routes/fileRoutes');
app.use('/api/files', fileRoutes);

const cronRoutes = require('./routes/cronRoutes');
app.use('/api/cron', cronRoutes);

// Local dev: run server + node-cron; Vercel imports this file as a module
if (require.main === module) {
  const { startCronJobs } = require('./services/cronService');
  startCronJobs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
