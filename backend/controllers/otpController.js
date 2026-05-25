const prisma = require('../lib/prisma');
const { sendOtpEmail } = require('../services/emailService');

// Generates a random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/otp/send
// Body: { email }
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Delete any existing OTP for this email (so only one OTP is valid at a time)
    await prisma.otp.deleteMany({ where: { email } });

    // Save new OTP to database
    await prisma.otp.create({ data: { email, otp, expiresAt } });

    // Send OTP via Brevo email
    const sent = await sendOtpEmail(email, otp);

    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/otp/verify
// Body: { email, otp }
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find the OTP record for this email
    const record = await prisma.otp.findFirst({ where: { email } });

    if (!record) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }

    // Check if OTP has expired
    if (record.expiresAt < new Date()) {
      await prisma.otp.deleteMany({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // OTP is correct — delete it so it can't be reused
    await prisma.otp.deleteMany({ where: { email } });

    res.json({ message: 'OTP verified successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { sendOtp, verifyOtp };
