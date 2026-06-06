const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Protected by CRON_SECRET header — called by cron-job.org on a schedule
router.post('/send-reports', async (req, res) => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
});

module.exports = router;
