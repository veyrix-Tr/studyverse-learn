const express  = require('express');
const router   = express.Router({ mergeParams: true });
const prisma   = require('../lib/prisma');
const { requireAuth, validateUrlUser } = require('../middleware/auth');
const { getEffectivePlan } = require('../services/planAccessService');
const { generateStudyPlan } = require('../lib/studyPlanAlgorithm');
const zoom     = require('../lib/zoom');

// GET /api/student/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true, name: true, email: true, role: true,
        studentProfile: {
          select: {
            plan: true, examTarget: true, targetYear: true,
            grade: true, planEndDate: true,
            diagnosticScore: true, diagnosticTakenAt: true,
            createdAt: true,
            mentorId: true,
            subjectFaculty: true,
            mentor: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Resolve subjectFaculty IDs → names
    const rawSF = user.studentProfile?.subjectFaculty;
    let resolvedSubjectFaculty = null;
    if (rawSF && typeof rawSF === 'object' && Object.keys(rawSF).length > 0) {
      const ids = [...new Set(Object.values(rawSF).filter(Number.isInteger))];
      const faculties = await prisma.facultyProfile.findMany({
        where: { id: { in: ids } },
        include: { user: { select: { name: true } } },
      });
      const nameMap = Object.fromEntries(faculties.map(f => [f.id, f.user.name]));
      resolvedSubjectFaculty = Object.fromEntries(
        Object.entries(rawSF).map(([subj, id]) => [subj, { id, name: nameMap[id] || null }])
      );
    }

    res.json({ ...user, studentProfile: { ...user.studentProfile, subjectFaculty: resolvedSubjectFaculty } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/student/diagnostic
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

router.post('/diagnostic', requireAuth, async (req, res) => {
  try {
    const { score, answers } = req.body;
    if (typeof score !== 'number' || score < 0 || score > 100)
      return res.status(400).json({ error: 'Invalid score' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not found' });

    if (profile.diagnosticTakenAt) {
      const nextAllowed = new Date(profile.diagnosticTakenAt.getTime() + THREE_MONTHS_MS);
      if (new Date() < nextAllowed)
        return res.status(409).json({ error: 'Diagnostic locked', nextAllowedAt: nextAllowed });
    }

    const now = new Date();
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        diagnosticScore:   Math.round(score),
        diagnosticTakenAt: now,
        diagnosticAnswers: answers || null,
      },
    });

    const nextAllowedAt = new Date(now.getTime() + THREE_MONTHS_MS);
    res.json({ success: true, score: Math.round(score), nextAllowedAt });

    // Notify all admins — fire and forget, don't block the response
    (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { name: true } });
        const admins = await prisma.adminProfile.findMany({ where: { isActive: true }, select: { id: true } });
        if (admins.length && user) {
          await prisma.adminMessage.createMany({
            data: admins.map(a => ({
              content: `${user.name} completed their diagnostic questionnaire (${Math.round(score)}% complete). View their report in the Students tab.`,
              type: 'Diagnostic',
              studentId: profile.id,
              adminId: a.id,
            })),
          });
        }
      } catch { /* non-critical */ }
    })();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save diagnostic' });
  }
});

// POST /api/student/topics/complete — toggle a topic done/undone for the current week
router.post('/topics/complete', requireAuth, async (req, res) => {
  try {
    const { topicName, subject, weekNumber } = req.body;
    if (!topicName || !subject || weekNumber === undefined)
      return res.status(400).json({ error: 'topicName, subject, weekNumber required' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not found' });

    const existing = await prisma.completedTopic.findUnique({
      where: { studentId_topicName_weekNumber: { studentId: profile.id, topicName, weekNumber } },
    });

    if (existing) {
      await prisma.completedTopic.delete({ where: { id: existing.id } });
      res.json({ completed: false });
    } else {
      await prisma.completedTopic.create({ data: { studentId: profile.id, topicName, subject, weekNumber } });
      res.json({ completed: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle topic' });
  }
});

// GET /api/student/study-plan
router.get('/study-plan', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.userId },
      select: {
        id: true,
        diagnosticAnswers: true,
        diagnosticTakenAt: true,
        plan: true,
      },
    });
    if (!profile?.diagnosticAnswers)
      return res.status(404).json({ error: 'No diagnostic data' });

    // Fetch latest weekly test score per subject (Forge plan only — free has none)
    let liveScores = null;
    const weeklyScores = await prisma.weeklyScore.findMany({
      where: { studentId: profile.id },
      orderBy: { testDate: 'desc' },
    });

    if (weeklyScores.length > 0) {
      // Normalise subject names to match algorithm keys (handles Maths/Math → Mathematics, Bio → Biology)
      const SUBJ_MAP = {
        'maths': 'Maths', 'math': 'Maths', 'mathematics': 'Maths',
        'bio': 'Biology', 'biology': 'Biology',
        'physics': 'Physics', 'chemistry': 'Chemistry',
      };
      const latest = {};
      for (const s of weeklyScores) {
        const subj = SUBJ_MAP[s.subject.trim().toLowerCase()] || s.subject.trim();
        if (!latest[subj]) {
          latest[subj] = Math.round((s.score / s.totalMarks) * 100);
        }
      }
      liveScores = latest;
    }

    // Fetch topics completed this week by the student
    const completedTopics = await prisma.completedTopic.findMany({
      where: { studentId: profile.id },
      select: { topicName: true, weekNumber: true },
    });

    const plan = generateStudyPlan(profile.diagnosticAnswers, liveScores, profile.diagnosticTakenAt, completedTopics);
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// GET /api/student/scores
router.get('/scores', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
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
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];

    // Sessions shown to this student: those they're explicitly enrolled in
    // (1:1 via studentId, or group via the SessionStudent roster), plus any
    // legacy broadcast sessions (no roster) matching grade/subject.
    const enrolledWhere = [
      { studentId: profile.id },
      { students: { some: { studentId: profile.id } } },
    ];
    const legacyWhere = (profile.grade && subjects.length)
      ? [{ students: { none: {} }, studentId: null, grade: profile.grade, subject: { in: subjects } }]
      : [];

    const sessions = await prisma.session.findMany({
      where: { OR: [...enrolledWhere, ...legacyWhere] },
      include: {
        faculty: { include: { user: { select: { name: true } } } },
        students: { include: { student: { include: { user: { select: { name: true } } } } } },
      },
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
      note: s.note || null,
      facultyName: s.faculty.user.name,
      enrolledCount: s.students.length || 1,
      enrolledStudents: s.students.length ? s.students.map(ss => ss.student.user.name) : (s.student?.user?.name ? [s.student.user.name] : []),
      hasZoom: !!s.zoomMeetingId,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/student/sessions/:id/zoom-signature — generates a per-join SDK signature for an eligible student
router.post('/sessions/:id/zoom-signature', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not a student' });

    const session = await prisma.session.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { students: { select: { studentId: true } } },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Sessions are 1:1 (studentId) or group (SessionStudent roster). Legacy
    // sessions (no roster, no studentId) fall back to the old grade/subject match.
    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];
    const enrolled = session.studentId === profile.id || session.students.some(x => x.studentId === profile.id);
    const eligible = session.studentId || session.students.length > 0
      ? enrolled
      : (profile.grade === session.grade && subjects.includes(session.subject));
    if (!eligible) return res.status(403).json({ error: 'Not eligible for this session' });

    if (!session.zoomMeetingId) return res.status(400).json({ error: 'This session has no Zoom meeting set up' });

    let livePassword = session.zoomPassword; // fallback if the refresh call fails

    try {
      const meeting = await zoom.getMeeting(session.zoomMeetingId);
      const freshPassword = meeting.password || ''; // live value — may legitimately be empty (no password)
      if (freshPassword !== session.zoomPassword) {
        livePassword = freshPassword;
        session.zoomPassword = freshPassword;
        await prisma.session.update({ where: { id: session.id }, data: { zoomPassword: freshPassword } });
      }
    } catch (err) {
      console.error(`Zoom getMeeting refresh failed for session ${session.id}:`, err.message);
    }

    const signature = zoom.generateSdkSignature({ meetingNumber: session.zoomMeetingId, role: 0 });
    res.json({
      signature,
      meetingNumber: session.zoomMeetingId,
      password: livePassword,
      title: session.title,
      subject: session.subject,
      duration: session.duration,
      scheduledAt: session.scheduledAt,
    });
  } catch (err) {
    if (err instanceof zoom.ZoomConfigError) return res.status(500).json({ error: 'Zoom is not configured on this server yet.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Zoom signature' });
  }
});

// POST /api/student/doubts
router.post('/doubts', requireAuth, async (req, res) => {
  try {
    const { question, subject } = req.body;
    if (!question || !question.trim()) return res.status(400).json({ error: 'Question is required' });
    if (!subject) return res.status(400).json({ error: 'Subject is required' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) return res.status(403).json({ error: 'Student not found' });
    if (!['apex'].includes(getEffectivePlan(profile))) return res.status(403).json({ error: 'Doubt desk is available on the Apex plan only' });

    const validSubjects = EXAM_SUBJECTS[profile.examTarget] || [];
    if (!validSubjects.includes(subject)) return res.status(400).json({ error: 'Invalid subject for your exam' });

    // Find faculty who teaches this subject (one faculty per subject) — looked up
    // directly on FacultyProfile rather than via Session, since Sessions are now
    // only created lazily per-student and may not exist yet for a given subject.
    const faculty = await prisma.facultyProfile.findFirst({
      where: { subject: { equals: subject, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!faculty) return res.status(400).json({ error: 'No faculty found for this subject' });

    const doubt = await prisma.doubt.create({
      data: { question: question.trim(), subject, studentId: profile.id, facultyId: faculty.id },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    // Notify faculty via FacultyAlert
    prisma.facultyAlert.create({
      data: {
        facultyId: faculty.id,
        type: 'Doubt',
        content: `New ${doubt.subject} doubt from ${profile.user?.name || 'a student'}: "${doubt.question.length > 80 ? doubt.question.slice(0, 80) + '…' : doubt.question}"`,
      },
    }).catch(() => {});

    res.json({
      id: doubt.id,
      question: doubt.question,
      subject: doubt.subject,
      answer: doubt.answer,
      answeredAt: doubt.answeredAt,
      helpful: doubt.helpful,
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
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
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
      helpful: d.helpful ?? null,
      createdAt: d.createdAt,
      facultyName: d.faculty?.user?.name || 'Faculty',
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// PUT /api/student/doubts/:id/helpful
router.put('/doubts/:id/helpful', requireAuth, async (req, res) => {
  try {
    const { helpful } = req.body;
    if (typeof helpful !== 'boolean') return res.status(400).json({ error: 'helpful must be a boolean' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not found' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const doubt = await prisma.doubt.findUnique({ where: { id } });
    if (!doubt || doubt.studentId !== profile.id) return res.status(404).json({ error: 'Doubt not found' });
    if (!doubt.answeredAt) return res.status(400).json({ error: 'Doubt not yet answered' });

    await prisma.doubt.update({ where: { id }, data: { helpful } });
    res.json({ success: true, helpful });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark helpful' });
  }
});

// GET /api/student/notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    // FacultyNotification relevant to all paid plans (Forge, Apex, Anchor have assigned faculty)
    const hasFaculty = ['forge', 'apex', 'anchor'].includes(getEffectivePlan(profile));

    // Types that are admin-only — never shown in student notification feed
    const ADMIN_ONLY_TYPES = ['Session Request'];
    // Content prefixes for system-generated messages that are also admin-only
    const SYSTEM_CONTENT_PREFIXES = [' submitted their daily report', ' completed their diagnostic'];

    const [adminMsgs, facultyNotifs] = await Promise.all([
      prisma.adminMessage.findMany({
        where: { studentId: profile.id, type: { notIn: ADMIN_ONLY_TYPES } },
        orderBy: { createdAt: 'desc' },
      }),
      hasFaculty
        ? prisma.facultyNotification.findMany({ where: { studentId: profile.id }, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),
    ]);

    const studentAdminMsgs = adminMsgs.filter(m =>
      !SYSTEM_CONTENT_PREFIXES.some(prefix => m.content.includes(prefix))
    );

    const merged = [
      ...studentAdminMsgs.map(m => ({ id: `a-${m.id}`, content: m.content, type: m.type, readAt: m.readAt, createdAt: m.createdAt })),
      ...facultyNotifs.map(n => ({ id: `f-${n.id}`, content: n.content, type: n.type, readAt: n.readAt, createdAt: n.createdAt })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/student/notifications/:id/read  (id format: "a-123" or "f-123")
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not found' });

    const raw = req.params.id;
    const [src, numStr] = raw.split('-');
    const numId = parseInt(numStr);
    if (!src || isNaN(numId)) return res.status(400).json({ error: 'Invalid ID' });

    if (src === 'a') {
      await prisma.adminMessage.updateMany({ where: { id: numId, studentId: profile.id }, data: { readAt: new Date() } });
    } else if (src === 'f') {
      await prisma.facultyNotification.updateMany({ where: { id: numId, studentId: profile.id }, data: { readAt: new Date() } });
    } else {
      return res.status(400).json({ error: 'Invalid ID prefix' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// GET /api/student/habits  — last 14 days of habit logs
router.get('/habits', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    // Last 14 dates in IST (YYYY-MM-DD)
    const logs = await prisma.habitLog.findMany({
      where: { studentId: profile.id },
      orderBy: { date: 'desc' },
      take: 14,
    });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/student/habits  — save today's check-in (one per day)
router.post('/habits', requireAuth, async (req, res) => {
  try {
    const { sleep, study, revision, phone, problems } = req.body;
    for (const key of ['sleep', 'study', 'revision', 'phone', 'problems']) {
      if (typeof req.body[key] !== 'boolean')
        return res.status(400).json({ error: `${key} must be boolean` });
    }

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not found' });

    // Today in IST (UTC+5:30)
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const today = ist.toISOString().slice(0, 10); // YYYY-MM-DD

    const log = await prisma.habitLog.upsert({
      where: { studentId_date: { studentId: profile.id, date: today } },
      create: { studentId: profile.id, date: today, sleep, study, revision, phone, problems },
      update: { sleep, study, revision, phone, problems },
    });

    res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save habits' });
  }
});

const RESOURCE_TYPES      = ['Study Material', 'Formula Sheet', 'Session Notes'];
const QUESTION_BANK_TYPES = ['MCQ Bank', 'Previous Year Papers', 'Practice Set'];

// GET /api/student/resources — approved resources matching student's exam subjects (Forge, Apex, Anchor)
router.get('/resources', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];
    if (!subjects.length) return res.json([]);

    // Plan gate (mirrors adminRoutes): Session Notes are Apex-exclusive;
    // Study Material / Formula Sheet require Forge or Apex. Spark/Free get nothing here.
    const APEX_ONLY   = ['Session Notes'];
    const FORGE_ABOVE = ['Study Material', 'Formula Sheet'];
    const isApex      = getEffectivePlan(profile) === 'apex';
    const isForge     = getEffectivePlan(profile) === 'forge';
    if (!isApex && !isForge) return res.json([]);

    const allowedTypes = RESOURCE_TYPES.filter(t =>
      APEX_ONLY.includes(t)   ? isApex :
      FORGE_ABOVE.includes(t) ? (isForge || isApex) : false,
    );

    // Grade filter: Dropper sees both 11 and 12, others see only their grade
    const allowedGrades = profile.grade === 'Dropper' ? ['11', '12'] : [profile.grade].filter(Boolean);

    const resources = await prisma.resource.findMany({
      where: {
        status: 'approved',
        subject: { in: subjects },
        type: { in: allowedTypes },
        ...(allowedGrades.length ? { grade: { in: allowedGrades } } : {}),
      },
      include: { faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { approvedAt: 'desc' },
    });

    res.json(resources.map(r => ({
      id: r.id, title: r.title, description: r.description || null,
      subject: r.subject, grade: r.grade, type: r.type,
      cloudinaryUrl: r.cloudinaryUrl, approvedAt: r.approvedAt,
      facultyName: r.faculty.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/student/question-bank — approved question bank items matching student's exam subjects
router.get('/question-bank', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile || !['forge', 'apex'].includes(getEffectivePlan(profile))) return res.json([]);

    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];
    if (!subjects.length) return res.json([]);

    const items = await prisma.resource.findMany({
      where: { status: 'approved', subject: { in: subjects }, type: { in: QUESTION_BANK_TYPES } },
      include: { faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { approvedAt: 'desc' },
    });

    res.json(items.map(r => ({
      id: r.id, title: r.title, description: r.description || null,
      subject: r.subject, grade: r.grade, type: r.type,
      cloudinaryUrl: r.cloudinaryUrl, approvedAt: r.approvedAt,
      facultyName: r.faculty.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch question bank' });
  }
});

// GET /api/student/reports — all sent WeeklyReports + per-subject latest note
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json({ subjects: [], reports: [] });

    const subjects = EXAM_SUBJECTS[profile.examTarget] || [];

    // Find faculty for each subject directly (one faculty per subject) — not via
    // Session, since Sessions are now only created lazily per-student and may not
    // exist yet for this student even though a subject faculty is assigned.
    const subjectFaculties = await Promise.all(
      subjects.map(async (subject) => {
        const faculty = await prisma.facultyProfile.findFirst({
          where: { subject: { equals: subject, mode: 'insensitive' } },
          include: { user: { select: { name: true } } },
        });
        return faculty
          ? { subject, facultyId: faculty.id, facultyName: faculty.user.name }
          : { subject, facultyId: null, facultyName: null };
      })
    );

    // facultyId → exam subject map for labeling reports
    const facultySubjectMap = {};
    for (const sf of subjectFaculties) {
      if (sf.facultyId) facultySubjectMap[sf.facultyId] = sf.subject;
    }

    // All sent reports for this student, newest first
    const reports = await prisma.weeklyReport.findMany({
      where: { studentId: profile.id, status: 'sent' },
      orderBy: [{ weekNumber: 'desc' }, { sentAt: 'desc' }],
      include: {
        faculty: { include: { user: { select: { name: true } } } },
      },
    });

    const mappedReports = reports.map(r => ({
      id: r.id,
      status: r.status,
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
      sentAt: r.sentAt,
      facultyId: r.facultyId,
      facultyName: r.faculty.user.name,
      subject: facultySubjectMap[r.facultyId] || r.testSubject || null,
      feedback: r.feedback ? { rating: r.feedback.rating, comment: r.feedback.comment } : null,
    }));

    // Each subject with their latest sent report (for top cards)
    const subjectsWithLatest = subjectFaculties.map(sf => ({
      subject: sf.subject,
      facultyId: sf.facultyId,
      facultyName: sf.facultyName,
      latestReport: sf.facultyId ? (mappedReports.find(r => r.facultyId === sf.facultyId) || null) : null,
    }));

    res.json({ subjects: subjectsWithLatest, reports: mappedReports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch parent reports' });
  }
});

// POST /api/student/feedback — one feedback per report, within the Mon–Sun week it was sent
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not a student' });

    const { reportId, rating, comment } = req.body;
    if (!reportId || !rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'reportId and rating (1–5) are required' });

    const report = await prisma.weeklyReport.findUnique({ where: { id: parseInt(reportId) } });
    if (!report || report.studentId !== profile.id || report.status !== 'sent')
      return res.status(404).json({ error: 'Report not found or not yet sent' });

    // Deadline = Sunday 23:59:59 of the week the report was sent
    const sentDate = new Date(report.sentAt);
    const daysUntilSun = sentDate.getDay() === 0 ? 0 : 7 - sentDate.getDay();
    const deadline = new Date(sentDate);
    deadline.setDate(sentDate.getDate() + daysUntilSun);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline)
      return res.status(403).json({ error: 'Feedback window has closed for this report' });

    const existing = await prisma.parentFeedback.findUnique({ where: { reportId: parseInt(reportId) } });
    if (existing) return res.status(409).json({ error: 'Feedback already submitted for this report' });

    const feedback = await prisma.parentFeedback.create({
      data: { reportId: parseInt(reportId), studentId: profile.id, rating, comment: comment || null },
    });

    res.json({ success: true, feedback });

    // Fix 6: notify all admins of new feedback — fire and forget
    (async () => {
      try {
        const [user, admins] = await Promise.all([
          prisma.user.findUnique({ where: { id: req.params.userId }, select: { name: true } }),
          prisma.adminProfile.findMany({ where: { isActive: true }, select: { id: true } }),
        ]);
        if (user && admins.length) {
          await prisma.adminMessage.createMany({
            data: admins.map(a => ({
              content: `${user.name} submitted feedback on their weekly report — ${rating}/5 stars.`,
              type: 'Feedback',
              studentId: profile.id,
              adminId: a.id,
            })),
          });
        }
      } catch { /* non-critical */ }
    })();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// POST /api/student/:userId/session-request — student requests a 1-on-1 session
router.post('/session-request', requireAuth, validateUrlUser, async (req, res) => {
  try {
    const { topic, phone, preferredTime } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'Topic is required' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const request = await prisma.sessionRequest.create({
      data: {
        studentId:    profile.id,
        topic:        topic.trim(),
        phone:        phone?.trim() || null,
        preferredTime: preferredTime?.trim() || null,
      },
    });

    res.json({ success: true, id: request.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit session request' });
  }
});

// GET /api/student/:userId/session-requests — student sees their own requests
router.get('/session-requests', requireAuth, validateUrlUser, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    const requests = await prisma.sessionRequest.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    res.json(requests.map(r => ({
      id: r.id, topic: r.topic, phone: r.phone, preferredTime: r.preferredTime,
      status: r.status, createdAt: r.createdAt,
      scheduledAt: r.scheduledAt, durationMin: r.durationMin,
      adminNote: r.adminNote, assignedAt: r.assignedAt,
      facultyName: r.faculty?.user?.name || null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session requests' });
  }
});

// GET /api/student/:userId/daily-reports — last 62 reports (2 months, covers full month grids)
router.get('/daily-reports', requireAuth, validateUrlUser, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);
    const reports = await prisma.dailyReport.findMany({
      where: { studentId: profile.id },
      orderBy: { date: 'desc' },
      take: 62,
    });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily reports' });
  }
});

// POST /api/student/:userId/daily-reports — submit today's report
router.post('/daily-reports', requireAuth, validateUrlUser, async (req, res) => {
  try {
    const { mood, showedUp, hrsPhysics, hrsChemistry, hrsThird, focusQuality,
            topicsDone, questionsSolved, mockToday, mockScore,
            wentWell, wentHard, tomorrowOne, noteForMentor } = req.body;

    if (!mood || !showedUp || !focusQuality)
      return res.status(400).json({ error: 'mood, showedUp, focusQuality are required' });

    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const date = nowIST.toISOString().slice(0, 10);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const existing = await prisma.dailyReport.findUnique({
      where: { studentId_date: { studentId: profile.id, date } },
    });
    if (existing) return res.status(409).json({ error: 'Report already submitted today' });

    const report = await prisma.dailyReport.create({
      data: {
        studentId: profile.id, date, mood, showedUp,
        hrsPhysics: hrsPhysics ? parseFloat(hrsPhysics) : null,
        hrsChemistry: hrsChemistry ? parseFloat(hrsChemistry) : null,
        hrsThird: hrsThird ? parseFloat(hrsThird) : null,
        focusQuality: parseInt(focusQuality),
        topicsDone: topicsDone?.trim() || null,
        questionsSolved: questionsSolved ? parseInt(questionsSolved) : null,
        mockToday: mockToday || null, mockScore: mockScore?.trim() || null,
        wentWell: wentWell?.trim() || null, wentHard: wentHard?.trim() || null,
        tomorrowOne: tomorrowOne?.trim() || null,
        noteForMentor: noteForMentor?.trim() || null,
      },
    });

    // Notify all active admins
    (async () => {
      try {
        const admins = await prisma.adminProfile.findMany({ where: { isActive: true }, select: { id: true } });
        if (admins.length) {
          await prisma.adminMessage.createMany({
            data: admins.map(a => ({
              content: `${profile.user.name} submitted their daily report (Mood: ${mood}/5, Focus: ${focusQuality}/5).`,
              type: 'Feedback', studentId: profile.id, adminId: a.id,
            })),
          });
        }
      } catch { /* non-critical */ }
    })();

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit daily report' });
  }
});

// GET /api/student/:userId/mentor-notes — latest mentor notes for anchor student
router.get('/mentor-notes', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    const notes = await prisma.mentorNote.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { mentor: { include: { user: { select: { name: true } } } } },
    });

    res.json(notes.map(n => ({
      id: n.id,
      content: n.content,
      weekOf: n.weekOf,
      createdAt: n.createdAt,
      mentorName: n.mentor?.user?.name || null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor notes' });
  }
});

// GET /api/student/:userId/mentor-calls — call history + upcoming for anchor student
router.get('/mentor-calls', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.json([]);

    const calls = await prisma.mentorCall.findMany({
      where: { studentId: profile.id },
      orderBy: { scheduledAt: 'desc' },
      take: 20,
      include: { mentor: { include: { user: { select: { name: true } } } } },
    });

    res.json(calls.map(c => ({
      id: c.id,
      scheduledAt: c.scheduledAt,
      durationMin: c.durationMin,
      meetLink: c.meetLink,
      notes: c.notes,
      completed: c.completed,
      mentorName: c.mentor?.user?.name || null,
      zoomMeetingId: c.zoomMeetingId,
      joinUrl: c.joinUrl,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor calls' });
  }
});

// POST /api/student/:userId/mentor-calls/:id/zoom-signature — SDK signature for a mentee to join their call on Zoom
router.post('/mentor-calls/:id/zoom-signature', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.userId } });
    if (!profile) return res.status(403).json({ error: 'Not a student' });

    const call = await prisma.mentorCall.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!call) return res.status(404).json({ error: 'Call not found' });
    if (call.studentId !== profile.id) return res.status(403).json({ error: 'Not your call' });
    if (!call.zoomMeetingId) return res.status(400).json({ error: 'This call has no Zoom meeting set up' });

    let livePassword = call.zoomPassword || '';

    try {
      const meeting = await zoom.getMeeting(call.zoomMeetingId);
      const freshPassword = meeting.password || '';
      if (freshPassword !== call.zoomPassword) {
        livePassword = freshPassword;
        await prisma.mentorCall.update({ where: { id: call.id }, data: { zoomPassword: freshPassword } });
      }
    } catch (err) {
      console.error(`Zoom getMeeting refresh failed for mentor call ${call.id}:`, err.message);
    }

    const signature = zoom.generateSdkSignature({ meetingNumber: call.zoomMeetingId, role: 0 });
    res.json({
      signature,
      meetingNumber: call.zoomMeetingId,
      password: livePassword,
      title: 'Mentor call',
      duration: call.durationMin,
      scheduledAt: call.scheduledAt,
    });
  } catch (err) {
    if (err instanceof zoom.ZoomConfigError) return res.status(500).json({ error: 'Zoom is not configured on this server yet.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Zoom signature' });
  }
});

module.exports = router;
