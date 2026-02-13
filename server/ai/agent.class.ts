import { runAgent } from "./runAgent";

const SYS = `
NEVER include markdown code fences (\`\`\`), language tags (bash, javascript), or unescaped backticks inside any string fields.
If you need to include code, put it as a normal string with \\n newlines and NO backticks.

NEVER include tool code (no "print(...)" or code strings) in JSON.
If you need StateStore, call the provided tools via tool-calling.
Your final output MUST be valid JSON only.

OUTPUT RULES (STRICT)
- Return a SINGLE JSON object only.
- Do NOT include raw newline characters anywhere. If needed, use "\\n" inside strings.
- Do NOT include any trailing text after the final "}".
`;

const MAX_RETRIES = 5;

const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 4000;

// keep this conservative; customize if you have known non-retryable codes
function isRetryableError(err: any) {
    const msg = (err?.message || String(err)).toLowerCase();

    // common "retryable" buckets: timeouts, rate limits, transient network, 5xx
    if (
        msg.includes("timeout") ||
        msg.includes("timed out") ||
        msg.includes("rate limit") ||
        msg.includes("too many requests") ||
        msg.includes("429") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("504") ||
        msg.includes("econnreset") ||
        msg.includes("enotfound") ||
        msg.includes("eai_again") ||
        msg.includes("network")
    ) return true;

    // common "non-retryable" buckets: schema/validation, bad request
    if (
        msg.includes("invalid json") ||
        msg.includes("zod") ||
        msg.includes("schema") ||
        msg.includes("validation") ||
        msg.includes("bad request") ||
        msg.includes("400") ||
        msg.includes("401") ||
        msg.includes("403") ||
        msg.includes("not found") ||
        msg.includes("404")
    ) return false;

    // default: retry (safer for flaky LLM/tool calls)
    return true;
}

function backoffDelay(attempt: number) {
    // attempt: 1..N
    const exp = Math.pow(2, Math.max(0, attempt - 1));
    const raw = BASE_DELAY_MS * exp;

    // jitter ±15%
    const jitter = 0.85 + Math.random() * 0.3;
    const delay = Math.round(raw * jitter);

    return Math.min(delay, MAX_DELAY_MS);
}

export class AiAgent {
    name: string;
    system: string;
    tools: any;

    constructor(name: string, system: any, tools: any = undefined) {
        if (typeof system === "object") {
            system = JSON.stringify(system, null, 2);
        }
        this.name = name;
        this.system = SYS + system;
        this.tools = tools;
    }

    async run(input: any, onEvent?: (event: any) => void) {
        let attempt = 0;
        let lastError: any = null;

        while (attempt < MAX_RETRIES) {
            attempt++;

            try {
                onEvent?.({
                    type: "agent_attempt",
                    name: this.name,
                    attempt,
                    max: MAX_RETRIES,
                });

                const result = await runAgent(this, input, onEvent);

                onEvent?.({
                    type: "agent_success",
                    name: this.name,
                    attempt,
                });

                return result;
            } catch (err: any) {
                lastError = err;

                const retryable = isRetryableError(err);

                onEvent?.({
                    type: "agent_error",
                    name: this.name,
                    attempt,
                    retryable,
                    error: err instanceof Error ? err.message : String(err),
                });

                // stop retrying if non-retryable OR final attempt
                if (!retryable || attempt >= MAX_RETRIES) break;

                const delay = backoffDelay(attempt);

                onEvent?.({
                    type: "agent_wait",
                    name: this.name,
                    attempt,
                    wait_ms: delay,
                });

                await new Promise((r) => setTimeout(r, delay));
            }
        }

        onEvent?.({
            type: "agent_failed",
            name: this.name,
            attempts: attempt,
            max: MAX_RETRIES,
            error: lastError instanceof Error ? lastError.message : String(lastError),
        });

        throw lastError;
    }
}
