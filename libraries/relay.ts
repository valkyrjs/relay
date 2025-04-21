import { makeRelayClient, RelayClient, RelayClientConfig } from "./client.ts";
import { Procedure, Procedures } from "./procedure.ts";

export class Relay<TProcedures extends Procedures, TProcedureIndex = ProcedureIndex<TProcedures>> {
  readonly #index = new Map<keyof TProcedureIndex, Procedure>();

  declare readonly $inferClient: RelayClient<TProcedures>;
  declare readonly $inferIndex: TProcedureIndex;

  /**
   * Instantiate a new Relay instance.
   *
   * @param procedures - Procedures to register with the instance.
   */
  constructor(readonly procedures: TProcedures) {
    indexProcedures(procedures, this.#index);
  }

  /**
   * Create a new relay client instance from the instance procedures.
   *
   * @param config - Client configuration.
   */
  client(config: RelayClientConfig): this["$inferClient"] {
    return makeRelayClient(config, this.procedures) as any;
  }

  /**
   * Retrieve a registered procedure registered with the relay instance.
   *
   * @param method - Method name assigned to the procedure.
   */
  method<TMethod extends keyof TProcedureIndex>(method: TMethod): TProcedureIndex[TMethod] {
    return this.#index.get(method) as TProcedureIndex[TMethod];
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

function indexProcedures<TProcedures extends Procedures, TProcedureIndex = ProcedureIndex<TProcedures>, TProcedureKey = keyof TProcedureIndex>(
  procedures: TProcedures,
  index: Map<TProcedureKey, Procedure>,
) {
  for (const key in procedures) {
    if (procedures[key] instanceof Procedure) {
      const method = procedures[key].method as TProcedureKey;
      if (index.has(method)) {
        throw new Error(`Relay > Procedure with method '${method}' already exists!`);
      }
      index.set(method, procedures[key]);
    } else {
      indexProcedures(procedures[key], index);
    }
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type ProcedureIndex<TProcedures extends Procedures> = MergeUnion<FlattenProcedures<TProcedures>>;

type FlattenProcedures<TProcedures extends Procedures> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends Procedure<infer TState>
    ? Record<TState["method"], TProcedures[TKey]>
    : TProcedures[TKey] extends Procedures
      ? FlattenProcedures<TProcedures[TKey]>
      : never;
}[keyof TProcedures];

type MergeUnion<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? { [K in keyof I]: I[K] } : never;
