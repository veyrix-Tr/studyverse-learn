const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { downgradeExpiredPlans } = require('../services/planExpiryService');

// Schedulers speak two different dialects:
//   • Vercel Cron   → GET  with `Authorization: Bearer <CRON_SECRET>`
//   • cron-job.org  → POST with `x-cron-secret: <CRON_SECRET>`
// Accept both so either (or both) can drive these endpoints. Fails closed if
// CRON_SECRET was never configured — an unset secret must never authorize.
const cronAuthorized = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers['x-cron-secret'] === secret) return true;
  return req.headers.authorization === `Bearer ${secret}`;
};

const cronGuard = (req, res, next) => {
  if (!cronAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// Reverts expired premium plans back to Spark (restoring a paid plan first
// when a manual grant was layered on top of one).
const runExpirePlans = async (req, res) => {
  try {
    const { downgraded, restored } = await downgradeExpiredPlans();
    res.json({ message: `Settled expired plans: ${downgraded} → spark, ${restored} restored`, downgraded, restored });
  } catch (err) {
    console.error('[cron] Plan expiry failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Warns students whose premium plan is about to lapse so they can renew
// instead of silently dropping to Spark. Deduped over a 26h window so a daily
// schedule sends each student at most one notice per day.
const PLAN_WARNING_DAYS = 3;
const DAY_MS = 86400000;

const runPlanWarnings = async (req, res) => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + PLAN_WARNING_DAYS * DAY_MS);

    const students = await prisma.studentProfile.findMany({
      where: { plan: { not: 'spark' }, planEndDate: { gt: now, lte: windowEnd } },
      select: { id: true, plan: true, planEndDate: true },
    });
    if (!students.length) return res.json({ warned: 0 });

    // AdminMessage needs an adminId — attribute the system notice to an
    // active admin account.
    const admins = await prisma.adminProfile.findMany({
      where: { isActive: true }, select: { id: true }, take: 1,
    });
    if (!admins.length) return res.json({ warned: 0 });

    const recent = await prisma.adminMessage.findMany({
      where: { type: 'Plan Expiry Warning', createdAt: { gte: new Date(now.getTime() - 26 * 3600000) } },
      select: { studentId: true },
    });
    const alreadyWarned = new Set(recent.map(m => m.studentId));

    const rows = [];
    for (const student of students) {
      if (alreadyWarned.has(student.id)) continue;
      const daysLeft = Math.max(1, Math.ceil((new Date(student.planEndDate).getTime() - now.getTime()) / DAY_MS));
      rows.push({
        studentId: student.id,
        adminId: admins[0].id,
        type: 'Plan Expiry Warning',
        content: `Your ${student.plan} plan expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew to keep full access.`,
      });
    }

    if (rows.length) await prisma.adminMessage.createMany({ data: rows });
    res.json({ warned: rows.length });
  } catch (err) {
    console.error('[cron] Plan warnings failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const runSendReports = async (req, res) => {
  try {
    const approved = await prisma.weeklyReport.findMany({
      where: { status: 'approved' },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });

    if (approved.length === 0) {
      return res.json({ message: 'No approved reports to send' });
    }

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

    res.json({ message: `Sent ${approved.length} report(s)` });
  } catch (err) {
    console.error('[cron] Failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

router.get('/expire-plans', cronGuard, runExpirePlans);
router.post('/expire-plans', cronGuard, runExpirePlans);
router.get('/plan-warnings', cronGuard, runPlanWarnings);
router.post('/plan-warnings', cronGuard, runPlanWarnings);
router.get('/send-reports', cronGuard, runSendReports);
router.post('/send-reports', cronGuard, runSendReports);

module.exports = router;
