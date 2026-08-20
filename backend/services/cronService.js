const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { downgradeExpiredPlans } = require('./planExpiryService');

// Runs every Saturday and Sunday at 6:00 AM IST
function startCronJobs() {
  cron.schedule('0 0 6 * * 6,0', async () => {
    console.log('[cron] Weekend auto-send: marking approved reports as sent');
    try {
      const approved = await prisma.weeklyReport.findMany({
        where: { status: 'approved' },
        include: { faculty: { include: { user: { select: { name: true } } } } },
      });

      if (approved.length === 0) {
        console.log('[cron] No approved reports to send');
        return;
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

      console.log(`[cron] Sent ${approved.length} report(s) and created notifications`);
    } catch (err) {
      console.error('[cron] Failed to send reports:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  // Runs every 5 minutes — reverts expired premium plans back to spark
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { downgraded } = await downgradeExpiredPlans();
      if (downgraded > 0) console.log(`[cron] Plan expiry sweep: downgraded ${downgraded} student(s)`);
    } catch (err) {
      console.error('[cron] Plan expiry sweep failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

}

module.exports = { startCronJobs };
