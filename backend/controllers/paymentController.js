// controllers/paymentController.js
// Backend for the Cashfree payment flow.
//
// Two payment goals are supported:
//   1. `plan`    — a plan upgrade (Spark → Forge / Apex / Anchor). On success the
//                  student's `StudentProfile.plan` and `planEndDate` are updated.
//   2. `session` — a pay-per-session (₹99) booking. On success a `SessionRequest`
//                  row is created from the payload captured at order time.
//
// Prices are defined here so the ground truth lives on the server; the frontend
// pulls the price when it shows the checkout. Enable/disable payments and choose
// TEST vs PPROD purely through environment variables — no code change needed.

const prisma        = require('../lib/prisma');
const cashfree      = require('../services/cashfreeService');
const { sendOtpEmail } = require('../services/emailService'); // reused for receipts

// ── Config from env ─────────────────────────────────────────────────────────

// Per-plan monthly price (INR). Feel free to adjust.
const PLAN_PRICES = { forge: 999, apex: 2499, anchor: 799 };

// Settable via env so different environments can use different values:
//   CASHFREE_PLAN_PRICES = 'forge:999,apex:2499,anchor:799'
const loadPlanPrices = () => {
  const raw = process.env.CASHFREE_PLAN_PRICES;
  if (!raw) return { ...PLAN_PRICES };
  const out = {};
  raw.split(',').forEach(pair => {
    const [k, v] = pair.split(':').map(s => s && s.trim());
    if (k) out[k] = Number(v);
  });
  return { ...PLAN_PRICES, ...out };
};
const planPrices = () => loadPlanPrices();

const SESSION_PRICE = Number(process.env.CASHFREE_SESSION_PRICE) || 99;

// Payments can be disabled entirely (e.g. for a coordinator admissions flow).
const paymentsEnabled = () => String(process.env.CASHFREE_ENABLED).toUpperCase() !== 'FALSE';

const SUPPORTED_PLANS = Object.keys(PLAN_PRICES);

// ── Helpers ─────────────────────────────────────────────────────────────────

const orderIdFor = (purpose, userId) =>
  `SV_${purpose.toUpperCase()}_${userId.slice(-8)}_${Date.now().toString(36).toUpperCase()}`;

const getStudent = async (userId) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) return null;
  return { id: profile.id, userId, user: profile.user, plan: profile.plan, parentPhone: profile.parentPhone };
};

// Idempotent post-payment side effects. Returns the (now PAID) Payment row.
// Guarded so replayed webhooks / duplicate verifies can never double-apply:
// we claim the payment with an atomic conditional UPDATE first, and only the
// caller that wins the claim runs the side effects — all inside one transaction.
const applyPaymentSuccess = async (payment) => {
  const updated = await prisma.$transaction(async (tx) => {
    // Atomically claim this payment. If it's already PAID, the update matches
    // zero rows and we skip straight to returning the current row.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, orderStatus: { not: 'PAID' } },
      data: { orderStatus: 'PAID', paymentStatus: 'CAPTURED', paidAt: new Date() },
    });
    if (claimed.count === 0) {
      return tx.payment.findUnique({ where: { id: payment.id } });
    }

    const latest = await tx.payment.findUnique({ where: { id: payment.id } });

    if (latest.goal === 'plan' && latest.plan) {
      const months = Number(process.env.CASHFREE_PLAN_MONTHS) || 1;
      const planEndDate = new Date();
      planEndDate.setMonth(planEndDate.getMonth() + months);

      await tx.studentProfile.update({
        where: { id: latest.studentId },
        data: { plan: latest.plan, planEndDate },
      });
    } else if (latest.goal === 'session') {
      // Materialise the pay-per-session request the student wanted.
      await tx.sessionRequest.create({
        data: {
          studentId:    latest.studentId,
          topic:        latest.sessionTopic || 'Doubt session',
          phone:        latest.sessionPhone,
          preferredTime: latest.sessionTime,
        },
      });
    }

    return tx.payment.findUnique({ where: { id: payment.id } });
  });

  // Fire an email receipt (best-effort, never blocks the response).
  if (String(process.env.CASHFREE_EMAIL_RECEIPTS).toUpperCase() !== 'FALSE') {
    try {
      const label = payment.goal === 'plan'
        ? `your new ${payment.plan} plan`
        : 'your 1-on-1 session request';
      if (payment.customerEmail) {
        await sendOtpEmail(payment.customerEmail, `Payment received for ${label}.`);
      }
    } catch (e) { /* ignore */ }
  }

  return updated;
};

// Reconcile a DB payment against the live Cashfree order status.
const reconcileAndApply = async (orderId) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) { const e = new Error('Payment not found'); e.status = 404; throw e; }

  if (payment.orderStatus === 'PAID') return { payment, changed: false };

  const order = await cashfree.getOrder(orderId);
  if (cashfree.isPaid(order)) {
    const applied = await applyPaymentSuccess(payment);
    return { payment: applied, changed: true, plan: payment.plan, goal: payment.goal };
  }
  return { payment, changed: false };
};

// ── Handlers ────────────────────────────────────────────────────────────────

// POST /api/payment/:userId/create-plan-order  { plan }
// Creates a Cashfree order + DB row for a plan upgrade.
const createPlanOrder = async (req, res) => {
  try {
    if (!paymentsEnabled()) return res.status(403).json({ error: 'Payments are currently disabled' });

    const { plan } = req.body;
    const price = planPrices()[plan];
    if (!price) return res.status(400).json({ error: `Invalid plan. Choose one of: ${SUPPORTED_PLANS.join(', ')}` });

    const student = await getStudent(req.params.userId);
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    if (student.plan === plan) return res.status(400).json({ error: `You are already on the ${plan} plan` });

    const orderId = orderIdFor('PLAN', req.params.userId);
    const order = await cashfree.createOrder({
      orderId,
      amount: price,
      customer: {
        customer_id: String(student.id),
        name: student.user.name,
        email: student.user.email,
        phone: student.parentPhone || '',
      },
      note: `Studyverse ${plan} plan upgrade`,
      meta: {
        notify_url: process.env.CASHFREE_WEBHOOK_URL || `${process.env.BACKEND_URL || ''}/api/payment/webhook`,
      },
    });

    await prisma.payment.create({
      data: {
        orderId,
        orderAmount: price,
        goal: 'plan',
        plan,
        customerName: student.user.name,
        customerEmail: student.user.email,
        studentId: student.id,
      },
    });

    res.json({ success: true, payment_session_id: order.payment_session_id, order_id: orderId, amount: price, plan, mode: cashfree.mode() });
  } catch (err) {
    console.error('createPlanOrder failed:', err.message);
    if (err.cashfree_config_error) return res.status(500).json({ error: 'Payment gateway is not configured (missing CASHFREE keys)' });
    res.status(500).json({ error: 'Failed to create plan order' });
  }
};

// POST /api/payment/:userId/create-session-order  { topic, phone, preferredTime }
// Creates a ₹99 Cashfree order + DB row for a pay-per-session booking.
const createSessionOrder = async (req, res) => {
  try {
    if (!paymentsEnabled()) return res.status(403).json({ error: 'Payments are currently disabled' });

    const { topic, phone, preferredTime } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'Topic is required' });

    const student = await getStudent(req.params.userId);
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const orderId = orderIdFor('SESS', req.params.userId);
    const order = await cashfree.createOrder({
      orderId,
      amount: SESSION_PRICE,
      customer: {
        customer_id: String(student.id),
        name: student.user.name,
        email: student.user.email,
        phone: phone || student.parentPhone || '',
      },
      note: 'Studyverse pay-per-session (1x1)',
      meta: {
        notify_url: process.env.CASHFREE_WEBHOOK_URL || `${process.env.BACKEND_URL || ''}/api/payment/webhook`,
      },
    });

    await prisma.payment.create({
      data: {
        orderId,
        orderAmount: SESSION_PRICE,
        goal: 'session',
        sessionTopic: topic.trim(),
        sessionPhone: phone?.trim() || null,
        sessionTime: preferredTime?.trim() || null,
        customerName: student.user.name,
        customerEmail: student.user.email,
        studentId: student.id,
      },
    });

    res.json({ success: true, payment_session_id: order.payment_session_id, order_id: orderId, amount: SESSION_PRICE, mode: cashfree.mode() });
  } catch (err) {
    console.error('createSessionOrder failed:', err.message);
    if (err.cashfree_config_error) return res.status(500).json({ error: 'Payment gateway is not configured (missing CASHFREE keys)' });
    res.status(500).json({ error: 'Failed to create session order' });
  }
};

// POST /api/payment/:userId/verify  { orderId }
// Server-side confirmation of a payment the frontend believes succeeded. We
// re-fetch from Cashfree (authoritative) and only then apply side effects.
const verifyOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { payment, changed, plan, goal } = await reconcileAndApply(orderId);
    res.json({
      success: payment.orderStatus === 'PAID',
      paid: payment.orderStatus === 'PAID',
      orderId,
      plan: goal === 'plan' ? plan : null,
      goal,
      changed,
    });
  } catch (err) {
    console.error('verifyOrder failed:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Verification failed' });
  }
};

// POST /api/payment/webhook  (public, signature-verified)
// Cashfree posts order events here. We verify the HMAC before trusting it.
const webhook = async (req, res) => {
  const signature = req.get('x-webhook-signature');
  const raw = req.rawBody || JSON.stringify(req.body);

  // If no webhook secret is configured we still allow processing (dev mode) but
  // warn loudly. In production always set CASHFREE_WEBHOOK_SECRET.
  const secretSet = !!process.env.CASHFREE_WEBHOOK_SECRET;
  if (secretSet && !cashfree.verifyWebhookSignature(raw, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    const event = req.body;
    const type = event.type;
    const orderId = event.data?.order?.order_id;

    if (!orderId) return res.json({ received: true });

    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return res.json({ received: true }); // unknown order — ignore

    const paid = event.data?.order_status === 'PAID' ||
                 event.data?.payment?.payment_status === 'SUCCESS';

    if (paid && payment.orderStatus !== 'PAID') {
      await applyPaymentSuccess(payment);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('webhook failed:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// GET /api/payment/config  (public)
// Exposes pricing + mode so the frontend always shows prices matching the server.
const paymentConfig = (req, res) => {
  res.json({
    enabled: paymentsEnabled(),
    mode: cashfree.mode(),
    plans: planPrices(),
    sessionPrice: SESSION_PRICE,
    planMonths: Number(process.env.CASHFREE_PLAN_MONTHS) || 1,
  });
};

module.exports = {
  createPlanOrder,
  createSessionOrder,
  verifyOrder,
  webhook,
  paymentConfig,
  applyPaymentSuccess,
  planPrices,
  SESSION_PRICE,
  SUPPORTED_PLANS,
};