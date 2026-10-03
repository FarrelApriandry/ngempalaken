import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users, type User } from "@/src/db/schema";

const COOKIE_NAME = "laprakhub_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    "dev-only-secret-change-me"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export type SessionPayload = {
  userId: string;
  expiresAt: number;
};

/** CreateSigned session value: base64url(payload).hex-signature */
export function createSessionValue(userId: string): string {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${raw}.${sign(raw)}`;
}

export function parseSessionValue(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [raw, sig] = value.split(".");
  if (!raw || !sig) return null;
  const expected = sign(raw);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!payload.userId || payload.expiresAt * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
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

export async function getSessionPayload(): Promise<SessionPayload | null> {
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

export async function requireUser(roles?: Array<"student" | "assistant" | "admin">): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: silakan login terlebih dahulu.");
  }
  if (roles && !roles.includes(user.role as "student" | "assistant" | "admin")) {
    throw new Error("FORBIDDEN: peran Anda tidak diizinkan.");
  }
  return user;
}

export { COOKIE_NAME };
