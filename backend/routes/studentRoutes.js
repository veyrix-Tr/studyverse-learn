const express  = require('express');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/student/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        studentProfile: {
          select: {
            plan: true, examTarget: true, targetYear: true,
            grade: true, planEndDate: true,
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

// GET /api/student/scores
router.get('/scores', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json({ weeks: [] });

    const rows = await prisma.weeklyScore.findMany({
      where: { studentId: profile.id },
      orderBy: { weekNumber: 'asc' },
    });

    // Group by weekNumber and aggregate
    const map = {};
    for (const r of rows) {
      if (!map[r.weekNumber]) {
        map[r.weekNumber] = { weekNumber: r.weekNumber, totalScore: 0, totalPossible: 0, testDate: r.testDate, subjects: [] };
      }
      map[r.weekNumber].totalScore += r.score;
      map[r.weekNumber].totalPossible += r.totalMarks;
      map[r.weekNumber].subjects.push({ subject: r.subject, score: r.score, totalMarks: r.totalMarks });
    }

    const weeks = Object.values(map).map(w => ({
      weekNumber: w.weekNumber,
      avgPct: w.totalPossible > 0 ? Math.round((w.totalScore / w.totalPossible) * 100) : 0,
      subjects: w.subjects,
      testDate: w.testDate,
    }));

    res.json({ weeks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

// GET /api/student/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile || profile.plan !== 'premium') return res.json([]);

    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];
    if (!profile.grade || subjects.length === 0) return res.json([]);

    const sessions = await prisma.session.findMany({
      where: { grade: profile.grade, subject: { in: subjects } },
      include: { faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(sessions.map(s => ({
      id: s.id,
      title: s.title,
      subject: s.subject,
      grade: s.grade,
      dayOfWeek: s.dayOfWeek,
      scheduledAt: s.scheduledAt,
      duration: s.duration,
      facultyName: s.faculty.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/student/doubts
router.get('/doubts', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json([]);

    const doubts = await prisma.doubt.findMany({
      where: { studentId: profile.id },
      include: { faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(doubts.map(d => ({
      id: d.id,
      question: d.question,
      answer: d.answer,
      answeredAt: d.answeredAt,
      createdAt: d.createdAt,
      facultyName: d.faculty?.user?.name || 'Faculty',
      subject: d.faculty?.subject || 'General',
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

module.exports = router;
