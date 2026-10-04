import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users, type User } from "@/src/db/schema";
import {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionValue,
  getSessionSecret,
  parseSessionValue,
} from "@/src/lib/session";

export type UserRole = "student" | "assistant" | "admin";

/** Demo fallback hanya untuk dev eksplisit — default MATI. */
export function isDemoFallbackAllowed(): boolean {
  return (
    process.env.ALLOW_DEMO_FALLBACK === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export async function setSessionCookie(userId: string): Promise<void> {
  // Fail-fast di production kalau secret belum diset.
  getSessionSecret();
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionPayload() {
  const store = await cookies();
  return parseSessionValue(store.get(COOKIE_NAME)?.value);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSessionPayload();
  if (!session) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * P0-1: penegakan RBAC di server.
 * - tanpa session → throw UNAUTHORIZED
 * - role tidak cocok → throw FORBIDDEN
 * Pages menangkap ini dan `redirect("/login")` / `redirect("/dashboard/...")`.
 */
export async function requireUser(
  roles?: Array<UserRole>
): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: silakan login terlebih dahulu.");
  }
  if (roles && !roles.includes(user.role as UserRole)) {
    throw new Error("FORBIDDEN: peran Anda tidak diizinkan.");
  }
  return user;
}

export async function requireStudent(): Promise<User> {
  return requireUser(["student"]);
}

export async function requireStaff(): Promise<User> {
  return requireUser(["assistant", "admin"]);
}

export async function requireAdmin(): Promise<User> {
  return requireUser(["admin"]);
}

export { COOKIE_NAME };

