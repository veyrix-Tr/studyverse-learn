// routes/paymentRoutes.js
// Mounted at /api/payment/:userId with requireAuth + validateUrlUser in server.js.
// The public /api/payment/webhook endpoint is registered directly in server.js.

const express = require('express');
const router  = express.Router();

const {
  createPlanOrder,
  createSessionOrder,
  verifyOrder,
} = require('../controllers/paymentController');

// POST /api/payment/:userId/create-plan-order — start a plan upgrade
router.post('/create-plan-order', createPlanOrder);

// POST /api/payment/:userId/create-session-order — pay ₹99 for a 1-on-1 session
router.post('/create-session-order', createSessionOrder);

// POST /api/payment/:userId/verify — confirm a payment the client completed
router.post('/verify', verifyOrder);

module.exports = router;