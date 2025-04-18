import z, { ZodObject, ZodRawShape, ZodType } from "zod";

import { Action } from "./action.ts";
import { RelayError } from "./errors.ts";

export class Route<TRouteState extends RouteState = RouteState> {
  #pattern?: URLPattern;

  declare readonly args: RouteArgs<TRouteState>;
  declare readonly context: RouteContext<TRouteState>;

  constructor(readonly state: TRouteState) {}

  /**
   * HTTP Method
   */
  get method(): RouteMethod {
    return this.state.method;
  }

  /**
   * URL pattern of the route.
   */
  get pattern(): URLPattern {
    if (this.#pattern === undefined) {
      this.#pattern = new URLPattern({ pathname: this.path });
    }
    return this.#pattern;
  }

  /**
   * URL path
   */
  get path(): string {
    return this.state.path;
  }

  /**
   * Check if the provided URL matches the route pattern.
   *
   * @param url - HTTP request.url
   */
  match(url: string): boolean {
    return this.pattern.test(url);
  }

  /**
   * Extract parameters from the provided URL based on the route pattern.
   *
   * @param url - HTTP request.url
   */
  getParsedParams(url: string): object {
    const params = this.pattern.exec(url)?.pathname.groups;
    if (params === undefined) {
      return {};
    }
    return params;
  }

  /**
   * Params allows for custom casting of URL parameters. If a parameter does not
   * have a corresponding zod schema the default param type is "string".
   *
   * @param params - URL params.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo/:bar")
   *   .params({
   *     bar: z.number({ coerce: true })
   *   })
   *   .handle(async ({ params: { bar } }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  params<TParams extends ZodRawShape>(params: TParams): Route<Omit<TRouteState, "params"> & { params: ZodObject<TParams> }> {
    return new Route({ ...this.state, params: z.object(params) as any });
  }

  /**
   * Search allows for custom casting of URL search parameters. If a parameter does
   * not have a corresponding zod schema the default param type is "string".
   *
   * @param search - URL search arguments.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .search({
   *     bar: z.number({ coerce: true })
   *   })
   *   .handle(async ({ search: { bar } }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  search<TSearch extends ZodRawShape>(search: TSearch): Route<Omit<TRouteState, "search"> & { search: ZodObject<TSearch> }> {
    return new Route({ ...this.state, search: z.object(search) as any });
  }

  /**
   * Shape of the body this route expects to receive. This is used by all
   * mutator routes and has no effect when defined on "GET" methods.
   *
   * @param body - Body the route expects.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .body(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async ({ bar }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  body<TBody extends ZodObject>(body: TBody): Route<Omit<TRouteState, "body"> & { body: TBody }> {
    return new Route({ ...this.state, body });
  }

  /**
   * List of route level middleware action to execute before running the
   * route handler.
   *
   * @param actions - Actions to execute on this route.
   *
   * @examples
   *
   * ```ts
   * const hasFooBar = action
   *   .make("hasFooBar")
   *   .response(z.object({ foobar: z.number() }))
   *   .handle(async () => {
   *     return {
   *       foobar: 1,
   *     };
   *   });
   *
   * route
   *   .post("/foo")
   *   .actions([hasFooBar])
   *   .handle(async ({ foobar }) => {
   *     console.log(typeof foobar); // => number
   *   });
   * ```
   */
  actions<TAction extends Action>(actions: TAction[]): Route<Omit<TRouteState, "actions"> & { actions: TAction[] }> {
    return new Route({ ...this.state, actions });
  }

  /**
   * Shape of the response this route produces. This is used by the transform
   * tools to ensure the client receives parsed data.
   *
   * @param response - Response shape of the route.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .response(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async () => {
   *     return {
   *       bar: 1
   *     }
   *   });
   * ```
   */
  response<TResponse extends ZodType>(output: TResponse): Route<Omit<TRouteState, "output"> & { output: TResponse }> {
    return new Route({ ...this.state, output });
  }

  /**
   * Server handler callback method.
   *
   * @param handle - Handle function to trigger when the route is executed.
   */
  handle<THandleFn extends HandleFn<this["context"], this["state"]["output"]>>(handle: THandleFn): Route<Omit<TRouteState, "handle"> & { handle: THandleFn }> {
    return new Route({ ...this.state, handle });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factories
 |--------------------------------------------------------------------------------
 */

/**
 * Route factories allowing for easy generation of relay compliant routes.
 */
export const route: {
  post<TPath extends string>(path: TPath): Route<{ method: "POST"; path: TPath }>;
  get<TPath extends string>(path: TPath): Route<{ method: "GET"; path: TPath }>;
  put<TPath extends string>(path: TPath): Route<{ method: "PUT"; path: TPath }>;
  patch<TPath extends string>(path: TPath): Route<{ method: "PATCH"; path: TPath }>;
  delete<TPath extends string>(path: TPath): Route<{ method: "DELETE"; path: TPath }>;
} = {
  /**
   * Create a new "POST" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .post("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  post<TPath extends string>(path: TPath) {
    return new Route({ method: "POST", path });
  },

  /**
   * Create a new "GET" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route.get("/foo");
   * ```
   */
  get<TPath extends string>(path: TPath) {
    return new Route({ method: "GET", path });
  },

  /**
   * Create a new "PUT" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .put("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  put<TPath extends string>(path: TPath) {
    return new Route({ method: "PUT", path });
  },

  /**
   * Create a new "PATCH" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route
   *   .patch("/foo")
   *   .body(
   *     z.object({ bar: z.string() })
   *   );
   * ```
   */
  patch<TPath extends string>(path: TPath) {
    return new Route({ method: "PATCH", path });
  },

  /**
   * Create a new "DELETE" route for the given path.
   *
   * @param path - Path to generate route for.
   *
   * @examples
   *
   * ```ts
   * route.delete("/foo");
   * ```
   */
  delete<TPath extends string>(path: TPath) {
    return new Route({ method: "DELETE", path });
  },
};

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type RouteState = {
  method: RouteMethod;
  path: string;
  params?: ZodObject;
  search?: ZodObject;
  body?: ZodObject;
  actions?: Array<Action>;
  output?: ZodType;
  handle?: HandleFn;
};

export type RouteMethod = "POST" | "GET" | "PUT" | "PATCH" | "DELETE";

export type HandleFn<TContext = any, TResponse = any> = (
  context: TContext,
) => TResponse extends ZodType ? Promise<z.infer<TResponse> | Response | RelayError> : Promise<Response | RelayError | void>;

type RouteContext<TRouteState extends RouteState = RouteState> = (TRouteState["params"] extends ZodObject ? z.infer<TRouteState["params"]> : object) &
  (TRouteState["search"] extends ZodObject ? z.infer<TRouteState["search"]> : object) &
  (TRouteState["body"] extends ZodObject ? z.infer<TRouteState["body"]> : object) &
  (TRouteState["actions"] extends Array<Action> ? UnionToIntersection<MergeAction<TRouteState["actions"]>> : object);

type RouteArgs<TRouteState extends RouteState = RouteState> = [
  ...TupleIfZod<TRouteState["params"]>,
  ...TupleIfZod<TRouteState["search"]>,
  ...TupleIfZod<TRouteState["body"]>,
];

type TupleIfZod<TState> = TState extends ZodObject ? [z.infer<TState>] : [];

type MergeAction<TActions extends Array<Action>> =
  TActions[number] extends Action<infer TActionState> ? (TActionState["output"] extends ZodObject ? z.infer<TActionState["output"]> : object) : object;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
