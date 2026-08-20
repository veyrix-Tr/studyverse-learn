const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { sendOtpEmail } = require('../services/emailService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, examTarget, targetYear, grade, city, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'student',
        studentProfile: {
          create: {
            examTarget:  examTarget  || null,
            targetYear:  targetYear  || null,
            grade:       grade       || null,
            city:        city        || null,
            parentPhone: phone       || null,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json({ message: 'Account created successfully', user });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find user by email, include student profile to know free/premium
    const user = await prisma.user.findUnique({
      where: { email },
      include: { studentProfile: true, adminProfile: true },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block deactivated admin accounts
    if ((user.role === 'admin' || user.role === 'superadmin') && user.adminProfile?.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your superadmin.' });
    }

    // Create a JWT token with user id, role, and plan inside
    const token = jwt.sign(
      { id: user.id, role: user.role, plan: user.studentProfile?.plan || null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.studentProfile?.plan || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// POST /api/auth/check-email
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    res.json({ exists: !!user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ exists: false });
  }
};

// POST /api/auth/refresh
// Re-issues the JWT from a still-valid token, refreshing the plan claim from the
// current DB value. Used after a payment so the client picks up the upgraded plan
// without forcing the user to log out and log back in.
const refresh = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign(
      { id: user.id, role: user.role, plan: user.studentProfile?.plan || null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Session refreshed',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.studentProfile?.plan || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
};

// POST /api/auth/forgot-password
// Body: { email }
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account is registered with this email.' });
    }

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otp.deleteMany({ where: { email } });
    await prisma.otp.create({ data: { email, otp, expiresAt } });

    const sent = await sendOtpEmail(email, otp, 'reset');
    if (!sent) return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/auth/verify-otp
// Body: { email, otp } — checks the OTP WITHOUT consuming it, so the UI can
// reveal the new-password fields only after the correct OTP is entered.
// The actual reset (resetPassword) still re-validates and consumes the OTP.
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const record = await prisma.otp.findFirst({ where: { email } });
    if (!record) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      await prisma.otp.deleteMany({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/auth/reset-password
// Body: { email, otp, password }
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const record = await prisma.otp.findFirst({ where: { email } });
    if (!record) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      await prisma.otp.deleteMany({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

    // Invalid one-time use only
    await prisma.otp.deleteMany({ where: { email } });

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { register, login, checkEmail, refresh, forgotPassword, verifyOtp, resetPassword };
