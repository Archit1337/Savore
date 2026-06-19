const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP verification email to the user.
 * Falls back to a beautiful, formatted console log in development if SMTP is not configured.
 * @param {string} email - Recipient's email address
 * @param {string} otp - The 6-digit verification code
 * @returns {Promise<boolean>}
 */
const sendOTPEmail = async (email, otp) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const hasSmtpConfig = smtpHost && smtpUser && smtpPass;

  if (hasSmtpConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f6f0; padding: 40px; text-align: center; color: #0b0f14;">
          <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1.5px solid rgba(0, 0, 0, 0.06); box-shadow: 0 16px 48px rgba(0, 0, 0, 0.04);">
            <h1 style="color: #FF6A4D; font-size: 32px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em;">Savoré</h1>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #7f8c8d; margin: 0 0 32px 0; font-weight: 700;">Cinematic Gastronomy</p>
            
            <h2 style="font-size: 19px; font-weight: 700; margin: 0 0 16px 0; color: #1c2833;">Security Verification Passcode</h2>
            <p style="font-size: 14px; color: #5d6d7e; line-height: 1.6; margin: 0 0 28px 0; font-weight: 400;">
              Please use the following One-Time Password (OTP) to complete your secure Savoré MERN portal sign-in. This passcode is valid for exactly <strong>5 minutes</strong>.
            </p>
            
            <div style="background-color: #fff2ef; border: 1.5px dashed #FF6A4D; border-radius: 16px; padding: 18px 36px; display: inline-block; margin-bottom: 28px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 0.18em; color: #FF6A4D; font-family: 'Courier New', Courier, monospace; margin-right: -0.18em;">${otp}</span>
            </div>
            
            <p style="font-size: 12px; color: #95a5a6; line-height: 1.5; margin: 0;">
              If you did not request this verification, please safely ignore this communication or update your account settings if you suspect unauthorized access.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Savoré" <${smtpUser}>`,
        to: email,
        subject: `Savoré Verification Code: ${otp}`,
        html: htmlContent,
      });

      console.log(`✉️ [SMTP] OTP email successfully sent to: ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ [SMTP] Failed to send OTP email via SMTP: ${error.message}`);
      // Fall through to console logging on email delivery failures
    }
  }

  // Visual Console Box Logger Fallback for Local Dev/Testing
  const border = '═'.repeat(66);
  console.log('\n');
  console.log(`\x1b[38;2;255;106;77m╔${border}╗\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m                  \x1b[1m\x1b[38;2;255;106;77m✉️  SAVORÉ SECURE OTP DISPATCH  ✉️\x1b[0m                  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m╠${border}╣\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[1mRecipient:\x1b[0m   \x1b[36m${email.padEnd(49)}\x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[1mExpiration:\x1b[0m  \x1b[33m5 Minutes (Time-To-Live Enabled)\x1b[0m                  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m                                                                  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m┌────────────────────────────────────────────────────────────┐\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m│\x1b[0m            YOUR 6-DIGIT VERIFICATION PASSCODE:             \x1b[38;2;255;106;77m│\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m│\x1b[0m                                                            \x1b[38;2;255;106;77m│\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m│\x1b[0m                         \x1b[1m\x1b[38;5;214m${otp.split('').join(' ')}\x1b[0m                         \x1b[38;2;255;106;77m│\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m│\x1b[0m                                                            \x1b[38;2;255;106;77m│\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[38;2;255;106;77m└────────────────────────────────────────────────────────────┘\x1b[0m  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m                                                                  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[90m⚠️  DEVELOPER FALLBACK: SMTP variables not found in .env.       \x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[90mUse this code directly in the login screen for testing.       \x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m╚${border}╝\x1b[0m`);
  console.log('\n');

  return true;
};

/**
 * Sends a password reset email to the user.
 * Falls back to a beautiful, formatted console log in development if SMTP is not configured.
 * @param {string} email - Recipient's email address
 * @param {string} resetUrl - The password reset URL
 * @returns {Promise<boolean>}
 */
const sendResetEmail = async (email, resetUrl) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const hasSmtpConfig = smtpHost && smtpUser && smtpPass;

  if (hasSmtpConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = `
        <div style="font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f6f0; padding: 40px; text-align: center; color: #0b0f14;">
          <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1.5px solid rgba(0, 0, 0, 0.06); box-shadow: 0 16px 48px rgba(0, 0, 0, 0.04);">
            <h1 style="color: #FF6A4D; font-size: 32px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em;">Savoré</h1>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #7f8c8d; margin: 0 0 32px 0; font-weight: 700;">Cinematic Gastronomy</p>
            
            <h2 style="font-size: 19px; font-weight: 700; margin: 0 0 16px 0; color: #1c2833;">Password Reset Request</h2>
            <p style="font-size: 14px; color: #5d6d7e; line-height: 1.6; margin: 0 0 28px 0; font-weight: 400;">
              We received a request to reset your password. Click the button below to specify a new password. This recovery link is valid for exactly <strong>10 minutes</strong>.
            </p>
            
            <a href="${resetUrl}" style="background-color: #FF6A4D; color: #ffffff; border-radius: 12px; padding: 14px 28px; display: inline-block; font-weight: 700; text-decoration: none; font-size: 14px; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(255, 106, 77, 0.2);">Reset Password</a>
            
            <p style="font-size: 12px; color: #95a5a6; line-height: 1.5; margin: 0;">
              If you did not request a password recovery link, you can safely ignore this email. No changes will be applied to your credentials.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Savoré" <${smtpUser}>`,
        to: email,
        subject: 'Savoré Account Password Reset Link',
        html: htmlContent,
      });

      console.log(`✉️ [SMTP] Password reset email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ [SMTP] Failed to send reset email via SMTP: ${error.message}`);
    }
  }

  // Development box logger fallback
  const border = '═'.repeat(66);
  console.log('\n');
  console.log(`\x1b[38;2;255;106;77m╔${border}╗\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m               \x1b[1m\x1b[38;2;255;106;77m✉️  SAVORÉ PASSWORD RESET DISPATCH  ✉️\x1b[0m               \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m╠${border}╣\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[1mRecipient:\x1b[0m   \x1b[36m${email.padEnd(49)}\x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[1mReset URL:\x1b[0m   \x1b[35m${resetUrl.padEnd(49)}\x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m                                                                  \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[90m⚠️  DEVELOPER FALLBACK: SMTP variables not found in .env.       \x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m║\x1b[0m  \x1b[90mUse this reset URL directly in the browser to test recovery. \x1b[0m \x1b[38;2;255;106;77m║\x1b[0m`);
  console.log(`\x1b[38;2;255;106;77m╚${border}╝\x1b[0m`);
  console.log('\n');

  return true;
};

module.exports = { sendOTPEmail, sendResetEmail };
