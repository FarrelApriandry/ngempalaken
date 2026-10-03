"use client";
import { Download } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { downloadCsv, matrixToCsv } from "@/src/lib/csv";
import type { MatrixRow } from "@/src/lib/matrix";

export function ExportButton({ rows, modules }: { rows: MatrixRow[]; modules: Array<{ moduleNumber: number; title: string }> }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const csv = matrixToCsv(rows, modules);
        const d = new Date().toISOString().slice(0, 10);
        downloadCsv(`laprakhub-matrix-${d}.csv`, csv);
      }}
    >
      <Download /> Export CSV
    </Button>
  );
}
