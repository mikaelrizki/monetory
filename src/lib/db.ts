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
    // 1. Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Create budgets table
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        category VARCHAR(50) PRIMARY KEY,
        limit_amount NUMERIC(15, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error("❌ Failed to initialize database tables:", error);
    throw error;
  }
}
