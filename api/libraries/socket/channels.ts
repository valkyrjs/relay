import type { Params } from "@valkyr/json-rpc";

import { Sockets } from "./sockets.ts";

export class Channels {
  readonly #channels = new Map<string, Sockets>();

  /**
   * Add a new channel.
   *
   * @param channel
   */
  add(channel: string): this {
    this.#channels.set(channel, new Sockets());
    return this;
  }

  /**
   * Deletes a channel.
   *
   * @param channel
   */
  del(channel: string): this {
    this.#channels.delete(channel);
    return this;
  }

  /**
   * Add socket to the given channel. If the channel does not exist it is
   * automatically created.
   *
   * @param channel - Channel to add socket to.
   * @param socket  - Socket to add to the channel.
   */
  join(channel: string, socket: WebSocket): this {
    const sockets = this.#channels.get(channel);
    if (sockets === undefined) {
      this.#channels.set(channel, new Sockets().add(socket));
    } else {
      sockets.add(socket);
    }
    return this;
  }

  /**
   * Remove a socket from the given channel.
   *
   * @param channel - Channel to leave.
   * @param socket  - Socket to remove from the channel.
   */
  leave(channel: string, socket: WebSocket): this {
    this.#channels.get(channel)?.del(socket);
    return this;
  }

  /**
   * Sends a JSON-RPC notification to all sockets in given channel.
   *
   * @param channel - Channel to emit method to.
   * @param method  - Method to send the notification to.
   * @param params  - Message data to send to the clients.
   */
  notify(channel: string, method: string, params: Params): this {
    this.#channels.get(channel)?.notify(method, params);
    return this;
  }

  /**
   * Transmits data to all registered WebSocket connections in the given channel.
   * Data can be a string, a Blob, an ArrayBuffer, or an ArrayBufferView.
   *
   * @param channel - Channel to emit message to.
   * @param data    - Data to send to each connected socket in the channel.
   */
  send(channel: string, data: string | ArrayBufferLike | Blob | ArrayBufferView): this {
    this.#channels.get(channel)?.send(data);
    return this;
  }
}

export const channels = new Channels();
