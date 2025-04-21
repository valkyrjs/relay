import z, { ZodType } from "zod";

import type { RelayAdapter } from "./adapter.ts";
import { Procedure, type Procedures } from "./procedure.ts";

/**
 * Make a new relay client instance.
 *
 * @param config     - Client configuration.
 * @param procedures - Map of procedures to make available to the client.
 */
export function makeRelayClient<TProcedures extends Procedures>(config: RelayClientConfig, procedures: TProcedures): RelayClient<TProcedures> {
  return mapProcedures(procedures, config.adapter);
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

function mapProcedures<TProcedures extends Procedures>(procedures: TProcedures, adapter: RelayAdapter): RelayClient<TProcedures> {
  const client: any = {};
  for (const key in procedures) {
    const entry = procedures[key];
    if (entry instanceof Procedure) {
      client[key] = async (params: unknown) => {
        const response = await adapter.send({ method: entry.method, params });
        if ("error" in response) {
          throw new Error(response.error.message);
        }
        if ("result" in response && entry.state.result !== undefined) {
          return entry.state.result.parseAsync(response.result);
        }
        return response.result;
      };
    } else {
      client[key] = mapProcedures(entry, adapter);
    }
  }
  return client;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type RelayClient<TProcedures extends Procedures> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends Procedure<infer TState>
    ? TState["params"] extends ZodType
      ? (params: z.infer<TState["params"]>) => Promise<TState["result"] extends ZodType ? z.infer<TState["result"]> : void>
      : () => Promise<TState["result"] extends ZodType ? z.infer<TState["result"]> : void>
    : TProcedures[TKey] extends Procedures
      ? RelayClient<TProcedures[TKey]>
      : never;
};

export type RelayClientConfig = {
  adapter: RelayAdapter;
};
