const axios = require('axios');

// Sends a 6-digit OTP to the given email via Brevo API
const sendOtpEmail = async (toEmail, otp, purpose = 'registration') => {
  const isReset = purpose === 'reset';
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name:  'Studyverse',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: toEmail }],
        subject: isReset ? 'Your Studyverse password reset OTP' : 'Your Studyverse OTP',
        htmlContent: isReset
          ? `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#0F1F3D;margin-bottom:8px;">Reset your password</h2>
            <p style="color:#4A5568;margin-bottom:24px;">Use the OTP below to set a new password. It expires in 5 minutes.</p>
            <div style="background:#F5EFE3;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#0F1F3D;">${otp}</span>
            </div>
            <p style="color:#8896B3;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>`
          : `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
            <h2 style="color:#0F1F3D;margin-bottom:8px;">Verify your email</h2>
            <p style="color:#4A5568;margin-bottom:24px;">Use the OTP below to complete your registration. It expires in 5 minutes.</p>
            <div style="background:#F5EFE3;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#0F1F3D;">${otp}</span>
            </div>
            <p style="color:#8896B3;font-size:13px;">If you didn't request this, ignore this email.</p>
          </div>`,
      },
      {
        headers: {
          'api-key':      process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`OTP sent to ${toEmail} (${purpose})`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.response?.data || error.message);
    return false;
  }
};

module.exports = { sendOtpEmail };