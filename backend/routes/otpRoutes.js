const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/otpController');

// POST /api/otp/send   — generates and emails an OTP
// POST /api/otp/verify — checks if OTP is correct
router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

module.exports = router;
