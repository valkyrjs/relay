import { Api } from "./api.ts";
import { makeRelayClient, RelayClient, RelayClientConfig } from "./client.ts";
import { Procedure } from "./procedure.ts";
import { Route, RouteMethod } from "./route.ts";

export class Relay<
  TRelays extends Relays,
  TRPCIndex = RPCIndex<TRelays>,
  TPostIndex = RouteIndex<"POST", TRelays>,
  TGetIndex = RouteIndex<"GET", TRelays>,
  TPutIndex = RouteIndex<"PUT", TRelays>,
  TPatchIndex = RouteIndex<"PATCH", TRelays>,
  TDeleteIndex = RouteIndex<"DELETE", TRelays>,
> {
  readonly #index = new Map<string, Procedure | Route>();

  declare readonly $inferClient: RelayClient<TRelays>;

  /**
   * Instantiate a new Relay instance.
   *
   * @param procedures - Procedures to register with the instance.
   */
  constructor(readonly relays: TRelays) {
    indexRelays(relays, this.#index);
  }

  /**
   * Create a new relay api instance with the given relays.
   *
   * @param relays - List of relays to handle.
   */
  api<TRelays extends (Procedure | Route)[]>(relays: TRelays): Api<TRelays> {
    return new Api<TRelays>(relays);
  }

  /**
   * Create a new relay client instance from the instance procedures.
   *
   * @param config - Client configuration.
   */
  client(config: RelayClientConfig): this["$inferClient"] {
    return makeRelayClient(config, this.relays) as any;
  }

  /**
   * Retrieve a registered procedure registered with the relay instance.
   *
   * @param method - Method name assigned to the procedure.
   */
  method<TMethod extends keyof TRPCIndex>(method: TMethod): TRPCIndex[TMethod] {
    return this.#index.get(method as string) as TRPCIndex[TMethod];
  }

  /**
   * Retrieve a registered 'POST' route registered with the relay instance.
   *
   * @param path - Route path to retrieve.
   */
  post<TPath extends keyof TPostIndex>(path: TPath): TPostIndex[TPath] {
    return this.#index.get(`POST ${path as string}`) as TPostIndex[TPath];
  }

  /**
   * Retrieve a registered 'GET' route registered with the relay instance.
   *
   * @param path - Route path to retrieve.
   */
  get<TPath extends keyof TGetIndex>(path: TPath): TGetIndex[TPath] {
    return this.#index.get(`GET ${path as string}`) as TGetIndex[TPath];
  }

  /**
   * Retrieve a registered 'PUT' route registered with the relay instance.
   *
   * @param path - Route path to retrieve.
   */
  put<TPath extends keyof TPutIndex>(path: TPath): TPutIndex[TPath] {
    return this.#index.get(`PUT ${path as string}`) as TPutIndex[TPath];
  }

  /**
   * Retrieve a registered 'PATCH' route registered with the relay instance.
   *
   * @param path - Route path to retrieve.
   */
  patch<TPath extends keyof TPatchIndex>(path: TPath): TPatchIndex[TPath] {
    return this.#index.get(`PATCH ${path as string}`) as TPatchIndex[TPath];
  }

  /**
   * Retrieve a registered 'DELETE' route registered with the relay instance.
   *
   * @param path - Route path to retrieve.
   */
  delete<TPath extends keyof TDeleteIndex>(path: TPath): TDeleteIndex[TPath] {
    return this.#index.get(`DELETE ${path as string}`) as TDeleteIndex[TPath];
  }
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

function indexRelays(relays: Relays, index: Map<string, Procedure | Route>) {
  for (const key in relays) {
    const relay = relays[key];
    if (relay instanceof Procedure) {
      const method = relay.method;
      if (index.has(method)) {
        throw new Error(`Relay > Procedure with method '${method}' already exists!`);
      }
      index.set(method, relay);
    } else if (relay instanceof Route) {
      const path = `${relay.method} ${relay.path}`;
      if (index.has(path)) {
        throw new Error(`Relay > Procedure with path 'path' already exists!`);
      }
      index.set(path, relay);
    } else {
      indexRelays(relay, index);
    }
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type Relays = {
  [key: string]: Relays | Procedure | Route;
};

type RPCIndex<TRelays extends Relays> = MergeUnion<FlattenRPCRelays<TRelays>>;

type RouteIndex<TMethod extends RouteMethod, TRelays extends Relays> = MergeUnion<FlattenRouteRelays<TMethod, TRelays>>;

type FlattenRPCRelays<TRelays extends Relays> = {
  [TKey in keyof TRelays]: TRelays[TKey] extends Procedure<infer TState>
    ? Record<TState["method"], TRelays[TKey]>
    : TRelays[TKey] extends Relays
      ? FlattenRPCRelays<TRelays[TKey]>
      : never;
}[keyof TRelays];

type FlattenRouteRelays<TMethod extends RouteMethod, TRelays extends Relays> = {
  [TKey in keyof TRelays]: TRelays[TKey] extends { state: { method: TMethod; path: infer TPath extends string } }
    ? Record<TPath, TRelays[TKey]>
    : TRelays[TKey] extends Relays
      ? FlattenRouteRelays<TMethod, TRelays[TKey]>
      : never;
}[keyof TRelays];

type MergeUnion<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? { [K in keyof I]: I[K] } : never;
