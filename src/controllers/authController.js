const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword } = require("../utils/bcrypt");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt");
const { generateOTP, sendOTP, sendVerificationEmail } = require("../utils/email");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { full_name, email, password, user_type = "member", phone, gender, date_of_birth } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: {
          message: "full_name, email, and password are required",
        },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: {
          message: "Password must be at least 8 characters",
        },
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.login_type === "google") {
        throw new Error("Email already registered with Google. Please use Google Sign In.");
      } else {
        throw new Error("Email already registered with password. Please login with email and password.");
      }
    }

    // Check username if provided
    if (req.body.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: req.body.username },
      });
      if (existingUsername) {
        throw new Error("Username already taken");
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        full_name,
        username: req.body.username || null,
        password: hashedPassword,
        user_type,
        phone: phone || null,
        gender: gender || null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        login_type: "credential",
        is_verified: false,
      },
    });

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.create({
      data: {
        email: user.email,
        otp_code: otpCode,
        purpose: "email_verification",
        expires_at: expiresAt,
        user_id: user.id,
      },
    });

    // Send OTP email
    await sendOTP(user.email, otpCode, "email_verification", user.full_name);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      data: {
        message: "Registration successful. Please verify your email.",
        user: userWithoutPassword,
        requires_verification: true,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === "P2002") {
      // Prisma unique constraint error
      return res.status(400).json({
        error: {
          message: error.meta?.target?.includes("email")
            ? "Email already registered"
            : "Username already taken",
        },
      });
    }

    res.status(400).json({
      error: {
        message: error.message || "Registration failed",
      },
    });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: "Email and password are required",
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
    }

    // Check if user registered with Google
    if (user.login_type === "google") {
      return res.status(401).json({
        error: {
          message: "Email already registered with Google. Please use Google Sign In.",
        },
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      // Generate new OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete old OTPs for this email
      await prisma.otp.deleteMany({
        where: {
          email: user.email,
          purpose: "email_verification",
        },
      });

      // Create new OTP
      await prisma.otp.create({
        data: {
          email: user.email,
          otp_code: otpCode,
          purpose: "email_verification",
          expires_at: expiresAt,
          user_id: user.id,
        },
      });

      // Send OTP
      await sendOTP(user.email, otpCode, "email_verification", user.full_name);

      // Generate verification token (for legacy support)
      const verificationToken = crypto.randomBytes(32).toString("hex");

      return res.status(200).json({
        data: {
          requires_verification: true,
          verification_token: verificationToken,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            username: user.username,
            profile_photo: user.profile_photo,
            user_type: user.user_type,
            is_verified: user.is_verified,
            login_type: user.login_type,
            created_at: user.created_at,
          },
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        message: "Login failed",
      },
    });
  }
}

/**
 * Verify OTP
 */
async function verifyOTP(req, res) {
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({
        error: {
          message: "Email and OTP code are required",
        },
      });
    }

    // Find OTP
    const otp = await prisma.otp.findFirst({
      where: {
        email,
        otp_code,
        purpose: "email_verification",
        used: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!otp) {
      return res.status(400).json({
        error: {
          message: "Invalid OTP code",
        },
      });
    }

    // Check if expired
    if (new Date() > otp.expires_at) {
      return res.status(400).json({
        error: {
          message: "OTP code has expired",
        },
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Update user as verified
    const user = await prisma.user.update({
      where: { email },
      data: { is_verified: true },
    });

    // Delete all used OTPs for this email
    await prisma.otp.deleteMany({
      where: {
        email,
        purpose: "email_verification",
        used: true,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      error: {
        message: "OTP verification failed",
      },
    });
  }
}

/**
 * Resend OTP
 */
async function resendOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          message: "Email is required",
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
        },
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete old unused OTPs
    await prisma.otp.deleteMany({
      where: {
        email,
        purpose: "email_verification",
        used: false,
      },
    });

    // Create new OTP
    await prisma.otp.create({
      data: {
        email: user.email,
        otp_code: otpCode,
        purpose: "email_verification",
        expires_at: expiresAt,
        user_id: user.id,
      },
    });

    // Send OTP
    await sendOTP(user.email, otpCode, "email_verification", user.full_name);

    res.json({
      data: {
        message: "OTP has been resent to your email",
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      error: {
        message: "Failed to resend OTP",
      },
    });
  }
}

/**
 * Verify email via token (legacy support)
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: {
          message: "Token is required",
        },
      });
    }

    // For now, we'll treat token as OTP code (6 digits)
    // In production, you might want to use JWT tokens stored in database
    const otp = await prisma.otp.findFirst({
      where: {
        otp_code: token,
        purpose: "email_verification",
        used: false,
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: true,
      },
    });

    if (!otp) {
      return res.status(400).json({
        error: {
          message: "Invalid or expired verification token",
        },
      });
    }

    if (new Date() > otp.expires_at) {
      return res.status(400).json({
        error: {
          message: "Verification token has expired",
        },
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Update user as verified
    const user = await prisma.user.update({
      where: { id: otp.user_id },
      data: { is_verified: true },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      error: {
        message: "Email verification failed",
      },
    });
  }
}

/**
 * Google OAuth
 */
async function googleOAuth(req, res) {
  try {
    const { email, full_name, profile_photo, google_id } = req.body;

    if (!email || !google_id) {
      return res.status(400).json({
        error: {
          message: "Email and google_id are required",
        },
      });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists - check login type
      if (user.login_type === "credential" && user.password) {
        throw new Error("Email already registered with password. Please login with email and password.");
      }

      // Check if same Google account
      if (user.google_id && user.google_id !== google_id) {
        throw new Error("Email already registered with different Google account.");
      }

      // Update user with Google info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          google_id,
          profile_photo: profile_photo || user.profile_photo,
          full_name: full_name || user.full_name,
          login_type: "google",
          is_verified: true, // Google emails are verified
          last_login: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          full_name: full_name || email.split("@")[0],
          profile_photo: profile_photo || null,
          google_id,
          login_type: "google",
          is_verified: true, // Google emails are verified
          last_login: new Date(),
        },
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(400).json({
      error: {
        message: error.message || "Google OAuth failed",
      },
    });
  }
}

/**
 * Refresh access token
 */
async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: {
          message: "Refresh token is required",
        },
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch (error) {
      return res.status(401).json({
        error: {
          message: "Invalid or expired refresh token",
        },
      });
    }

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refresh_token },
      include: { user: true },
    });

    if (!tokenRecord || new Date() > tokenRecord.expires_at) {
      // Delete invalid token
      if (tokenRecord) {
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
      }

      return res.status(401).json({
        error: {
          message: "Invalid or expired refresh token",
        },
      });
    }

    const user = tokenRecord.user;

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Save new refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      error: {
        message: "Token refresh failed",
      },
    });
  }
}

/**
 * Request password reset
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          message: "Email is required",
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user || !user.password) {
      return res.json({
        data: {
          message: "If the email exists, a password reset OTP has been sent",
        },
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old password reset OTPs
    await prisma.otp.deleteMany({
      where: {
        email,
        purpose: "password_reset",
      },
    });

    // Create new OTP
    await prisma.otp.create({
      data: {
        email: user.email,
        otp_code: otpCode,
        purpose: "password_reset",
        expires_at: expiresAt,
        user_id: user.id,
      },
    });

    // Send OTP
    await sendOTP(user.email, otpCode, "password_reset", user.full_name);

    res.json({
      data: {
        message: "If the email exists, a password reset OTP has been sent",
      },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      error: {
        message: "Failed to process password reset request",
      },
    });
  }
}

/**
 * Verify reset password OTP (just verify, don't reset password yet)
 */
async function verifyOtpReset(req, res) {
  try {
    const { email, otp_code } = req.body;

    if (!email || !otp_code) {
      return res.status(400).json({
        error: {
          message: "Email and OTP code are required",
        },
      });
    }

    // Find OTP
    const otp = await prisma.otp.findFirst({
      where: {
        email,
        otp_code,
        purpose: "password_reset",
        used: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!otp) {
      return res.status(400).json({
        error: {
          message: "Invalid or expired OTP code",
        },
      });
    }

    if (new Date() > otp.expires_at) {
      return res.status(400).json({
        error: {
          message: "OTP code has expired",
        },
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    res.json({
      data: {
        message: "OTP verified successfully",
      },
    });
  } catch (error) {
    console.error("Verify OTP reset error:", error);
    res.status(500).json({
      error: {
        message: "OTP verification failed",
      },
    });
  }
}

/**
 * Verify reset password OTP and reset password
 */
async function verifyResetPassword(req, res) {
  try {
    const { email, otp_code, new_password } = req.body;

    if (!email || !otp_code || !new_password) {
      return res.status(400).json({
        error: {
          message: "Email, OTP code, and new password are required",
        },
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: {
          message: "Password must be at least 8 characters",
        },
      });
    }

    if (new_password.length > 128) {
      return res.status(400).json({
        error: {
          message: "Password must be at most 128 characters",
        },
      });
    }

    // Find OTP (check both used and unused, as it might have been verified already)
    const otp = await prisma.otp.findFirst({
      where: {
        email,
        otp_code,
        purpose: "password_reset",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (!otp) {
      return res.status(400).json({
        error: {
          message: "Invalid OTP code",
        },
      });
    }

    if (new Date() > otp.expires_at) {
      return res.status(400).json({
        error: {
          message: "OTP code has expired",
        },
      });
    }

    // Mark OTP as used if not already used
    if (!otp.used) {
      await prisma.otp.update({
        where: { id: otp.id },
        data: { used: true },
      });
    }

    // Update password
    const hashedPassword = await hashPassword(new_password);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete all used password reset OTPs
    await prisma.otp.deleteMany({
      where: {
        email,
        purpose: "password_reset",
        used: true,
      },
    });

    res.json({
      data: {
        message: "Password has been reset successfully",
      },
    });
  } catch (error) {
    console.error("Verify reset password error:", error);
    res.status(500).json({
      error: {
        message: "Password reset failed",
      },
    });
  }
}

/**
 * Reset password (alternative endpoint using token)
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: {
          message: "Token and newPassword are required",
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          message: "Password must be at least 8 characters",
        },
      });
    }

    // Find OTP by token (treating token as OTP code)
    const otp = await prisma.otp.findFirst({
      where: {
        otp_code: token,
        purpose: "password_reset",
        used: false,
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: true,
      },
    });

    if (!otp || new Date() > otp.expires_at) {
      return res.status(400).json({
        error: {
          message: "Invalid or expired token",
        },
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    const user = await prisma.user.update({
      where: { id: otp.user_id },
      data: { password: hashedPassword },
    });

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refresh_token,
        user_id: user.id,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      data: {
        user: userWithoutPassword,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      error: {
        message: "Password reset failed",
      },
    });
  }
}

/**
 * Get current user (me)
 */
async function getMe(req, res) {
  try {
    // User is attached by auth middleware
    const user = req.user;

    res.json({
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      error: {
        message: "Failed to fetch user data",
      },
    });
  }
}

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  verifyEmail,
  googleOAuth,
  refreshToken,
  forgotPassword,
  verifyOtpReset,
  verifyResetPassword,
  resetPassword,
  getMe,
};

