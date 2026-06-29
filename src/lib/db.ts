import { neon } from '@neondatabase/serverless';

// Try to resolve the database URL from various possible env variables
// MONETORY_DATABASE_URL is injected by Neon's Vercel integration
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.MONETORY_DATABASE_URL || 
  process.env.MONETORY_POSTGRES_URL;

if (!connectionString) {
  console.warn(
    "⚠️ WARNING: DATABASE_URL is not set. Please add DATABASE_URL to your .env.local for local development."
  );
}

// Initialize the Neon SQL client
export const sql = connectionString ? neon(connectionString) : null;

/**
 * Automatically initializes the database tables if they do not exist.
 * This runs when API routes are triggered to guarantee schema setup without manual migrations.
 */
export async function initDb() {
  if (!sql) {
    throw new Error(
      "Database client is not initialized. Please configure DATABASE_URL in your environment variables."
    );
  }

  try {
    // 0. Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Migrate existing users to add name column if not exists
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100)
    `;
    await sql`
      UPDATE users SET name = username WHERE name IS NULL
    `;
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS summary_start_day INTEGER DEFAULT 1
    `;

    // 1. Create accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Migrate tables to add user_id / account_id columns
    await sql`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id VARCHAR(50)
    `;

    await sql`
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)
    `;
    await sql`
      UPDATE accounts SET user_id = 'legacy' WHERE user_id IS NULL
    `;

    await sql`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)
    `;
    await sql`
      UPDATE transactions SET user_id = 'legacy' WHERE user_id IS NULL
    `;

    // 4. Create budgets table
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        category VARCHAR(50) NOT NULL,
        limit_amount NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)
    `;
    await sql`
      UPDATE budgets SET user_id = 'legacy' WHERE user_id IS NULL
    `;

    // 5. Migrate budgets key to composite primary key (user_id, category)
    try {
      await sql`
        ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_pkey
      `;
      await sql`
        ALTER TABLE budgets ADD PRIMARY KEY (user_id, category)
      `;
    } catch (keyErr) {
      console.log('Composite primary key for budgets already exists or migration skipped:', keyErr);
    }

  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error);
    throw error;
  }
}
