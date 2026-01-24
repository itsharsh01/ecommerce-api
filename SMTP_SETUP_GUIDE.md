# SMTP Setup Guide for Nodemailer

## What is SMTP?

SMTP (Simple Mail Transfer Protocol) is the standard protocol for sending emails. Nodemailer uses SMTP to send emails through email service providers.

## Required SMTP Credentials

You need these 4 pieces of information:

1. **SMTP_HOST** - The SMTP server address (e.g., `smtp.gmail.com`)
2. **SMTP_PORT** - The port number (usually `587` for TLS or `465` for SSL)
3. **SMTP_USER** - Your email address or username
4. **SMTP_PASS** - Your email password or app-specific password
5. **SMTP_FROM** (Optional) - The "from" email address (defaults to SMTP_USER)

## How to Get SMTP Credentials

### Option 1: Gmail (Recommended for Development)

Gmail is the easiest to set up and has a generous free tier.

#### Steps:

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "2-Step Verification"
   - Follow the steps to enable it

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter a name like "Ecommerce API"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Add to .env file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=noreply@yourapp.com
   ```

**Important:** 
- Use the **App Password**, NOT your regular Gmail password
- The App Password is 16 characters with spaces (you can remove spaces in .env)

---

### Option 2: Outlook/Hotmail

#### Steps:

1. **Enable 2-Step Verification**
   - Go to [Microsoft Account Security](https://account.microsoft.com/security)
   - Enable "Two-step verification"

2. **Generate App Password**
   - Go to [Security Settings](https://account.microsoft.com/security)
   - Click "Advanced security options"
   - Under "App passwords", click "Create a new app password"
   - Enter a name like "Ecommerce API"
   - Copy the generated password

3. **Add to .env file:**
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your-email@outlook.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourapp.com
   ```

---

### Option 3: Yahoo Mail

#### Steps:

1. **Enable 2-Step Verification**
   - Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
   - Enable "Two-step verification"

2. **Generate App Password**
   - Go to Account Security → Generate app password
   - Select "Mail" and "Desktop App"
   - Copy the generated password

3. **Add to .env file:**
   ```env
   SMTP_HOST=smtp.mail.yahoo.com
   SMTP_PORT=587
   SMTP_USER=your-email@yahoo.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourapp.com
   ```

---

### Option 4: SendGrid (Recommended for Production)

SendGrid is a professional email service with a free tier (100 emails/day).

#### Steps:

1. **Sign Up**
   - Go to [SendGrid](https://sendgrid.com/)
   - Create a free account
   - Verify your email

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Give it a name like "Ecommerce API"
   - Select "Full Access" or "Mail Send" permissions
   - Copy the API key (you won't see it again!)

3. **Verify Sender**
   - Go to Settings → Sender Authentication
   - Verify a Single Sender (your email address)
   - Follow the verification steps

4. **Add to .env file:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key-here
   SMTP_FROM=your-verified-email@example.com
   ```

**Note:** The username is literally `apikey`, and the password is your API key.

---

### Option 5: Mailgun (Good for Production)

Mailgun offers 5,000 free emails/month for 3 months.

#### Steps:

1. **Sign Up**
   - Go to [Mailgun](https://www.mailgun.com/)
   - Create a free account
   - Verify your email

2. **Get SMTP Credentials**
   - Go to Sending → Domain Settings
   - Select your domain (or use sandbox domain for testing)
   - Go to "SMTP credentials" tab
   - Copy the SMTP username and password

3. **Add to .env file:**
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-username
   SMTP_PASS=your-mailgun-password
   SMTP_FROM=noreply@your-domain.com
   ```

---

### Option 6: AWS SES (Amazon Simple Email Service)

Good for high-volume production use.

#### Steps:

1. **Sign Up**
   - Go to [AWS SES](https://aws.amazon.com/ses/)
   - Create an AWS account

2. **Verify Email**
   - Go to SES Console → Verified identities
   - Verify your email address

3. **Get SMTP Credentials**
   - Go to SES Console → SMTP settings
   - Click "Create SMTP credentials"
   - Copy the username and password

4. **Add to .env file:**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Your region's endpoint
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   SMTP_FROM=your-verified-email@example.com
   ```

---

## Complete .env Example

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# SMTP Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@yourapp.com
```

## Testing Your SMTP Configuration

### Development Mode (No SMTP Required)

If you don't configure SMTP, the application will:
- Log OTPs to the console
- Still work for testing
- Not send actual emails

Example console output:
```
⚠️  SMTP not configured. Email would be sent to: user@example.com
⚠️  OTP: 123456
```

### Production Mode (SMTP Required)

Once you add SMTP credentials:
1. Restart your application
2. Register a new user
3. Check your email inbox (and spam folder)
4. You should receive the verification email

## Troubleshooting

### "Invalid login" or "Authentication failed"
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Outlook**: Verify 2-step verification is enabled and you're using an App Password
- **SendGrid**: Make sure username is `apikey` and password is your API key

### "Connection timeout"
- Check your firewall settings
- Verify SMTP_HOST and SMTP_PORT are correct
- Try port 465 with `secure: true` (SSL) instead of 587 (TLS)

### "Email not received"
- Check spam/junk folder
- Verify SMTP_FROM email is correct
- Check SendGrid/Mailgun dashboard for delivery status
- Make sure sender email is verified

### "Rate limit exceeded"
- Gmail: 500 emails/day limit
- SendGrid Free: 100 emails/day
- Mailgun: 5,000 emails/month (first 3 months)
- Consider upgrading or using a different provider

## Security Best Practices

1. **Never commit .env file** - It's already in .gitignore
2. **Use App Passwords** - Don't use your main email password
3. **Rotate passwords regularly** - Especially in production
4. **Use environment-specific credentials** - Different credentials for dev/staging/prod
5. **Monitor email usage** - Set up alerts for unusual activity

## Quick Start (Gmail - Easiest)

1. Enable 2-Step Verification on Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```
4. Restart your application
5. Test by registering a new user

That's it! 🎉

