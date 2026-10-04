"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { grades } from "@/src/db/schema";
import { requireUser } from "@/src/lib/auth";
import { gradeInputSchema } from "@/src/lib/validators";

export type GradeResult = { ok: boolean; message: string };

export async function saveGrade(input: unknown): Promise<GradeResult> {
  // P0-1: hanya aslab/admin. Tanpa session → UNAUTHORIZED (throw).
  // P0-2: tidak ada lagi fallback ke assistant@laprakhub.local.
  const sessionUser = await requireUser(["assistant", "admin"]);
  const graderId = sessionUser.id;
  const parsed = gradeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Nilai tidak valid." };
  }
  const now = new Date();
  const existing = await db.query.grades.findFirst({
    where: (g, { eq }) => eq(g.submissionId, parsed.data.submissionId),
  });
  if (existing) {
    await db
      .update(grades)
      .set({
        score: parsed.data.score,
        feedback: parsed.data.feedback ?? "",
        gradedBy: graderId,
        gradedAt: now,
        updatedAt: now,
      })
      .where(eq(grades.submissionId, parsed.data.submissionId));
  } else {
    await db.insert(grades).values({
      submissionId: parsed.data.submissionId,
      score: parsed.data.score,
      feedback: parsed.data.feedback ?? "",
      gradedBy: graderId,
      gradedAt: now,
      updatedAt: now,
    });
  }
  revalidatePath("/dashboard/assistant");
  return { ok: true, message: "Nilai tersimpan." };
}

