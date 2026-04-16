import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add some basic pool settings for reliability
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Helper to check DB connection
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    client.release();
    return { connected: true };
  } catch (err) {
    console.error("Database connection error:", err);
    return { connected: false, error: err instanceof Error ? err.message : String(err) };
  }
}
