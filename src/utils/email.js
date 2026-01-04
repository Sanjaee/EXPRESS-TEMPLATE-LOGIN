const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generate 6-digit OTP code
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Email verification HTML template
 */
function getVerificationEmailTemplate(username, otpCode) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 24px;">Welcome to Zacode!</h1>
            </div>

            <!-- Content -->
            <div style="margin-bottom: 30px;">
              <p style="margin-bottom: 15px;">Hello <strong>${username}</strong>,</p>
              <p style="margin-bottom: 15px;">Thank you for signing up with Zacode! We're thrilled to have you on board.</p>
              <p style="margin-bottom: 15px;">To ensure the security of your account and access all the features, please use the following OTP to verify your email address:</p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 25px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                  ${otpCode}
                </span>
                <!-- Security Notice -->
                <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
                  Kode ini akan kadaluarsa dalam 10 menit
                </p>
              </div>
              
              <p style="margin-bottom: 15px;">Once your email is verified, you'll be ready to dive into Zacode's exciting features.</p>
              <p style="margin-bottom: 15px;">If you did not register with us, please ignore this email or contact our support team at <a href="mailto:support@zacode.com" style="color: #007bff; text-decoration: none;">support@zacode.com</a>.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="margin-bottom: 10px;">Thank you for choosing Zacode!</p>
              <p style="margin: 0; color: #666666;">Best regards,<br>Zacode Team</p>
            </div>
          </div>

          <!-- Disclaimer -->
          <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Password reset HTML template
 */
function getPasswordResetEmailTemplate(username, otpCode) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>

            <!-- Content -->
            <div style="margin-bottom: 30px;">
              <p style="margin-bottom: 15px;">Hi <strong>${username}</strong>,</p>
              <p style="margin-bottom: 15px;">Tidak perlu khawatir! Kami paham terkadang kita bisa lupa password. Kami siap membantu Anda mendapatkan akses kembali ke akun Anda.</p>
              <p style="margin-bottom: 15px;">Gunakan kode OTP di bawah ini untuk mereset password Anda:</p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 25px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                  ${otpCode}
                </span>
                <!-- Security Notice -->
                <p style="margin: 15px 0 0 0; color: #dc3545; font-size: 14px;">
                  Kode ini akan kadaluarsa dalam 10 menit demi keamanan akun Anda
                </p>
              </div>

              <!-- Security Reminders -->
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  🔒 Demi keamanan:
                  <br>• Jangan bagikan kode ini kepada siapapun
                  <br>• Tim Zacode tidak akan pernah meminta kode ini melalui telepon atau email
                </p>
              </div>

              <p style="margin-bottom: 15px;">Jika Anda tidak meminta reset password, mohon abaikan email ini atau segera hubungi tim support kami di <a href="mailto:support@zacode.com" style="color: #007bff; text-decoration: none;">support@zacode.com</a> untuk melaporkan aktivitas mencurigakan.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="margin-bottom: 10px;">Terima kasih telah mempercayai Zacode</p>
              <p style="margin: 0; color: #666666;">Salam hangat,<br>Tim Zacode</p>
            </div>
          </div>

          <!-- Disclaimer -->
          <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send OTP via email using Gmail SMTP
 */
async function sendOTP(email, otpCode, purpose = "email_verification", username = null) {
  try {
    // Extract username from email if not provided
    const displayName = username || email.split("@")[0];

    const subject = purpose === "password_reset" 
      ? "Reset Password - Zacode Account Recovery" 
      : "Verify Your Email Address to Complete Registration";
    
    const htmlTemplate = purpose === "password_reset"
      ? getPasswordResetEmailTemplate(displayName, otpCode)
      : getVerificationEmailTemplate(displayName, otpCode);

    const mailOptions = {
      from: `"Zacode Support" <${process.env.EMAIL_USER || "gamingafriza005@gmail.com"}>`,
      to: email,
      subject: subject,
      html: htmlTemplate,
      text: purpose === "password_reset"
        ? `Hi ${displayName},\n\nYour password reset OTP is: ${otpCode}. This code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
        : `Hello ${displayName},\n\nYour email verification OTP is: ${otpCode}. This code will expire in 10 minutes.\n\nThank you for signing up with Zacode!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a Gmail sending limit error
    if (errorMessage.includes("Daily user sending limit exceeded")) {
      throw new Error("EMAIL_LIMIT_EXCEEDED");
    }
    
    // Check for other common email errors
    const errorCode = error?.code;
    if (errorCode === "EAUTH" || errorCode === "EENVELOPE") {
      throw new Error("EMAIL_CONFIG_ERROR");
    }
    
    // Generic email error
    throw new Error("EMAIL_SEND_ERROR");
  }
}

/**
 * Send email verification link (for legacy support)
 */
async function sendVerificationEmail(email, token, username = null) {
  try {
    const displayName = username || email.split("@")[0];
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333333; margin: 0; font-size: 24px;">Verify Your Email Address</h1>
              </div>
              <div style="margin-bottom: 30px;">
                <p style="margin-bottom: 15px;">Hello <strong>${displayName}</strong>,</p>
                <p style="margin-bottom: 15px;">Please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                </div>
                <p style="margin-bottom: 15px; color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="margin-bottom: 15px; color: #007bff; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                <p style="margin-bottom: 15px; color: #dc3545; font-size: 14px;">This link will expire in 24 hours.</p>
              </div>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; color: #666666;">Best regards,<br>Zacode Team</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Zacode Support" <${process.env.EMAIL_USER || "gamingafriza005@gmail.com"}>`,
      to: email,
      subject: "Verify Your Email Address",
      html: htmlTemplate,
      text: `Hello ${displayName},\n\nPlease click this link to verify your email: ${verificationUrl}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Daily user sending limit exceeded")) {
      throw new Error("EMAIL_LIMIT_EXCEEDED");
    }
    
    const errorCode = error?.code;
    if (errorCode === "EAUTH" || errorCode === "EENVELOPE") {
      throw new Error("EMAIL_CONFIG_ERROR");
    }
    
    throw new Error("EMAIL_SEND_ERROR");
  }
}

module.exports = {
  generateOTP,
  sendOTP,
  sendVerificationEmail,
  transporter,
};

