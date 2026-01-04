# Express Authentication API

Backend API untuk autentikasi menggunakan Express.js, Prisma, dan PostgreSQL. Support authentication dengan email/password dan Google OAuth.

## 📋 Requirements

- Node.js (v16 atau lebih tinggi)
- PostgreSQL (v12 atau lebih tinggi)
- npm atau yarn

## 🚀 Cara Setup dan Menjalankan

### Langkah 1: Install Dependencies

```bash
npm install
```

Script ini akan otomatis menjalankan `prisma generate` setelah install (berdasarkan script `postinstall`).

### Langkah 2: Setup Database PostgreSQL

1. **Install PostgreSQL** (jika belum ada):
   - Download dari: https://www.postgresql.org/download/
   - Atau gunakan PostgreSQL di Docker

2. **Buat Database Baru**:
   ```sql
   -- Masuk ke PostgreSQL CLI
   psql -U postgres

   -- Buat database baru
   CREATE DATABASE auth_db;

   -- Atau gunakan nama database sesuai kebutuhan
   ```

3. **Catat informasi koneksi database**:
   - Host: biasanya `localhost` atau `127.0.0.1`
   - Port: biasanya `5432`
   - Database name: nama database yang dibuat
   - Username: username PostgreSQL (biasanya `postgres`)
   - Password: password PostgreSQL

### Langkah 3: Setup Environment Variables

Buat file `.env` di root folder `express/` dan tambahkan semua variabel berikut:

```env
# ============================================
# DATABASE CONFIGURATION (WAJIB)
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/auth_db?schema=public"

# Contoh format DATABASE_URL:
# postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
# 
# Ganti dengan kredensial database Anda:
# - username: username PostgreSQL Anda
# - password: password PostgreSQL Anda
# - localhost: host database (bisa diganti dengan IP)
# - 5432: port PostgreSQL (default 5432)
# - auth_db: nama database yang dibuat

# ============================================
# JWT CONFIGURATION (WAJIB)
# ============================================
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production-min-32-chars"

# Catatan:
# - Generate secret yang kuat (minimal 32 karakter)
# - Jangan gunakan secret yang sama untuk JWT_SECRET dan JWT_REFRESH_SECRET
# - Di production, gunakan random string yang aman
# - Contoh generate secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ============================================
# SERVER CONFIGURATION (OPSIONAL)
# ============================================
PORT=5000

# Port dimana server akan berjalan
# Default: 5000

# ============================================
# FRONTEND URL (OPSIONAL - untuk email links)
# ============================================
FRONTEND_URL="http://localhost:3000"

# URL frontend untuk email verification links
# Ganti sesuai dengan URL frontend Anda

# ============================================
# EMAIL CONFIGURATION (WAJIB untuk fitur email)
# ============================================
EMAIL_USER="gamingafriza005@gmail.com"
EMAIL_PASS="prcypthkwnplsuzv"

# Catatan Gmail SMTP:
# 1. EMAIL_USER: Gmail address Anda
# 2. EMAIL_PASS: Gmail App Password (BUKAN password biasa!)
# 
# Cara mendapatkan Gmail App Password:
# 1. Aktifkan 2-Step Verification di Google Account
#    https://myaccount.google.com/security
# 2. Generate App Password:
#    https://myaccount.google.com/apppasswords
#    - Select app: "Mail"
#    - Select device: "Other (Custom name)" -> ketik "Express API"
#    - Click "Generate"
#    - Copy 16-character password (tanpa spasi)
# 3. Paste password tersebut ke EMAIL_PASS
```

**Contoh file `.env` lengkap:**

```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/auth_db?schema=public"
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
JWT_REFRESH_SECRET="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"
PORT=5000
FRONTEND_URL="http://localhost:3000"
EMAIL_USER="gamingafriza005@gmail.com"
EMAIL_PASS="prcypthkwnplsuzv"
```

### Langkah 4: Setup Prisma Database Schema

Setelah environment variables di-set, jalankan Prisma untuk membuat tabel di database:

```bash
# Generate Prisma Client (sudah otomatis di postinstall, tapi bisa manual)
npm run prisma:generate

# Push schema ke database (untuk development - membuat tabel langsung)
npm run prisma:push

# ATAU gunakan migration (lebih disarankan untuk production)
npm run prisma:migrate

# Catatan:
# - prisma:push = langsung sync schema ke database (fast, untuk dev)
# - prisma:migrate = membuat migration file (lebih aman, untuk production)
```

**Verifikasi database schema berhasil:**
```bash
# Buka Prisma Studio untuk melihat database
npm run prisma:studio

# Akan terbuka di browser: http://localhost:5555
```

### Langkah 5: Verifikasi Setup

Sebelum menjalankan server, pastikan semua sudah benar:

1. ✅ File `.env` sudah dibuat dengan semua variabel
2. ✅ Database PostgreSQL sudah dibuat dan bisa diakses
3. ✅ `DATABASE_URL` di `.env` benar dan bisa connect
4. ✅ Prisma schema sudah di-push/migrate ke database
5. ✅ Gmail App Password sudah dibuat (untuk fitur email)

**Test koneksi database:**
```bash
# Test dengan Prisma Studio
npm run prisma:studio
# Jika bisa buka dan lihat database, berarti koneksi berhasil
```

### Langkah 6: Menjalankan Server

**Development Mode (dengan auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Expected Output:**
```
Server is running on port http://localhost:5000
```

### Langkah 7: Test API

Buka browser atau gunakan Postman/Thunder Client:

1. **Health Check:**
   ```
   GET http://localhost:5000/
   ```
   Response:
   ```json
   {
     "message": "API Server is running"
   }
   ```

2. **Test Register:**
   ```
   POST http://localhost:5000/api/v1/auth/register
   Content-Type: application/json
   
   {
     "full_name": "Test User",
     "email": "test@example.com",
     "password": "password123",
     "user_type": "member"
   }
   ```

3. **Cek Email:**
   - Cek inbox email yang digunakan (di EMAIL_USER)
   - Atau cek console log untuk melihat OTP code (jika email gagal terkirim)

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register user baru |
| `POST` | `/api/v1/auth/login` | Login user dengan email/password |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP code untuk email verification |
| `POST` | `/api/v1/auth/resend-otp` | Resend OTP code |
| `POST` | `/api/v1/auth/verify-email` | Verify email via token (legacy) |
| `POST` | `/api/v1/auth/google-oauth` | Google OAuth login/register |
| `POST` | `/api/v1/auth/refresh-token` | Refresh access token |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset OTP |
| `POST` | `/api/v1/auth/verify-otp-reset` | Verify OTP untuk reset password |
| `POST` | `/api/v1/auth/verify-reset-password` | Verify OTP dan reset password |
| `POST` | `/api/v1/auth/reset-password` | Reset password dengan token |

### Protected Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/auth/me` | Get current user info | Bearer Token |

## 🔧 Troubleshooting

### Error: "DATABASE_URL tidak terdefinisi"

**Penyebab:** File `.env` tidak ditemukan atau `DATABASE_URL` tidak di-set.

**Solusi:**
1. Pastikan file `.env` ada di folder `express/`
2. Pastikan `DATABASE_URL` sudah di-set dengan format yang benar
3. Restart server setelah mengubah `.env`

### Error: "Can't reach database server"

**Penyebab:** PostgreSQL tidak berjalan atau koneksi salah.

**Solusi:**
1. Pastikan PostgreSQL service berjalan:
   ```bash
   # Windows
   services.msc -> cari PostgreSQL -> Start

   # Linux/Mac
   sudo systemctl start postgresql
   ```
2. Test koneksi manual:
   ```bash
   psql -U postgres -h localhost -p 5432
   ```
3. Periksa `DATABASE_URL` di `.env`:
   - Host: `localhost` atau IP yang benar
   - Port: `5432` (default)
   - Username dan password: sesuai dengan PostgreSQL

### Error: "Prisma Client did not initialize yet"

**Penyebab:** Prisma Client belum di-generate.

**Solusi:**
```bash
npm run prisma:generate
```

### Error: "Email send failed" atau "EMAIL_CONFIG_ERROR"

**Penyebab:** Gmail SMTP configuration salah.

**Solusi:**
1. Pastikan `EMAIL_USER` adalah alamat Gmail yang valid
2. Pastikan `EMAIL_PASS` adalah App Password (bukan password biasa)
3. Pastikan 2-Step Verification sudah aktif
4. Generate App Password baru: https://myaccount.google.com/apppasswords

### Error: "Invalid JWT secret"

**Penyebab:** `JWT_SECRET` atau `JWT_REFRESH_SECRET` tidak di-set atau terlalu pendek.

**Solusi:**
1. Pastikan kedua secret sudah di-set di `.env`
2. Pastikan minimal 32 karakter
3. Generate secret baru:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Port 5000 sudah digunakan

**Solusi:**
1. Ubah `PORT` di `.env` ke port lain (contoh: `5001`)
2. Atau stop process yang menggunakan port 5000

## 📝 Notes

- **OTP Codes**: Expire dalam 10 menit
- **Access Tokens**: Expire dalam 15 menit
- **Refresh Tokens**: Expire dalam 7 hari
- **Email Service**: Menggunakan Gmail SMTP dengan template HTML
- **Database**: PostgreSQL dengan Prisma ORM
- **Auto Generate**: Prisma Client otomatis di-generate saat `npm install` (berdasarkan `postinstall` script)

## 🔐 Security Best Practices

1. **Jangan commit file `.env`** ke git (sudah ada di `.gitignore`)
2. **Gunakan secret yang kuat** untuk JWT (minimal 32 karakter random)
3. **Jangan gunakan App Password yang sama** di berbagai environment
4. **Di production**, gunakan environment variables yang berbeda
5. **Enable HTTPS** di production
6. **Regular update dependencies**: `npm audit` dan `npm update`

## 🆘 Butuh Bantuan?

Jika masih ada error, cek:
1. Console log untuk error message detail
2. Pastikan semua environment variables sudah benar
3. Test koneksi database dengan `prisma studio`
4. Test email dengan register endpoint

---

**Happy Coding! 🚀**
