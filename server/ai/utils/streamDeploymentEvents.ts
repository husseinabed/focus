type StreamDeploymentEventsOptions = {
    deploymentId: string
    teamId?: string
    token: string
    signal?: AbortSignal
    limit?: number
    onEvent: (event: any) => void | Promise<void>

    // optional: override terminal detection
    isTerminal?: (event: any) => boolean
}

const defaultIsTerminal = (ev: any) => {
    const type = String(ev?.type ?? "").toLowerCase()

 
    // 1) explicit terminal event types
    if (["ready", "error", "canceled", "fatal", "exit"].includes(type)) return true

    // 2) deployment readyState (if present)
    const readyState =
        ev?.payload?.info?.readyState ??
        ev?.payload?.readyState ??
        ev?.info?.readyState

    if (
        readyState &&
        ["READY", "ERROR", "CANCELED"].includes(String(readyState).toUpperCase())
    ) return true

    // 3) build/log failure patterns
    const text = String(ev?.text ?? "")
    // if (type === "stderr") return true
    if (/exited with\s+1/i.test(text)) return true
    if (/command\s+".+"\s+exited with\s+\d+/i.test(text)) return true
    // if (/build failed/i.test(text)) return true
    if (/error:/i.test(text) && /exited|build|command|failed/i.test(text)) return true

    return false
}

export async function streamDeploymentEvents({
    deploymentId,
    teamId,
    token,
    signal,
    limit = 100,
    onEvent,
    isTerminal = defaultIsTerminal,
}: StreamDeploymentEventsOptions): Promise<{ terminalEvent?: any }> {
    const url = new URL(`https://api.vercel.com/v3/deployments/${deploymentId}/events`)
    url.searchParams.set("follow", "1")
    if (limit) url.searchParams.set("limit", String(limit))
    if (teamId) url.searchParams.set("teamId", teamId)

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        },
        signal,
    })

    if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "")
        throw new Error(`Vercel events stream failed (${res.status}): ${text}`)
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let terminalEvent: any | undefined

    const flushLine = async (line: string) => {
        const trimmed = line.trim()
        if (!trimmed) return

        let ev: any
        try {
            ev = JSON.parse(trimmed)
        } catch {
            // forward raw (rare)
            const rawEv = { type: "raw", line: trimmed }
            await onEvent(rawEv)
            if (isTerminal(rawEv)) terminalEvent = rawEv
            return
        }

        await onEvent(ev)
        if (isTerminal(ev)) terminalEvent = ev
    }

    for await (const chunk of res.body as any) {
        buffer += decoder.decode(chunk, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
            await flushLine(line)
            if (terminalEvent) return { terminalEvent }
        }
    }

    // flush any remaining buffer
    if (buffer.trim()) {
        await flushLine(buffer)
        if (terminalEvent) return { terminalEvent }
    }

    return { terminalEvent }
}
