# LaprakHub — Pengumpulan & Evaluasi Laporan Praktikum

Portal mandiri pengganti Google Form untuk praktikum M1–M14: mahasiswa kumpul link **Medium + GitHub**, validasi URL otomatis (Regex + GitHub REST API), penanda **Terlambat otomatis**, dan **matriks rekapitulasi M1–M14 + CSV** untuk aslab.

## Fitur utama

- **Portal Praktikan** (`/dashboard/student`): pilih modul aktif, submit/revisi (UNIQUE per student+assignment = update), riwayat + nilai/feedback milik sendiri.
- **Matriks Aslab** (`/dashboard/assistant`): grid M1–M14 per praktikan (Tepat Waktu / Terlambat / Belum / Private Repo), Quick View + input nilai, export CSV.
- **Admin Overview** (`/dashboard/admin`, read-only): ringkasan users/courses/modul/submissions + daftar pengguna.
- **Validasi eksplisit**: `medium.com/@username/slug` dan `github.com/username/repo`; cek GitHub `200=public, 404=not_found, selain itu=private`.
- **Auth + RBAC keras**: login email/password (scrypt), cookie `laprakhub_session` HMAC-SHA256 7 hari, `proxy.ts` fail-closed → `/login`, `requireStudent/requireStaff/requireAdmin` di pages + server actions.

## Tech stack

Next.js 16 App Router + React 19 · Tailwind 4 · Drizzle ORM + `@neondatabase/serverless` (Neon Postgres) · Zod · lucide-react. Package manager: `bun@1.4.2` (npm/yarn/pnpm tetap bisa).

## Struktur

```
app/page.tsx                 landing + info akun demo
app/login/page.tsx           login
app/dashboard/layout.tsx     guard login lapis-2 + nav per-role
app/dashboard/student/       portal praktikan
app/dashboard/assistant/     matriks aslab
app/dashboard/admin/         overview admin (read-only)
proxy.ts                     guard cookie signature/expiry untuk /dashboard/*
src/actions/                 auth.ts, submissions.ts, grades.ts (server actions)
src/lib/                     session.ts, auth.ts, password.ts, validators.ts, github.ts, matrix.ts, csv.ts
src/db/                      schema.ts, index.ts, setup.ts, seed.ts
src/components/              submit-form, matrix-grid, grade-form, export-button, login-form
docs/Architecture.md         arsitektur detail
.env.example                 template env (wajib di-copy ke .env)
```

DB (6 tabel): `users (student|assistant|admin)`, `courses`, `course_enrollments`, `assignments (M1-M14)`, `submissions`, `grades`. RLS sudah `ENABLE` di semua tabel (defense-in-depth; koneksi app single-owner `neondb_owner` bypass RLS).

## Prasyarat

Node 20+ atau Bun 1.4+, database Neon Postgres, `GITHUB_TOKEN` opsional (naikkan rate-limit 60→5000 req/jam).

## Quickstart

```bash
cp .env.example .env   # isi DATABASE_URL + SESSION_SECRET
bun install            # atau npm install
bun run db:setup       # buat enum+tabel+index+ENABLE RLS (idempotent)
bun run db:seed        # users demo + course PRAK-IF101 + M1-M14 + enrollments
bun run dev            # http://localhost:3000
```

Verifikasi: `bun run typecheck` (tsc --noEmit harus EXIT 0), `bun run build`.

## Konfigurasi env

| Var | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` (fallback `NEON_DATABASE_URL`) | Ya | connection string Neon `...?sslmode=require` |
| `SESSION_SECRET` (fallback `AUTH_SECRET`) | Ya, min 32 char | `openssl rand -base64 48`. Production: missing/lemah → throw + proxy tolak semua (fail-closed). Dev boleh pendek (warning). |
| `GITHUB_TOKEN` | Tidak | PAT server-only, tanpa prefix `NEXT_PUBLIC_` |
| `ALLOW_DEMO_FALLBACK` | Tidak, default OFF | Hanya `true` + `NODE_ENV!=production` → halaman dashboard boleh pakai akun demo tanpa login. Production selalu OFF. |
| `SEED_DEMO` | Tidak | kontrol seed demo |

`.env*` di-ignore kecuali `.env.example` yang tetap ter-track.

## Database

- `db:setup` (`src/db/setup.ts`): `pgcrypto`, enum `role` + `github_repo_status`, 6 tabel, 3 index, 6x `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- `db:seed` (`src/db/seed.ts`): upsert idempotent. Course `PRAK-IF101 Praktikum Pemrograman Web`, M1–M14 (M1–M8 aktif), enroll 5 students.
- `db:generate` / `db:push`: drizzle-kit. Manfaatkan Neon branching untuk isolasi dev/staging vs production.

## Akun demo (setelah seed)

```
student@laprakhub.local / student123
assistant@laprakhub.local / aslab123
admin@laprakhub.local / admin123
```

Ganti password ini sebelum dipakai kelas sungguhan. Jangan aktifkan `ALLOW_DEMO_FALLBACK` di production.

## Keamanan (status P0)

- `proxy.ts`: cek signature + expiry saja (tanpa query DB), tanpa/invalid → redirect `/login?next=...`.
- Pages + actions: `requireUser(['student'|'assistant'|'admin'])` → `UNAUTHORIZED`/`FORBIDDEN`, pages redirect ke `/login` atau portal per-role.
- `getStudentHistory`: student hanya boleh lihat milik sendiri; student page fetch grades via `inArray(submissionIds sendiri)` (least-privilege).
- `saveGrade`: hanya assistant/admin + Zod 0–100. `submitLaprak`/`checkGithubAction`: wajib login.

## Scripts

```
dev / build / start / lint / typecheck
db:generate / db:push / db:seed / db:setup
```

## Deploy

Set `DATABASE_URL` + `SESSION_SECRET>=32` di env hosting, pastikan `ALLOW_DEMO_FALLBACK` unset/false, jalankan `db:setup + db:seed` ke branch DB yang benar, lalu `build/start`. Lihat `docs/Architecture.md` untuk diagram Vercel→Neon (region `ap-southeast-1`).

