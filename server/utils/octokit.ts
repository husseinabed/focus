import { Octokit } from "octokit";

// github api client
export function createOctokit(token: string) {
  return new Octokit({ auth: token });
}

export const octokit = createOctokit(process.env.GITHUB_TOKEN ?? "")