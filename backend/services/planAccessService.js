// Returns the plan that should be enforced for a given StudentProfile,
// lazily downgrading an expired premium plan to 'spark' in-memory.
// The persisted downgrade is handled by the plan-expiry sweep (cronService +
// cronRoutes) so DB-level `where: { plan: { in: [...] } }` filters also settle.
function getEffectivePlan(profile) {
  if (!profile) return 'spark';
  if (profile.plan === 'spark' || profile.plan === null) return 'spark';
  if (profile.planEndDate && new Date(profile.planEndDate) < new Date()) {
    return 'spark';
  }
  return profile.plan;
}

module.exports = { getEffectivePlan };