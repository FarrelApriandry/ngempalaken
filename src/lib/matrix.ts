import type { GithubRepoStatus } from "@/src/db/schema";

export type CellStatus = "missing" | "ontime" | "late" | "private_warn";
export type MatrixCell = {
  submissionId: string | null;
  mediumUrl: string | null;
  githubUrl: string | null;
  githubStatus: GithubRepoStatus | null;
  isLate: boolean;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  status: CellStatus;
};

export type MatrixRow = {
  studentId: string;
  npmNip: string;
  fullName: string;
  email: string;
  cells: Record<number, MatrixCell>;
  submittedCount: number;
  lateCount: number;
  avgScore: number | null;
};

export function resolveCellStatus(input: {
  submissionId: string | null;
  githubStatus: GithubRepoStatus | null;
  isLate: boolean;
}): CellStatus {
  if (!input.submissionId) return "missing";
  if (input.githubStatus === "private" || input.githubStatus === "not_found") {
    return "private_warn";
  }
  return input.isLate ? "late" : "ontime";
}

export function cellMeta(status: CellStatus): { emoji: string; label: string } {
  switch (status) {
    case "ontime":
      return { emoji: "🟢", label: "Tepat Waktu" };
    case "late":
      return { emoji: "🟡", label: "Terlambat" };
    case "private_warn":
      return { emoji: "⚠️", label: "Private Repo" };
    case "missing":
    default:
      return { emoji: "🔴", label: "Belum" };
  }
}
