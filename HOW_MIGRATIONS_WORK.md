# How TypeORM Detects Entity Changes

## How It Works

TypeORM's `migration:generate` command automatically detects changes by comparing:

1. **Your Entity Files** (in `src/entities/*.entity.ts`) - The current state of your code
2. **Your Database Schema** - The actual tables and columns in your database

When you run `migration:generate`, TypeORM:
- Reads all entity files from `src/entities/`
- Connects to your database
- Compares the entity definitions with the actual database schema
- Generates a migration file with the differences

## Automatic Detection Setup

The `data-source.ts` file loads all entities. **When you create a new entity**, you need to:

1. **Create the entity file** in `src/entities/` (e.g., `product.entity.ts`)
2. **Import it in `src/data-source.ts`**:
   ```typescript
   import { Product } from './entities/product.entity';
   ```
3. **Add it to the entities array**:
   ```typescript
   entities: [
     User,
     Product,  // Add your new entity here
   ],
   ```

This ensures:
- ✅ TypeORM can compare your entity definitions with the database
- ✅ Any changes to existing entity files are automatically detected when you run `migration:generate`
- ✅ New entities are included in migration generation

## Workflow

### Step 1: Make Changes to Your Entity

Edit any file in `src/entities/`, for example:

```typescript
// src/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  // ✨ Add a new field
  @Column({ nullable: true })
  middleName: string;  // NEW FIELD

  @Column()
  lastName: string;
  
  // ... rest of the entity
}
```

### Step 2: Generate Migration

Run the generate command (migration name is auto-generated with timestamp):

```bash
npm run migration:generate AddMiddleNameToUser
```

Or with spaces:
```bash
npm run migration:generate "Add Middle Name To User"
```

**The migration will be automatically saved as:**
```
src/migrations/1703123456789-AddMiddleNameToUser.ts
```

TypeORM will:
1. ✅ Read `src/entities/user.entity.ts` (sees `middleName` field)
2. ✅ Connect to database (checks if `middleName` column exists)
3. ✅ Detects the difference (column doesn't exist)
4. ✅ Generates migration file with `ALTER TABLE` statement
5. ✅ Auto-saves with timestamp-based name

### Step 3: Review Generated Migration

Check the generated file in `src/migrations/`:

```typescript
// src/migrations/1234567890-AddMiddleNameToUser.ts
export class AddMiddleNameToUser1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'middleName',
      type: 'varchar',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'middleName');
  }
}
```

### Step 4: Run Migration

```bash
npm run migration:run
```

## What Changes Are Detected?

TypeORM automatically detects:

- ✅ **New columns** - Adding a new `@Column()` field
- ✅ **Removed columns** - Removing a `@Column()` field
- ✅ **Column type changes** - Changing `varchar` to `text`
- ✅ **Column constraints** - Adding/removing `nullable`, `unique`, etc.
- ✅ **New indexes** - Adding `@Index()` decorator
- ✅ **New entities** - Creating a new entity file
- ✅ **Table name changes** - Changing `@Entity('table_name')`
- ✅ **Relations** - Adding `@OneToMany`, `@ManyToOne`, etc.

## Examples

### Example 1: Add a New Field

**Before:**
```typescript
@Column()
email: string;
```

**After:**
```typescript
@Column()
email: string;

@Column({ nullable: true })
middleName: string;  // NEW
```

**Command:**
```bash
npm run migration:generate AddMiddleNameToUser
```

**Auto-generated file:**
```
src/migrations/1703123456789-AddMiddleNameToUser.ts
```

### Example 2: Change Field Type

**Before:**
```typescript
@Column({ type: 'varchar', length: 100 })
firstName: string;
```

**After:**
```typescript
@Column({ type: 'text' })
firstName: string;
```

**Command:**
```bash
npm run migration:generate ChangeFirstNameToText
```

**Auto-generated file:**
```
src/migrations/1703123456789-ChangeFirstNameToText.ts
```

### Example 3: Add a New Entity

Create `src/entities/product.entity.ts`:

```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
```

**Command:**
```bash
npm run migration:generate CreateProductTable
```

**Auto-generated file:**
```
src/migrations/1703123456789-CreateProductTable.ts
```

## Important Notes

1. **Always run migrations in order** - Don't skip migrations
2. **Review generated migrations** - Check the SQL before running
3. **Test on development first** - Never run untested migrations on production
4. **Keep entities in sync** - Make sure your entity files match your database after running migrations
5. **Use descriptive names** - Migration names should clearly describe the change

## Troubleshooting

### Migration says "no changes detected"

This means your entity files match your database schema. Possible reasons:
- You haven't made any changes to entities
- You already ran the migration
- Database is out of sync (check with `migration:show`)

### Migration generates wrong SQL

- Review the generated migration file
- You can manually edit it before running
- Or create a manual migration with `migration:create`

### Can't find entities

Make sure:
- Entity files are in `src/entities/` folder
- Files end with `.entity.ts`
- Entities have `@Entity()` decorator
- Entity is imported in `src/data-source.ts`
- Entity is added to the `entities` array in `data-source.ts`

