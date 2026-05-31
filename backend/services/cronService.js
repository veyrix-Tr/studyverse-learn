const cron = require('node-cron');
const prisma = require('../lib/prisma');

// Runs every Sunday at 6:00 AM IST (UTC+5:30 → 00:30 UTC)
// cron expression: second(0) minute(30) hour(0) day(*) month(*) weekday(0=Sunday)
function startCronJobs() {
  cron.schedule('0 30 0 * * 0', async () => {
    console.log('[cron] Sunday auto-send: marking approved reports as sent');
    try {
      const result = await prisma.weeklyReport.updateMany({
        where: { status: 'approved' },
        data: { status: 'sent', sentAt: new Date() },
      });
      console.log(`[cron] Sent ${result.count} report(s)`);
    } catch (err) {
      console.error('[cron] Failed to send reports:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[cron] Weekly report auto-send scheduled (Sunday 6:00 AM IST)');
}

module.exports = { startCronJobs };
