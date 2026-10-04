import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getCurrentUser, isDemoFallbackAllowed } from "@/src/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatDateTime } from "@/src/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — LaprakHub" };

export default async function AdminDashboardPage() {
  // P0-3: admin-only. Tanpa session -> /login. Non-admin -> portalnya.
  // Demo fallback hanya bila ALLOW_DEMO_FALLBACK=true (dev saja), sama seperti portal lain.
  let admin = await getCurrentUser();
  if (!admin) {
    if (isDemoFallbackAllowed()) {
      const demo = await db
        .select()
        .from(users)
        .where(eq(users.email, "admin@laprakhub.local"))
        .limit(1);
      admin = demo[0] ?? null;
    }
    if (!admin) redirect("/login");
  }
  if (admin.role !== "admin") {
    redirect(admin.role === "student" ? "/dashboard/student" : "/dashboard/assistant");
  }

  const [userRows, courseRows, assignmentRows, submissionRows, gradeRows] = await Promise.all([
    db.query.users.findMany({ orderBy: (u, { asc }) => [asc(u.npmNip)] }),
    db.query.courses.findMany({ orderBy: (c, { asc }) => [asc(c.code)] }),
    db.query.assignments.findMany({ orderBy: (a, { asc }) => [asc(a.moduleNumber)] }),
    db.query.submissions.findMany({}),
    db.query.grades.findMany({}),
  ]);

  const counts = {
    students: userRows.filter((u) => u.role === "student").length,
    assistants: userRows.filter((u) => u.role === "assistant").length,
    admins: userRows.filter((u) => u.role === "admin").length,
    courses: courseRows.length,
    assignments: assignmentRows.length,
    submissions: submissionRows.length,
    graded: gradeRows.filter((g) => typeof g.score === "number").length,
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin — Ringkasan Kelas</CardTitle>
          <CardDescription>
            {admin.fullName} · hanya peran admin yang boleh membuka halaman ini. Read-only overview (tanpa mutasi).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="info">Praktikan: {counts.students}</Badge>
            <Badge variant="info">Aslab: {counts.assistants}</Badge>
            <Badge variant="info">Admin: {counts.admins}</Badge>
            <Badge variant="secondary">Courses: {counts.courses}</Badge>
            <Badge variant="secondary">Modul: {counts.assignments}</Badge>
            <Badge variant="success">Submissions: {counts.submissions}</Badge>
            <Badge variant="success">Dinilai: {counts.graded}</Badge>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            RBAC: proxy cek signature cookie → layout wajib login → halaman ini wajib role=admin → server actions
            (saveGrade/submitLaprak) menegakkan peran masing-masing. Demo fallback default MATI
            (ALLOW_DEMO_FALLBACK=true + non-production saja).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengguna ({userRows.length})</CardTitle>
          <CardDescription>NPM/NIP · nama · email · role · dibuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {userRows.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-900"
              >
                <span className="font-mono text-xs font-semibold">{u.npmNip} · {u.fullName}</span>
                <span className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="font-mono">{u.email}</span>
                  <Badge variant={u.role === "admin" ? "danger" : u.role === "assistant" ? "warning" : "secondary"}>
                    {u.role}
                  </Badge>
                  <span>{formatDateTime(u.createdAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses &amp; Modul</CardTitle>
          <CardDescription>{courseRows.length} course · {assignmentRows.length} modul.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {courseRows.map((c) => (
              <div key={c.id} className="rounded-lg border border-zinc-200 p-3 text-sm">
                <p className="font-semibold">
                  {c.code} — {c.name} <span className="font-normal text-zinc-500">({c.semester})</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {assignmentRows
                    .filter((a) => a.courseId === c.id)
                    .map((a) => (
                      <Badge key={a.id} variant={a.isActive ? "success" : "secondary"}>
                        M{a.moduleNumber} {a.isActive ? "aktif" : "nonaktif"}
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
            {courseRows.length === 0 && (
              <p className="text-sm text-zinc-500">Belum ada course. Jalankan db:setup + db:seed.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
