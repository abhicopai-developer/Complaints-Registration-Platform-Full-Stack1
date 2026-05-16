import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("your_supabase_postgres_url")) {
  console.error("CRITICAL ERROR: DATABASE_URL is not configured in .env file.");
  process.exit(1);
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
