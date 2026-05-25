const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma');

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name  = profile.displayName;

      // Check if user already exists
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // New user — create with student role and free profile
        user = await prisma.user.create({
          data: {
            name,
            email,
            password: '',   // no password for Google users
            role: 'student',
            studentProfile: { create: {} },
          },
        });
      }

      // Attach google profile data so callback route can use it
      if (!user) {
        return done(null, { email, name, password: '' });
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

module.exports = passport;
