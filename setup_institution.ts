import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory as the script
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
-- 1. Institution Classifications
CREATE TABLE IF NOT EXISTS institution_classifications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 Institution Heads Lookup
CREATE TABLE IF NOT EXISTS institution_heads (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Institution Head Titles Lookup
CREATE TABLE IF NOT EXISTS institution_head_titles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Institutions
CREATE TABLE IF NOT EXISTS academic_institutions (
  id SERIAL PRIMARY KEY,
  official_name VARCHAR(255) NOT NULL,
  classification_id INTEGER REFERENCES institution_classifications(id),
  head_person_id INTEGER, -- Placeholder for now
  head_title VARCHAR(100),
  institution_unique_identifier VARCHAR(100) UNIQUE,
  address_street TEXT,
  address_municipality VARCHAR(100),
  address_province_city VARCHAR(100),
  address_region VARCHAR(100),
  address_zip_code VARCHAR(20),
  telephone_no VARCHAR(50),
  fax_no VARCHAR(50),
  head_telephone VARCHAR(50),
  email_address VARCHAR(255),
  website VARCHAR(255),
  year_established INTEGER,
  latest_sec_registration VARCHAR(100),
  date_granted_or_approved DATE,
  year_converted_to_college INTEGER,
  year_converted_to_university INTEGER,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Classifications
INSERT INTO institution_classifications (name) VALUES
  ('University/Pamantasan'),
  ('College/Kolehiyo'),
  ('Academy/Akademia'),
  ('Institute/Instituto'),
  ('Center'),
  ('School')
ON CONFLICT (name) DO NOTHING;

INSERT INTO institution_head_titles (name) VALUES
  ('Adm. Ast III'),
  ('President'),
  ('Chancellor'),
  ('Executive Director'),
  ('Dean'),
  ('Rector'),
  ('Head')
ON CONFLICT (name) DO NOTHING;
`;

async function setup() {
  console.log("Setting up Academic Institution schema...");
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    
    await client.query(schemaSQL);
    console.log("Schema created and seeded successfully.");
    
    client.release();
  } catch (err) {
    console.error("Database setup failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
