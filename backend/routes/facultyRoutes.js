const express    = require('express');
const router     = express.Router({ mergeParams: true });
const prisma     = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { v2: cloudinary } = require('cloudinary');
const zoom       = require('../lib/zoom');
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
      where: { id: req.params.userId },
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
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.json([]);

    const [sessions, allPremiumStudents] = await Promise.all([
      prisma.session.findMany({
        where: { facultyId: fp.id },
        include: {
          student: { include: { user: { select: { name: true } } } },
          students: { include: { student: { include: { user: { select: { name: true } } } } } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.studentProfile.findMany({
        where: { plan: { in: ['apex', 'anchor'] } },
        include: { user: { select: { name: true } } },
      }),
    ]);

    res.json(sessions.map(s => {
      // Modern sessions (1:1 or group) store an explicit roster in the
      // SessionStudent join table. Legacy sessions (seeded before this existed)
      // have no studentId and no roster — fall back to the old grade/subject
      // broadcast-eligibility calc so they still render sensibly.
      let enrolledCount, enrolledStudents;
      if (s.students.length > 0) {
        enrolledCount = s.students.length;
        enrolledStudents = s.students.map(ss => ss.student.user.name);
      } else if (s.studentId && s.student) {
        enrolledCount = 1;
        enrolledStudents = [s.student.user.name];
      } else {
        const eligible = allPremiumStudents.filter(sp => {
          if (sp.plan === 'apex') {
            return sp.grade === s.grade && (EXAM_SUBJECTS[sp.examTarget] || []).includes(s.subject);
          }
          const sf = sp.subjectFaculty;
          return sf && Object.entries(sf).some(([subj, facId]) =>
            subj.toLowerCase() === s.subject.toLowerCase() && facId === fp.id
          );
        });
        enrolledCount = eligible.length;
        enrolledStudents = eligible.map(sp => sp.user.name);
      }
      return {
        id: s.id,
        title: s.title,
        subject: s.subject,
        grade: s.grade,
        dayOfWeek: s.dayOfWeek,
        scheduledAt: s.scheduledAt,
        duration: s.duration,
        note: s.note || null,
        studentId: s.studentId || null,
        studentName: s.student?.user?.name || null,
        enrolledCount,
        enrolledStudents,
        zoomMeetingId: s.zoomMeetingId || null,
        joinUrl: s.joinUrl || null,
        startUrl: s.startUrl || null,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/faculty/sessions — schedule a live class with one or more Apex
// students. A single shared Zoom meeting is created (faculty hosts, all selected
// students attend), each student is enrolled, and they're notified.
router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({
      where: { userId: req.params.userId },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const { studentId, studentIds, title, subject, scheduledAt, duration } = req.body;
    const ids = (Array.isArray(studentIds) && studentIds.length) ? studentIds : (studentId ? [studentId] : []);
    if (ids.length === 0 || !title?.trim() || !scheduledAt || !duration) {
      return res.status(400).json({ error: 'At least one student, plus title, scheduledAt, duration are required' });
    }

    const students = await prisma.studentProfile.findMany({
      where: { id: { in: ids.map(Number) } },
      include: { user: { select: { name: true } } },
    });
    if (students.length !== ids.length) {
      return res.status(400).json({ error: 'One or more selected students were not found' });
    }
    for (const st of students) {
      const isApex = st.plan === 'apex';
      const isMentee = st.mentorId === fp.id;
      if (!isApex && !isMentee) {
        return res.status(400).json({ error: `${st.user.name} is not eligible for this session (not an Apex student or your mentee)` });
      }
      if (!st.grade) {
        return res.status(400).json({ error: `${st.user.name} has no grade set on their profile yet` });
      }
    }

    // Mentor-mentee sessions are pure mentorship check-ins — no academic subject.
    // If every selected student is this faculty's mentee, default to 'Mentorship'
    // and don't require a subject. Mixed/Apex sessions still use the provided one.
    const allMentees = students.every(st => st.mentorId === fp.id);
    const effectiveSubject = allMentees ? 'Mentorship' : subject;
    if (!allMentees && !effectiveSubject?.trim()) {
      return res.status(400).json({ error: 'subject is required for academic sessions' });
    }
    for (const st of students) {
      const isApex = st.plan === 'apex';
      if (isApex && !(EXAM_SUBJECTS[st.examTarget] || []).includes(effectiveSubject)) {
        return res.status(400).json({ error: `${st.user.name} does not study ${effectiveSubject}` });
      }
    }

    const startDate = new Date(scheduledAt);
    if (isNaN(startDate.getTime())) return res.status(400).json({ error: 'Invalid scheduledAt' });

    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    const names = students.map(st => st.user.name);
    // Keep a primary student for continuity (old display + legacy eligibility);
    // the real roster lives in the SessionStudent join table.
    const primary = students[0];

    const zoomTopic = allMentees
      ? (names.length === 1 ? `${title.trim()} — ${names[0]}` : `${title.trim()} — ${names.length} mentees`)
      : (names.length === 1
        ? `${title.trim()} — ${names[0]} (${effectiveSubject})`
        : `${title.trim()} (${effectiveSubject}) — ${names.length} students${names.length <= 3 ? `: ${names.join(', ')}` : ''}`);

    let zoomFields;
    try {
      zoomFields = await zoom.createMeeting({
        topic: zoomTopic,
        startTime: startDate.toISOString(),
        durationMin: Number(duration),
      });
    } catch (err) {
      if (err instanceof zoom.ZoomConfigError) {
        return res.status(500).json({ error: 'Zoom is not configured on this server yet. Ask an admin to add the ZOOM_* env vars.' });
      }
      console.error('Zoom createMeeting failed', err.response?.data || err.message);
      return res.status(502).json({ error: 'Failed to create the Zoom meeting. Please try again in a moment.' });
    }

    const session = await prisma.session.create({
      data: {
        title: title.trim(),
        subject: effectiveSubject,
        grade: primary.grade,
        dayOfWeek,
        scheduledAt: startDate,
        duration: Number(duration),
        facultyId: fp.id,
        studentId: primary.id,
        students: { create: students.map(st => ({ studentId: st.id })) },
        ...zoomFields,
      },
    });

    const admin = await prisma.adminProfile.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
    if (admin) {
      for (const st of students) {
        const adminMsgs = prisma.adminMessage.create({
          data: {
            content: allMentees
              ? `Your mentorship session "${title.trim()}" with ${fp.user.name} is scheduled for ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Join live from your dashboard when it starts.`
              : `New live class scheduled: "${title.trim()}" (${effectiveSubject}) by ${fp.user.name} for ${names.join(', ')} — ${startDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
            type: allMentees ? 'Mentorship Session' : 'Reminder',
            studentId: st.id,
            adminId: admin.id,
          },
        });
        await adminMsgs.catch(() => {});
      }
    }

    for (const st of students) {
      prisma.facultyAlert.create({
        data: { facultyId: fp.id, type: 'Session', content: `Live class "${title.trim()}" scheduled with ${st.user.name} (${names.join(', ')}) — Zoom meeting created ✓` },
      }).catch(() => {});
    }

    res.status(201).json({
      id: session.id,
      title: session.title,
      subject: session.subject,
      grade: session.grade,
      dayOfWeek: session.dayOfWeek,
      scheduledAt: session.scheduledAt,
      duration: session.duration,
      studentId: primary.id,
      studentName: names[0],
      studentNames: names,
      studentIds: students.map(st => st.id),
      enrolledCount: students.length,
      zoomMeetingId: session.zoomMeetingId,
      joinUrl: session.joinUrl,
      startUrl: session.startUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule session' });
  }
});

// POST /api/faculty/sessions/:id/zoom-signature — generates a per-join SDK signature for the host
router.post('/sessions/:id/zoom-signature', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const session = await prisma.session.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!session || session.facultyId !== fp.id) return res.status(403).json({ error: 'Not your session' });
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

    const signature = zoom.generateSdkSignature({ meetingNumber: session.zoomMeetingId, role: 1 });
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

// GET /api/faculty/doubts
router.get('/doubts', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
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
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp || !fp.subject) return res.json([]);

    // Grades this faculty teaches for their subject
    const gradeSessions = await prisma.session.findMany({
      where: { facultyId: fp.id, subject: fp.subject },
      select: { grade: true },
      distinct: ['grade'],
    });
    const grades = gradeSessions.map(s => s.grade);
    if (grades.length === 0) return res.json([]);

    // Apex students in those grades whose exam curriculum includes this faculty's subject
    const apexStudents = await prisma.studentProfile.findMany({
      where: { grade: { in: grades }, plan: 'apex' },
      include: { user: { select: { name: true } } },
    });
    const relevantApex = apexStudents.filter(sp =>
      (EXAM_SUBJECTS[sp.examTarget] || []).includes(fp.subject)
    );

    // Anchor students where this faculty is assigned for this subject via subjectFaculty map
    const anchorStudents = await prisma.studentProfile.findMany({
      where: { plan: 'anchor' },
      include: { user: { select: { name: true } } },
    });
    const relevantAnchor = anchorStudents.filter(sp => {
      const sf = sp.subjectFaculty;
      if (!sf || typeof sf !== 'object') return false;
      return Object.entries(sf).some(([subj, facId]) =>
        subj.toLowerCase() === fp.subject.toLowerCase() && facId === fp.id
      );
    });

    const relevant = [...relevantApex, ...relevantAnchor];

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

// GET /api/faculty/apex-students — students a faculty can schedule a session with:
// their Apex students (subject-filtered client-side) plus their own mentees.
router.get('/apex-students', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.json([]);

    const students = await prisma.studentProfile.findMany({
      where: { OR: [{ plan: 'apex', grade: { not: null } }, { mentorId: fp.id }] },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    });

    res.json(students.map(sp => ({
      id: sp.id,
      name: sp.user.name,
      grade: sp.grade,
      examTarget: sp.examTarget,
      plan: sp.plan,
    })));
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
      where: { userId: req.params.userId },
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
        where: { plan: { in: ['apex', 'anchor'] } },
      });
      const eligible = students.filter(sp => {
        if (sp.plan === 'apex') return sp.grade === session.grade && (EXAM_SUBJECTS[sp.examTarget] || []).includes(session.subject);
        const sf = sp.subjectFaculty;
        return sf && Object.entries(sf).some(([subj, facId]) => subj.toLowerCase() === session.subject.toLowerCase() && facId === fp.id);
      });
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
      where: { userId: req.params.userId },
      include: { user: { select: { name: true } } },
    });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) return res.status(400).json({ error: 'Invalid session ID' });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.facultyId !== fp.id) return res.status(404).json({ error: 'Session not found' });

    const students = await prisma.studentProfile.findMany({
      where: { plan: { in: ['apex', 'anchor'] } },
    });
    const eligible = students.filter(sp => {
      if (sp.plan === 'apex') return sp.grade === session.grade && (EXAM_SUBJECTS[sp.examTarget] || []).includes(session.subject);
      const sf = sp.subjectFaculty;
      return sf && Object.entries(sf).some(([subj, facId]) => subj.toLowerCase() === session.subject.toLowerCase() && facId === fp.id);
    });
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
      where: { userId: req.params.userId },
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
      where: { plan: { in: ['apex', 'anchor'] } },
    });
    const eligible = students.filter(sp => {
      if (sp.plan === 'apex') return grades.includes(sp.grade) && (EXAM_SUBJECTS[sp.examTarget] || []).includes(fp.subject);
      const sf = sp.subjectFaculty;
      return sf && Object.entries(sf).some(([subj, facId]) => subj.toLowerCase() === fp.subject.toLowerCase() && facId === fp.id);
    });
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
      where: { userId: req.params.userId },
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
      where: { userId: req.params.userId },
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

    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
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
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
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

// ── Weekly Reports ──────────────────────────────────────────────────────────

// weekNumber = YYYYWW (e.g. 202622), weekStartDate = "YYYY-MM-DD" (Monday)
function getWeekInfo(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const jan4 = new Date(monday.getFullYear(), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setDate(jan4.getDate() - jan4Day + 1);
  const isoWeek = Math.round((monday - jan4Monday) / (7 * 86400000)) + 1;

  return {
    weekNumber: monday.getFullYear() * 100 + isoWeek,
    weekStartDate: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
  };
}

// GET /api/faculty/reports
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.json([]);

    const reports = await prisma.weeklyReport.findMany({
      where: { facultyId: fp.id },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
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
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      studentId: r.studentId,
      studentName: r.student.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/faculty/reports — create draft for a student for current week
router.post('/reports', requireAuth, async (req, res) => {
  try {
    const { studentId, weekStartDate: wsdOverride } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId is required' });

    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const student = await prisma.studentProfile.findUnique({
      where: { id: parseInt(studentId) },
      include: { user: { select: { name: true } } },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { weekNumber, weekStartDate } = wsdOverride
      ? getWeekInfo(new Date(wsdOverride))
      : getWeekInfo();

    const existing = await prisma.weeklyReport.findUnique({
      where: { studentId_facultyId_weekNumber: { studentId: student.id, facultyId: fp.id, weekNumber } },
    });
    if (existing) return res.status(409).json({ error: 'Report already exists for this week', reportId: existing.id });

    // Snapshot latest test score for this faculty's subject
    const latestScore = await prisma.weeklyScore.findFirst({
      where: { studentId: student.id, ...(fp.subject ? { subject: fp.subject } : {}) },
      orderBy: { testDate: 'desc' },
    });

    const report = await prisma.weeklyReport.create({
      data: {
        weekNumber,
        weekStartDate,
        studentId: student.id,
        facultyId: fp.id,
        testScore: latestScore?.score ?? null,
        testTotalMarks: latestScore?.totalMarks ?? null,
        testSubject: latestScore?.subject ?? null,
      },
    });

    res.json({ success: true, report: { ...report, studentName: student.user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PUT /api/faculty/reports/:id — update draft fields
router.put('/reports/:id', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const report = await prisma.weeklyReport.findUnique({ where: { id } });
    if (!report || report.facultyId !== fp.id) return res.status(404).json({ error: 'Report not found' });
    if (!['draft', 'rejected'].includes(report.status))
      return res.status(400).json({ error: 'Only draft or rejected reports can be edited' });

    const { overallRating, strengths, improvements, mentorNote, nextWeekPlan } = req.body;
    const updated = await prisma.weeklyReport.update({
      where: { id },
      data: {
        ...(overallRating !== undefined && { overallRating: parseInt(overallRating) || null }),
        ...(strengths !== undefined && { strengths: strengths || null }),
        ...(improvements !== undefined && { improvements: improvements || null }),
        ...(mentorNote !== undefined && { mentorNote: mentorNote || null }),
        ...(nextWeekPlan !== undefined && { nextWeekPlan: nextWeekPlan || null }),
      },
    });

    res.json({ success: true, report: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// PUT /api/faculty/reports/:id/submit — submit for admin review
router.put('/reports/:id/submit', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const report = await prisma.weeklyReport.findUnique({ where: { id } });
    if (!report || report.facultyId !== fp.id) return res.status(404).json({ error: 'Report not found' });
    if (!['draft', 'rejected'].includes(report.status))
      return res.status(400).json({ error: 'Only draft or rejected reports can be submitted' });

    const updated = await prisma.weeklyReport.update({
      where: { id },
      data: { status: 'submitted', submittedAt: new Date(), rejectedReason: null },
    });

    res.json({ success: true, report: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// DELETE /api/faculty/reports/:id — delete a draft report
router.delete('/reports/:id', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const report = await prisma.weeklyReport.findUnique({ where: { id } });
    if (!report || report.facultyId !== fp.id) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'draft')
      return res.status(400).json({ error: 'Only draft reports can be deleted' });

    await prisma.weeklyReport.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// ── Resources ────────────────────────────────────────────────────────────────

// DELETE /api/faculty/resources/:id — delete own pending or declined resource
router.delete('/resources/:id', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
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

// GET /api/faculty/feedback — all parent feedback for this faculty's sent reports
router.get('/feedback', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty member' });

    const feedbacks = await prisma.parentFeedback.findMany({
      where: { report: { facultyId: fp.id } },
      include: {
        report: { select: { weekNumber: true, weekStartDate: true, testSubject: true } },
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedbacks.map(f => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt,
      weekNumber: f.report.weekNumber,
      weekStartDate: f.report.weekStartDate,
      subject: f.report.testSubject,
      studentName: f.student.user.name,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// ── ANCHOR MENTOR TOOLS (faculty-side) ────────────────────────────────────

// GET /api/faculty/:userId/mentor-daily-reports — all daily reports from all mentees, newest first
router.get('/mentor-daily-reports', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.json([]);

    const students = await prisma.studentProfile.findMany({
      where: { mentorId: fp.id },
      include: {
        user:         { select: { name: true } },
        dailyReports: { orderBy: { date: 'desc' }, take: 62 },
      },
    });

    const reports = students.flatMap(s =>
      s.dailyReports.map(r => ({
        id: r.id, date: r.date, mood: r.mood, showedUp: r.showedUp,
        hrsPhysics: r.hrsPhysics, hrsChemistry: r.hrsChemistry, hrsThird: r.hrsThird,
        focusQuality: r.focusQuality, topicsDone: r.topicsDone, questionsSolved: r.questionsSolved,
        wentWell: r.wentWell, wentHard: r.wentHard, tomorrowOne: r.tomorrowOne,
        noteForMentor: r.noteForMentor, createdAt: r.createdAt,
        studentId: s.id, studentName: s.user.name, examTarget: s.examTarget,
      }))
    ).sort((a, b) => b.date.localeCompare(a.date));

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor daily reports' });
  }
});

// GET /api/faculty/:userId/mentor-students — anchor students assigned to this faculty as mentor
router.get('/mentor-students', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const students = await prisma.studentProfile.findMany({
      where: { mentorId: fp.id },
      include: {
        user:        { select: { name: true, email: true } },
        dailyReports:{ orderBy: { date: 'desc' }, take: 1 },
        habitLogs:   { orderBy: { date: 'desc' }, take: 14 },
        mentorNotes: { orderBy: { createdAt: 'desc' }, take: 1 },
        mentorCalls: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        _count:      { select: { dailyReports: true } },
      },
    });

    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    res.json(students.map(s => ({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      examTarget: s.examTarget,
      reportCount: s._count.dailyReports,
      reportedToday: s.dailyReports[0]?.date === today,
      lastReportDate: s.dailyReports[0]?.date || null,
      lastNote: s.mentorNotes[0] ? { id: s.mentorNotes[0].id, content: s.mentorNotes[0].content, weekOf: s.mentorNotes[0].weekOf, createdAt: s.mentorNotes[0].createdAt } : null,
      nextCall: s.mentorCalls.find(c => !c.completed && new Date(c.scheduledAt).getTime() + c.durationMin * 60 * 1000 > Date.now()) || null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mentor students' });
  }
});

// GET /api/faculty/:userId/mentor-student/:studentId — full detail for one anchor student
router.get('/mentor-student/:studentId', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const sid = parseInt(req.params.studentId);
    const s = await prisma.studentProfile.findUnique({
      where: { id: sid },
      include: {
        user:        { select: { name: true, email: true } },
        dailyReports:{ orderBy: { date: 'desc' }, take: 30 },
        habitLogs:   { orderBy: { date: 'desc' }, take: 14 },
        mentorNotes: { orderBy: { createdAt: 'desc' }, take: 10, include: { mentor: { include: { user: { select: { name: true } } } } } },
        mentorCalls: { orderBy: { scheduledAt: 'desc' }, take: 20, include: { mentor: { include: { user: { select: { name: true } } } } } },
      },
    });
    if (!s || s.mentorId !== fp.id) return res.status(403).json({ error: 'Not your mentee' });

    res.json({
      id: s.id,
      name: s.user.name,
      email: s.user.email,
      examTarget: s.examTarget,
      dailyReports: s.dailyReports,
      habitLogs: s.habitLogs,
      mentorNotes: s.mentorNotes.map(n => ({ id: n.id, content: n.content, weekOf: n.weekOf, createdAt: n.createdAt, mentorName: n.mentor?.user?.name || null })),
      mentorCalls: s.mentorCalls.map(c => ({ id: c.id, scheduledAt: c.scheduledAt, durationMin: c.durationMin, meetLink: c.meetLink, notes: c.notes, completed: c.completed, mentorName: c.mentor?.user?.name || null })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/faculty/:userId/mentor-student/:studentId/note — write a mentor note
router.post('/mentor-student/:studentId/note', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId }, include: { user: { select: { name: true } } } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const sid = parseInt(req.params.studentId);
    const { content, weekOf } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Note content required' });
    if (content.trim().length > 2000) return res.status(400).json({ error: 'Note too long (max 2000 chars)' });

    const s = await prisma.studentProfile.findUnique({ where: { id: sid }, include: { user: { select: { name: true } } } });
    if (!s || s.mentorId !== fp.id) return res.status(403).json({ error: 'Not your mentee' });

    const wof = weekOf || (() => {
      const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d.toISOString().slice(0, 10);
    })();

    const note = await prisma.mentorNote.create({
      data: { studentId: sid, mentorId: fp.id, content: content.trim(), weekOf: wof },
    });

    const admin = await prisma.adminProfile.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
    if (admin) await prisma.adminMessage.create({
      data: { content: `${fp.user.name} left you a weekly note. Tap to read it.`, type: 'Motivational Note', studentId: sid, adminId: admin.id },
    });
    else console.warn('No admin profile found — student note notification skipped for studentId', sid);

    // Self-alert: faculty's own notification that note was sent
    prisma.facultyAlert.create({
      data: { facultyId: fp.id, type: 'Mentor Note', content: `You sent a weekly note to ${s.user?.name || 'your mentee'} ✓` },
    }).catch(() => {});

    res.json({ id: note.id, content: note.content, weekOf: note.weekOf, createdAt: note.createdAt, mentorName: fp.user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// POST /api/faculty/:userId/mentor-student/:studentId/call — schedule or log a call
router.post('/mentor-student/:studentId/call', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId }, include: { user: { select: { name: true } } } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const sid = parseInt(req.params.studentId);
    const { scheduledAt, durationMin, meetLink, notes, completed } = req.body;
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt required' });
    if (!meetLink?.trim()) return res.status(400).json({ error: 'Google Meet link is required' });

    const s = await prisma.studentProfile.findUnique({ where: { id: sid } });
    if (!s || s.mentorId !== fp.id) return res.status(403).json({ error: 'Not your mentee' });

    const call = await prisma.mentorCall.create({
      data: { studentId: sid, mentorId: fp.id, scheduledAt: new Date(scheduledAt), durationMin: durationMin || 45, meetLink: meetLink?.trim() || null, notes: notes?.trim() || null, completed: completed ?? false },
    });

    if (!completed) {
      const admin = await prisma.adminProfile.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
      if (admin) {
        const callDateIST = new Date(new Date(scheduledAt).getTime() + 5.5 * 60 * 60 * 1000);
        const label = callDateIST.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
        const time  = callDateIST.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
        await prisma.adminMessage.create({
          data: { content: `Weekly mentor call scheduled — ${label} at ${time}. Duration: ${durationMin || 45} min.`, type: 'Reminder', studentId: sid, adminId: admin.id },
        });
      }
    }

    // Self-alert for faculty
    const cs = await prisma.studentProfile.findUnique({ where: { id: sid }, include: { user: { select: { name: true } } } });
    const callDateIST2 = new Date(new Date(scheduledAt).getTime() + 5.5 * 60 * 60 * 1000);
    const callLabel = callDateIST2.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const callTime2 = callDateIST2.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
    prisma.facultyAlert.create({
      data: { facultyId: fp.id, type: 'Call', content: `Mentor call with ${cs?.user?.name || 'mentee'} scheduled — ${callLabel} at ${callTime2}` },
    }).catch(() => {});

    res.json({ id: call.id, scheduledAt: call.scheduledAt, durationMin: call.durationMin, meetLink: call.meetLink, notes: call.notes, completed: call.completed, mentorName: fp.user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save call' });
  }
});

// PUT /api/faculty/:userId/mentor-call/:callId — mark call complete + add notes
router.put('/mentor-call/:callId', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });

    const { notes, completed } = req.body;
    const existing = await prisma.mentorCall.findUnique({ where: { id: parseInt(req.params.callId) } });
    if (!existing || existing.mentorId !== fp.id) return res.status(403).json({ error: 'Not your call' });

    const call = await prisma.mentorCall.update({
      where: { id: existing.id },
      data: { notes: notes?.trim() || null, completed: completed ?? true },
    });
    res.json({ id: call.id, notes: call.notes, completed: call.completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// ── FACULTY ALERTS ──────────────────────────────────────────────────────────

// GET /api/faculty/:userId/alerts
router.get('/alerts', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.json([]);
    const alerts = await prisma.facultyAlert.findMany({
      where: { facultyId: fp.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PUT /api/faculty/:userId/alerts/read-all  ← must come before /:id/read
router.put('/alerts/read-all', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });
    await prisma.facultyAlert.updateMany({
      where: { facultyId: fp.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// PUT /api/faculty/:userId/alerts/:id/read
router.put('/alerts/:id/read', requireAuth, async (req, res) => {
  try {
    const fp = await prisma.facultyProfile.findUnique({ where: { userId: req.params.userId } });
    if (!fp) return res.status(403).json({ error: 'Not a faculty' });
    await prisma.facultyAlert.updateMany({
      where: { id: parseInt(req.params.id), facultyId: fp.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

module.exports = router;
