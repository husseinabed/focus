import { createGoogleGenerativeAI } from "@ai-sdk/google";

function getGeminiApiKey(): string {
    try {
        // Nuxt runtime config (server)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = (globalThis as any).useRuntimeConfig?.();
        const key = cfg?.googleGenerativeAiApiKey;
        if (typeof key === "string" && key.length > 0) return key;
    } catch {
        // ignore
    }

    const envKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (typeof envKey === "string" && envKey.length > 0) return envKey;

    throw new Error(
        "Missing GOOGLE_GENERATIVE_AI_API_KEY (or runtimeConfig.googleGenerativeAiApiKey)."
    );
}

export const google = createGoogleGenerativeAI({ apiKey: getGeminiApiKey() });
