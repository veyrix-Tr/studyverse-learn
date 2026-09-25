// Plan access state — the single source of truth for "which plan is this
// student really on right now".
//
// Two rules:
//   1. A premium plan with a live planEndDate is what the student is on.
//   2. When that period is over, a superadmin manual grant hands the student
//      back the plan the grant replaced (fallbackPlan / fallbackEndDate, written
//      onto StudentProfile when the grant was made) — but only while there is
//      still time left on it. Otherwise the student drops to 'spark'.
//
// Keeping the restore target on the profile (rather than only in PlanGrant)
// means getEffectivePlan() stays synchronous: a comped student gets their paid
// plan back the instant the grant expires, without a DB round-trip. The
// persisted restore is written by planExpiryService so DB-level
// `where: { plan: { in: [...] } }` filters also settle.

const isFuture = (value) => value && new Date(value) > new Date();

function getEffectivePlan(profile) {
  if (!profile) return 'spark';
  if (profile.plan === 'spark' || profile.plan === null) return 'spark';

  if (!profile.planEndDate || isFuture(profile.planEndDate)) return profile.plan;

  // Current period is over — hand back the plan the manual grant replaced.
  if (profile.fallbackPlan && isFuture(profile.fallbackEndDate)) return profile.fallbackPlan;
  return 'spark';
}

// What a student's plan fields should be once their current period has lapsed.
// Returns null when nothing needs to change. Used by the expiry sweep so the
// restore rule lives in exactly one place alongside getEffectivePlan.
function resolveExpiredPlan(profile) {
  const now = new Date();
  const expired = profile.plan !== 'spark'
    && profile.planEndDate
    && new Date(profile.planEndDate) <= now;
  if (!expired) return null;

  const restore = profile.fallbackPlan && isFuture(profile.fallbackEndDate);
  return restore
    ? { plan: profile.fallbackPlan, planEndDate: profile.fallbackEndDate, fallbackPlan: null, fallbackEndDate: null }
    : { plan: 'spark', planEndDate: null, fallbackPlan: null, fallbackEndDate: null };
}

module.exports = { getEffectivePlan, resolveExpiredPlan, isFuture };
