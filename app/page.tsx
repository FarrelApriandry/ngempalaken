import Link from "next/link";
import { ArrowRight, FileText, GitBranch, ShieldCheck, TableProperties } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="grid gap-8 rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4">
          <span className="w-fit rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
            Praktikum · M1–M14 · Medium + GitHub
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 md:text-4xl">
            LaprakHub — Pengumpulan &amp; Evaluasi Laporan Praktikum
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 md:text-base">
            Menggantikan Google Form manual dengan portal mandiri mahasiswa,
            validasi URL otomatis (Regex + GitHub REST API), penanda
            keterlambatan otomatis, dan matriks rekapitulasi M1–M14 untuk
            asisten lab.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/student"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Portal Praktikan <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard/assistant"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Matriks Aslab <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="grid gap-3 text-zinc-900">
          <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 text-zinc-900">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm">
              <FileText className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Validasi URL eksplisit</p>
              <p className="text-sm text-zinc-600">medium.com/@username/slug dan github.com/username/repo.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 text-zinc-900">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm">
              <GitBranch className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">GitHub REST API check</p>
              <p className="text-sm text-zinc-600">200 public, 404 not found, selain itu private.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 text-zinc-900">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm">
              <TableProperties className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Matriks M1–M14</p>
              <p className="text-sm text-zinc-600">Tepat Waktu / Terlambat / Belum / Private Repo + CSV.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-zinc-50 p-4 text-zinc-900">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Anti-duplikat &amp; LATE otomatis</p>
              <p className="text-sm text-zinc-600">UNIQUE(student, assignment) → kirim ulang = update.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Akun demo (setelah db:setup + db:seed)</p>
        <ul className="mt-2 grid gap-1 font-mono text-xs md:grid-cols-3">
          <li>student@laprakhub.local / student123</li>
          <li>assistant@laprakhub.local / aslab123</li>
          <li>admin@laprakhub.local / admin123</li>
        </ul>
      </section>
    </main>
  );
}

