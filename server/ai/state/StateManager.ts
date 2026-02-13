// server/ai/state/StateManager.ts
import { StateStore } from "./store";

export class StateManager {
    constructor(private store: StateStore) { }

    // pull repo from many shapes, fall back to stored
    getRepo(input: any) {
        return (
            input?.repo ??
            input?.payload?.repo ??
            input?.payload?.project?.repo ??
            input?.project?.repo ??
            this.store.get("repo") ??
            null
        );
    }

    ensureRepo(input: any) {
        const repo = this.getRepo(input);
        if (!repo) throw new Error("MISSING_REPO_CONTEXT: repo is required");
        this.store.set("repo", repo);
        return repo;
    }

    injectRepo(input: any, repo: any) {
        if (input?.meta && input?.payload) {
            return { ...input, payload: { ...input.payload, repo } };
        }
        return { ...input, repo };
    }
}
