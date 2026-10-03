import { parseGithubRepo } from "./validators";
import type { GithubRepoStatus } from "@/src/db/schema";

export type GithubCheckResult = {
  status: GithubRepoStatus;
  httpStatus: number;
  isPrivateFlag: boolean | null;
  checkedAt: string;
};

/**
 * SDD §3.1 ValidateAndCheckSubmission step 4 + Architecture §2.3.
 * GET https://api.github.com/repos/{owner}/{repo}
 *   200 + private=false → public
 *   200 + private=true  → private
 *   404                 → not_found
 *   403/429/other       → private (warn user before save, per REQ-VAL-02)
 */
export async function checkGithubRepo(
  githubUrl: string
): Promise<GithubCheckResult> {
  const parsed = parseGithubRepo(githubUrl);
  const checkedAt = new Date().toISOString();
  if (!parsed) {
    return { status: "not_found", httpStatus: 0, isPrivateFlag: null, checkedAt };
  }
  const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "LaprakHub/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  let res: Response;
  try {
    res = await fetch(apiUrl, { headers, cache: "no-store" });
  } catch {
    return { status: "not_found", httpStatus: 0, isPrivateFlag: null, checkedAt };
  }
  if (res.status === 200) {
    try {
      const data = (await res.json()) as { private?: boolean };
      const isPrivate = data.private === true;
      return {
        status: isPrivate ? "private" : "public",
        httpStatus: 200,
        isPrivateFlag: isPrivate,
        checkedAt,
      };
    } catch {
      return { status: "public", httpStatus: 200, isPrivateFlag: false, checkedAt };
    }
  }
  if (res.status === 404) {
    return { status: "not_found", httpStatus: 404, isPrivateFlag: null, checkedAt };
  }
  return { status: "private", httpStatus: res.status, isPrivateFlag: null, checkedAt };
}

export function githubStatusLabel(status: GithubRepoStatus): string {
  switch (status) {
    case "public":
      return "Public ✓";
    case "private":
      return "Private ⚠️";
    case "not_found":
      return "Not Found ⚠️";
  }
}
