"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { saveGrade } from "@/src/actions/grades";

export function GradeForm({ submissionId, initialScore, initialFeedback }: { submissionId: string; initialScore: number | null; initialFeedback: string | null }) {
  const router = useRouter();
  const [score, setScore] = React.useState(initialScore != null ? String(initialScore) : "");
  const [feedback, setFeedback] = React.useState(initialFeedback ?? "");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const r = await saveGrade({ submissionId, score: Number(score), feedback });
      setMsg(r.message);
      if (r.ok) router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menyimpan nilai.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSave} className="grid gap-3 rounded-lg bg-zinc-50 p-3">
      <div className="grid gap-2">
        <Label htmlFor={`score-${submissionId}`}>Nilai (0–100)</Label>
        <Input id={`score-${submissionId}`} type="number" min={0} max={100} required value={score} onChange={(e) => setScore(e.target.value)} placeholder="85" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`fb-${submissionId}`}>Feedback / catatan revisi</Label>
        <Textarea id={`fb-${submissionId}`} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Perbaiki struktur abstrak, tambah screenshot…" rows={3} />
      </div>
      {msg && <p className="text-xs text-zinc-700">{msg}</p>}
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Save />} Simpan Nilai
      </Button>
    </form>
  );
}
