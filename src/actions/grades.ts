"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { grades } from "@/src/db/schema";
import { getCurrentUser } from "@/src/lib/auth";
import { gradeInputSchema } from "@/src/lib/validators";

export type GradeResult = { ok: boolean; message: string };

export async function saveGrade(input: unknown): Promise<GradeResult> {
  const parsed = gradeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Nilai tidak valid." };
  }
  const sessionUser = await getCurrentUser();
  let graderId: string | null = null;
  if (sessionUser && (sessionUser.role === "assistant" || sessionUser.role === "admin")) {
    graderId = sessionUser.id;
  } else {
    const demo = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, "assistant@laprakhub.local"),
    });
    if (!demo) return { ok: false, message: "Login sebagai Aslab diperlukan." };
    graderId = demo.id;
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

