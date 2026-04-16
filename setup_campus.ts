import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schemaSQL = `
CREATE TABLE IF NOT EXISTS campuses (
  id SERIAL PRIMARY KEY,
  institution_id INTEGER REFERENCES academic_institutions(id) ON DELETE CASCADE,
  acronym VARCHAR(20) NOT NULL,
  campus_name VARCHAR(255),
  short_name VARCHAR(100),
  short_name_by_site VARCHAR(100),

  -- Campus Registrar Office
  registrar_office_name VARCHAR(255),
  registrar_name VARCHAR(255),
  registrar_title VARCHAR(100),
  registrar_applies_to_all BOOLEAN DEFAULT FALSE,

  -- Campus Accounting Office
  accounting_office_name VARCHAR(255),
  accountant_name VARCHAR(255),
  accountant_title VARCHAR(100),
  accounting_applies_to_all BOOLEAN DEFAULT FALSE,

  -- Campus Cashier Office
  cashier_office_name VARCHAR(255),
  cashier_name VARCHAR(255),
  cashier_title VARCHAR(100),
  cashier_applies_to_all BOOLEAN DEFAULT FALSE,

  -- Campus Location and Mailing Address
  barangay VARCHAR(100),
  town_city VARCHAR(100),
  district_id VARCHAR(20),
  zip_code VARCHAR(20),
  province VARCHAR(100),
  region VARCHAR(100),
  mailing_address TEXT,
  email VARCHAR(255),
  website VARCHAR(255),
  telephone_no VARCHAR(50),
  fax_no VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

async function setup() {
  console.log("Setting up Campus schema...");
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");

    await client.query(schemaSQL);
    console.log("Campus table created successfully.");

    client.release();
  } catch (err) {
    console.error("Database setup failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
