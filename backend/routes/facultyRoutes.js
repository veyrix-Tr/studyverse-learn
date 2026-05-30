const express    = require('express');
const router     = express.Router();
const prisma     = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

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
        note: s.note || null,
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
      helpful: d.helpful ?? null,
      createdAt: d.createdAt,
      studentName: d.student.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// GET /api/faculty/students
// Students whose grade + exam curriculum includes this faculty's subject (via sessions)
router.get('/students', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp || !fp.subject) return res.json([]);

    // Grades this faculty teaches for their subject
    const gradeSessions = await prisma.session.findMany({
      where: { facultyId: fp.id, subject: fp.subject },
      select: { grade: true },
      distinct: ['grade'],
    });
    const grades = gradeSessions.map(s => s.grade);
    if (grades.length === 0) return res.json([]);

    // Premium students in those grades whose exam curriculum includes this faculty's subject
    const students = await prisma.studentProfile.findMany({
      where: { grade: { in: grades }, plan: 'premium' },
      include: { user: { select: { name: true } } },
    });
    const relevant = students.filter(sp =>
      (EXAM_SUBJECTS[sp.examTarget] || []).includes(fp.subject)
    );

    const now = new Date();
    const result = await Promise.all(relevant.map(async (sp) => {
      const scores = await prisma.weeklyScore.findMany({
        where: { studentId: sp.id, subject: fp.subject },
        orderBy: { testDate: 'desc' },
        take: 4,
      });
      const nextSession = await prisma.session.findFirst({
        where: { facultyId: fp.id, grade: sp.grade, subject: fp.subject, scheduledAt: { gt: now } },
        orderBy: { scheduledAt: 'asc' },
      });
      return {
        id: sp.id,
        name: sp.user.name,
        examTarget: sp.examTarget,
        targetYear: sp.targetYear,
        grade: sp.grade,
        plan: sp.plan,
        latestScore: scores[0] ? { score: scores[0].score, totalMarks: scores[0].totalMarks, testDate: scores[0].testDate, weekNumber: scores[0].weekNumber } : null,
        allScores: scores.map(s => ({ score: s.score, totalMarks: s.totalMarks, testDate: s.testDate, weekNumber: s.weekNumber })),
        nextSession: nextSession ? { scheduledAt: nextSession.scheduledAt, title: nextSession.title } : null,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /api/faculty/sessions/:id/note
router.post('/sessions/:id/note', requireAuth, async (req, res) => {
  try {
    const { note } = req.body;
    if (note === undefined) return res.status(400).json({ error: 'Note text is required' });

    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid session ID' });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.facultyId !== fp.id) return res.status(404).json({ error: 'Session not found' });

    const trimmedNote = note.trim() || null;
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { note: trimmedNote },
    });

    // Notify eligible students if a note was actually set
    if (trimmedNote) {
      const students = await prisma.studentProfile.findMany({
        where: { grade: session.grade, plan: 'premium' },
      });
      const eligible = students.filter(sp =>
        (EXAM_SUBJECTS[sp.examTarget] || []).includes(session.subject)
      );
      if (eligible.length > 0) {
        // Delete old notification for this session (so we don't pile up duplicates on edits)
        await prisma.facultyNotification.deleteMany({
          where: { sessionId, facultyId: fp.id },
        });
        await prisma.facultyNotification.createMany({
          data: eligible.map(sp => ({
            content: `${fp.user.name} added a note for "${session.title}": ${trimmedNote.length > 80 ? trimmedNote.slice(0, 80) + '…' : trimmedNote}`,
            type: 'Session Note',
            studentId: sp.id,
            facultyId: fp.id,
            sessionId,
          })),
        });
      }
    }

    res.json({ success: true, note: updated.note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// POST /api/faculty/sessions/:id/remind
router.post('/sessions/:id/remind', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid session ID' });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.facultyId !== fp.id) return res.status(404).json({ error: 'Session not found' });

    const students = await prisma.studentProfile.findMany({
      where: { grade: session.grade, plan: 'premium' },
    });
    const eligible = students.filter(sp =>
      (EXAM_SUBJECTS[sp.examTarget] || []).includes(session.subject)
    );
    if (eligible.length === 0) return res.json({ success: true, notified: 0 });

    const scheduledAt = new Date(session.scheduledAt);
    const dateStr = scheduledAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Delete previous reminders for this session to avoid duplicates
    await prisma.facultyNotification.deleteMany({
      where: { sessionId, facultyId: fp.id, type: 'Reminder' },
    });
    await prisma.facultyNotification.createMany({
      data: eligible.map(sp => ({
        content: `Reminder from ${fp.user.name}: "${session.title}" is scheduled on ${dateStr} at ${timeStr}. Be prepared!`,
        type: 'Reminder',
        studentId: sp.id,
        facultyId: fp.id,
        sessionId,
      })),
    });

    res.json({ success: true, notified: eligible.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// POST /api/faculty/broadcast
router.post('/broadcast', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!fp || !fp.subject) return res.status(403).json({ error: 'Not a faculty member' });

    // Find all eligible premium students (same logic as /students)
    const gradeSessions = await prisma.session.findMany({
      where: { facultyId: fp.id, subject: fp.subject },
      select: { grade: true },
      distinct: ['grade'],
    });
    const grades = gradeSessions.map(s => s.grade);
    if (grades.length === 0) return res.json({ success: true, notified: 0 });

    const students = await prisma.studentProfile.findMany({
      where: { grade: { in: grades }, plan: 'premium' },
    });
    const eligible = students.filter(sp =>
      (EXAM_SUBJECTS[sp.examTarget] || []).includes(fp.subject)
    );
    if (eligible.length === 0) return res.json({ success: true, notified: 0 });

    await prisma.facultyNotification.createMany({
      data: eligible.map(sp => ({
        content: `${fp.user.name}: ${message.trim()}`,
        type: 'Announcement',
        studentId: sp.id,
        facultyId: fp.id,
        sessionId: null,
      })),
    });

    res.json({ success: true, notified: eligible.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// POST /api/faculty/doubts/:id/discuss
router.post('/doubts/:id/discuss', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const doubtId = parseInt(req.params.id);
    if (isNaN(doubtId)) return res.status(400).json({ error: 'Invalid doubt ID' });

    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      include: { student: true },
    });
    if (!doubt || doubt.facultyId !== fp.id) return res.status(404).json({ error: 'Doubt not found' });

    const nextSession = await prisma.session.findFirst({
      where: { facultyId: fp.id, subject: doubt.subject, grade: doubt.student.grade, scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: 'asc' },
    });

    const dateStr = nextSession
      ? new Date(nextSession.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      : null;

    await prisma.facultyNotification.create({
      data: {
        content: `${fp.user.name} will address your ${doubt.subject || 'General'} doubt in the ${dateStr ? `session on ${dateStr}` : 'next session'}: "${doubt.question.length > 60 ? doubt.question.slice(0, 60) + '…' : doubt.question}"`,
        type: 'Announcement',
        studentId: doubt.studentId,
        facultyId: fp.id,
        sessionId: nextSession?.id || null,
      },
    });

    res.json({ success: true, sessionDate: dateStr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark for discussion' });
  }
});

// PUT /api/faculty/doubts/:id/answer
router.put('/doubts/:id/answer', requireAuth, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || !answer.trim()) return res.status(400).json({ error: 'Answer text is required' });

    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const doubtId = parseInt(req.params.id);
    if (isNaN(doubtId)) return res.status(400).json({ error: 'Invalid doubt ID' });
    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } });
    if (!doubt || doubt.facultyId !== fp.id) return res.status(404).json({ error: 'Doubt not found' });

    const updated = await prisma.doubt.update({
      where: { id: doubt.id },
      data: { answer: answer.trim(), answeredAt: new Date(), helpful: null },
    });

    // Notify student
    await prisma.facultyNotification.create({
      data: {
        content: `${fp.user.name} answered your ${doubt.subject || 'General'} doubt: "${doubt.question.length > 60 ? doubt.question.slice(0, 60) + '…' : doubt.question}"`,
        type: 'Doubt Answered',
        studentId: doubt.studentId,
        facultyId: fp.id,
        sessionId: null,
      },
    });

    res.json({ success: true, answeredAt: updated.answeredAt, answer: updated.answer, helpful: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// POST /api/faculty/resources — submit a resource (URL from Cloudinary)
router.post('/resources', requireAuth, async (req, res) => {
  try {
    const { title, description, subject, grade, type, cloudinaryUrl, cloudinaryId } = req.body;
    if (!title || !subject || !grade || !type || !cloudinaryUrl || !cloudinaryId)
      return res.status(400).json({ error: 'Missing required fields' });

    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const resource = await prisma.resource.create({
      data: { title, description: description || null, subject, grade, type, cloudinaryUrl, cloudinaryId, facultyId: fp.id },
    });

    res.json({ success: true, resource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit resource' });
  }
});

// GET /api/faculty/resources — faculty sees their own resources
router.get('/resources', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.json([]);

    const resources = await prisma.resource.findMany({
      where: { facultyId: fp.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// DELETE /api/faculty/resources/:id — delete own pending or declined resource
router.delete('/resources/:id', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.facultyId !== fp.id)
      return res.status(404).json({ error: 'Resource not found' });
    if (resource.status === 'approved')
      return res.status(400).json({ error: 'Cannot delete an approved resource' });

    // Best-effort Cloudinary deletion (don't fail the request if it errors)
    try {
      await cloudinary.uploader.destroy(resource.cloudinaryId, { resource_type: 'image' });
    } catch (_) {}

    await prisma.resource.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

module.exports = router;
