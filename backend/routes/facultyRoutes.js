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
      subject: d.subject || fp.subject || 'General',
      answer: d.answer,
      answeredAt: d.answeredAt,
      createdAt: d.createdAt,
      studentName: d.student.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// PUT /api/faculty/doubts/:id/answer
router.put('/doubts/:id/answer', requireAuth, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || !answer.trim()) return res.status(400).json({ error: 'Answer text is required' });

    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const doubtId = parseInt(req.params.id);
    if (isNaN(doubtId)) return res.status(400).json({ error: 'Invalid doubt ID' });
    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } });
    if (!doubt || doubt.facultyId !== fp.id) return res.status(404).json({ error: 'Doubt not found' });

    const updated = await prisma.doubt.update({
      where: { id: doubt.id },
      data: { answer: answer.trim(), answeredAt: new Date() },
    });
    res.json({ success: true, answeredAt: updated.answeredAt, answer: updated.answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

module.exports = router;
