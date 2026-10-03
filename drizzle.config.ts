import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? "";

if (!databaseUrl) {
  console.warn(
    "[drizzle-kit] DATABASE_URL / NEON_DATABASE_URL is not set. `drizzle-kit push` will fail until it is configured. See .env.example."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
