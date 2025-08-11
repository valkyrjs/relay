import z, { ZodType } from "zod";

import type { RelayAdapter, RelayInput, RelayResponse } from "./adapter.ts";
import { Route, type Routes } from "./route.ts";

/**
 * Factory method for generating a new relay client instance.
 *
 * @param config     - Client configuration.
 * @param procedures - Map of routes to make available to the client.
 */
export function makeClient<TRoutes extends Routes>(config: Config, routes: TRoutes): RelayClient<TRoutes> {
  const client: any = {
    getUrl: config.adapter.getUrl.bind(config.adapter),
    request: config.adapter.request.bind(config.adapter),
  };
  for (const key in routes) {
    const route = routes[key];
    if (route instanceof Route) {
      client[key] = getRouteFn(route, config);
    } else {
      client[key] = getNestedRoute(config, route);
    }
  }
  return client;
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

function getNestedRoute<TRoutes extends Routes>(config: Config, routes: TRoutes): RelayClient<TRoutes> {
  const nested: any = {};
  for (const key in routes) {
    const route = routes[key];
    if (route instanceof Route) {
      nested[key] = getRouteFn(route, config);
    } else {
      nested[key] = getNestedRoute(config, route);
    }
  }
  return nested;
}

function getRouteFn(route: Route, { adapter }: Config) {
  return async (options: any) => {
    const input: RelayInput = {
      method: route.state.method,
      endpoint: route.state.path,
      query: "",
    };

    // ### Params
    // Prepare request parameters by replacing :param notations with the
    // parameter argument provided.

    if (route.state.params !== undefined) {
      const params = await toParsedArgs(
        route.state.params,
        options.params,
        `Invalid 'params' passed to ${route.state.path} handler.`,
      );
      for (const key in params) {
        input.endpoint = input.endpoint.replace(`:${key}`, encodeURIComponent(params[key]));
      }
    }

    // ### Query
    // Prepare request query by looping through the query argument and
    // creating a query string to pass onto the fetch request.

    if (route.state.query !== undefined) {
      const query = await toParsedArgs(
        route.state.query,
        options.query,
        `Invalid 'query' passed to ${route.state.path} handler.`,
      );
      const pieces: string[] = [];
      for (const key in query) {
        pieces.push(`${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`);
      }
      if (pieces.length > 0) {
        input.query = `?${pieces.join("&")}`;
      }
    }

    // ### Body
    // Attach the body to the input which is handled internally based on the
    // type of fetch body is submitted.

    if (route.state.body !== undefined) {
      input.body = await toParsedArgs(
        route.state.body,
        options.body,
        `Invalid 'body' passed to ${route.state.path} handler.`,
      );
    }

    // ### Request Init
    // List of request init options that we can extract and forward to the
    // request adapter.

    if (options.headers !== undefined) {
      input.headers = new Headers(options.headers);
    }

    // ### Fetch

    const response = route.state.content === "json" ? await adapter.json(input) : await adapter.data(input);

    if ("data" in response && route.state.output !== undefined) {
      response.data = route.state.output.parse(response.data);
    }

    return response;
  };
}

async function toParsedArgs(
  zod: ZodType,
  args: unknown,
  msg: string,
): Promise<Record<string, string | number | boolean>> {
  const result = await zod.safeParseAsync(args);
  if (result.success === false) {
    throw new Error(msg);
  }
  return result.data as Record<string, string | number | boolean>;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type RelayClient<TRoutes extends Routes> = RelayRequest & RelayRoutes<TRoutes>;

type RelayRequest = {
  url: string;
  getUrl: (endpoint: string) => string;
  request: <TData = unknown>(input: RequestInfo | URL, init?: RequestInit) => Promise<RelayResponse<TData>>;
};

type RelayRoutes<TRoutes extends Routes> = {
  [TKey in keyof TRoutes]: TRoutes[TKey] extends Route
    ? ((
        payload: OmitNever<{
          params: TRoutes[TKey]["$params"];
          query: TRoutes[TKey]["$query"];
          body: TRoutes[TKey]["$body"];
          headers?: Headers;
        }>,
      ) => Promise<RelayResponse<RelayRouteResponse<TRoutes[TKey]>, RelayRouteErrors<TRoutes[TKey]>>>) & {
        $params: TRoutes[TKey]["$params"];
        $query: TRoutes[TKey]["$query"];
        $body: TRoutes[TKey]["$body"];
        $response: TRoutes[TKey]["$response"];
      }
    : TRoutes[TKey] extends Routes
      ? RelayClient<TRoutes[TKey]>
      : never;
};

type RelayRouteResponse<TRoute extends Route> = TRoute["state"]["output"] extends ZodType
  ? z.infer<TRoute["state"]["output"]>
  : null;

type RelayRouteErrors<TRoute extends Route> = InstanceType<TRoute["state"]["errors"][number]>;

type OmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type Config = {
  adapter: RelayAdapter;
};
