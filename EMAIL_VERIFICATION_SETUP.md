# Email Verification Setup Guide

## Overview

This project implements email verification using OTP (One-Time Password) sent via email. When a user registers, they receive an OTP in their email that must be verified within 10 minutes.

## Features

- ✅ OTP stored in separate database table
- ✅ OTP valid for 10 minutes (checked against `createdAt`)
- ✅ Email service with HTML template
- ✅ Email verification endpoint
- ✅ Resend OTP endpoint
- ✅ Login requires email verification

## Database Schema

### OTP Table (`otps`)
- `id` (UUID) - Primary key
- `email` (VARCHAR) - User's email address
- `otp` (VARCHAR 6) - 6-digit OTP code
- `isUsed` (BOOLEAN) - Whether OTP has been used
- `createdAt` (TIMESTAMP) - OTP creation time (used for expiration check)

### User Table Updates
- `emailVerified` (BOOLEAN) - Email verification status (default: false)

## API Endpoints

### 1. Register User
**POST** `/auth/register`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "msg": "Registration successful. Please check your email for verification OTP.",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "emailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Note:** No JWT token is returned until email is verified.

### 2. Verify Email
**POST** `/auth/verify-email`

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "msg": "Email verified successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Resend OTP
**POST** `/auth/resend-otp`

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "msg": "Verification OTP has been resent to your email",
  "data": {
    "email": "john@example.com",
    "expiresIn": "10 minutes"
  }
}
```

### 4. Login
**POST** `/auth/login`

**Note:** Login will fail if email is not verified.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (if email not verified):**
```json
{
  "success": false,
  "msg": "Please verify your email before logging in"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com  # Optional: sender email address
```

### Gmail Setup

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASS`

### Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Development Mode

If SMTP credentials are not configured:
- OTP will be logged to console
- Email template will be logged
- You can test the flow without sending actual emails

Example console output:
```
⚠️  SMTP not configured. Email would be sent to: john@example.com
⚠️  OTP: 123456
```

## Email Template

The email template is located at:
```
src/common/templates/email-verification.html
```

Template variables:
- `{{firstName}}` - User's first name
- `{{otp}}` - 6-digit OTP code
- `{{expirationTime}}` - OTP expiration time (10 minutes)

## OTP Validation

- OTP is valid for **10 minutes** from creation
- Expiration is checked using `createdAt` timestamp
- OTP can only be used once (`isUsed` flag)
- Old unused OTPs are deleted when a new one is generated

## Migration

After adding the new entities, run:

```bash
# Generate migration
npm run migration:generate AddEmailVerification

# Review the migration file
# Then run it
npm run migration:run
```

## Workflow

1. **User registers** → Account created with `emailVerified: false`
2. **OTP generated** → Saved to `otps` table with `createdAt` timestamp
3. **Email sent** → User receives OTP via email
4. **User verifies** → Sends OTP via `/auth/verify-email`
5. **OTP validated** → Checked against database and expiration time
6. **User updated** → `emailVerified: true`, JWT token returned
7. **User can login** → Login now works after email verification

## Security Notes

- OTP expires after 10 minutes
- OTP is single-use (marked as used after verification)
- Old unused OTPs are automatically deleted when new ones are generated
- Email verification is required before login
- Rate limiting recommended for production (to prevent OTP spam)

## Troubleshooting

### Email not sending?
1. Check SMTP credentials in `.env`
2. Verify SMTP connection (check console logs)
3. For Gmail: Make sure App Password is used (not regular password)
4. Check spam folder

### OTP expired?
- Use `/auth/resend-otp` to get a new OTP

### OTP invalid?
- Make sure you're using the latest OTP (old ones are deleted)
- Check if OTP was already used
- Verify OTP hasn't expired (10 minutes)

