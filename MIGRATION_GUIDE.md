# TypeORM Migration Guide

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure your `.env` file has `DATABASE_URL` configured:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Migration Commands

### Generate a Migration (Auto-generate from entity changes)
```bash
npm run migration:generate MigrationDescription
```
This will automatically detect changes in your entities and generate a migration file with an auto-generated timestamp-based name.

**Examples:**
```bash
# Simple name
npm run migration:generate AddUserMiddleName

# With spaces (will be converted to PascalCase)
npm run migration:generate "Add User Middle Name"

# The migration will be saved as:
# src/migrations/1703123456789-AddUserMiddleName.ts
```

### Create an Empty Migration (Manual)
```bash
npm run migration:create -- src/migrations/MigrationName
```
This creates an empty migration file that you can manually write.

**Example:**
```bash
npm run migration:create -- src/migrations/AddUserEmailIndex
```

### Run Migrations
```bash
npm run migration:run
```
This will execute all pending migrations.

### Revert Last Migration
```bash
npm run migration:revert
```
This will undo the last migration that was run.

### Show Migration Status
```bash
npm run migration:show
```
This shows which migrations have been executed and which are pending.

## Common Workflow

1. **Make changes to your entity** (e.g., `src/entities/user.entity.ts`)

2. **Generate migration (name is auto-generated with timestamp):**
   ```bash
   npm run migration:generate AddUserFields
   ```
   The migration will be automatically saved as: `src/migrations/1703123456789-AddUserFields.ts`

3. **Review the generated migration file** in `src/migrations/`

4. **Run the migration:**
   ```bash
   npm run migration:run
   ```

## Important Notes

- Always review generated migrations before running them
- Never edit migrations that have already been run in production
- Use `migration:create` for complex migrations that can't be auto-generated
- Keep migrations small and focused on a single change
- Test migrations on a development database first

