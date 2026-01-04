const { verifyAccessToken } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Middleware to authenticate requests using JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: {
          message: "Authorization token required",
        },
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = verifyAccessToken(token);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          username: true,
          phone: true,
          profile_photo: true,
          date_of_birth: true,
          gender: true,
          user_type: true,
          login_type: true,
          is_verified: true,
          is_active: true,
          last_login: true,
          created_at: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          error: {
            message: "User not found",
          },
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          error: {
            message: "Account is deactivated",
          },
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        error: {
          message: "Invalid or expired token",
        },
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      error: {
        message: "Authentication failed",
      },
    });
  }
}

module.exports = {
  authenticate,
};

