import z from "zod";

import { BadRequestError, InternalServerError, NotFoundError, RelayError } from "./errors.ts";
import { Route, RouteMethod } from "./route.ts";

const SUPPORTED_MEHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export class Api<TRoutes extends Route[]> {
  /**
   * Route maps funneling registered routes to the specific methods supported by
   * the relay instance.
   */
  readonly routes: Routes = {
    POST: [],
    GET: [],
    PUT: [],
    PATCH: [],
    DELETE: [],
  };

  /**
   * List of paths in the '${method} ${path}' format allowing us to quickly throw
   * errors if a duplicate route path is being added.
   */
  readonly #paths = new Set<string>();

  /**
   * Route index in the '${method} ${path}' format allowing for quick access to
   * a specific route.
   */
  readonly #index = new Map<string, Route>();

  /**
   * Instantiate a new Server instance.
   *
   * @param routes - Routes to register with the instance.
   */
  constructor(routes: TRoutes) {
    const methods: (keyof typeof this.routes)[] = [];
    for (const route of routes) {
      this.#validateRoutePath(route);
      this.routes[route.method].push(route);
      methods.push(route.method);
      this.#index.set(`${route.method} ${route.path}`, route);
    }
    for (const method of methods) {
      this.routes[method].sort(byStaticPriority);
    }
  }

  /**
   * Handle a incoming fetch request.
   *
   * @param request - Fetch request to pass to a route handler.
   */
  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const matched = this.#resolve(request.method, request.url);
    if (matched === undefined) {
      return toResponse(
        new NotFoundError(`Invalid routing path provided for ${request.url}`, {
          method: request.method,
          url: request.url,
        }),
      );
    }

    const { route, params } = matched;

    // ### Context
    // Context is passed to every route handler and provides a suite of functionality
    // and request data.

    const context: Record<string, unknown> = {};

    // ### Params
    // If the route has params we want to coerce the values to the expected types.

    if (route.state.params !== undefined) {
      const result = await route.state.params.safeParseAsync(params);
      if (result.success === false) {
        return toResponse(new BadRequestError("Invalid request params", z.prettifyError(result.error)));
      }
      for (const key in result.data) {
        context[key] = (result.data as any)[key];
      }
    }

    // ### Query
    // If the route has a query schema we need to validate and parse the query.

    if (route.state.search !== undefined) {
      const result = await route.state.search.safeParseAsync(toSearch(url.searchParams) ?? {});
      if (result.success === false) {
        return toResponse(new BadRequestError("Invalid request query", z.prettifyError(result.error)));
      }
      for (const key in result.data) {
        context[key] = (result.data as any)[key];
      }
    }

    // ### Body
    // If the route has a body schema we need to validate and parse the body.

    if (route.state.body !== undefined) {
      let body: Record<string, unknown> = {};
      if (request.headers.get("content-type")?.includes("json")) {
        body = await request.json();
      }
      const result = await route.state.body.safeParseAsync(body);
      if (result.success === false) {
        return toResponse(new BadRequestError("Invalid request body", z.prettifyError(result.error)));
      }
      for (const key in result.data) {
        context[key] = (result.data as any)[key];
      }
    }

    // ### Actions
    // Run through all assigned actions for the route.

    if (route.state.actions !== undefined) {
      for (const action of route.state.actions) {
        const result = (await action.state.input?.safeParseAsync(context)) ?? { success: true, data: {} };
        if (result.success === false) {
          return toResponse(new BadRequestError("Invalid action input", z.prettifyError(result.error)));
        }
        const output = (await action.state.handle?.(result.data)) ?? {};
        for (const key in output) {
          context[key] = output[key];
        }
      }
    }

    // ### Handler
    // Execute the route handler and apply the result.

    if (route.state.handle === undefined) {
      return toResponse(new InternalServerError(`Path '${route.method} ${route.path}' is missing request handler.`));
    }
    return toResponse(await route.state.handle(context).catch((error) => error));
  }

  /**
   * Attempt to resolve a route based on the given method and pathname.
   *
   * @param method - HTTP method.
   * @param url    - HTTP request url.
   */
  #resolve(method: string, url: string): ResolvedRoute | undefined {
    this.#assertMethod(method);
    for (const route of this.routes[method]) {
      if (route.match(url) === true) {
        return { route, params: route.getParsedParams(url) };
      }
    }
  }

  #validateRoutePath(route: Route): void {
    const path = `${route.method} ${route.path}`;
    if (this.#paths.has(path)) {
      throw new Error(`Router > Path ${path} already exists`);
    }
    this.#paths.add(path);
  }

  #assertMethod(method: string): asserts method is RouteMethod {
    if (!SUPPORTED_MEHODS.includes(method)) {
      throw new Error(`Router > Unsupported method '${method}'`);
    }
  }
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

/**
 * Sorting method for routes to ensure that static properties takes precedence
 * for when a route is matched against incoming requests.
 *
 * @param a - Route A
 * @param b - Route B
 */
function byStaticPriority(a: Route, b: Route) {
  const aSegments = a.path.split("/");
  const bSegments = b.path.split("/");

  const maxLength = Math.max(aSegments.length, bSegments.length);

  for (let i = 0; i < maxLength; i++) {
    const aSegment = aSegments[i] || "";
    const bSegment = bSegments[i] || "";

    const isADynamic = aSegment.startsWith(":");
    const isBDynamic = bSegment.startsWith(":");

    if (isADynamic !== isBDynamic) {
      return isADynamic ? 1 : -1;
    }

    if (isADynamic === false && aSegment !== bSegment) {
      return aSegment.localeCompare(bSegment);
    }
  }

  return a.path.localeCompare(b.path);
}

/**
 * Resolve and return query object from the provided search parameters, or undefined
 * if the search parameters does not have any entries.
 *
 * @param searchParams - Search params to create a query object from.
 */
function toSearch(searchParams: URLSearchParams): object | undefined {
  if (searchParams.size === 0) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }
  return result;
}

/**
 * Takes a server side request result and returns a fetch Response.
 *
 * @param result - Result to send back as a Response.
 */
function toResponse(result: object | RelayError | Response | void): Response {
  if (result instanceof Response) {
    return result;
  }
  if (result instanceof RelayError) {
    return new Response(result.message, {
      status: result.status,
    });
  }
  if (result === undefined) {
    return new Response(null, { status: 204 });
  }
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Routes = {
  POST: Route[];
  GET: Route[];
  PUT: Route[];
  PATCH: Route[];
  DELETE: Route[];
};

type ResolvedRoute = {
  route: Route;
  params: any;
};
