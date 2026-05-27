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

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

// GET /api/faculty/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.json([]);

    const [sessions, premiumStudents] = await Promise.all([
      prisma.session.findMany({
        where: { facultyId: fp.id },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.studentProfile.findMany({
        where: { plan: 'premium' },
        include: { user: { select: { name: true } } },
      }),
    ]);

    res.json(sessions.map(s => {
      const eligible = premiumStudents.filter(sp =>
        sp.grade === s.grade &&
        (EXAM_SUBJECTS[sp.examTarget] || []).includes(s.subject)
      );
      return {
        id: s.id,
        title: s.title,
        subject: s.subject,
        grade: s.grade,
        dayOfWeek: s.dayOfWeek,
        scheduledAt: s.scheduledAt,
        duration: s.duration,
        enrolledCount: eligible.length,
        enrolledStudents: eligible.map(sp => sp.user.name),
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/faculty/doubts
router.get('/doubts', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.json([]);

    const doubts = await prisma.doubt.findMany({
      where: { facultyId: fp.id },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(doubts.map(d => ({
      id: d.id,
      question: d.question,
      answer: d.answer,
      answeredAt: d.answeredAt,
      createdAt: d.createdAt,
      studentName: d.student.user.name,
      subject: fp.subject,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

module.exports = router;
