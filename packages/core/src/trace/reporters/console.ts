import type { Reporter, TraceEvent } from "../types";

export function createConsoleReporter(): Reporter {
  return {
    name: "console",
    report(event: TraceEvent) {
      const { kind, timestamp, id, ...rest } = event;
      const ts = timestamp.slice(11, 19);
      console.error(`[trace ${ts}] ${kind} ${id.slice(0, 8)}`, JSON.stringify(rest));
    },
  };
}
