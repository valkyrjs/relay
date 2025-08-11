import { AsyncLocalStorage } from "node:async_hooks";

import type { Session } from "~libraries/auth/mod.ts";

export const asyncLocalStorage = new AsyncLocalStorage<{
  session?: Session;
  info: {
    method: string;
    start: number;
    end?: number;
  };
  socket?: WebSocket;
  response: {
    headers: Headers;
  };
}>();
