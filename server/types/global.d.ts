// /server/types/global.d.ts  (optional, for TS)
export {};

declare global {
  // eslint-disable-next-line no-var
  var __orch_streams:
    | Map<string, { queue: any[]; done: boolean }>
    | undefined;
}
