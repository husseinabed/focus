// server/utils/vercel.ts
import { Vercel } from "@vercel/sdk";

export const vercel = new Vercel({
  bearerToken: process.env.VERCEL_TOKEN,
});
 
function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getVercelTeamId() {
  // optional (works for personal accounts too)
  return process.env.VERCEL_TEAM_ID || null;
}

export function getVercelGitHubRepo() {
  return {
    type: "github" as const,
    repo: requiredEnv("GITHUB_REPO"), // usually unused here; keep if you want global defaults
  };
}
