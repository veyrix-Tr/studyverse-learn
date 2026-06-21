const express  = require('express');
const router   = express.Router({ mergeParams: true });
const prisma   = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const QUESTION_BANK_TYPES = ['MCQ Bank', 'Previous Year Papers', 'Practice Set'];

// GET /api/admin/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
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
        parentFeedback: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { rating: true, comment: true, createdAt: true },
        },
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
        diagnosticTakenAt: s.diagnosticTakenAt,
        facultyName,
        lastWeek, lastScore, lastTotalMarks,
        latestFeedback: s.parentFeedback[0] || null,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/admin/faculty — list all faculty with session stats and ratings
router.get('/faculty', requireAuth, async (req, res) => {
  try {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);
    const faculty = await prisma.facultyProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        sessions: {
          select: { id: true, subject: true, grade: true, scheduledAt: true },
        },
        weeklyReports: {
          select: { overallRating: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const result = faculty.map(f => {
      const ratings = f.weeklyReports.map(r => r.overallRating).filter(Boolean);
      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;
      const recentSessions = f.sessions.filter(s => new Date(s.scheduledAt) >= fourWeeksAgo);
      const sessionsPerWeek = Math.round(recentSessions.length / 4) || 0;
      const uniqueSubjects = [...new Set(f.sessions.map(s => s.subject))];
      return {
        id: f.id,
        userId: f.userId,
        name: f.user.name,
        email: f.user.email,
        subject: f.subject,
        department: f.department,
        qualification: f.qualification,
        subjects: uniqueSubjects.length > 0 ? uniqueSubjects : [f.subject].filter(Boolean),
        sessionsPerWeek,
        totalSessions: f.sessions.length,
        avgRating,
        reportCount: f.weeklyReports.length,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// POST /api/admin/faculty — create a new faculty member
router.post('/faculty', requireAuth, async (req, res) => {
  try {
    const { name, subject, qualification, department } = req.body;
    if (!name || !subject) return res.status(400).json({ error: 'name and subject required' });

    // Auto-generate email and password
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    const baseEmail = `${slug}@studyverse.faculty`;
    const password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!';

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: baseEmail } });
    const email = existing
      ? `${slug}.${Date.now().toString(36)}@studyverse.faculty`
      : baseEmail;

    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'faculty',
        facultyProfile: {
          create: {
            subject,
            qualification: qualification || null,
            department: department || 'Science',
          },
        },
      },
      include: { facultyProfile: true },
    });

    res.json({
      success: true,
      faculty: {
        id: user.facultyProfile.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        subject,
        qualification: qualification || null,
      },
      credentials: { email, password },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

// DELETE /api/admin/student/:studentUserId/diagnostic — reset diagnostic lock (admin only)
router.delete('/student/:studentUserId/diagnostic', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.studentUserId } });
    if (!profile) return res.status(404).json({ error: 'Student not found' });
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { diagnosticScore: null, diagnosticTakenAt: null, diagnosticAnswers: null },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset diagnostic' });
  }
});

// GET /api/admin/student/:studentUserId/diagnostic — diagnostic digest for a student
router.get('/student/:studentUserId/diagnostic', requireAuth, async (req, res) => {
  try {
    const { generateStudyPlan } = require('../lib/studyPlanAlgorithm');
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.studentUserId },
      select: {
        id: true, diagnosticAnswers: true,
        diagnosticScore: true, diagnosticTakenAt: true,
        plan: true,
      },
    });
    if (!profile?.diagnosticAnswers)
      return res.status(404).json({ error: 'No diagnostic' });

    const a = profile.diagnosticAnswers;

    // Latest weekly scores for live plan
    const weeklyScores = await prisma.weeklyScore.findMany({
      where: { studentId: profile.id }, orderBy: { testDate: 'desc' },
    });
    const SUBJ_MAP = { 'maths':'Mathematics','math':'Mathematics','bio':'Biology','biology':'Biology','physics':'Physics','chemistry':'Chemistry','mathematics':'Mathematics' };
    let liveScores = null;
    if (weeklyScores.length > 0) {
      const latest = {};
      for (const s of weeklyScores) {
        const subj = SUBJ_MAP[s.subject.trim().toLowerCase()] || s.subject.trim();
        if (!latest[subj]) latest[subj] = Math.round((s.score / s.totalMarks) * 100);
      }
      liveScores = latest;
    }

    const plan = generateStudyPlan(a, liveScores, profile.diagnosticTakenAt);

    res.json({
      score: profile.diagnosticScore,
      takenAt: profile.diagnosticTakenAt,
      _userId: req.params.studentUserId,
      digest: {
        exam_target:       a.exam_target,
        current_class:     a.current_class,
        study_hours:       a.study_hours,
        syllabus_coverage: a.syllabus_coverage,
        has_coaching:      a.has_coaching,
        target_score:      a.target_score,
        target_rank:       a.target_rank,
        mock_scores:       [a.mock_score_1, a.mock_score_2, a.mock_score_3].filter(Boolean),
        hardest_subject:   a.hardest_subject,
        weak_topics: [a.phy_loss, a.chem_weak, a.math_weak, a.bio_weak, a.dreaded_chapters]
          .filter(Boolean).join(', '),
        review_mistakes:   a.review_mistakes,
        same_day_revision: a.same_day_revision,
        time_mgmt:         a.time_mgmt,
      },
      plan: {
        subjectFocus: plan.subjectFocus.map(s => ({
          subject: s.subject, scorePct: s.scorePct,
          urgency: s.urgency, urgencyColor: s.urgencyColor,
          hoursPerWeek: s.hoursPerWeek, reason: s.reason,
        })),
        thisWeek: plan.thisWeek.slice(0, 3),
        habits:   plan.habits,
        mockTrend: plan.mockTrend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch diagnostic' });
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
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId }, data: { isActive: false } });
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
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId }, data: { isActive: true } });
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

    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
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

// GET /api/admin/messages — sent messages (deduplicated broadcasts)
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const msgs = await prisma.adminMessage.findMany({
      where: { adminId: ap.id },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Group by content+type+minute to collapse broadcasts into one row
    const groups = {};
    for (const m of msgs) {
      const minute = new Date(m.createdAt).toISOString().slice(0, 16);
      const key = `${minute}|${m.type}|${m.content}`;
      if (!groups[key]) groups[key] = { id: m.id, content: m.content, type: m.type, createdAt: m.createdAt, count: 0 };
      groups[key].count++;
    }

    const result = Object.values(groups)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30)
      .map(g => ({ id: g.id, content: g.content, type: g.type, createdAt: g.createdAt, recipient: g.count > 1 ? 'All Students' : msgs.find(m => m.id === g.id)?.student?.user?.name || 'Student' }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/admin/resources — all resources pending/approved/declined
router.get('/resources', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const resources = await prisma.resource.findMany({
      include: { faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(resources.map(r => ({
      id: r.id, title: r.title, description: r.description,
      subject: r.subject, grade: r.grade, type: r.type,
      cloudinaryUrl: r.cloudinaryUrl, status: r.status,
      declineReason: r.declineReason, createdAt: r.createdAt, approvedAt: r.approvedAt,
      facultyName: r.faculty.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// PUT /api/admin/resources/:id/approve
router.put('/resources/:id/approve', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const resource = await prisma.resource.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: ap.id },
    });

    // Notify all students whose exam target includes this resource's subject
    const allStudents = await prisma.studentProfile.findMany({
      select: { id: true, examTarget: true },
    });
    const relevantStudents = allStudents.filter(s => {
      const subjects = EXAM_SUBJECTS[s.examTarget] || [];
      return subjects.includes(resource.subject);
    });
    if (relevantStudents.length > 0) {
      await prisma.facultyNotification.createMany({
        data: relevantStudents.map(s => ({
          content: `New ${resource.type} available: "${resource.title}" (${resource.subject})`,
          type:      QUESTION_BANK_TYPES.includes(resource.type) ? 'New Question Bank' : 'New Resource',
          studentId: s.id,
          facultyId: resource.facultyId,
        })),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve resource' });
  }
});

// PUT /api/admin/resources/:id/decline
router.put('/resources/:id/decline', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    await prisma.resource.update({
      where: { id },
      data: { status: 'declined', declineReason: reason || null },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline resource' });
  }
});

// ── Weekly Parent Reports ────────────────────────────────────────────────────

// GET /api/admin/reports — all submitted/approved/rejected/sent reports
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const reports = await prisma.weeklyReport.findMany({
      where: { status: { in: ['submitted', 'approved', 'rejected', 'sent'] } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        faculty: { include: { user: { select: { name: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(reports.map(r => ({
      id: r.id,
      weekNumber: r.weekNumber,
      weekStartDate: r.weekStartDate,
      overallRating: r.overallRating,
      strengths: r.strengths,
      improvements: r.improvements,
      mentorNote: r.mentorNote,
      nextWeekPlan: r.nextWeekPlan,
      testScore: r.testScore,
      testTotalMarks: r.testTotalMarks,
      testSubject: r.testSubject,
      status: r.status,
      rejectedReason: r.rejectedReason,
      submittedAt: r.submittedAt,
      approvedAt: r.approvedAt,
      sentAt: r.sentAt,
      studentId: r.studentId,
      studentName: r.student.user.name,
      facultyId: r.facultyId,
      facultyName: r.faculty.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PUT /api/admin/reports/:id/approve
router.put('/reports/:id/approve', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const report = await prisma.weeklyReport.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'submitted') return res.status(400).json({ error: 'Only submitted reports can be approved' });

    const updated = await prisma.weeklyReport.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: ap.id },
    });

    res.json({ success: true, report: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

// PUT /api/admin/reports/:id/reject
router.put('/reports/:id/reject', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const report = await prisma.weeklyReport.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'submitted') return res.status(400).json({ error: 'Only submitted reports can be rejected' });

    const updated = await prisma.weeklyReport.update({
      where: { id },
      data: { status: 'rejected', rejectedReason: reason || null },
    });

    res.json({ success: true, report: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject report' });
  }
});

// POST /api/admin/reports/approve-all — approve all submitted reports for this admin
router.post('/reports/approve-all', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const result = await prisma.weeklyReport.updateMany({
      where: { status: 'submitted' },
      data: { status: 'approved', approvedAt: new Date(), approvedById: ap.id },
    });

    res.json({ success: true, approved: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve reports' });
  }
});

// POST /api/admin/reports/send — mark approved reports as sent (called by cron or manually)
router.post('/reports/send', requireAuth, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const approved = await prisma.weeklyReport.findMany({
      where: { status: 'approved' },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    if (approved.length === 0) return res.json({ success: true, sent: 0 });

    const now = new Date();
    await prisma.$transaction([
      prisma.weeklyReport.updateMany({
        where: { status: 'approved' },
        data: { status: 'sent', sentAt: now },
      }),
      prisma.facultyNotification.createMany({
        data: approved.map(r => ({
          content: `Your weekly report from ${r.faculty.user.name} for Week ${r.weekNumber % 100} is now available.`,
          type: 'Weekly Report',
          studentId: r.studentId,
          facultyId: r.facultyId,
        })),
      }),
    ]);

    res.json({ success: true, sent: approved.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reports' });
  }
});

module.exports = router;
