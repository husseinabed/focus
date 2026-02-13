
import { Agent } from '@ai-sdk-tools/agents'
import { DrizzleProvider } from '@ai-sdk-tools/memory/drizzle'
import { nuxtMCPClient, nuxtUIMCPClient } from "~~/server/ai/tools/nuxt_docs";
import { browser_visit } from "~~/server/ai/tools/browser";
import { db } from '~~/server/db'
type ToolMap = Record<string, any>;
import { ToolSet } from 'ai'
const buildTools = async (): Promise<ToolMap> => {
  const nuxt = await (await nuxtMCPClient).tools();
  const ui = await (await nuxtUIMCPClient).tools();

  // IMPORTANT: keep the tool name stable for the model
  return { ...nuxt, ...ui, browser_visit };
};


export default defineEventHandler(async (event) => {
  const body = await readBody<{ prompt?: string }>(event)
  const prompt = JSON.stringify(body?.prompt)?.trim()
  if (!prompt) return { error: 'Missing prompt' }

  const model = google('gemini-pro-latest')
  const tools = await buildTools()

  // Stable user key for memory scoping (replace with your auth user id when available)
  const userKey = String(getHeader(event, 'x-user-id') || 'anon')

  const researchAgent = new Agent({
    name: 'Research Agent',
    model,
    tools,
    instructions: `
You are a Research Agent.

Tooling:
- Use Nuxt/Nuxt UI docs tools to look up correct APIs, examples, and best practices.
- Use browser_visit ONLY when needed to verify up-to-date info or confirm specifics.

Behavior:
- If the request is ambiguous, ask 1 short clarifying question.
- Otherwise, produce a well-structured answer with:
  1) Summary (3-6 bullets)
  2) Key details (with code/examples when relevant)
  3) Citations: list what you consulted (tool/doc pages visited or URLs)
  4) Next steps (optional)
- Do not invent sources. If you didn't consult a tool/page, say so.
- Prefer official docs and primary sources.

Quality:
- Be precise about versions (Nuxt 3/4, Nuxt UI v4) when relevant.
- Provide production-ready guidance; avoid vague advice.
`,
    memory: {
      provider: new DrizzleProvider(db),
      workingMemory: { enabled: true, scope: 'user' },
      history: { enabled: true, limit: 10 }
    },
    matchOn: [
      'research',
      'look up',
      'docs',
      'documentation',
      'nuxt',
      'nuxt ui',
      'best practice',
      'compare',
      'verify',
      'latest',
      'source',
      'citation'
    ],
    onEvent(event) {
      console.log(event)
    },
  })

  return await researchAgent.generate({ prompt })
})