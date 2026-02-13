// server/ai/tools/browser.ts
import { z } from "zod";
import { tool } from "ai";
import puppeteer, { type Browser } from "puppeteer";

// If you're on Node 18+, global fetch exists. Otherwise uncomment:
// import { fetch } from "undici";

let _browser: Browser | null = null;

async function getBrowser() {
    if (_browser) return _browser;

    _browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    });

    return _browser;
}

function normalizeText(s: string) {
    return s
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export const BrowserToolSchema = z.object({
    url: z.string().url(),
    waitUntil: z.enum(["domcontentloaded", "load", "networkidle0", "networkidle2"]).default("domcontentloaded"),
    timeoutMs: z.number().int().min(1000).max(120000).default(30000),
    waitForSelector: z.string().min(1).optional(),
    selectorTimeoutMs: z.number().int().min(500).max(120000).default(15000),
    contentSelector: z.string().min(1).optional(),
    maxChars: z.number().int().min(500).max(200000).default(30000),
    screenshot: z.boolean().default(false),
    screenshotFullPage: z.boolean().default(true),
    viewport: z.object({
        width: z.number().int().min(320).max(2560).default(1280),
        height: z.number().int().min(320).max(2560).default(720),
        deviceScaleFactor: z.number().min(1).max(3).default(1),
    }).default({ width: 1280, height: 720, deviceScaleFactor: 1 }),
});

export type BrowserToolInput = z.infer<typeof BrowserToolSchema>;

export const browser_visit = tool({
    description:
        "Open a webpage in a real browser (Puppeteer), collect console/page/network errors, extract visible text, and optionally return a screenshot (base64).",
    parameters: BrowserToolSchema,
    execute: async (input: BrowserToolInput) => {
        const browser = await getBrowser();
        const page = await browser.newPage();

        const consoleLogs: Array<{ type: string; text: string }> = [];
        const pageErrors: string[] = [];
        const requestFailures: Array<{ url: string; errorText: string }> = [];

        try {
            await page.setViewport(input.viewport);

            page.on("console", (msg) => {
                consoleLogs.push({ type: msg.type(), text: msg.text() });
            });

            page.on("pageerror", (err) => {
                pageErrors.push(err?.message || String(err));
            });

            page.on("requestfailed", (req) => {
                const failure = req.failure();
                requestFailures.push({
                    url: req.url(),
                    errorText: failure?.errorText || "request failed",
                });
            });

            const startedAt = Date.now();

            const resp = await page.goto(input.url, {
                waitUntil: input.waitUntil,
                timeout: input.timeoutMs,
            });

            if (input.waitForSelector) {
                await page.waitForSelector(input.waitForSelector, {
                    timeout: input.selectorTimeoutMs,
                });
            }

            const { title, text } = await page.evaluate((contentSelector) => {
                const getText = (root: Element) => {
                    const clone = root.cloneNode(true) as Element;
                    clone.querySelectorAll("script,style,noscript,svg,canvas,template").forEach((el) => el.remove());
                    const t = (clone as HTMLElement).innerText || clone.textContent || "";
                    return t;
                };

                const el = contentSelector ? document.querySelector(contentSelector) : document.body;

                return {
                    title: document.title || "",
                    text: el ? getText(el) : "",
                };
            }, input.contentSelector ?? null);

            const cleaned = normalizeText(text).slice(0, input.maxChars);

            let screenshotBase64: string | null = null;
            if (input.screenshot) {
                const buf = (await page.screenshot({
                    type: "png",
                    fullPage: input.screenshotFullPage,
                    encoding: "binary",
                })) as Buffer;
                screenshotBase64 = buf.toString("base64");
            }

            const status = resp?.status() ?? null;
            const ok = resp?.ok() ?? null;

            return {
                ok: true,
                url: input.url,
                status,
                responseOk: ok,
                timingMs: Date.now() - startedAt,
                title,
                text: cleaned,
                screenshotBase64,
                logs: {
                    console: consoleLogs.slice(0, 200),
                    pageErrors: pageErrors.slice(0, 50),
                    requestFailures: requestFailures.slice(0, 50),
                },
            };
        } catch (err: any) {
            return {
                ok: false,
                url: input.url,
                error: err?.message || String(err),
                logs: {
                    console: consoleLogs.slice(0, 200),
                    pageErrors: pageErrors.slice(0, 50),
                    requestFailures: requestFailures.slice(0, 50),
                },
            };
        } finally {
            await page.close().catch(() => { });
        }
    },
});

/* ---------------------------------------------
   NEW: browser_search
--------------------------------------------- */

const SearchToolSchema = z.object({
    query: z.string().min(2),
    maxResults: z.number().int().min(1).max(10).default(8),

    // Optional: light targeting (works best with SerpAPI)
    country: z.string().length(2).optional(),   // e.g. "IL"
    language: z.string().min(2).max(5).optional(), // e.g. "he" | "en" | "ar"

    // Optional: restrict results
    site: z.string().min(3).optional(), // e.g. "wix.com"
});

type SearchToolInput = z.infer<typeof SearchToolSchema>;

function stripTags(html: string) {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Very small HTML entity decode (enough for snippets/titles)
function decodeEntities(s: string) {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

export const browser_search = tool({
    description:
        "Search the web for relevant pages/competitors and return a compact list of candidate URLs (title + snippet). Uses SerpAPI if available, otherwise falls back to DuckDuckGo HTML parsing.",
    parameters: SearchToolSchema,
    execute: async (input: SearchToolInput) => {
        const q = input.site ? `${input.query} site:${input.site}` : input.query;
        const startedAt = Date.now();

        // Prefer SerpAPI (stable + compliant)
        const SERPAPI_KEY = process.env.SERPAPI_KEY;

        try {
            if (SERPAPI_KEY) {
                const params = new URLSearchParams({
                    api_key: SERPAPI_KEY,
                    engine: "google",
                    q,
                    num: String(input.maxResults),
                });

                // Optional geo/lang
                if (input.language) params.set("hl", input.language);
                if (input.country) params.set("gl", input.country);

                const url = `https://serpapi.com/search.json?${params.toString()}`;
                const res = await fetch(url);
                const json: any = await res.json();

                const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
                const results = organic.slice(0, input.maxResults).map((r: any) => ({
                    title: String(r?.title || ""),
                    url: String(r?.link || ""),
                    snippet: String(r?.snippet || ""),
                    displayUrl: String(r?.displayed_link || ""),
                })).filter((r: any) => r.url);

                return {
                    ok: true,
                    provider: "serpapi",
                    query: q,
                    timingMs: Date.now() - startedAt,
                    results,
                };
            }

            // Fallback: DuckDuckGo HTML (best-effort)
            const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
            const res = await fetch(ddgUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                    "Accept": "text/html",
                },
            });

            const html = await res.text();

            // Parse <a class="result__a" href="...">Title</a> and snippets
            const results: Array<{ title: string; url: string; snippet: string }> = [];

            // Grab blocks
            const blockRegex = /<div class="result__body">([\s\S]*?)<\/div>\s*<\/div>/g;
            let m: RegExpExecArray | null;

            while ((m = blockRegex.exec(html)) && results.length < input.maxResults) {
                const block = m[1];

                const aMatch = block.match(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
                if (!aMatch) continue;

                const url = decodeEntities(aMatch[1]);
                const title = decodeEntities(stripTags(aMatch[2]));

                const snMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)
                    || block.match(/<div[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/div>/);

                const snippet = snMatch ? decodeEntities(stripTags(snMatch[1])) : "";

                // Filter obvious junk
                if (!url.startsWith("http")) continue;

                results.push({ title, url, snippet });
            }

            return {
                ok: true,
                provider: "duckduckgo_html",
                query: q,
                timingMs: Date.now() - startedAt,
                results,
                warning:
                    "Fallback HTML parsing used. For best reliability, set SERPAPI_KEY to use SerpAPI.",
            };
        } catch (err: any) {
            return {
                ok: false,
                provider: SERPAPI_KEY ? "serpapi" : "duckduckgo_html",
                query: q,
                timingMs: Date.now() - startedAt,
                error: err?.message || String(err),
                results: [],
            };
        }
    },
});
