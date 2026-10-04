import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/src/components/logout-button";
import { getCurrentUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // P0-1: layout tidak lagi menampilkan mode demo — user wajib login.
  // Proxy sudah redirect /dashboard/* tanpa session; ini pertahanan lapis kedua.
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) redirect("/login");
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900">
        <nav className="flex items-center gap-1 text-sm">
          {(user.role === "student" || user.role === "admin") && (
            <Link href="/dashboard/student" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
              Praktikan
            </Link>
          )}
          {(user.role === "assistant" || user.role === "admin") && (
            <Link href="/dashboard/assistant" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
              Aslab (M1–M14)
            </Link>
          )}
          {user.role === "admin" && (
            <Link href="/dashboard/admin" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600">
            {user.fullName} · <span className="font-mono text-xs">{user.role}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}

