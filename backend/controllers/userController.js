// controllers/userController.js

const prisma = require('../lib/prisma');

// Shared select block — always return the right profile alongside user
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  // password intentionally excluded
  studentProfile: true,
  facultyProfile: true,
  adminProfile: true,
};

// GET /api/users
// Returns all users with their role-specific profile
const getAllUsers = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ select: userSelect });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// POST /api/users
// Creates a user and auto-creates the matching profile based on role
// Body: { name, email, password, role }
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    // Auto-create the right profile based on role
    const profileData = {};
    if (role === 'student')       profileData.studentProfile = { create: {} };
    else if (role === 'faculty')  profileData.facultyProfile = { create: {} };
    else if (role === 'admin')    profileData.adminProfile   = { create: {} };

    const user = await prisma.user.create({
      data: { name, email, password, role, ...profileData },
      select: userSelect,
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

module.exports = { getAllUsers, createUser };
