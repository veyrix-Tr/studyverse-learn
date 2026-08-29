// services/cashfreeService.js
// Thin wrapper around Cashfree Payment Gateway (PG) v2 REST API.
//
// All credentials come from environment variables:
//   CASHFREE_MODE          = "TEST" (sandbox) | "PROD" (live)
//   CASHFREE_APP_ID        = Cashfree client id (x-client-id)
//   CASHFREE_SECRET_KEY    = Cashfree client secret (x-client-secret) — also used for webhook signature verification
//
// In TEST mode we talk to https://sandbox.cashfree.com, in PROD https://api.cashfree.com.
// When CASHFREE_MODE is not TEST, we default to PROD so live traffic is never
// accidentally routed through the sandbox.

const crypto = require('crypto');
const axios  = require('axios');

const CASHFREE_BASE_URLS = {
  TEST: 'https://sandbox.cashfree.com',
  PROD: 'https://api.cashfree.com',
};

const CASHFREE_API_VERSION = '2022-09-01';

// ── Mode helpers ────────────────────────────────────────────────────────────

const mode = () => String(process.env.CASHFREE_MODE || '').toUpperCase() === 'TEST' ? 'TEST' : 'PROD';
const baseURL = () => CASHFREE_BASE_URLS[mode()];

// Config is read lazily so tests / env overrides work after require-time.
// In PROD mode, validates that keys are not sandbox credentials.
const config = () => {
  const appId     = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiVersion = process.env.CASHFREE_API_VERSION || CASHFREE_API_VERSION;

  if (mode() === 'PROD') {
    if (!appId || !secretKey) {
      throw new Error('CASHFREE: PROD mode requires CASHFREE_APP_ID and CASHFREE_SECRET_KEY');
    }
    if (String(appId).startsWith('TEST') || String(secretKey).startsWith('cfsk_ma_test')) {
      const err = new Error('CASHFREE: PROD mode active but keys look like TEST/sandbox credentials. Aborting.');
      err.cashfree_config_error = true;
      throw err;
    }
  }

  return { appId, secretKey, apiVersion };
};

const headers = () => {
  const { appId, secretKey, apiVersion } = config();
  return {
    'x-client-id':     appId,
    'x-client-secret': secretKey,
    'x-api-version':   apiVersion,
    'Content-Type':    'application/json',
  };
};

// ── Order management ────────────────────────────────────────────────────────

// Cashfree requires customer_phone to be a 10-digit Indian number in production;
// anything else causes a 422 on order creation. We normalise to the last 10
// digits and fall back to a configurable placeholder so a missing/invalid number
// never blocks a payment.
const normalizePhone = (p) => {
  const digits = String(p || '').replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : (process.env.CASHFREE_DEFAULT_PHONE || '9999999999');
};

// Creates a Cashfree PG order and returns the payment_session_id (used by the
// frontend to open the Cashfree checkout SDK). Full order object also returned.
const createOrder = async ({
  orderId,
  amount,            // number in INR paise-free form e.g. 99, 999
  currency = 'INR',
  customer,          // { customer_id, name, email, phone }
  note = '',
  meta = {},         // { return_url?, notify_url?, payment_methods? }
}) => {
  if (!config().appId || !config().secretKey) {
    const err = new Error('CASHFREE_APP_ID / CASHFREE_SECRET_KEY are not set');
    err.cashfree_config_error = true;
    throw err;
  }

  const body = {
    order_id:     String(orderId),
    order_amount: amount,
    order_currency: currency,
    order_note:   note,
    customer_details: {
      customer_id:   String(customer.customer_id),
      customer_name: customer.name || 'Student',
      customer_email: customer.email || '',
      customer_phone: normalizePhone(customer.phone),
    },
    order_meta: meta,
  };

  const res = await axios.post(`${baseURL()}/pg/orders`, body, { headers: headers() });
  return res.data; // { payment_session_id, order_status, order_id, ... }
};

// Fetch a single order back from Cashfree to confirm its authoritative status.
const getOrder = async (orderId) => {
  const res = await axios.get(`${baseURL()}/pg/orders/${orderId}`, { headers: headers() });
  return res.data; // { order_status, order_amount, order_currency, order_id, payments? }
};

// ── Signature / webhook verification ────────────────────────────────────────

// Cashfree signs webhooks as: Base64(HMAC-SHA256(timestamp + rawBody, clientSecret))
// The signature arrives in "x-webhook-signature", timestamp in "x-webhook-timestamp".
// The secret used is the PG Client Secret (CASHFREE_SECRET_KEY), NOT a separate key.
const verifyWebhookSignature = (rawBody, signature, timestamp) => {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !rawBody || !signature || !timestamp) return false;

  const signedPayload = String(timestamp) + String(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64');

  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Returns true once the order is paid (mirrors logic used on the frontend via
// the Cashfree SDK's onPaymentSuccess callback). Always returns a strict boolean.
const isPaid = (order) => {
  if (!order) return false;
  const status = order.order_status || order.orderStatus;
  return String(status || '').toUpperCase() === 'PAID';
};

module.exports = {
  createOrder,
  getOrder,
  verifyWebhookSignature,
  isPaid,
  normalizePhone,
  mode,
  baseURL,
  config,
};