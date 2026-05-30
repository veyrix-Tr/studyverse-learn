const express  = require('express');
const cors     = require('cors');
const session  = require('express-session');
const passport = require('./config/passport');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

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

const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

const facultyRoutes = require('./routes/facultyRoutes');
app.use('/api/faculty', facultyRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const fileRoutes = require('./routes/fileRoutes');
app.use('/api/files', fileRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
