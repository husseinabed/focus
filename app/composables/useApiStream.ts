// ~/composables/useApiStream.ts
import { ref, shallowRef, onBeforeUnmount } from "vue";

type StreamStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type ApiStreamEvent<T = any> = {
  raw: string;
  data?: T;
  event?: string;
  id?: string;
  retry?: number;
};

export type UseApiStreamOptions<T = any> = {
  /**
   * Called for each parsed SSE message (data: ...)
   */
  onEvent?: (evt: ApiStreamEvent<T>) => void;

  /**
   * Called on connection open
   */
  onOpen?: () => void;

  /**
   * Called on connection close (normal or abort)
   */
  onClose?: () => void;

  /**
   * Called on any error
   */
  onError?: (err: unknown) => void;

  /**
   * If your SSE endpoint requires auth/cookies, keep credentials on.
   * (Same-origin cookies work by default. For cross-origin cookies you need CORS settings.)
   */
  credentials?: RequestCredentials;

  /**
   * Extra headers (e.g. Authorization). Note: SSE endpoints must allow these.
   */
  headers?: Record<string, string>;

  /**
   * Optional: transform raw "data:" payload string -> T
   * Default: JSON.parse if possible else string
   */
  parse?: (dataText: string) => T;

  /**
   * Optional: automatic reconnect (basic)
   */
  reconnect?: {
    enabled: boolean;
    maxAttempts?: number;
    delayMs?: number;
  };
};

/**
 * Streams a text/event-stream (SSE) endpoint over fetch + ReadableStream.
 * Works in the browser (client-side). Call connect() inside onMounted / user action.
 */
export function useApiStream<T = any>(url: Ref<string, string>, opts: UseApiStreamOptions<T> = {}) {
  const status = ref<StreamStatus>("idle");
  const lastEvent = shallowRef<ApiStreamEvent<T> | null>(null);
  const error = shallowRef<unknown>(null);

  const controller = shallowRef<AbortController | null>(null);
  const attempts = ref(0);

  // ✅ NEW: prevents reconnect after user pressed stop
  const manualStop = ref(false);

  const parseData =
    opts.parse ??
    ((txt: string) => {
      const t = txt.trim();
      if (!t) return "" as any;
      try {
        return JSON.parse(t);
      } catch {
        return t as any;
      }
    });

  const disconnect = () => {
    manualStop.value = true; // ✅ NEW
    controller.value?.abort();
    controller.value = null;
    if (status.value !== "idle") status.value = "closed";
    opts.onClose?.();
  };

  const connect = async () => {
    if (process.server) return;
    if (status.value === "connecting" || status.value === "open") return;

    manualStop.value = false; // ✅ NEW
    status.value = "connecting";
    error.value = null;

    const ac = new AbortController();
    controller.value = ac;
 

    try {
      const res = await fetch(url.value, {
        method: "GET",
        signal: ac.signal,
        credentials: opts.credentials ?? "same-origin",
        headers: { Accept: "text/event-stream", ...(opts.headers ?? {}) },
      });

      if (!res.ok) {
        throw new Error(`SSE HTTP ${res.status}: ${await res.text().catch(() => "")}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream body (res.body is null)");

      status.value = "open";
      attempts.value = 0;
      opts.onOpen?.();

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const evt = parseSseMessage<T>(raw, parseData);
          if (!evt) continue;
          
          lastEvent.value = evt;
          opts.onEvent?.(evt);
        }
      }

      disconnect();
    } catch (e) {
      // ✅ if user stopped, never reconnect
      if ((e as any)?.name === "AbortError") return;

      status.value = "error";
      error.value = e;
      opts.onError?.(e);

      // ✅ NEW: block reconnect if manually stopped
      if (manualStop.value) return;

      if (opts.reconnect?.enabled) {
        const max = opts.reconnect.maxAttempts ?? 10;
        const delay = opts.reconnect.delayMs ?? 1000;

        if (attempts.value < max) {
          attempts.value += 1;
          await new Promise((r) => setTimeout(r, delay));
          if (manualStop.value) return; // ✅ NEW
          await connect();
        }
      }
    }
  };

  onBeforeUnmount(disconnect);

  return { status, lastEvent, error, attempts, connect, disconnect };
}
/* ------------------------------ helpers ------------------------------ */

function parseSseMessage<T>(
  raw: string,
  parseData: (txt: string) => T
): ApiStreamEvent<T> | null {
  // ignore comments/heartbeats like ":ok"
  const lines = raw.split(/\r?\n/);
  const out: ApiStreamEvent<T> = { raw };

  let dataLines: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith(":")) continue;

    const sep = line.indexOf(":");
    const field = sep === -1 ? line : line.slice(0, sep);
    let value = sep === -1 ? "" : line.slice(sep + 1);
    if (value.startsWith(" ")) value = value.slice(1);

    if (field === "data") dataLines.push(value);
    else if (field === "event") out.event = value;
    else if (field === "id") out.id = value;
    else if (field === "retry") {
      const n = Number(value);
      if (!Number.isNaN(n)) out.retry = n;
    }
  }

  if (!dataLines.length) return null;

  const dataText = dataLines.join("\n");
  out.data = parseData(dataText);
  return out;
}
