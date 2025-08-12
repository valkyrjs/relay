import { Session } from "../auth/auth.ts";
import { asyncLocalStorage } from "./storage.ts";

export const req = {
  get store() {
    const store = asyncLocalStorage.getStore();
    if (store === undefined) {
      throw new Error("Request > AsyncLocalStorage not defined.");
    }
    return store;
  },

  get socket() {
    return this.store.socket;
  },

  /**
   * Get store that is potentially undefined.
   * Typically used when utility functions might run in and out of request scope.
   */
  get unsafeStore() {
    return asyncLocalStorage.getStore();
  },

  /**
   * Check if the request is authenticated.
   */
  get isAuthenticated(): boolean {
    return this.session !== undefined;
  },

  /**
   * Get current session.
   */
  get session(): Session | undefined {
    return this.store.session;
  },

  /**
   * Gets the meta information stored in the request.
   */
  get info() {
    return this.store.info;
  },

  /**
   * Sends a JSON-RPC 2.0 notification to the request if sent through a
   * WebSocket connection.
   *
   * @param method - Method to send notification to.
   * @param params - Params to pass to the method.
   */
  notify(method: string, params: any): void {
    this.socket?.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  },
} as const;

export type ReqContext = typeof req;
