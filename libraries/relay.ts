import type { Route, RouteMethod } from "./route.ts";

export class Relay<TRoutes extends Route[]> {
  /**
   * Route index in the '${method} ${path}' format allowing for quick access to
   * a specific route.
   */
  readonly #index = new Map<string, Route>();

  declare readonly $inferRoutes: TRoutes;

  /**
   * Instantiate a new Relay instance.
   *
   * @param config - Relay configuration to apply to the instance.
   * @param routes - Routes to register with the instance.
   */
  constructor(readonly routes: TRoutes) {
    for (const route of routes) {
      this.#index.set(`${route.method} ${route.path}`, route);
    }
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
}
