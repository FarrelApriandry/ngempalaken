import Link from "next/link";
import { LogoutButton } from "@/src/components/logout-button";
import { getCurrentUser } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900">
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard/student" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
            Praktikan
          </Link>
          <Link href="/dashboard/assistant" className="rounded-md px-3 py-1.5 text-zinc-900 hover:bg-zinc-100">
            Aslab (M1–M14)
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <span className="text-zinc-600">
              {user.fullName} · <span className="font-mono text-xs">{user.role}</span>
            </span>
          ) : (
            <span className="text-xs text-amber-700">Mode demo (belum login)</span>
          )}
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
