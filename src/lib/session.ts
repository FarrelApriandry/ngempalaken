import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "laprakhub_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_FALLBACK_SECRET = "dev-only-secret-change-me";

export type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function readSecretEnv(): string | undefined {
  return process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
}

/**
 * P0-4: fail-fast di production kalau secret belum diset.
 * Di dev/test: fallback ke dev-only secret agar `bun dev` tetap jalan,
 * tapi cetak warning jelas supaya tidak terbawa ke deploy.
 */
export function getSessionSecret(): string {
  const secret = readSecretEnv();
  if (secret && secret.length >= 32) return secret;
  if (secret && process.env.NODE_ENV !== "production") {
    console.warn(
      "[auth] SESSION_SECRET terlalu pendek (<32 char) — pakai apa adanya hanya untuk dev."
    );
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing SESSION_SECRET (or AUTH_SECRET, min 32 char) in production. Set di environment sebelum start."
    );
  }
  console.warn(
    "[auth] SESSION_SECRET/AUTH_SECRET belum diset — memakai dev-only fallback. JANGAN pakai di production."
  );
  return DEV_FALLBACK_SECRET;
}

function signWith(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Pure verifier — aman diimpor dari `proxy.ts` (tanpa I/O DB). */
export function parseSessionValueWith(
  secret: string,
  value: string | undefined | null
): SessionPayload | null {
  if (!value) return null;
  const [raw, sig] = value.split(".");
  if (!raw || !sig) return null;
  const expected = signWith(secret, raw);
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

export function parseSessionValue(
  value: string | undefined | null
): SessionPayload | null {
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  return parseSessionValueWith(secret, value);
}

export function createSessionValue(userId: string): string {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${raw}.${signWith(getSessionSecret(), raw)}`;
}

export { COOKIE_NAME, SESSION_TTL_SECONDS };
