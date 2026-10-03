import type { MatrixRow } from "./matrix";

function esc(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function matrixToCsv(
  rows: MatrixRow[],
  modules: Array<{ moduleNumber: number; title: string }>
): string {
  const header = [
    "NPM",
    "Nama",
    "Email",
    ...modules.flatMap((m) => [`M${m.moduleNumber}_status`, `M${m.moduleNumber}_score`]),
    "Terkumpul",
    "Terlambat",
    "Rata-rata",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const cells = modules.flatMap((m) => {
      const c = r.cells[m.moduleNumber];
      if (!c || !c.submissionId) return ["Belum", ""];
      const label =
        c.status === "ontime" ? "Tepat Waktu" : c.status === "late" ? "Terlambat" : "Private Repo";
      return [label, c.score ?? ""];
    });
    lines.push(
      [
        esc(r.npmNip),
        esc(r.fullName),
        esc(r.email),
        ...cells.map(esc),
        r.submittedCount,
        r.lateCount,
        r.avgScore ?? "",
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
