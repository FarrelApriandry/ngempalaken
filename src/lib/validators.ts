import { z } from "zod";

export const MEDIUM_URL_RE =
  /^https?:\/\/(www\.)?medium\.com\/@[\w.-]+\/.+$/;
export const GITHUB_URL_RE =
  /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const clean = normalizeUrl(url).replace(/\/+$/, "");
  const m = clean.match(
    /^https?:\/\/(www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:[?#].*)?$/
  );
  if (!m) return null;
  return { owner: m[2], repo: m[3] };
}

const mediumUrlSchema = z
  .string()
  .trim()
  .min(1, "URL Medium wajib diisi")
  .regex(
    MEDIUM_URL_RE,
    "URL Medium tidak valid. Format: https://medium.com/@<username>/<slug>"
  );

const githubUrlSchema = z
  .string()
  .trim()
  .min(1, "URL GitHub wajib diisi")
  .regex(
    GITHUB_URL_RE,
    "URL GitHub tidak valid. Format: https://github.com/<username>/<repo>"
  );

export const submissionInputSchema = z.object({
  assignmentId: z.string().uuid("assignmentId tidak valid"),
  mediumUrl: mediumUrlSchema,
  githubUrl: githubUrlSchema,
});
export type SubmissionInput = z.infer<typeof submissionInputSchema>;

export const gradeInputSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.coerce.number().int().min(0).max(100),
  feedback: z.string().max(2000).optional().default(""),
});
export type GradeInput = z.infer<typeof gradeInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});
