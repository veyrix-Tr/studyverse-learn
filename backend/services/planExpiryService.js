const prisma = require('../lib/prisma');
const { resolveExpiredPlan } = require('./planAccessService');

// Settles every StudentProfile whose premium period has lapsed:
//   • a superadmin manual grant that was layered on top of an active paid plan
//     hands the student that paid plan back (with its original end date);
//   • anything else drops to 'spark'.
// Resetting the plan fields here downgrades access everywhere at once —
// including DB `where: { plan: { in: [...] } }` query filters. Nothing about
// the student is deleted: doubts, sessions, reports, mentor assignment,
// diagnostics and payment history all stay, so a later repayment restores
// everything as it was.
async function downgradeExpiredPlans() {
  const now = new Date();

  // Close out the ledger rows whose window has passed. durationDays > 0 keeps
  // immediate actions (a manual move to Spark) marked as active until they are
  // superseded, rather than flipping them to 'expired' on the next sweep.
  //
  // This runs on every sweep, *before* the no-op early return below: a payment
  // can push planEndDate past a comp's endDate, so a grant may lapse while its
  // profile is still live. Skipping the close-out there left the row 'active'
  // indefinitely (wrong history, plus a Revoke button that always 400s).
  await prisma.planGrant.updateMany({
    where: { status: 'active', durationDays: { gt: 0 }, endDate: { lt: now } },
    data: { status: 'expired' },
  });

  const expired = await prisma.studentProfile.findMany({
    where: {
      plan: { not: 'spark' },
      planEndDate: { lt: now },
    },
    select: {
      id: true,
      plan: true,
      planEndDate: true,
      fallbackPlan: true,
      fallbackEndDate: true,
    },
  });

  if (expired.length === 0) {
    return { downgraded: 0, restored: 0 };
  }

  let downgraded = 0;
  let restored = 0;

  for (const profile of expired) {
    const next = resolveExpiredPlan(profile);
    if (!next) continue;
    await prisma.studentProfile.update({ where: { id: profile.id }, data: next });
    if (next.plan === 'spark') downgraded += 1;
    else restored += 1;
  }

  if (downgraded || restored) {
    console.log(
      `[plan-expiry] Settled ${expired.length} plan(s): ${downgraded} → spark, ${restored} restored to a paid plan`
    );
  }
  return { downgraded, restored };
}

module.exports = { downgradeExpiredPlans };
