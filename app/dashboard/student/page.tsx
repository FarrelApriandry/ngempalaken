import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getCurrentUser, isDemoFallbackAllowed } from "@/src/lib/auth";
import { getStudentHistory } from "@/src/actions/submissions";
import { SubmitForm, type AssignmentOption } from "@/src/components/submit-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatDateTime } from "@/src/lib/utils";
import { githubStatusLabel } from "@/src/lib/github";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard Praktikan — LaprakHub" };

export default async function StudentDashboardPage() {
  // P0-1: RBAC keras — tanpa session → /login.
  // P0-2: demo fallback hanya bila ALLOW_DEMO_FALLBACK=true (dev saja).
  let user = await getCurrentUser();
  if (!user) {
    if (isDemoFallbackAllowed()) {
      const demo = await db
        .select()
        .from(users)
        .where(eq(users.email, "student@laprakhub.local"))
        .limit(1);
      user = demo[0] ?? null;
    }
    if (!user) redirect("/login");
  }
  if (user.role !== "student" && user.role !== "admin") {
    // Praktikan saja (admin boleh memantau). Aslab → matriks.
    redirect("/dashboard/assistant");
  }

  const assignmentRows = await db.query.assignments.findMany({
    orderBy: (a, { asc }) => [asc(a.moduleNumber)],
  });
  const options: AssignmentOption[] = assignmentRows
    .filter((a) => a.isActive)
    .map((a) => ({
      id: a.id,
      title: a.title,
      moduleNumber: a.moduleNumber,
      deadline: a.deadline instanceof Date ? a.deadline.toISOString() : String(a.deadline),
      isActive: a.isActive,
    }));

  const history = await getStudentHistory(user.id);
  // Least-privilege: hanya nilai milik sendiri (jangan fetch seluruh tabel grades).
  const submissionIds = history.map((h) => h.id);
  const gradeRows = submissionIds.length
    ? await db.query.grades.findMany({
        where: (g, { inArray }) => inArray(g.submissionId, submissionIds),
      })
    : [];
  const gradeBySubmission = new Map(gradeRows.map((g) => [g.submissionId, g]));
  const historyByAssignment = new Map(history.map((h) => [h.assignmentId, h]));

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Kumpulkan Laporan</CardTitle>
          <CardDescription>
            {user.fullName} · {user.npmNip} — pilih modul aktif M1–M14, kirim ulang = revisi otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmitForm assignments={options} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Modul &amp; Deadline</CardTitle>
            <CardDescription>M1–M14 · tepat waktu / terlambat dihitung otomatis dari deadline.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {assignmentRows.map((a) => {
                const sub = historyByAssignment.get(a.id);
                return (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-900">
                    <span className="font-medium text-zinc-900">M{a.moduleNumber} — {a.title}</span>
                    <span className="flex items-center gap-2 text-xs text-zinc-600">
                      <span>{formatDateTime(a.deadline)}</span>
                      {!a.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                      {sub ? (
                        sub.isLate ? <Badge variant="warning">Terlambat</Badge> : <Badge variant="success">Terkumpul</Badge>
                      ) : (
                        <Badge variant="outline">Belum</Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengumpulan</CardTitle>
            <CardDescription>{history.length} laporan tersimpan.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500">Belum ada laporan. Isi form di samping.</p>
            ) : (
              <div className="grid gap-2">
                {history.map((s) => {
                  const grade = gradeBySubmission.get(s.id);
                  return (
                    <div key={s.id} className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-900">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{s.assignment?.title ?? s.assignmentId}</span>
                        <span className="flex gap-1.5">
                          {s.isLate ? <Badge variant="warning">Terlambat</Badge> : <Badge variant="success">Tepat Waktu</Badge>}
                          <Badge variant={s.githubRepoStatus === "public" ? "success" : "danger"}>
                            {githubStatusLabel(s.githubRepoStatus)}
                          </Badge>
                          {typeof grade?.score === "number" && <Badge variant="info">Nilai: {grade.score}</Badge>}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <a href={s.mediumUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">Medium</a>
                        <a href={s.githubUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">GitHub</a>
                        <span className="text-zinc-500">{formatDateTime(s.submittedAt)}</span>
                      </div>
                      {grade?.feedback && <p className="mt-1.5 text-xs text-zinc-600">Feedback aslab: {grade.feedback}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
