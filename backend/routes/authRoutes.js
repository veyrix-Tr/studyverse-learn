const express  = require('express');
const router   = express.Router();
const passport = require('passport');
const jwt      = require('jsonwebtoken');
const { register, login, checkEmail } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail);

// Step 1 — redirect user to Google login page
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2 — Google redirects back here after login
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google-failed` }),
  async (req, res) => {
    try {
      const prisma  = require('../lib/prisma');
      const profile = req.user;

      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
        include: { studentProfile: true },
      });

      // ── Existing user → login directly ──────────────────
      if (existingUser && existingUser.password !== '') {
        const token = jwt.sign(
          { id: existingUser.id, role: existingUser.role, plan: existingUser.studentProfile?.plan || null },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        const plan = existingUser.studentProfile?.plan || 'free';
        const user = encodeURIComponent(JSON.stringify({
          id:    existingUser.id,
          name:  existingUser.name,
          email: existingUser.email,
          role:  existingUser.role,
          plan,
        }));

        return res.redirect(`${process.env.CLIENT_URL}/auth/google?token=${token}&user=${user}`);
      }

      // ── New user → send to register with pre-filled data ─
      // Delete the empty user passport created (no password)
      if (existingUser) {
        await prisma.studentProfile.deleteMany({ where: { userId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
      }

      const name  = encodeURIComponent(profile.name);
      const email = encodeURIComponent(profile.email);
      res.redirect(`${process.env.CLIENT_URL}/register?google=true&name=${name}&email=${email}`);

    } catch (error) {
      console.error(error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=google-failed`);
    }
  }
);

module.exports = router;
