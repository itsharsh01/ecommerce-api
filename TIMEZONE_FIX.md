# Database Timezone Fix

## Problem
Database timestamps were 5 hours 30 minutes behind the current time (IST - India Standard Time).

## Root Cause
- PostgreSQL by default stores timestamps in UTC
- TypeORM was using `timestamp` type (without timezone)
- No timezone configuration was set in the database connection

## Solution Applied

### 1. Updated TypeORM Configuration (`src/app.module.ts`)
Added timezone settings to the database connection:
```typescript
timezone: 'Asia/Kolkata', // Set timezone to IST (UTC+5:30)
extra: {
  timezone: 'Asia/Kolkata', // For connection-level timezone
},
```

### 2. Updated Entity Timestamp Columns
Changed from `timestamp` to `timestamptz` (timestamp with timezone):

**User Entity (`src/entities/user.entity.ts`):**
- `createdAt`: `timestamp` → `timestamptz`
- `updatedAt`: `timestamp` → `timestamptz`

**OTP Entity (`src/entities/otp.entity.ts`):**
- `createdAt`: `timestamp` → `timestamptz`

## What Changed

### Before:
- Timestamps stored in UTC without timezone awareness
- 5:30 hours difference from IST
- Example: If current time is 9:30 PM IST, database showed 4:00 PM

### After:
- Timestamps stored with timezone awareness
- Automatically converted to IST (Asia/Kolkata)
- Correct local time displayed

## Testing the Fix

### 1. Restart the Application
```bash
# The app will automatically restart if running in watch mode
# Or manually restart:
npm run start:dev
```

### 2. Register a New User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"password\":\"Test123!@#\"}"
```

### 3. Check the Response
The `createdAt` and `updatedAt` fields should now show the correct IST time:
```json
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "...",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "emailVerified": false,
    "createdAt": "2026-01-24T21:30:00.000+05:30",  // ✅ Correct IST time
    "updatedAt": "2026-01-24T21:30:00.000+05:30"   // ✅ Correct IST time
  }
}
```

### 4. Verify in Database
If you want to check directly in the database:
```sql
-- Check user timestamps
SELECT id, email, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 5;

-- Check OTP timestamps
SELECT id, email, otp, created_at FROM otps ORDER BY created_at DESC LIMIT 5;
```

The timestamps should now reflect IST timezone.

## Important Notes

### About `timestamptz` vs `timestamp`
- **`timestamp`**: Stores date/time without timezone info (naive)
- **`timestamptz`**: Stores date/time with timezone info (aware)
- PostgreSQL stores `timestamptz` in UTC internally but converts based on connection timezone

### Existing Data
- **Old records**: Will still show UTC time (no timezone info)
- **New records**: Will show correct IST time
- If you need to fix old records, you'll need to run a migration

### Migration for Existing Data (Optional)
If you want to fix existing timestamps:

```sql
-- Backup first!
-- Update existing timestamps assuming they were in UTC
ALTER TABLE users 
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE otps 
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
```

## Timezone Options

If you're not in India, change the timezone in `src/app.module.ts`:

| Location | Timezone |
|----------|----------|
| India | `Asia/Kolkata` |
| USA (EST) | `America/New_York` |
| USA (PST) | `America/Los_Angeles` |
| UK | `Europe/London` |
| Singapore | `Asia/Singapore` |
| Australia (Sydney) | `Australia/Sydney` |
| UTC | `UTC` |

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Troubleshooting

### Timestamps Still Wrong?
1. **Restart the application** - Changes require a restart
2. **Clear old data** - Test with newly created records
3. **Check PostgreSQL timezone**:
   ```sql
   SHOW timezone;
   ```

### TypeORM Synchronize Warning
Since `synchronize: true` is enabled, the schema will auto-update. However:
- **Development**: This is fine
- **Production**: Use migrations instead of synchronize

## Summary
✅ Database timezone configured to IST (Asia/Kolkata)
✅ Timestamp columns updated to use `timestamptz`
✅ New records will show correct local time
✅ No code changes needed in services/controllers

