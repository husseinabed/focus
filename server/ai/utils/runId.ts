export function generateRunId(prefix = "run"): string {
    const ts = new Date()
        .toISOString()                 // 2026-02-04T20:33:12.345Z
        .replace(/[-:.TZ]/g, "")       // 20260204203312345
        .slice(0, 17);                 // 20260204203312345

    const rand = Math.random()
        .toString(36)
        .slice(2, 8);                  // 6 chars

    return `${prefix}_${ts}_${rand}`;
}