"use client";
import * as React from "react";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { GradeForm } from "@/src/components/grade-form";
import { cellMeta, type MatrixRow } from "@/src/lib/matrix";
import { formatDateTime } from "@/src/lib/utils";

export type ModuleInfo = { id: string; moduleNumber: number; title: string; deadline: string };

export function MatrixGrid({ rows, modules }: { rows: MatrixRow[]; modules: ModuleInfo[] }) {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState<{ row: MatrixRow; mod: ModuleInfo } | null>(null);
  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return r.fullName.toLowerCase().includes(s) || r.npmNip.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
  });
  const selCell = sel ? sel.row.cells[sel.mod.moduleNumber] : null;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Cari NPM / nama / email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <span className="text-xs text-zinc-500">{filtered.length} praktikan · 🟢 Tepat Waktu · 🟡 Terlambat · ⚠️ Private Repo · 🔴 Belum</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white text-zinc-900">
        <table className="min-w-[1100px] w-full text-center text-xs text-zinc-900">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-900">
              <th className="sticky left-0 bg-zinc-50 px-3 py-2 text-left text-zinc-900">NPM · Nama</th>
              {modules.map((m) => (
                <th key={m.id} className="px-2 py-2 text-zinc-900" title={`${m.title} · ${formatDateTime(m.deadline)}`}>M{m.moduleNumber}</th>
              ))}
              <th className="px-2 py-2 text-zinc-900">Terkumpul</th>
              <th className="px-2 py-2 text-zinc-900">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.studentId} className="border-b border-zinc-100 text-zinc-900 hover:bg-zinc-50/60">
                <td className="sticky left-0 bg-white px-3 py-1.5 text-left text-zinc-900">
                  <p className="font-mono font-semibold text-zinc-900">{r.npmNip}</p>
                  <p className="truncate text-[11px] text-zinc-600">{r.fullName}</p>
                </td>
                {modules.map((m) => {
                  const c = r.cells[m.moduleNumber];
                  const meta = cellMeta(c.status);
                  const v = c.status === "ontime" ? "success" : c.status === "late" ? "warning" : c.status === "private_warn" ? "danger" : "outline";
                  return (
                    <td key={m.id} className="px-1 py-1.5">
                      <button
                        type="button"
                        disabled={!c.submissionId}
                        onClick={() => setSel({ row: r, mod: m })}
                        title={c.submissionId ? `${meta.label}${c.score != null ? ` · ${c.score}` : ""} — klik Quick View` : meta.label}
                        className={c.submissionId ? "cursor-pointer" : "cursor-default opacity-80"}
                      >
                        <Badge variant={v as never}>{meta.emoji} {c.score ?? meta.label}</Badge>
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 text-zinc-900">{r.submittedCount}/{modules.length}</td>
                <td className="px-2 font-semibold text-zinc-900">{r.avgScore ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!sel} onOpenChange={(o) => { if (!o) setSel(null); }}>
        {sel && selCell?.submissionId && (
          <>
            <DialogHeader>
              <DialogTitle>Quick View — {sel.row.npmNip} · M{sel.mod.moduleNumber}</DialogTitle>
              <DialogClose onClick={() => setSel(null)} />
            </DialogHeader>
            <DialogContent>
              <div className="grid gap-2 text-sm text-zinc-900">
                <p><span className="text-zinc-500">Mahasiswa:</span> {sel.row.fullName} ({sel.row.email})</p>
                <p><span className="text-zinc-500">Modul:</span> {sel.mod.title} · Deadline {formatDateTime(sel.mod.deadline)}</p>
                <p><span className="text-zinc-500">Status:</span> {cellMeta(selCell.status).emoji} {cellMeta(selCell.status).label} · {selCell.isLate ? "Terlambat" : "Tepat waktu"}</p>
                <p><span className="text-zinc-500">Submit:</span> {formatDateTime(selCell.submittedAt)}</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {selCell.mediumUrl && <a href={selCell.mediumUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">Buka Medium</a>}
                  {selCell.githubUrl && <a href={selCell.githubUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">Buka GitHub ({selCell.githubStatus})</a>}
                </div>
                <GradeForm submissionId={selCell.submissionId} initialScore={selCell.score} initialFeedback={selCell.feedback} />
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
    </div>
  );
}
