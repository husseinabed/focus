// ~/server/utils/stream.ts
import type { H3Event } from "h3";
import type { IncomingMessage, ServerResponse } from "http";

export async function stream(
    event: H3Event,
    handler: (ctx: {
        send: (data: any) => boolean
        close: () => void
        req: IncomingMessage
        res: ServerResponse
        abort: AbortSignal
        aborted: () => boolean
    }) => Promise<void> | void
) {
    setHeaders(event, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });

    const res = event.node.res;
    const req = event.node.req;

    const controller = new AbortController();
    let closed = false;

    const aborted = () => closed || controller.signal.aborted || req.destroyed;

    const send = (data: any) => {
        if (aborted()) return false;
        res.write(`data: ${JSON.stringify({ ...data, created: Date.now() })}\n\n`);
        return true;
    };

    // open + heartbeat
    res.write(`:ok\n\n`);

    const hb = setInterval(() => {
        if (aborted()) return;
        res.write(`:hb\n\n`);
    }, 15000);

    const close = () => {
        if (closed) return;
        closed = true;

        clearInterval(hb);       // ✅ IMPORTANT
        controller.abort();      // ✅ stop handler loops
        try { res.end(); } catch { }
    };

    // close on disconnect
    req.on("close", close);
    req.on("aborted", close);
    res.on("close", close);
    res.on("error", close);

    try {
        await handler({ send, close, req, res, abort: controller.signal, aborted });
    } catch (e) {
        send({ type: "error", message: "stream_failed", error: String(e) });
        close();
    } finally {
        // ✅ If handler finishes, close stream (prevents hanging connections)
        close();
    }
}
