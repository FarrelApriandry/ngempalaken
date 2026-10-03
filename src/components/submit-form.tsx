"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { checkGithubAction, submitLaprak } from "@/src/actions/submissions";
import { GITHUB_URL_RE, MEDIUM_URL_RE } from "@/src/lib/validators";
import { formatDateTime } from "@/src/lib/utils";

export type AssignmentOption = {
  id: string;
  title: string;
  moduleNumber: number;
  deadline: string;
  isActive: boolean;
};

export function SubmitForm({ assignments }: { assignments: AssignmentOption[] }) {
  const router = useRouter();
  const [assignmentId, setAssignmentId] = React.useState(assignments[0]?.id ?? "");
  const [mediumUrl, setMediumUrl] = React.useState("");
  const [githubUrl, setGithubUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [ghStatus, setGhStatus] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ ok: boolean; message: string; warning?: string } | null>(null);
  const mediumOk = MEDIUM_URL_RE.test(mediumUrl.trim());
  const githubOk = GITHUB_URL_RE.test(githubUrl.trim());
  const selected = assignments.find((a) => a.id === assignmentId);

  React.useEffect(() => {
    if (!GITHUB_URL_RE.test(githubUrl.trim())) {
      setGhStatus(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await checkGithubAction(githubUrl.trim());
        if (r.ok && "status" in r && r.status) setGhStatus(r.status);
        else if (!r.ok) setGhStatus("invalid");
        else setGhStatus(null);
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [githubUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const r = await submitLaprak({ assignmentId, mediumUrl: mediumUrl.trim(), githubUrl: githubUrl.trim() });
      setResult({ ok: r.ok, message: r.message, warning: r.warning });
      if (r.ok) router.refresh();
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setLoading(false);
    }
  }

  if (assignments.length === 0) return <p className="text-sm text-zinc-500">Belum ada modul aktif.</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="modul">Modul (M1–M14)</Label>
        <select id="modul" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>M{a.moduleNumber} — {a.title}</option>
          ))}
        </select>
        {selected && <p className="text-xs text-zinc-500">Deadline: {formatDateTime(selected.deadline)} · {selected.isActive ? "Aktif" : "Nonaktif"}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="medium">Link Medium</Label>
        <Input id="medium" placeholder="https://medium.com/@username/slug" value={mediumUrl} onChange={(e) => setMediumUrl(e.target.value)} required />
        {mediumUrl && <Badge variant={mediumOk ? "success" : "danger"}>{mediumOk ? "Format Medium valid" : "Format: medium.com/@user/slug"}</Badge>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="github">Link GitHub</Label>
        <Input id="github" placeholder="https://github.com/username/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} required />
        <div className="flex flex-wrap gap-2">
          {githubUrl && <Badge variant={githubOk ? "success" : "danger"}>{githubOk ? "Format GitHub valid" : "Format: github.com/user/repo"}</Badge>}
          {checking && <Badge variant="info">Cek repo…</Badge>}
          {!checking && ghStatus === "public" && <Badge variant="success">Public ✓</Badge>}
          {!checking && ghStatus === "private" && <Badge variant="warning">Private ⚠️ ubah ke Public</Badge>}
          {!checking && ghStatus === "not_found" && <Badge variant="warning">Not Found ⚠️ cek URL</Badge>}
        </div>
      </div>
      {result && (
        <div role="alert" className={`rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          <p>{result.message}</p>
          {result.warning && <p className="mt-1 text-xs">{result.warning}</p>}
        </div>
      )}
      <Button type="submit" disabled={loading || !mediumOk || !githubOk}>
        {loading ? <Loader2 className="animate-spin" /> : <Send />}
        {loading ? "Menyimpan…" : "Kumpulkan / Revisi"}
      </Button>
    </form>
  );
}
