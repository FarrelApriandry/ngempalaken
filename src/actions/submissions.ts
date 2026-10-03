"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { assignments, submissions } from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth";
import { checkGithubRepo } from "@/src/lib/github";
import { normalizeUrl, submissionInputSchema } from "@/src/lib/validators";

export type SubmitLaprakResult = {
  ok: boolean;
  message: string;
  githubStatus?: "public" | "private" | "not_found";
  isLate?: boolean;
  isUpdate?: boolean;
  warning?: string;
};

export async function submitLaprak(input: {
  assignmentId: string;
  mediumUrl: string;
  githubUrl: string;
}): Promise<SubmitLaprakResult> {
  const mediumUrl = normalizeUrl(input.mediumUrl ?? "");
  const githubUrl = normalizeUrl(input.githubUrl ?? "");

  const parsed = submissionInputSchema.safeParse({
    assignmentId: input.assignmentId,
    mediumUrl,
    githubUrl,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "Input tidak valid." };
  }

  const sessionUser = await getCurrentUser();
  let studentId = sessionUser?.id ?? null;
  if (!studentId) {
    const demo = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, "student@laprakhub.local"),
    });
    if (!demo) {
      return { ok: false, message: "Silakan login terlebih dahulu sebagai Praktikan." };
    }
    studentId = demo.id;
  }

  const assignment = await db.query.assignments.findFirst({
    where: (a, { eq }) => eq(a.id, parsed.data.assignmentId),
  });
  if (!assignment) {
    return { ok: false, message: "Modul/assignment tidak ditemukan." };
  }
  if (!assignment.isActive) {
    return { ok: false, message: `Modul ${assignment.title} sedang tidak aktif.` };
  }

  const github = await checkGithubRepo(parsed.data.githubUrl);

  const now = new Date();
  const isLate = now.getTime() > new Date(assignment.deadline).getTime();

  const existing = await db.query.submissions.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.studentId, studentId), eq(s.assignmentId, assignment.id)),
  });

  if (existing) {
    await db
      .update(submissions)
      .set({
        mediumUrl: parsed.data.mediumUrl,
        githubUrl: parsed.data.githubUrl,
        githubRepoStatus: github.status,
        isLate,
        submittedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(submissions.studentId, studentId),
          eq(submissions.assignmentId, assignment.id)
        )
      );
  } else {
    await db.insert(submissions).values({
      studentId,
      assignmentId: assignment.id,
      mediumUrl: parsed.data.mediumUrl,
      githubUrl: parsed.data.githubUrl,
      githubRepoStatus: github.status,
      isLate,
      submittedAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/assistant");

  let warning: string | undefined;
  if (github.status === "not_found") {
    warning =
      "Peringatan: repository GitHub tidak ditemukan (404). Pastikan URL benar dan repo berstatus Public sebelum deadline.";
  } else if (github.status === "private") {
    warning =
      "Peringatan: repository GitHub terdeteksi Private/tidak dapat diakses publik. Ubah ke Public agar dapat dinilai.";
  }

  return {
    ok: true,
    message: existing
      ? `Revisi tersimpan (${isLate ? "Terlambat" : "Tepat waktu"}).`
      : `Laporan tersimpan (${isLate ? "Terlambat" : "Tepat waktu"}).`,
    githubStatus: github.status,
    isLate,
    isUpdate: !!existing,
    warning,
  };
}

export async function getStudentHistory(studentId: string) {
  return db.query.submissions.findMany({
    where: (s, { eq }) => eq(s.studentId, studentId),
    with: { assignment: true },
    orderBy: (s, { asc }) => [asc(s.submittedAt)],
  });
}

export async function checkGithubAction(githubUrl: string) {
  const { checkGithubRepo } = await import("@/src/lib/github");
  const { normalizeUrl, GITHUB_URL_RE } = await import("@/src/lib/validators");
  const clean = normalizeUrl(githubUrl ?? "");
  if (!clean) return { ok: false, message: "URL kosong." as const };
  if (!GITHUB_URL_RE.test(clean)) {
    return { ok: false, message: "Format URL GitHub tidak valid." as const };
  }
  const result = await checkGithubRepo(clean);
  return { ok: true, status: result.status, httpStatus: result.httpStatus };
}
