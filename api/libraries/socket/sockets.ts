import type { Params } from "@valkyr/json-rpc";

export class Sockets {
  readonly #sockets = new Set<WebSocket>();

  /**
   * Add a socket to the pool.
   *
   * @param socket - WebSocket to add.
   */
  add(socket: WebSocket): this {
    this.#sockets.add(socket);
    return this;
  }

  /**
   * Remove a socket from the pool.
   *
   * @param socket - WebSocket to remove.
   */
  del(socket: WebSocket): this {
    this.#sockets.delete(socket);
    return this;
  }

  /**
   * Sends a JSON-RPC notification to all connected sockets.
   *
   * @param method - Method to send the notification to.
   * @param params - Message data to send to the clients.
   */
  notify(method: string, params: Params): this {
    this.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
    return this;
  }

  /**
   * Transmits data to all registered WebSocket connections. Data can be a string,
   * a Blob, an ArrayBuffer, or an ArrayBufferView.
   *
   * @param data - Data to send to each connected socket.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): this {
    this.#sockets.forEach((socket) => socket.send(data));
    return this;
  }
}

export const sockets = new Sockets();
