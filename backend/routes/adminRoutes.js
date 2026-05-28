const express  = require('express');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

// GET /api/admin/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        adminProfile: {
          select: { department: true, isActive: true },
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

// GET /api/admin/students — list all students with scores and faculty
router.get('/students', requireAuth, async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true } },
        weeklyScores: { orderBy: { weekNumber: 'asc' } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const result = await Promise.all(students.map(async s => {
      // Resolve faculty via sessions matching this student's grade + exam subjects
      let facultyName = null;
      if (s.grade && s.examTarget) {
        const subjects = EXAM_SUBJECTS[s.examTarget] || [];
        if (subjects.length > 0) {
          const session = await prisma.session.findFirst({
            where: { grade: s.grade, subject: { in: subjects } },
            include: { faculty: { include: { user: { select: { name: true } } } } },
          });
          if (session) facultyName = session.faculty.user.name;
        }
      }

      // Aggregate score and totalMarks per week
      const scoreMap = {};
      const totalMap = {};
      for (const sc of s.weeklyScores) {
        scoreMap[sc.weekNumber] = (scoreMap[sc.weekNumber] || 0) + sc.score;
        totalMap[sc.weekNumber] = (totalMap[sc.weekNumber] || 0) + sc.totalMarks;
      }
      const weeks = Object.keys(scoreMap).map(Number).sort((a, b) => a - b);
      const lastWeek       = weeks[weeks.length - 1] ?? null;
      const lastScore      = lastWeek !== null ? Math.round(scoreMap[lastWeek]) : null;
      const lastTotalMarks = lastWeek !== null ? Math.round(totalMap[lastWeek])  : null;

      return {
        id: s.id, userId: s.userId,
        name: s.user.name,
        plan: s.plan, examTarget: s.examTarget, grade: s.grade,
        diagnosticScore: s.diagnosticScore,
        facultyName,
        lastWeek, lastScore, lastTotalMarks,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/admin/admins — list all admin accounts (superadmin only)
router.get('/admins', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        adminProfile: { select: { department: true, isActive: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// PUT /api/admin/admins/:id/deactivate — deactivate an admin account (superadmin only)
router.put('/admins/:id/deactivate', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId: id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate' });
  }
});

// PUT /api/admin/admins/:id/reactivate — reactivate an admin account (superadmin only)
router.put('/admins/:id/reactivate', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId: id }, data: { isActive: true } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate' });
  }
});

// POST /api/admin/messages — send message to one or all students
router.post('/messages', requireAuth, async (req, res) => {
  try {
    const { studentId, content, type } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required' });

    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.user.id } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    if (studentId === 'all') {
      const students = await prisma.studentProfile.findMany({ select: { id: true } });
      await prisma.adminMessage.createMany({
        data: students.map(s => ({ content: content.trim(), type: type || 'Announcement', studentId: s.id, adminId: ap.id })),
      });
      return res.json({ success: true, sent: students.length });
    }

    const sid = parseInt(studentId);
    if (isNaN(sid)) return res.status(400).json({ error: 'Invalid student ID' });
    const msg = await prisma.adminMessage.create({
      data: { content: content.trim(), type: type || 'Announcement', studentId: sid, adminId: ap.id },
    });
    res.json({ success: true, id: msg.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
