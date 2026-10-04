import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(
  process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? ""
);

const STATEMENTS: string[] = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('student', 'assistant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `DO $$ BEGIN
  CREATE TYPE "github_repo_status" AS ENUM ('public', 'private', 'not_found');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$`,
  `CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "npm_nip" varchar(20) NOT NULL UNIQUE,
  "full_name" varchar(100) NOT NULL,
  "email" varchar(100) NOT NULL UNIQUE,
  "password_hash" text,
  "role" "role" NOT NULL DEFAULT 'student',
  "created_at" timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS "courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(20) NOT NULL UNIQUE,
  "name" varchar(120) NOT NULL,
  "semester" varchar(20) NOT NULL DEFAULT 'Ganjil',
  "created_at" timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS "course_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "enrolled_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "course_enrollments_unique" UNIQUE ("course_id", "student_id")
)`,
  `CREATE TABLE IF NOT EXISTS "assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" uuid REFERENCES "courses"("id") ON DELETE CASCADE,
  "title" varchar(100) NOT NULL,
  "module_number" integer NOT NULL,
  "deadline" timestamptz NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "assignments_course_module_unique" UNIQUE ("course_id", "module_number")
)`,
  `CREATE TABLE IF NOT EXISTS "submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assignment_id" uuid NOT NULL REFERENCES "assignments"("id") ON DELETE CASCADE,
  "medium_url" text NOT NULL,
  "github_url" text NOT NULL,
  "github_repo_status" "github_repo_status" NOT NULL DEFAULT 'not_found',
  "is_late" boolean NOT NULL DEFAULT false,
  "submitted_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "submissions_student_assignment_unique" UNIQUE ("student_id", "assignment_id")
)`,
  `CREATE TABLE IF NOT EXISTS "grades" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "submission_id" uuid NOT NULL UNIQUE REFERENCES "submissions"("id") ON DELETE CASCADE,
  "score" integer,
  "feedback" text,
  "graded_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "graded_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE INDEX IF NOT EXISTS "submissions_student_idx" ON "submissions" ("student_id")`,
  `CREATE INDEX IF NOT EXISTS "submissions_assignment_idx" ON "submissions" ("assignment_id")`,
  `CREATE INDEX IF NOT EXISTS "assignments_module_idx" ON "assignments" ("module_number")`,
  // P0-5: defense-in-depth — aktifkan RLS di semua tabel app.
  // Koneksi app memakai single owner (neondb_owner) yang bypass RLS, jadi tidak ada
  // perubahan perilaku; RLS melindungi bila kelak ada role unprivileged / kredensial bocor.
  // Idempotent, aman dijalankan ulang via db:setup. Branch production sudah di-ENABLE via SQL langsung.
  `ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "course_enrollments" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY`,
];

async function main() {
  for (const stmt of STATEMENTS) {
    await sql.query(stmt, []);
  }
  console.log(`[setup] applied ${STATEMENTS.length} statements OK`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[setup] failed:", err);
    process.exit(1);
  });
