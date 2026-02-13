// server/ai/json.ts
function lastIndexOfAny(s: string, chars: string[]) {
    let best = -1;
    for (const c of chars) best = Math.max(best, s.lastIndexOf(c));
    return best;
}

export function extractJsonText(raw: string): string {
    if (!raw) return "";

    let s = String(raw).trim();
    s = s.replace(/^\uFEFF/, "");

    // ✅ Only accept JSON fences, NOT bash/javascript/etc
    const fencedJson = s.match(/```(?:json)\s*([\s\S]*?)\s*```/i);
    if (fencedJson?.[1]) {
        const inner = fencedJson[1].trim();
        if (inner.startsWith("{") || inner.startsWith("[")) return inner;
    }

    // Optional: accept unlabeled fences ONLY if content looks like JSON
    const fencedAny = s.match(/```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```/);
    if (fencedAny?.[1]) {
        const inner = fencedAny[1].trim();
        if (inner.startsWith("{") || inner.startsWith("[")) return inner;
    }

    // fallback: find first { or [
    const firstObj = s.indexOf("{");
    const firstArr = s.indexOf("[");
    let start = -1;

    if (firstObj === -1 && firstArr === -1) start = -1;
    else if (firstObj === -1) start = firstArr;
    else if (firstArr === -1) start = firstObj;
    else start = Math.min(firstObj, firstArr);

    if (start === -1) return s;

    const candidate = s.slice(start);

    // ✅ best path: balanced JSON end
    const end = findBalancedJsonEnd(candidate);
    if (end !== -1) return candidate.slice(0, end + 1).trim();

    // ✅ critical fallback: hard-trim at last closing brace/bracket
    // This removes trailing junk like "providerMetadata: undefined"
    const hardEnd = lastIndexOfAny(candidate, ["}", "]"]);
    if (hardEnd !== -1) return candidate.slice(0, hardEnd + 1).trim();

    return candidate.trim();
}

export function parseJsonRaw(raw: string): any {
    const jsonText = extractJsonText(raw);

    // ✅ key fix: make JSON parseable if the model put raw newlines in strings
    const normalized = escapeRawNewlinesInsideStrings(jsonText);

    try {
        return JSON.parse(normalized);
    } catch (err) {
        const preview = normalized.slice(0, 600);
        throw new Error(
            `Failed to JSON.parse agent output. Preview:\n${preview}\n\nError: ${err instanceof Error ? err.message : String(err)
            }`
        );
    }
}

/**
 * Escapes raw LF/CR characters that appear INSIDE quoted strings.
 * This preserves meaning but makes the JSON valid.
 */
export function escapeRawNewlinesInsideStrings(input: string): string {
    let out = "";
    let inString = false;
    let escaped = false;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        if (inString) {
            if (escaped) {
                escaped = false;
                out += ch;
                continue;
            }

            if (ch === "\\") {
                escaped = true;
                out += ch;
                continue;
            }

            if (ch === '"') {
                inString = false;
                out += ch;
                continue;
            }

            // raw newline inside string -> escape it
            if (ch === "\n") {
                out += "\\n";
                continue;
            }
            if (ch === "\r") {
                out += "\\r";
                continue;
            }

            out += ch;
            continue;
        }

        if (ch === '"') {
            inString = true;
            out += ch;
            continue;
        }

        out += ch;
    }

    return out;
}

function findBalancedJsonEnd(s: string): number {
    const first = s[0];
    if (first !== "{" && first !== "[") return -1;

    const stack: string[] = [first];
    let inString = false;
    let escaped = false;

    for (let i = 1; i < s.length; i++) {
        const ch = s[i];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === "\\") {
                escaped = true;
                continue;
            }
            if (ch === '"') inString = false;
            continue;
        }

        if (ch === '"') {
            inString = true;
            continue;
        }

        if (ch === "{" || ch === "[") stack.push(ch);

        if (ch === "}" || ch === "]") {
            const top = stack[stack.length - 1];
            if (top === "{" && ch === "}") stack.pop();
            else if (top === "[" && ch === "]") stack.pop();
            else return -1;

            if (stack.length === 0) return i;
        }
    }

    return -1;
}
