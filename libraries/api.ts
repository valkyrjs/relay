import z from "zod";

import { BadRequestError, InternalServerError, NotFoundError, RelayError } from "./errors.ts";
import { Procedure } from "./procedure.ts";
import { RelayRequest, request } from "./request.ts";
import { Route, RouteMethod } from "./route.ts";

const SUPPORTED_MEHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export class Api<TRelays extends (Procedure | Route)[]> {
  readonly #index = {
    rest: new Map<string, Route>(),
    rpc: new Map<string, Procedure>(),
  };

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
   * Instantiate a new Server instance.
   *
   * @param routes - Routes to register with the instance.
   */
  constructor(relays: TRelays) {
    const methods: (keyof typeof this.routes)[] = [];
    for (const relay of relays) {
      if (relay instanceof Procedure === true) {
        this.#index.rpc.set(relay.method, relay);
      }
      if (relay instanceof Route === true) {
        this.#validateRoutePath(relay);
        this.routes[relay.method].push(relay);
        methods.push(relay.method);
        this.#index.rest.set(`${relay.method} ${relay.path}`, relay);
      }
    }
    for (const method of methods) {
      this.routes[method].sort(byStaticPriority);
    }
  }

  /**
   * Takes a request candidate and parses its json body.
   *
   * @param candidate - Request candidate to parse.
   */
  async parse(candidate: Request): Promise<RelayRequest> {
    return request.parseAsync(await candidate.json());
  }

  /**
   * Handle a incoming REST request.
   *
   * @param request - REST request to pass to a route handler.
   */
  async rest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const matched = this.#resolve(request.method, request.url);
    if (matched === undefined) {
      return toRestResponse(
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

    const context: any[] = [];

    // ### Params
    // If the route has params we want to coerce the values to the expected types.

    if (route.state.params !== undefined) {
      const result = await route.state.params.safeParseAsync(params);
      if (result.success === false) {
        return toRestResponse(new BadRequestError("Invalid request params", z.prettifyError(result.error)));
      }
      context.push(result.data);
    }

    // ### Query
    // If the route has a query schema we need to validate and parse the query.

    if (route.state.query !== undefined) {
      const result = await route.state.query.safeParseAsync(toQuery(url.searchParams) ?? {});
      if (result.success === false) {
        return toRestResponse(new BadRequestError("Invalid request query", z.prettifyError(result.error)));
      }
      context.push(result.data);
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
        return toRestResponse(new BadRequestError("Invalid request body", z.prettifyError(result.error)));
      }
      context.push(result.data);
    }

    // ### Actions
    // Run through all assigned actions for the route.

    const data: Record<string, unknown> = {};

    if (route.state.actions !== undefined) {
      for (const entry of route.state.actions) {
        let action = entry;
        let input: any;

        if (Array.isArray(entry)) {
          action = entry[0];
          input = entry[1](...context);
        }

        const result = (await action.state.input?.safeParseAsync(input)) ?? { success: true, data: {} };
        if (result.success === false) {
          return toRestResponse(new BadRequestError("Invalid action input", z.prettifyError(result.error)));
        }

        if (action.state.handle === undefined) {
          return toRestResponse(new InternalServerError(`Action '${action.state.name}' is missing handler.`));
        }

        const output = await action.state.handle(result.data);
        if (output instanceof RelayError) {
          return toRestResponse(output);
        }

        for (const key in output) {
          data[key] = output[key];
        }
      }
      context.push(data);
    }

    // ### Handler
    // Execute the route handler and apply the result.

    if (route.state.handle === undefined) {
      return toRestResponse(new InternalServerError(`Path '${route.method} ${route.path}' is missing request handler.`));
    }
    return toRestResponse(await route.state.handle(...context).catch((error) => error));
  }

  /**
   * Handle a incoming RPC request.
   *
   * @param method - Method name being executed.
   * @param params - Parameters provided with the method request.
   * @param id     - Request id used for response identification.
   */
  async rpc({ method, params, id }: RelayRequest): Promise<Response> {
    const procedure = this.#index.rpc.get(method);
    if (procedure === undefined) {
      return toResponse(new NotFoundError(`Method '' does not exist`), id);
    }

    // ### Context
    // Context is passed to every route handler and provides a suite of functionality
    // and request data.

    const args: any[] = [];

    // ### Params
    // If the route has a body schema we need to validate and parse the body.

    if (procedure.state.params !== undefined) {
      if (params === undefined) {
        return toResponse(new BadRequestError("Procedure expected 'params' but got 'undefined'."), id);
      }
      const result = await procedure.state.params.safeParseAsync(params);
      if (result.success === false) {
        return toResponse(new BadRequestError("Invalid request body", z.prettifyError(result.error)), id);
      }
      args.push(result.data);
    }

    // ### Actions
    // Run through all assigned actions for the route.

    const data: Record<string, unknown> = {};

    if (procedure.state.actions !== undefined) {
      for (const entry of procedure.state.actions) {
        let action = entry;
        let input: any;

        if (Array.isArray(entry)) {
          action = entry[0];
          input = entry[1](args[0]);
        }

        const result = (await action.state.input?.safeParseAsync(input)) ?? { success: true, data: {} };
        if (result.success === false) {
          return toResponse(new BadRequestError("Invalid action input", z.prettifyError(result.error)), id);
        }

        if (action.state.handle === undefined) {
          return toResponse(new InternalServerError(`Action '${action.state.name}' is missing handler.`), id);
        }

        const output = await action.state.handle(result.data);
        if (output instanceof RelayError) {
          return toResponse(output, id);
        }

        for (const key in output) {
          data[key] = output[key];
        }
      }
      args.push(data);
    }

    // ### Handler
    // Execute the route handler and apply the result.

    if (procedure.state.handle === undefined) {
      return toResponse(new InternalServerError(`Path '${procedure.method}' is missing request handler.`), id);
    }
    return toResponse(await procedure.state.handle(...args).catch((error) => error), id);
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
function toQuery(searchParams: URLSearchParams): object | undefined {
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
function toRestResponse(result: object | RelayError | Response | void): Response {
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

/**
 * Takes a server side request result and returns a fetch Response.
 *
 * @param result - Result to send back as a Response.
 * @param id     - Request id which can be used to identify the response.
 */
export function toResponse(result: object | RelayError | Response | void, id: string | number): Response {
  if (result === undefined) {
    return new Response(
      JSON.stringify({
        relay: "1.0",
        result: null,
        id,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
  if (result instanceof Response) {
    return result;
  }
  if (result instanceof RelayError) {
    return new Response(
      JSON.stringify({
        relay: "1.0",
        error: result,
        id,
      }),
      {
        status: result.status,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
  return new Response(
    JSON.stringify({
      relay: "1.0",
      result,
      id,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
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
