import z, { ZodType } from "zod";

import { Route, RouteMethod } from "./route.ts";

export class Relay<TRoutes extends Route[]> {
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
  constructor(
    readonly config: RelayConfig,
    routes: TRoutes,
  ) {
    for (const route of routes) {
      this.#index.set(`${route.method} ${route.path}`, route);
    }
  }

  /**
   * Override relay url configuration.
   */
  set url(value: string) {
    this.config.url = value;
  }

  /**
   * Retrieve a route for the given method/path combination which can be further extended
   * for serving incoming third party requests.
   *
   * @param method - Method the route is registered for.
   * @param path   - Path the route is registered under.
   *
   * @examples
   *
   * ```ts
   * const relay = new Relay([
   *   route
   *     .post("/users")
   *     .body(
   *       z.object({
   *         name: z.object({ family: z.string(), given: z.string() }),
   *         email: z.string().check(z.email()),
   *       })
   *     )
   * ]);
   *
   * relay
   *   .route("POST", "/users")
   *   .actions([hasSessionUser, hasAccess("users", "create")])
   *   .handle(async ({ name, email, sessionUserId }) => {
   *     // await db.users.insert({ name, email, createdBy: sessionUserId });
   *   })
   * ```
   */
  route<
    TMethod extends RouteMethod,
    TPath extends Extract<TRoutes[number], { state: { method: TMethod } }>["state"]["path"],
    TRoute extends Extract<TRoutes[number], { state: { method: TMethod; path: TPath } }>,
  >(method: TMethod, path: TPath): TRoute {
    const route = this.#index.get(`${method} ${path}`);
    if (route === undefined) {
      throw new Error(`Relay > Route not found at '${method} ${path}' index`);
    }
    return route as TRoute;
  }

  /*
   |--------------------------------------------------------------------------------
   | Client
   |--------------------------------------------------------------------------------
   */

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
    const route = this.route(method, url);

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

type RelayConfig = {
  url: string;
  adapter: RelayAdapter;
};

export type RelayAdapter = {
  fetch(input: RequestInput): Promise<unknown>;
};

export type RequestInput = {
  method: RouteMethod;
  url: string;
  search: string;
  body?: string;
};
