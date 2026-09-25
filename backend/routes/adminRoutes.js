const express  = require('express');
const router   = express.Router({ mergeParams: true });
const prisma   = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { ensureAssignmentTasks } = require('../services/adminTaskService');
const { logAction } = require('../services/auditLogService');
const { getEffectivePlan } = require('../services/planAccessService');

const EXAM_SUBJECTS = {
  'JEE Mains':    ['Physics', 'Chemistry', 'Maths'],
  'JEE Advanced': ['Physics', 'Chemistry', 'Maths'],
  'NEET':         ['Physics', 'Chemistry', 'Biology'],
};

const QUESTION_BANK_TYPES = ['MCQ Bank', 'Previous Year Papers', 'Practice Set'];

// GET /api/admin/me
router.get('/me', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/students', requireAuth, requireAdmin, async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, name: true } },
        mentor: { include: { user: { select: { name: true } } } },
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
        mentorId: s.mentorId || null,
        mentorName: s.mentor?.user?.name || null,
        subjectFaculty: s.subjectFaculty || {},
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
router.get('/faculty', requireAuth, requireAdmin, async (req, res) => {
  try {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);
    const faculty = await prisma.facultyProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        sessions: { select: { id: true, subject: true, grade: true, scheduledAt: true } },
        weeklyReports: { select: { overallRating: true }, orderBy: { createdAt: 'desc' }, take: 20 },
        mentorStudents: { select: { id: true } },
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
        mentorStudentCount: f.mentorStudents.length,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// POST /api/admin/faculty — create a new faculty member
router.post('/faculty', requireAuth, requireAdmin, async (req, res) => {
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
    logAction({ adminUserId: req.params.userId, action: 'faculty.create', target: user.name, metadata: { subject, email, qualification: qualification || null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

// PUT /api/admin/student/:studentUserId/mentor — assign or clear mentor
router.put('/student/:studentUserId/mentor', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const { mentorId } = req.body; // null to clear, facultyProfile.id to assign
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.studentUserId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    if (mentorId !== null && mentorId !== undefined) {
      const faculty = await prisma.facultyProfile.findUnique({ where: { id: mentorId } });
      if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    }

    const updated = await prisma.studentProfile.update({
      where: { userId: req.params.studentUserId },
      data: { mentorId: mentorId != null ? parseInt(mentorId) || null : null },
      include: { mentor: { include: { user: { select: { name: true } } } } },
    });

    if (mentorId) {
      await prisma.adminNotification.updateMany({
        where: { studentId: profile.id, type: 'mentor', status: 'pending' },
        data: { status: 'done', resolvedAt: new Date() },
      });
    }

    res.json({ mentorId: updated.mentorId, mentorName: updated.mentor?.user?.name || null });
    if (mentorId != null && mentorId !== undefined && mentorId !== '') {
      logAction({ adminUserId: req.params.userId, action: 'mentor.assign', target: profile.user.name, metadata: { mentorId: parseInt(mentorId), mentorName: updated.mentor?.user?.name || null } });
    } else {
      logAction({ adminUserId: req.params.userId, action: 'mentor.clear', target: profile.user.name });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update mentor assignment' });
  }
});

// PUT /api/admin/student/:studentUserId/subject-faculty — assign or clear a faculty for a subject
router.put('/student/:studentUserId/subject-faculty', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const { subject, facultyId } = req.body; // subject: "Physics"|"Chemistry"|..., facultyId: number or null
    if (!subject) return res.status(400).json({ error: 'subject is required' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.params.studentUserId }, include: { user: { select: { name: true } } } });
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const current = (profile.subjectFaculty || {});
    const updated = { ...current };
    if (facultyId) {
      updated[subject] = parseInt(facultyId);
    } else {
      delete updated[subject];
    }

    const result = await prisma.studentProfile.update({
      where: { userId: req.params.studentUserId },
      data: { subjectFaculty: updated },
    });

    if (facultyId) {
      await prisma.adminNotification.updateMany({
        where: { studentId: profile.id, type: 'faculty', status: 'pending' },
        data: { status: 'done', resolvedAt: new Date() },
      });
    }

    res.json({ subjectFaculty: result.subjectFaculty });
    if (facultyId) {
      logAction({ adminUserId: req.params.userId, action: 'faculty.assign', target: profile.user.name, metadata: { subject, facultyId: parseInt(facultyId) } });
    } else {
      logAction({ adminUserId: req.params.userId, action: 'faculty.clear', target: profile.user.name, metadata: { subject } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subject faculty' });
  }
});

// DELETE /api/admin/student/:studentUserId/diagnostic — reset diagnostic lock (admin only)
router.delete('/student/:studentUserId/diagnostic', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/student/:studentUserId/diagnostic', requireAuth, requireAdmin, async (req, res) => {
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
    const SUBJ_MAP = { 'maths':'Maths','math':'Maths','mathematics':'Maths','bio':'Biology','biology':'Biology','physics':'Physics','chemistry':'Chemistry' };
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

// ── Manual plan grants (superadmin only) ─────────────────────────────────────
// A superadmin can hand a student an Apex upgrade for a fixed number of days,
// or put them back on the free Spark plan. Whatever the student was on — and
// any time left on it — is captured as a fallback on their profile, so it is
// handed straight back when the grant expires or is revoked. Every change is
// written to the PlanGrant ledger, to the student's notifications and to the
// Super Admin access log.

// Manual grants are deliberately narrow: Apex is the only upgrade, plus Spark
// for putting any student back on the free plan.
// Plans a superadmin may assign. A free student can be put on any of them; a
// student already on a paid plan can only go up to Apex (or back to Spark).
const MANUAL_GRANT_PLANS = ['forge', 'apex', 'anchor', 'spark'];
const PLAN_LABEL = { forge: 'Forge', apex: 'Apex', anchor: 'Anchor', spark: 'Spark' };

const planSummary = (profile) => ({
  plan: profile.plan,
  planEndDate: profile.planEndDate,
  fallbackPlan: profile.fallbackPlan,
  fallbackEndDate: profile.fallbackEndDate,
  effectivePlan: getEffectivePlan(profile),
});

// PUT /api/admin/student/:studentUserId/plan — grant Apex for N days, or move to Spark
router.put('/student/:studentUserId/plan', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const { plan, durationDays, reason } = req.body;

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.studentUserId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    // Free students can be assigned any plan. A student already on a paid plan
    // can only be upgraded to Apex (or moved back to Spark) — never swapped
    // onto a different paid tier.
    const currentlyFree = getEffectivePlan(profile) === 'spark';
    const allowedPlans = currentlyFree ? MANUAL_GRANT_PLANS : ['apex', 'spark'];
    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({
        error: currentlyFree
          ? `Plan must be ${PLAN_LABEL.forge}, ${PLAN_LABEL.apex} or ${PLAN_LABEL.anchor}`
          : 'Only an Apex upgrade or a move to Spark is allowed on top of an active plan',
      });
    }

    const now = new Date();
    const adminNote = { adminId: ap.id, studentId: profile.id, type: 'Announcement' };

    // Move to the free plan — immediate, keeps nothing to restore.
    if (plan === 'spark') {
      await prisma.$transaction([
        prisma.studentProfile.update({
          where: { id: profile.id },
          data: { plan: 'spark', planEndDate: null, fallbackPlan: null, fallbackEndDate: null },
        }),
        prisma.planGrant.updateMany({
          where: { studentId: profile.id, source: 'manual', status: 'active' },
          data: { status: 'replaced' },
        }),
        prisma.planGrant.create({
          data: {
            studentId: profile.id, plan: 'spark', source: 'manual', durationDays: 0,
            startDate: now, endDate: now, reason: reason || null,
            grantedBy: req.params.userId, status: 'active',
          },
        }),
        prisma.adminMessage.create({
          data: { ...adminNote, content: 'Your account has been moved to the free Spark plan by our team.' },
        }),
      ]);

      logAction({ adminUserId: req.params.userId, action: 'plan.spark', target: profile.user.name, metadata: { reason: reason || null } });
      return res.json(planSummary({ ...profile, plan: 'spark', planEndDate: null, fallbackPlan: null, fallbackEndDate: null }));
    }

    // Time-boxed upgrade for a fixed number of days.
    const days = parseInt(durationDays, 10);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      return res.status(400).json({ error: 'durationDays must be between 1 and 365' });
    }

    const effective = getEffectivePlan(profile);
    const currentEnd = profile.planEndDate ? new Date(profile.planEndDate) : null;
    const fallbackLive = profile.fallbackPlan
      && profile.fallbackEndDate
      && new Date(profile.fallbackEndDate) > now;

    // Keep an already-stored restore target when grants are chained, so the
    // student still ends up back on the plan they were actually paying for.
    let fallbackPlan = null;
    let fallbackEndDate = null;
    if (fallbackLive) {
      fallbackPlan = profile.fallbackPlan;
      fallbackEndDate = profile.fallbackEndDate;
    } else if (effective !== 'spark' && currentEnd && currentEnd > now) {
      fallbackPlan = effective;
      fallbackEndDate = currentEnd;
    }

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    await prisma.$transaction([
      prisma.studentProfile.update({
        where: { id: profile.id },
        data: { plan, planEndDate: endDate, fallbackPlan, fallbackEndDate },
      }),
      prisma.planGrant.updateMany({
        where: { studentId: profile.id, source: 'manual', status: 'active', durationDays: { gt: 0 } },
        data: { status: 'replaced' },
      }),
      prisma.planGrant.create({
        data: {
          studentId: profile.id, plan, source: 'manual', durationDays: days,
          startDate: now, endDate, reason: reason || null,
          grantedBy: req.params.userId, status: 'active',
        },
      }),
      prisma.adminMessage.create({
        data: { ...adminNote, content: `You have been granted the ${PLAN_LABEL[plan]} plan for ${days} day${days === 1 ? '' : 's'} by our team.` },
      }),
    ]);

    // Anchor/Apex students need a mentor and (Apex) subject faculty — same
    // side effects as a paid upgrade, so a comped student is never unassigned.
    await ensureAssignmentTasks(prisma);

    logAction({
      adminUserId: req.params.userId, action: 'plan.grant', target: profile.user.name,
      metadata: { plan, durationDays: days, reason: reason || null, fallbackPlan },
    });

    return res.json(planSummary({ ...profile, plan, planEndDate: endDate, fallbackPlan, fallbackEndDate }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply plan change' });
  }
});

// PUT /api/admin/student/:studentUserId/plan/revoke — end an active manual grant now
router.put('/student/:studentUserId/plan/revoke', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.studentUserId },
      include: { user: { select: { name: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const now = new Date();
    const grant = await prisma.planGrant.findFirst({
      where: { studentId: profile.id, source: 'manual', status: 'active', durationDays: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
    });
    if (!grant) return res.status(400).json({ error: 'No active manual grant to revoke' });

    // Only revoke if the student's current window really is that grant — a
    // later self-serve payment must never be thrown away by a stale revoke.
    const currentEnd = profile.planEndDate ? new Date(profile.planEndDate).getTime() : null;
    if (currentEnd !== new Date(grant.endDate).getTime()) {
      return res.status(400).json({ error: 'The current plan was not granted manually' });
    }

    const restore = profile.fallbackPlan && profile.fallbackEndDate && new Date(profile.fallbackEndDate) > now;
    const next = restore
      ? { plan: profile.fallbackPlan, planEndDate: profile.fallbackEndDate, fallbackPlan: null, fallbackEndDate: null }
      : { plan: 'spark', planEndDate: null, fallbackPlan: null, fallbackEndDate: null };

    await prisma.$transaction([
      prisma.studentProfile.update({ where: { id: profile.id }, data: next }),
      prisma.planGrant.updateMany({
        where: { studentId: profile.id, source: 'manual', status: 'active', durationDays: { gt: 0 } },
        data: { status: 'revoked', revokedAt: now },
      }),
      prisma.adminMessage.create({
        data: {
          adminId: ap.id, studentId: profile.id, type: 'Announcement',
          content: restore
            ? 'Your temporary Apex grant has ended and your previous plan has been restored.'
            : 'Your temporary Apex grant has been removed. You are now on the free Spark plan.',
        },
      }),
    ]);

    logAction({
      adminUserId: req.params.userId, action: 'plan.revoke', target: profile.user.name,
      metadata: { grantId: grant.id, restoredPlan: next.plan },
    });

    return res.json(planSummary({ ...profile, ...next }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to revoke plan grant' });
  }
});

// GET /api/admin/student/:studentUserId/plan-grants — full grant history
router.get('/student/:studentUserId/plan-grants', requireAuth, requireAdmin, async (req, res) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.params.studentUserId },
      select: { id: true, plan: true, planEndDate: true, fallbackPlan: true, fallbackEndDate: true },
    });
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const grants = await prisma.planGrant.findMany({
      where: { studentId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const granterIds = [...new Set(grants.map(g => g.grantedBy).filter(Boolean))];
    const granters = granterIds.length
      ? await prisma.user.findMany({ where: { id: { in: granterIds } }, select: { id: true, name: true } })
      : [];
    const granterName = Object.fromEntries(granters.map(g => [g.id, g.name]));

    res.json({
      current: planSummary(profile),
      grants: grants.map(g => ({
        id: g.id,
        plan: g.plan,
        source: g.source,
        durationDays: g.durationDays,
        startDate: g.startDate,
        endDate: g.endDate,
        reason: g.reason,
        status: g.status,
        grantedByName: granterName[g.grantedBy] || null,
        createdAt: g.createdAt,
        revokedAt: g.revokedAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plan history' });
  }
});

// GET /api/admin/admins — list all admin accounts (superadmin only)
router.get('/admins', requireAuth, requireAdmin, async (req, res) => {
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

// POST /api/admin/admins — create a new admin account (superadmin only)
router.post('/admins', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const { name, email, department } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'name and email required' });

    const bcrypt = require('bcrypt');
    const password = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!';

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        role: 'admin',
        adminProfile: { create: { department: department || 'Operations' } },
      },
      include: { adminProfile: true },
    });

    res.status(201).json({
      success: true,
      admin: { id: user.adminProfile.id, userId: user.id, name: user.name, email: user.email, isActive: true },
      credentials: { email: user.email, password },
    });
    logAction({ adminUserId: req.params.userId, action: 'admin.create', target: user.name, metadata: { email: user.email, department: department || 'Operations' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// PUT /api/admin/admins/:id/deactivate — deactivate an admin account (superadmin only)
router.put('/admins/:id/deactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId }, data: { isActive: false } });
    res.json({ success: true });
    const targetAdmin = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    logAction({ adminUserId: req.params.userId, action: 'admin.deactivate', target: targetAdmin?.name || userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate' });
  }
});

// PUT /api/admin/admins/:id/reactivate — reactivate an admin account (superadmin only)
router.put('/admins/:id/reactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'Invalid ID' });
    await prisma.adminProfile.update({ where: { userId }, data: { isActive: true } });
    res.json({ success: true });
    const targetAdmin = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    logAction({ adminUserId: req.params.userId, action: 'admin.reactivate', target: targetAdmin?.name || userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate' });
  }
});

// POST /api/admin/messages — send message to one or all students, with optional plan targeting
router.post('/messages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { studentId, content, type, targetPlan } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content is required' });
    if (content.trim().length > 500) return res.status(400).json({ error: 'Message too long (max 500 characters)' });

    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const msgType = type || 'Announcement';
    const msgContent = content.trim();
    const sentAt = new Date();

    // Multi-select: array of specific student IDs
    if (Array.isArray(studentId)) {
      const ids = studentId.map(Number).filter(n => !isNaN(n));
      if (ids.length === 0) return res.status(400).json({ error: 'No valid student IDs' });
      await prisma.adminMessage.createMany({
        data: ids.map(sid => ({ content: msgContent, type: msgType, studentId: sid, adminId: ap.id, createdAt: sentAt })),
      });
      logAction({ adminUserId: req.params.userId, action: 'message.send', target: `${msgType} to ${ids.length} selected student(s)`, metadata: { type: msgType, count: ids.length } });
      // Fix 5: return sentAt so frontend gets a consistent, real timestamp
      return res.json({ success: true, sent: ids.length, sentAt: sentAt.toISOString() });
    }

    if (studentId === 'all') {
      if (targetPlan !== undefined && targetPlan !== null && !['spark', 'forge', 'apex', 'anchor'].includes(targetPlan)) {
        return res.status(400).json({ error: `Invalid targetPlan "${targetPlan}". Must be spark, forge, apex, or anchor.` });
      }
      let planWhere = {};
      if (targetPlan === 'spark')  planWhere = { plan: 'spark' };
      else if (targetPlan === 'forge')  planWhere = { plan: { in: ['forge', 'apex', 'anchor'] } };
      else if (targetPlan === 'apex')   planWhere = { plan: 'apex' };
      else if (targetPlan === 'anchor') planWhere = { plan: 'anchor' };

      const students = await prisma.studentProfile.findMany({ where: planWhere, select: { id: true } });
      if (students.length === 0) return res.json({ success: true, sent: 0, sentAt: sentAt.toISOString() });

      await prisma.adminMessage.createMany({
        data: students.map(s => ({ content: msgContent, type: msgType, studentId: s.id, adminId: ap.id, createdAt: sentAt })),
      });
      logAction({ adminUserId: req.params.userId, action: 'message.send', target: `${msgType} to ${students.length} student(s)${targetPlan ? ` (${targetPlan})` : ''}`, metadata: { type: msgType, count: students.length, targetPlan: targetPlan ?? null } });
      return res.json({ success: true, sent: students.length, sentAt: sentAt.toISOString() });
    }

    const sid = parseInt(studentId);
    if (isNaN(sid)) return res.status(400).json({ error: 'Invalid student ID' });
    const msg = await prisma.adminMessage.create({
      data: { content: msgContent, type: msgType, studentId: sid, adminId: ap.id },
    });
    res.json({ success: true, id: msg.id });
    logAction({ adminUserId: req.params.userId, action: 'message.send', target: `${msgType} to student #${sid}`, metadata: { type: msgType } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/admin/messages — sent messages (deduplicated broadcasts)
router.get('/messages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    // Only fetch manually composed messages — exclude system-generated types
    const SYSTEM_TYPES = ['Diagnostic', 'Feedback'];
    const msgs = await prisma.adminMessage.findMany({
      where: { adminId: ap.id, type: { notIn: SYSTEM_TYPES } },
      include: { student: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Fix 7: group by adminId + type + content + 10-second window to collapse broadcasts
    // but avoid merging two genuinely separate sends of the same message
    const groups = {};
    for (const m of msgs) {
      const tenSec = Math.floor(new Date(m.createdAt).getTime() / 10000);
      const key = `${ap.id}|${tenSec}|${m.type}|${m.content}`;
      if (!groups[key]) {
        groups[key] = { id: m.id, content: m.content, type: m.type, createdAt: m.createdAt, count: 0, studentNames: [] };
      }
      groups[key].count++;
      const name = m.student?.user?.name;
      if (name) groups[key].studentNames.push(name);
    }

    const result = Object.values(groups)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30)
      .map(g => {
        let recipient;
        const resolvedNames = g.studentNames; // only names that resolved (student not deleted)
        if (g.count === 1) {
          recipient = resolvedNames[0] || 'Student';
        } else if (resolvedNames.length <= 3) {
          // show names if few enough, fall back to count if names didn't resolve
          recipient = resolvedNames.length > 0
            ? resolvedNames.join(', ')
            : `${g.count} students`;
        } else {
          recipient = `${g.count} students`;
        }
        return { id: g.id, content: g.content, type: g.type, createdAt: g.createdAt, recipient };
      });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/admin/resources — all resources pending/approved/declined
router.get('/resources', requireAuth, requireAdmin, async (req, res) => {
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
router.put('/resources/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const resource = await prisma.resource.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: ap.id },
    });

    // Fix 4: explicit type-to-plan mapping — no implicit fallthrough
    const APEX_ONLY_RESOURCE_TYPES   = ['Session Notes'];
    const FORGE_ABOVE_RESOURCE_TYPES = ['MCQ Bank', 'Previous Year Papers', 'Practice Set', 'Study Material', 'Formula Sheet'];
    const isKnownType = APEX_ONLY_RESOURCE_TYPES.includes(resource.type) || FORGE_ABOVE_RESOURCE_TYPES.includes(resource.type);

    const allStudents = isKnownType ? await prisma.studentProfile.findMany({
      select: { id: true, examTarget: true, plan: true },
    }) : [];

    const relevantStudents = allStudents.filter(s => {
      const subjects = EXAM_SUBJECTS[s.examTarget] || [];
      if (!subjects.includes(resource.subject)) return false;
      if (APEX_ONLY_RESOURCE_TYPES.includes(resource.type))   return s.plan === 'apex';
      if (FORGE_ABOVE_RESOURCE_TYPES.includes(resource.type)) return s.plan === 'forge' || s.plan === 'apex';
      return false; // unknown type — no notification
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

    // Alert the faculty who submitted the resource
    prisma.facultyAlert.create({
      data: { facultyId: resource.facultyId, type: 'Resource', content: `Your resource "${resource.title}" (${resource.subject}) was approved by admin ✓` },
    }).catch(() => {});

    res.json({ success: true });
    logAction({ adminUserId: req.params.userId, action: 'resource.approve', target: resource.title, metadata: { subject: resource.subject, type: resource.type } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve resource' });
  }
});

// PUT /api/admin/resources/:id/decline
router.put('/resources/:id/decline', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const resource = await prisma.resource.update({
      where: { id },
      data: { status: 'declined', declineReason: reason || null },
    });

    // Alert the faculty
    prisma.facultyAlert.create({
      data: { facultyId: resource.facultyId, type: 'Resource', content: `Your resource "${resource.title}" (${resource.subject}) was declined${reason ? `: ${reason}` : ''}` },
    }).catch(() => {});

    res.json({ success: true });
    logAction({ adminUserId: req.params.userId, action: 'resource.decline', target: resource.title, metadata: { subject: resource.subject, type: resource.type, reason: reason || null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline resource' });
  }
});

// ── Weekly Parent Reports ────────────────────────────────────────────────────

// GET /api/admin/reports — all submitted/approved/rejected/sent reports
router.get('/reports', requireAuth, requireAdmin, async (req, res) => {
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
router.put('/reports/:id/approve', requireAuth, requireAdmin, async (req, res) => {
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
    logAction({ adminUserId: req.params.userId, action: 'report.approve', target: `Weekly report #${id}`, metadata: { weekNumber: updated.weekNumber, studentId: updated.studentId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

// PUT /api/admin/reports/:id/reject
router.put('/reports/:id/reject', requireAuth, requireAdmin, async (req, res) => {
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
    logAction({ adminUserId: req.params.userId, action: 'report.reject', target: `Weekly report #${id}`, metadata: { weekNumber: updated.weekNumber, studentId: updated.studentId, reason: reason || null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject report' });
  }
});

// POST /api/admin/reports/approve-all — approve all submitted reports for this admin
router.post('/reports/approve-all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });

    const result = await prisma.weeklyReport.updateMany({
      where: { status: 'submitted' },
      data: { status: 'approved', approvedAt: new Date(), approvedById: ap.id },
    });

    res.json({ success: true, approved: result.count });
    logAction({ adminUserId: req.params.userId, action: 'report.approve', target: `${result.count} weekly report(s)`, metadata: { count: result.count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve reports' });
  }
});

// POST /api/admin/reports/send — mark approved reports as sent (called by cron or manually)
router.post('/reports/send', requireAuth, requireAdmin, async (req, res) => {
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
    logAction({ adminUserId: req.params.userId, action: 'report.send', target: `${approved.length} weekly report(s)`, metadata: { count: approved.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reports' });
  }
});

// ── SESSION REQUESTS ──────────────────────────────────────────────────────

// GET /api/admin/:userId/session-requests — list all requests with student + faculty info
router.get('/session-requests', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await prisma.sessionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        faculty:  { include: { user: { select: { name: true } } } },
      },
    });

    res.json(requests.map(r => ({
      id: r.id, topic: r.topic, phone: r.phone, preferredTime: r.preferredTime,
      status: r.status, createdAt: r.createdAt,
      scheduledAt: r.scheduledAt, durationMin: r.durationMin,
      adminNote: r.adminNote, assignedAt: r.assignedAt,
      studentName: r.student.user.name, studentEmail: r.student.user.email,
      studentId: r.student.id, studentPlan: r.student.plan,
      facultyName: r.faculty?.user?.name || null, facultyId: r.facultyId,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session requests' });
  }
});

// PUT /api/admin/:userId/session-requests/:id/assign — assign faculty + time, check conflicts
router.put('/session-requests/:id/assign', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { facultyId, scheduledAt, durationMin, adminNote } = req.body;
    if (!facultyId || !scheduledAt || !durationMin)
      return res.status(400).json({ error: 'facultyId, scheduledAt, durationMin required' });

    const request = await prisma.sessionRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { student: { include: { user: { select: { name: true } } } } },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const start = new Date(scheduledAt);
    const end   = new Date(start.getTime() + durationMin * 60000);

    // ── Conflict check: Sessions (batch) ──
    const sessionConflicts = await prisma.session.findMany({
      where: {
        facultyId: parseInt(facultyId),
        scheduledAt: { gte: start, lt: end },
      },
      select: { title: true, scheduledAt: true, duration: true },
    });

    // ── Conflict check: MentorCalls (Anchor 1-on-1) ──
    const callConflicts = await prisma.mentorCall.findMany({
      where: {
        mentorId: parseInt(facultyId),
        completed: false,
        scheduledAt: { gte: new Date(start.getTime() - 90 * 60000), lt: end },
      },
      select: { scheduledAt: true, durationMin: true },
    });

    // Filter mentorCalls that actually overlap
    const overlappingCalls = callConflicts.filter(c => {
      const cs = new Date(c.scheduledAt);
      const ce = new Date(cs.getTime() + c.durationMin * 60000);
      return cs < end && ce > start;
    });

    const conflicts = [
      ...sessionConflicts.map(s => `Batch session "${s.title}" at ${new Date(s.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`),
      ...overlappingCalls.map(c => `Mentor call at ${new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`),
    ];

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Faculty has conflicts', conflicts });
    }

    // ── Assign ──
    const faculty = await prisma.facultyProfile.findUnique({
      where: { id: parseInt(facultyId) },
      include: { user: { select: { name: true } } },
    });

    const updated = await prisma.sessionRequest.update({
      where: { id: request.id },
      data: {
        status: 'assigned', facultyId: parseInt(facultyId),
        scheduledAt: start, durationMin: parseInt(durationMin),
        adminNote: adminNote?.trim() || null, assignedAt: new Date(),
      },
    });

    // Notify student
    const admins = await prisma.adminProfile.findMany({ where: { isActive: true }, select: { id: true } });
    if (admins.length) {
      const dateStr = start.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      const timeStr = start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      await prisma.adminMessage.createMany({
        data: admins.map(a => ({
          content: `Your session has been confirmed! ${faculty.user.name} will meet you on ${dateStr} at ${timeStr} for ${durationMin} minutes. Topic: ${request.topic}`,
          type: 'Reminder',
          studentId: request.studentId,
          adminId: a.id,
        })),
      });
    }

    // Resolve this admin's pending session-assignment task for that student
    await prisma.adminNotification.updateMany({
      where: { studentId: request.studentId, type: 'session', status: 'pending' },
      data: { status: 'done', resolvedAt: new Date() },
    });

    res.json({ success: true, request: updated, conflicts: [] });
    logAction({ adminUserId: req.params.userId, action: 'session.assign', target: request.student.user.name, metadata: { topic: request.topic, facultyId: parseInt(facultyId), scheduledAt, durationMin: parseInt(durationMin) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign session' });
  }
});

// PUT /api/admin/:userId/session-requests/:id/status — mark done/cancelled
router.put('/session-requests/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['done', 'cancelled', 'pending'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const updated = await prisma.sessionRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json({ success: true, status: updated.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/admin/:userId/notifications — persistent admin assignment inbox
router.get('/notifications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });
    await ensureAssignmentTasks(prisma);
    const items = await prisma.adminNotification.findMany({
      where: { adminId: ap.id },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, plan: true, user: { select: { id: true, name: true, email: true } } } },
      },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/admin/:userId/notifications/read-all — mark every admin task read
router.put('/notifications/read-all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });
    await prisma.adminNotification.updateMany({
      where: { adminId: ap.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// PUT /api/admin/:userId/notifications/:id/read — mark a single task read
router.put('/notifications/:id/read', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ap = await prisma.adminProfile.findUnique({ where: { userId: req.params.userId } });
    if (!ap) return res.status(403).json({ error: 'Not an admin' });
    await prisma.adminNotification.updateMany({
      where: { id: parseInt(req.params.id), adminId: ap.id },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

// ── ANALYTICS ──────────────────────────────────────────────────────────────
// GET /api/admin/:userId/analytics — real dashboard numbers computed live from
// the actual database (students, payments, weekly scores, sessions).

const PREMIUM_PLANS = ['forge', 'apex', 'anchor'];

router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [students, payments, weeklyScores] = await Promise.all([
      prisma.studentProfile.findMany({
        select: {
          id: true, plan: true, createdAt: true, diagnosticScore: true,
        },
      }),
      prisma.payment.findMany({
        select: { orderAmount: true, orderStatus: true, plan: true, createdAt: true, paidAt: true, goal: true },
      }),
      prisma.weeklyScore.findMany({
        select: { studentId: true, score: true, weekNumber: true },
        orderBy: [{ studentId: 'asc' }, { weekNumber: 'asc' }],
      }),
    ]);

    const sessionRows = await prisma.sessionStudent.findMany({ select: { studentId: true } });
    const legacySessions = await prisma.session.findMany({ where: { studentId: { not: null } }, select: { studentId: true } });
    const sessionStudentIds = new Set([...sessionRows.map(r => r.studentId), ...legacySessions.map(r => r.studentId)]);

    const totalStudents = students.length;
    const premiumStudents = students.filter(s => PREMIUM_PLANS.includes(s.plan)).length;
    const activeStudents = new Set();
    students.forEach(s => { if (PREMIUM_PLANS.includes(s.plan) || sessionStudentIds.has(s.id)) activeStudents.add(s.id); });
    const diagnosticsCompleted = students.filter(s => s.diagnosticScore != null).length;

    // Avg improvement across students who have weekly scores:
    // (last week's score − first week's score), averaged over students.
    const byStudent = {};
    for (const w of weeklyScores) {
      if (!byStudent[w.studentId]) byStudent[w.studentId] = { first: null, last: null };
      if (byStudent[w.studentId].first === null) byStudent[w.studentId].first = w.score;
      byStudent[w.studentId].last = w.score;
    }
    let impSum = 0, impCount = 0;
    for (const k in byStudent) { if (byStudent[k].first !== null && byStudent[k].last !== null) { impSum += byStudent[k].last - byStudent[k].first; impCount++; } }
    const avgImprovement = impCount > 0 ? Math.round(impSum / impCount) : 0;

    // New enrollments this month / last month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newThisMonth  = students.filter(s => s.createdAt >= monthStart).length;
    const newLastMonth  = students.filter(s => s.createdAt >= lastMonthStart && s.createdAt < monthStart).length;

    // Revenue — only from actually PAID payments (plan upgrades + pay-per-session)
    const paid = payments.filter(p => p.orderStatus === 'PAID');
    const totalRevenue = paid.reduce((a, p) => a + p.orderAmount, 0);
    const thisMonthRevenue = paid.filter(p => p.paidAt && p.paidAt >= monthStart).reduce((a, p) => a + p.orderAmount, 0);

    // Revenue by plan (plan goal + pay-per-session as "Session")
    const revByPlan = {};
    paid.filter(p => p.plan && p.goal === 'plan').forEach(p => {
      revByPlan[p.plan] = (revByPlan[p.plan] || 0) + p.orderAmount;
    });
    const sessionRev = paid.filter(p => p.goal === 'session').reduce((a, p) => a + p.orderAmount, 0);
    const revenueByPlan = [
      ...PREMIUM_PLANS.map(plan => ({ plan, amount: Math.round(revByPlan[plan] || 0) })),
      ...(sessionRev > 0 ? [{ plan: 'session', amount: Math.round(sessionRev) }] : []),
    ];

    // Monthly revenue last 6 months (by actual paid date), zero-filled
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d;
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const amount = paid.filter(p => p.paidAt && p.paidAt >= start && p.paidAt < end).reduce((a, p) => a + p.orderAmount, 0);
      monthlyRevenue.push({ month: d.toLocaleString('en-IN', { month: 'short' }), amount: Math.round(amount) });
    }

    // Enrollment funnel — real stages derived from DB state
    const withDiagnostic = students.filter(s => s.diagnosticScore != null).length;
    const pipeline = [
      { label: 'Enquiry Received', count: totalStudents },
      { label: 'Diagnostic Completed', count: withDiagnostic },
      { label: 'Program Fit & Review', count: activeStudents.size },
      { label: 'Active Students', count: activeStudents.size },
    ];

    res.json({
      totalStudents, premiumStudents, activeStudents: activeStudents.size,
      diagnosticsCompleted, avgImprovement,
      newThisMonth, newLastMonth,
      totalRevenue: Math.round(totalRevenue),
      thisMonthRevenue: Math.round(thisMonthRevenue),
      revenueByPlan, monthlyRevenue, pipeline,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// GET /api/admin/:userId/access-log — real admin audit trail, newest first
router.get('/access-log', requireAuth, requireAdmin, async (req, res) => {
  try {
    const entries = await prisma.adminAccessLog.findMany({
      include: { admin: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(entries.map(e => ({
      id: e.id,
      action: e.action,
      target: e.target,
      metadata: e.metadata,
      adminName: e.admin?.user?.name || 'System',
      createdAt: e.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch access log' });
  }
});

module.exports = router;
