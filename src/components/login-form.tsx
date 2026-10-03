"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { loginAction } from "@/src/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("student@laprakhub.local");
  const [password, setPassword] = React.useState("student123");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginAction({ email, password });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const dest =
        res.role === "assistant" || res.role === "admin"
          ? "/dashboard/assistant"
          : "/dashboard/student";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  function fillAs(role: "student" | "assistant" | "admin") {
    if (role === "student") {
      setEmail("student@laprakhub.local");
      setPassword("student123");
    } else if (role === "assistant") {
      setEmail("assistant@laprakhub.local");
      setPassword("aslab123");
    } else {
      setEmail("admin@laprakhub.local");
      setPassword("admin123");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Masuk LaprakHub</CardTitle>
        <CardDescription>
          Gunakan akun demo setelah <code className="font-mono">bun run db:setup &amp;&amp; bun run db:seed</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Kata sandi</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
            {loading ? "Memeriksa..." : "Login"}
          </Button>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-zinc-500">Isi cepat:</span>
            <button type="button" onClick={() => fillAs("student")} className="rounded-full bg-zinc-100 px-2.5 py-1 hover:bg-zinc-200">
              Praktikan
            </button>
            <button type="button" onClick={() => fillAs("assistant")} className="rounded-full bg-zinc-100 px-2.5 py-1 hover:bg-zinc-200">
              Aslab
            </button>
            <button type="button" onClick={() => fillAs("admin")} className="rounded-full bg-zinc-100 px-2.5 py-1 hover:bg-zinc-200">
              Admin
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
