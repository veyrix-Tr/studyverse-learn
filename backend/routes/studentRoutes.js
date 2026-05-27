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

// POST /api/student/doubts
router.post('/doubts', requireAuth, async (req, res) => {
  try {
    const { question, subject } = req.body;
    if (!question || !question.trim()) return res.status(400).json({ error: 'Question is required' });
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ error: 'Student not found' });

    const validSubjects = EXAM_SUBJECTS[profile.examTarget] || [];
    if (!validSubjects.includes(subject)) return res.status(400).json({ error: 'Invalid subject for your exam' });

    // Find faculty who teaches this subject for this student's grade
    const session = await prisma.session.findFirst({
      where: { subject, grade: profile.grade },
      select: { facultyId: true },
    });
    if (!session) return res.status(400).json({ error: 'No faculty found for this subject and grade' });

    const doubt = await prisma.doubt.create({
      data: { question: question.trim(), subject, studentId: profile.id, facultyId: session.facultyId },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    res.json({
      id: doubt.id,
      question: doubt.question,
      subject: doubt.subject,
      answer: doubt.answer,
      answeredAt: doubt.answeredAt,
      createdAt: doubt.createdAt,
      facultyName: doubt.faculty.user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post doubt' });
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
      subject: d.subject || d.faculty?.subject || 'General',
      answer: d.answer,
      answeredAt: d.answeredAt,
      createdAt: d.createdAt,
      facultyName: d.faculty?.user?.name || 'Faculty',
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// GET /api/student/notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json([]);
    const messages = await prisma.adminMessage.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages.map(m => ({ id: m.id, content: m.content, type: m.type, readAt: m.readAt, createdAt: m.createdAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/student/notifications/:id/read
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ error: 'Not found' });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminMessage.updateMany({ where: { id, studentId: profile.id }, data: { readAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

module.exports = router;
