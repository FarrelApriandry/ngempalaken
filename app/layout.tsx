import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaprakHub — Pengumpulan & Evaluasi Laporan Praktikum",
  description:
    "Platform pengumpulan, validasi otomatis, dan rekapitulasi laporan praktikum (Medium + GitHub).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white text-zinc-900">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <FlaskConical className="size-4" />
              </span>
              LaprakHub
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/dashboard/student" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
                Praktikan
              </Link>
              <Link href="/dashboard/assistant" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
                Aslab
              </Link>
              <Link
                href="/login"
                className="ml-1 rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
              >
                Login
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-200 bg-white text-zinc-900">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-zinc-500">
            LaprakHub — SRS/SDD/Architecture compliant · Next.js + Drizzle + Neon ·
            Singapore (ap-southeast-1)
          </div>
        </footer>
      </body>
    </html>
  );
}

