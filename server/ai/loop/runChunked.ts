// server/ai/loop/runChunked.ts
// Minimal loop runner for BIG outputs (ui_layout_agent, copy packs, etc.)
// Works with your AiAgent.run() which already calls runAgent() + parseJsonRaw().

export type ChunkStatus = "continue" | "done";

export type ChunkedAgentOutput = {
    status: ChunkStatus;
    cursor?: string | null;
    next_request?: {
        cursor?: string | null;
        // optional knobs your agent may echo back
        max_patterns?: number;
        max_pages?: number;
        max_items?: number;
    } | null;
    // plus any payload fields (arrays you want to collect)
    [key: string]: any;
};

function assertChunked(o: any): asserts o is ChunkedAgentOutput {
    if (!o || typeof o !== "object") throw new Error("Chunk loop: agent output is not an object");

    // Normalize status to lowercase string
    const status = String(o.status).toLowerCase();

    // Map common synonyms to your internal types
    if (['complete', 'finished', 'success', 'done'].includes(status)) {
        o.status = "done";
    } else if (['continue', 'more', 'pending'].includes(status)) {
        o.status = "continue";
    } else {
        throw new Error(`Chunk loop: missing/invalid status (${String(o.status)})`);
    }
}

/**
 * Minimal chunk loop:
 * - Calls agent with baseInput + cursor
 * - Concats array fields listed in collectKeys
 * - Continues until status="done" (or maxIterations)
 */
export async function runChunked(
    agent: { name: string; run: (input: any, onEvent?: (e: any) => void) => Promise<any> },
    opts: {
        baseInput: any;
        collectKeys: string[]; // e.g. ["layout_patterns_library", "page_layouts"]
        maxIterations?: number;
        onEvent?: (e: any) => void;
    }
): Promise<{
    ok: true;
    iterations: number;
    cursor: string | null;
    combined: Record<string, any[]>;
    last: ChunkedAgentOutput;
} | {
    ok: false;
    iterations: number;
    cursor: string | null;
    error: string;
    last?: any;
}> {
    const maxIterations = opts.maxIterations ?? 12;

    const combined: Record<string, any[]> = {};
    for (const k of opts.collectKeys) combined[k] = [];

    let cursor: string | null = null;
    let iterations = 0;
    let last: any = null;

    while (iterations < maxIterations) {
        iterations++;

        const input = { ...opts.baseInput, cursor };



        try {
            last = await agent.run(input, opts.onEvent);
        } catch (e) {
            return {
                ok: false,
                iterations,
                cursor,
                error: `Chunk too large: The model cut off before finishing JSON. Try decreasing max_pages_per_chunk in the system prompt.`,
                last: e
            };
        }


        assertChunked(last);

        // collect arrays
        for (const k of opts.collectKeys) {
            const val = (last as any)[k];
            if (val == null) continue;
            if (!Array.isArray(val)) {
                return {
                    ok: false,
                    iterations,
                    cursor,
                    error: `Chunk loop: expected '${k}' to be an array, got ${typeof val}`,
                    last,
                };
            }
            combined[k].push(...val);
        }

        // advance cursor (prefer next_request.cursor)
        const nextCursor =
            last?.next_request?.cursor !== undefined
                ? (last.next_request.cursor ?? null)
                : (last.cursor ?? null);

        cursor = nextCursor;

        if (last.status === "done") {
            return {
                ok: true,
                iterations,
                cursor,
                combined,
                last,
            };
        }

        // status=continue but no cursor => can't safely continue
        if (!cursor) {
            return {
                ok: false,
                iterations,
                cursor,
                error: "Chunk loop: status=continue but no cursor provided",
                last,
            };
        }
    }

    return {
        ok: false,
        iterations,
        cursor,
        error: `Chunk loop: exceeded maxIterations (${maxIterations})`,
        last,
    };
}
