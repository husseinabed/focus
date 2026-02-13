// ~/server/state/Runs.ts
type Run = {
    body: any
    createdAt: number
};

const store = new Map<string, Run>();

export function saveRun(runId: string, body: any) {
    store.set(runId, { body, createdAt: Date.now() });
}

export function getRun(runId: string) {
    return store.get(runId);
}

export function deleteRun(runId: string) {
    store.delete(runId);
}

// optional cleanup helper
export function cleanupRuns(ttlMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [id, run] of store) {
        if (now - run.createdAt > ttlMs) {
            store.delete(id);
        }
    }
}
