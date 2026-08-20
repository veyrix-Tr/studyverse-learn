// services/auditLogService.js
// Writes entries to the AdminAccessLog table — the real audit trail surfaced
// on the dashboard's "Super Admin Access Log". Fire-and-forget: logging is
// best-effort and must never block the action it records.

const prisma = require('../lib/prisma');

const logAction = async ({ adminUserId, action, target, metadata }) => {
  try {
    const admin = adminUserId
      ? await prisma.adminProfile.findUnique({ where: { userId: adminUserId }, select: { id: true } })
      : null;
    await prisma.adminAccessLog.create({
      data: {
        action,
        target: target ?? null,
        metadata: metadata ?? null,
        adminId: admin?.id ?? null,
      },
    });
  } catch (err) {
    console.error('audit log write failed:', err.message);
  }
};

module.exports = { logAction };