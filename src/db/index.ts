import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? "";
  if (!url) {
    // Jangan throw saat build time (Next prerender) — kembalikan placeholder.
    // Query akan gagal dengan pesan jelas jika benar-benar dieksekusi tanpa env.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(
        "[db] DATABASE_URL belum diset — memakai placeholder saat build."
      );
      return "postgresql://build:build@localhost:5432/build";
    }
    throw new Error(
      "Missing DATABASE_URL (or NEON_DATABASE_URL). Copy .env.example to .env and fill in your Neon connection string."
    );
  }
  return url;
}

const sql = neon(resolveDatabaseUrl());

export const db = drizzle(sql, { schema });
export type Db = typeof db;

