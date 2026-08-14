const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, examTarget, targetYear, grade, phone } = req.body;

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

    // Block deprecated plans (apex only)
    const plan = user.studentProfile?.plan;
    if (plan === 'apex') {
      return res.status(403).json({
        error: 'Plan deprecated',
        message: `The Apex plan is no longer available. Please contact support to upgrade to Spark or Anchor.`,
        deprecatedPlan: plan,
        availablePlans: ['spark', 'anchor']
      });
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

module.exports = { register, login, checkEmail };
