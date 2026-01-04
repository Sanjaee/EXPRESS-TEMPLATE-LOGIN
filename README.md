# Express Authentication API

Backend API untuk autentikasi menggunakan Express.js, Prisma, dan PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup database:
- Buat database PostgreSQL
- Copy `.env.example` ke `.env` dan isi `DATABASE_URL`

3. Setup Prisma:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Atau push schema langsung ke database (untuk development)
npm run prisma:push
```

4. Set environment variables di `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret untuk JWT access token
- `JWT_REFRESH_SECRET` - Secret untuk JWT refresh token
- `PORT` - Port server (default: 5000)
- `FRONTEND_URL` - URL frontend (untuk email links)
- `EMAIL_USER` - Gmail email address (default: gamingafriza005@gmail.com)
- `EMAIL_PASS` - Gmail App Password (default: prcypthkwnplsuzv)

5. Run server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Public Endpoints

- `POST /api/v1/auth/register` - Register user baru
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/verify-otp` - Verify OTP code
- `POST /api/v1/auth/resend-otp` - Resend OTP code
- `POST /api/v1/auth/verify-email` - Verify email via token
- `POST /api/v1/auth/google-oauth` - Google OAuth login/register
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/verify-reset-password` - Verify reset password OTP
- `POST /api/v1/auth/reset-password` - Reset password with token

### Protected Endpoints

- `GET /api/v1/auth/me` - Get current user (requires Bearer token)

## Request/Response Examples

### Register
```json
POST /api/v1/auth/register
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "user_type": "member"
}
```

### Login
```json
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Verify OTP
```json
POST /api/v1/auth/verify-otp
{
  "email": "john@example.com",
  "otp_code": "123456"
}
```

### Google OAuth
```json
POST /api/v1/auth/google-oauth
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "profile_photo": "https://...",
  "google_id": "google_user_id"
}
```

## Notes

- OTP codes expire in 10 minutes
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Email OTP dikirim melalui Gmail SMTP dengan template HTML yang professional
- Untuk menggunakan Gmail SMTP, pastikan:
  - Menggunakan App Password (bukan password biasa)
  - Enable 2-Step Verification di akun Google
  - Generate App Password di: https://myaccount.google.com/apppasswords

