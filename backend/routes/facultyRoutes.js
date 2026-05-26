const express  = require('express');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/faculty/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        facultyProfile: {
          select: {
            subject: true, department: true, qualification: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
