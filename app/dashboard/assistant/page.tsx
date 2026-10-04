import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getCurrentUser, isDemoFallbackAllowed } from "@/src/lib/auth";
import { resolveCellStatus, type MatrixCell, type MatrixRow } from "@/src/lib/matrix";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { MatrixGrid } from "@/src/components/matrix-grid";
import { ExportButton } from "@/src/components/export-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Matriks Aslab M1–M14 — LaprakHub" };

export default async function AssistantDashboardPage() {
  // P0-1: hanya aslab/admin. Praktikan → portalnya. Belum login → /login.
  // P0-2: demo fallback hanya bila ALLOW_DEMO_FALLBACK=true (dev saja).
  let staff = await getCurrentUser();
  if (!staff) {
    if (isDemoFallbackAllowed()) {
      const demo = await db
        .select()
        .from(users)
        .where(eq(users.email, "assistant@laprakhub.local"))
        .limit(1);
      staff = demo[0] ?? null;
    }
    if (!staff) redirect("/login");
  }
  if (staff.role !== "assistant" && staff.role !== "admin") {
    redirect("/dashboard/student");
  }

  const [assignmentRows, studentRows, submissionRows, gradeRows] = await Promise.all([
    db.query.assignments.findMany({ orderBy: (a, { asc }) => [asc(a.moduleNumber)] }),
    db.query.users.findMany({
      where: (u, { eq }) => eq(u.role, "student"),
      orderBy: (u, { asc }) => [asc(u.npmNip)],
    }),
    db.query.submissions.findMany({}),
    db.query.grades.findMany({}),
  ]);

  const modules = assignmentRows.map((a) => ({
    id: a.id,
    moduleNumber: a.moduleNumber,
    title: a.title,
    deadline: a.deadline instanceof Date ? a.deadline.toISOString() : String(a.deadline),
  }));

  const subByKey = new Map(submissionRows.map((s) => [`${s.studentId}::${s.assignmentId}`, s]));
  const gradeBySub = new Map(gradeRows.map((g) => [g.submissionId, g]));

  const rows: MatrixRow[] = studentRows.map((st) => {
    const cells: Record<number, MatrixCell> = {};
    let submitted = 0;
    let late = 0;
    const scores: number[] = [];
    for (const a of assignmentRows) {
      const sub = subByKey.get(`${st.id}::${a.id}`);
      if (!sub) {
        cells[a.moduleNumber] = {
          submissionId: null, mediumUrl: null, githubUrl: null,
          githubStatus: null, isLate: false, submittedAt: null,
          score: null, feedback: null, status: "missing",
        };
        continue;
      }
      const gr = gradeBySub.get(sub.id);
      const score = typeof gr?.score === "number" ? gr.score : null;
      if (score != null) scores.push(score);
      submitted += 1;
      if (sub.isLate) late += 1;
      const status = resolveCellStatus({
        submissionId: sub.id, githubStatus: sub.githubRepoStatus, isLate: sub.isLate,
      });
      cells[a.moduleNumber] = {
        submissionId: sub.id, mediumUrl: sub.mediumUrl, githubUrl: sub.githubUrl,
        githubStatus: sub.githubRepoStatus, isLate: sub.isLate,
        submittedAt: sub.submittedAt instanceof Date ? sub.submittedAt.toISOString() : String(sub.submittedAt),
        score, feedback: gr?.feedback ?? null, status,
      };
    }
    return {
      studentId: st.id, npmNip: st.npmNip, fullName: st.fullName, email: st.email,
      cells, submittedCount: submitted, lateCount: late,
      avgScore: scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10 : null,
    };
  });

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Matriks M1–M14</CardTitle>
              <CardDescription>
                {rows.length} praktikan · {modules.length} modul · klik sel berisi untuk Quick View + nilai.
              </CardDescription>
            </div>
            <ExportButton rows={rows} modules={modules} />
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada praktikan. Jalankan db:seed.</p>
          ) : (
            <MatrixGrid rows={rows} modules={modules} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
