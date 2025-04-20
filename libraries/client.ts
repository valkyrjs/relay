import z, { ZodType } from "zod";

import type { RelayAdapter, RequestInput } from "./adapter.ts";
import type { Route, RouteMethod } from "./route.ts";

export class RelayClient<TRoutes extends Route[]> {
  /**
   * Route index in the '${method} ${path}' format allowing for quick access to
   * a specific route.
   */
  readonly #index = new Map<string, Route>();

  /**
   * Instantiate a new Relay instance.
   *
   * @param config - Relay configuration to apply to the instance.
   * @param routes - Routes to register with the instance.
   */
  constructor(readonly config: RelayConfig<TRoutes>) {
    for (const route of config.routes) {
      this.#index.set(`${route.method} ${route.path}`, route);
    }
  }

  /**
   * Send a "POST" request through the relay `fetch` adapter.
   *
   * @param path - Path to send request to.
   * @param args - List of request arguments.
   */
  async post<
    TPath extends Extract<TRoutes[number], { state: { method: "POST" } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: "POST"; path: TPath } }>,
  >(path: TPath, ...args: TRoute["args"]): Promise<RelayResponse<TRoute>> {
    return this.#send("POST", path, args) as RelayResponse<TRoute>;
  }

  /**
   * Send a "GET" request through the relay `fetch` adapter.
   *
   * @param path - Path to send request to.
   * @param args - List of request arguments.
   */
  async get<
    TPath extends Extract<TRoutes[number], { state: { method: "GET" } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: "GET"; path: TPath } }>,
  >(path: TPath, ...args: TRoute["args"]): Promise<RelayResponse<TRoute>> {
    return this.#send("GET", path, args) as RelayResponse<TRoute>;
  }

  /**
   * Send a "PUT" request through the relay `fetch` adapter.
   *
   * @param path - Path to send request to.
   * @param args - List of request arguments.
   */
  async put<
    TPath extends Extract<TRoutes[number], { state: { method: "PUT" } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: "PUT"; path: TPath } }>,
  >(path: TPath, ...args: TRoute["args"]): Promise<RelayResponse<TRoute>> {
    return this.#send("PUT", path, args) as RelayResponse<TRoute>;
  }

  /**
   * Send a "PATCH" request through the relay `fetch` adapter.
   *
   * @param path - Path to send request to.
   * @param args - List of request arguments.
   */
  async patch<
    TPath extends Extract<TRoutes[number], { state: { method: "PATCH" } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: "PATCH"; path: TPath } }>,
  >(path: TPath, ...args: TRoute["args"]): Promise<RelayResponse<TRoute>> {
    return this.#send("PATCH", path, args) as RelayResponse<TRoute>;
  }

  /**
   * Send a "DELETE" request through the relay `fetch` adapter.
   *
   * @param path - Path to send request to.
   * @param args - List of request arguments.
   */
  async delete<
    TPath extends Extract<TRoutes[number], { state: { method: "DELETE" } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: "DELETE"; path: TPath } }>,
  >(path: TPath, ...args: TRoute["args"]): Promise<RelayResponse<TRoute>> {
    return this.#send("DELETE", path, args) as RelayResponse<TRoute>;
  }

  async #send(method: RouteMethod, url: string, args: any[]) {
    const route = this.#index.get(`${method} ${url}`);
    if (route === undefined) {
      throw new Error(`RelayClient > Failed to send request for '${method} ${url}' route, not found.`);
    }

    // ### Input

    const input: RequestInput = { method, url: `${this.config.url}${url}`, search: "" };

    let index = 0; // argument incrementor

    if (route.state.params !== undefined) {
      const params = args[index++] as { [key: string]: string };
      for (const key in params) {
        input.url = input.url.replace(`:${key}`, params[key]);
      }
    }

    if (route.state.search !== undefined) {
      const search = args[index++] as { [key: string]: string };
      const pieces: string[] = [];
      for (const key in search) {
        pieces.push(`${key}=${search[key]}`);
      }
      if (pieces.length > 0) {
        input.search = `?${pieces.join("&")}`;
      }
    }

    if (route.state.body !== undefined) {
      input.body = JSON.stringify(args[index++]);
    }

    // ### Fetch

    const data = await this.config.adapter.fetch(input);
    if (route.state.output !== undefined) {
      return route.state.output.parse(data);
    }
    return data;
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type RelayResponse<TRoute extends Route> = TRoute["state"]["output"] extends ZodType ? z.infer<TRoute["state"]["output"]> : void;

type RelayConfig<TRoutes extends Route[]> = {
  url: string;
  adapter: RelayAdapter;
  routes: TRoutes;
};
