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
// Preserve the raw request body (used to verify the Cashfree webhook HMAC signature).
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); } }));
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

// Payments — Cashfree
// Public config endpoint (prices + mode) so the UI matches the server.
const { webhook, paymentConfig } = require('./controllers/paymentController');
app.get('/api/payment/config', paymentConfig);

// Protected student-facing payment endpoints (create order / verify).
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment/:userId', requireAuth, validateUrlUser, paymentRoutes);

// Public webhook endpoint for Cashfree to push order events to.
// Body is verbatim JSON; Express is configured below to keep the raw body for
// HMAC signature verification.
app.post('/api/payment/webhook', webhook);

// Local dev: run server + node-cron; Vercel imports this file as a module
if (require.main === module) {
  const { startCronJobs } = require('./services/cronService');
  startCronJobs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
