// lib/zoom.js
// Thin wrapper around Zoom's Server-to-Server OAuth API (meeting creation)
// and the Meeting SDK signature (embedded join). All env vars are read lazily
// inside each function so a missing ZOOM_* config never crashes server boot —
// it only fails the specific Zoom-dependent request that needs it.

const axios = require('axios');
const jwt = require('jsonwebtoken');

class ZoomConfigError extends Error {}

let cachedToken = null; // { token, expiresAt }

async function getS2SToken() {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new ZoomConfigError('Zoom Server-to-Server OAuth credentials not configured');
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
  const { data } = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    null,
    { headers: { Authorization: `Basic ${basic}` } }
  );

  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

// All meetings are created under the single Zoom account/user tied to the
// S2S app ('me'). The embedded SDK's `role` claim (see generateSdkSignature)
// controls who acts as host per-join, not separate Zoom user accounts.
async function createMeeting({ topic, startTime, durationMin }) {
  const token = await getS2SToken();
  const { data } = await axios.post(
    'https://api.zoom.us/v2/users/me/meetings',
    {
      topic,
      type: 2, // scheduled meeting
      start_time: startTime, // ISO 8601 UTC
      duration: durationMin,
      timezone: 'Asia/Kolkata',
      password: '', // no passcode — Waiting Room below is the security option instead
      settings: {
        join_before_host: false,
        waiting_room: true, // required: Zoom forces at least one security option (pw/waiting room/auth)
        approval_type: 2,
        meeting_authentication: false,
        mute_upon_entry: true,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    zoomMeetingId: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
    zoomPassword: data.password,
  };
}

// Fetches the live meeting record so the join flow can use the current
// plain-text password rather than a possibly-stale cached copy.
async function getMeeting(meetingId) {
  const token = await getS2SToken();
  const { data } = await axios.get(
    `https://api.zoom.us/v2/meetings/${meetingId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data; // includes .password (plain-text)
}

// role: 1 = host (faculty), 0 = attendee (student)
// The Meeting SDK JWT uses the Meeting SDK app's Client ID + Client Secret.
// These are stored in ZOOM_SDK_KEY / ZOOM_SDK_SECRET (the SDK Key/Secret names
// are deprecated, but for a Meeting SDK app the SDK Key == Client ID and the
// SDK Secret == Client Secret, so reusing these vars is correct).
function generateSdkSignature({ meetingNumber, role }) {
  const { ZOOM_SDK_KEY, ZOOM_SDK_SECRET } = process.env;
  if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
    throw new ZoomConfigError('Zoom Meeting SDK credentials not configured');
  }

  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2hr validity — comfortably over any class duration

  const payload = {
    appKey: ZOOM_SDK_KEY, // == the Meeting SDK app's Client ID
    mn: Number(meetingNumber),
    role,
    iat,
    exp,
    tokenExp: exp,
  };

  return jwt.sign(payload, ZOOM_SDK_SECRET, { algorithm: 'HS256' });
}

module.exports = { createMeeting, getMeeting, generateSdkSignature, ZoomConfigError };
