const prisma = require('../lib/prisma');

// Reverts any StudentProfile whose premium plan has expired back to 'spark'.
// Every premium-gating check reads `profile.plan` from the DB, so resetting it
// here (plan -> spark, planEndDate -> null) downgrades access everywhere at once
// — including DB `where: { plan: { in: [...] } }` query filters.
async function downgradeExpiredPlans() {
  const now = new Date();

  const expired = await prisma.studentProfile.findMany({
    where: {
      plan: { not: 'spark' },
      planEndDate: { lt: now },
    },
    select: { id: true, plan: true },
  });

  if (expired.length === 0) {
    return { downgraded: 0 };
  }

  await prisma.studentProfile.updateMany({
    where: {
      plan: { not: 'spark' },
      planEndDate: { lt: now },
    },
    data: { plan: 'spark', planEndDate: null },
  });

  console.log(`[plan-expiry] Downgraded ${expired.length} plan(s) to spark:`, expired.map(e => e.id));
  return { downgraded: expired.length };
}

module.exports = { downgradeExpiredPlans };