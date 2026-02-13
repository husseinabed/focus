// ~/server/state/brandRuns.ts
type BrandRun = {
    body: any
    createdAt: number
};

const store = new Map<string, BrandRun>();

export function saveBrandRun(runId: string, body: any) {
    store.set(runId, { body, createdAt: Date.now() });
}

export function getBrandRun(runId: string) {
    return store.get(runId);
}

export function deleteBrandRun(runId: string) {
    store.delete(runId);
}

// optional cleanup helper
export function cleanupBrandRuns(ttlMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [id, run] of store) {
        if (now - run.createdAt > ttlMs) {
            store.delete(id);
        }
    }
}
