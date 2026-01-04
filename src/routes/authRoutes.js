const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);
router.post("/resend-otp", authController.resendOTP);
router.post("/verify-email", authController.verifyEmail);
router.post("/google-oauth", authController.googleOAuth);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp-reset", authController.verifyOtpReset);
router.post("/verify-reset-password", authController.verifyResetPassword);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/me", authenticate, authController.getMe);

module.exports = router;

