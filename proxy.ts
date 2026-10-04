import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, parseSessionValueWith } from "@/src/lib/session";

function readSecret(): string | null {
  const s = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (s && process.env.NODE_ENV !== "production") return s;
  // P0-4: fail-closed di production — tanpa secret valid, tolak semua sesi.
  if (process.env.NODE_ENV === "production") return null;
  return "dev-only-secret-change-me";
}

/**
 * P0-1: RBAC garis depan.
 * Next.js 16: `proxy.ts` pengganti `middleware.ts`.
 * - `/dashboard/*` wajib punya cookie session valid (signature + expiry).
 * - Tanpa/invalid → redirect `/login`.
 * - Role detail (student vs assistant/admin) ditegakkan di page + server actions
 *   via `requireUser()` karena proxy tidak query DB.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (!isDashboard) return NextResponse.next();

  const secret = readSecret();
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  const session = secret ? parseSessionValueWith(secret, raw ?? null) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Simpan tujuan agar login bisa redirect balik bila perlu.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
