"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { clearSessionCookie, setSessionCookie } from "@/src/lib/auth";
import { verifyPassword } from "@/src/lib/password";
import { loginSchema } from "@/src/lib/validators";

export type LoginResult = { ok: boolean; message: string; role?: string };

export async function loginAction(input: { email: string; password: string }): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }
  const email = parsed.data.email.toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !user.passwordHash) {
    return { ok: false, message: "Email atau kata sandi salah." };
  }
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return { ok: false, message: "Email atau kata sandi salah." };
  }
  await setSessionCookie(user.id);
  return { ok: true, message: `Selamat datang, ${user.fullName}!`, role: user.role };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
