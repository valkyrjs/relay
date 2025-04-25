import z, { ZodType } from "zod";

import type { RelayAdapter, RelayRESTInput } from "./adapter.ts";
import { Procedure } from "./procedure.ts";
import type { Relays } from "./relay.ts";
import { Route } from "./route.ts";

/**
 * Make a new relay client instance.
 *
 * @param config     - Client configuration.
 * @param procedures - Map of procedures to make available to the client.
 */
export function makeRelayClient<TRelays extends Relays>(config: RelayClientConfig, relays: TRelays): RelayClient<TRelays> {
  return mapRelays(relays, config.adapter);
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

function mapRelays<TRelays extends Relays>(relays: TRelays, adapter: RelayAdapter): RelayClient<TRelays> {
  const client: any = {};
  for (const key in relays) {
    const relay = relays[key];
    if (relay instanceof Procedure) {
      client[key] = async (params: unknown) => {
        const response = await adapter.send({ method: relay.method, params });
        if ("error" in response) {
          throw new Error(response.error.message);
        }
        if ("result" in response && relay.state.result !== undefined) {
          return relay.state.result.parseAsync(response.result);
        }
        return response.result;
      };
    } else if (relay instanceof Route) {
      client[key] = async (...args: any[]) => {
        const input: RelayRESTInput = { method: relay.state.method, url: `${adapter.url}${relay.state.path}`, query: "" };

        let index = 0; // argument incrementor

        if (relay.state.params !== undefined) {
          const params = args[index++] as { [key: string]: string };
          for (const key in params) {
            input.url = input.url.replace(`:${key}`, params[key]);
          }
        }

        if (relay.state.query !== undefined) {
          const query = args[index++] as { [key: string]: string };
          const pieces: string[] = [];
          for (const key in query) {
            pieces.push(`${key}=${query[key]}`);
          }
          if (pieces.length > 0) {
            input.query = `?${pieces.join("&")}`;
          }
        }

        if (relay.state.body !== undefined) {
          input.body = JSON.stringify(args[index++]);
        }

        // ### Fetch

        const data = await adapter.fetch(input);
        if (relay.state.output !== undefined) {
          return relay.state.output.parse(data);
        }
        return data;
      };
    } else {
      client[key] = mapRelays(relay, adapter);
    }
  }
  return client;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type RelayClient<TRelays extends Relays> = {
  [TKey in keyof TRelays]: TRelays[TKey] extends Procedure<infer TState>
    ? TState["params"] extends ZodType
      ? (params: z.infer<TState["params"]>) => Promise<TState["result"] extends ZodType ? z.infer<TState["result"]> : void>
      : () => Promise<TState["result"] extends ZodType ? z.infer<TState["result"]> : void>
    : TRelays[TKey] extends Route
      ? (...args: TRelays[TKey]["args"]) => Promise<RelayRouteResponse<TRelays[TKey]>>
      : TRelays[TKey] extends Relays
        ? RelayClient<TRelays[TKey]>
        : never;
};

type RelayRouteResponse<TRoute extends Route> = TRoute["state"]["output"] extends ZodType ? z.infer<TRoute["state"]["output"]> : void;

export type RelayClientConfig = {
  adapter: RelayAdapter;
};
