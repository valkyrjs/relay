import z, { ZodObject, ZodType } from "zod";

import { Action } from "./action.ts";
import { RelayError } from "./errors.ts";

export class Procedure<const TState extends State = State> {
  readonly type = "rpc" as const;

  declare readonly args: Args<TState>;

  constructor(readonly state: TState) {}

  get method(): TState["method"] {
    return this.state.method;
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
   * relay
   *   .method("user:create")
   *   .params(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async ({ bar }) => {
   *     console.log(typeof bar); // => number
   *   });
   * ```
   */
  params<TParams extends ZodType>(params: TParams): Procedure<Omit<TState, "params"> & { params: TParams }> {
    return new Procedure({ ...this.state, params });
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
   *   .output(z.object({ foobar: z.number() }))
   *   .handle(async () => {
   *     return {
   *       foobar: 1,
   *     };
   *   });
   *
   * relay
   *   .method("foo")
   *   .actions([hasFooBar])
   *   .handle(async ({ foobar }) => {
   *     console.log(typeof foobar); // => number
   *   });
   * ```
   */
  actions<TAction extends Action, TActionFn extends ActionFn<TAction, this["state"]>>(
    actions: (TAction | [TAction, TActionFn])[],
  ): Procedure<Omit<TState, "actions"> & { actions: TAction[] }> {
    return new Procedure({ ...this.state, actions: actions as TAction[] });
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
   * relay
   *   .method("foo")
   *   .result(
   *     z.object({
   *       bar: z.number()
   *     })
   *   )
   *   .handle(async () => {
   *     return { bar: 1 };
   *   });
   * ```
   */
  result<TResult extends ZodType>(result: TResult): Procedure<Omit<TState, "result"> & { result: TResult }> {
    return new Procedure({ ...this.state, result });
  }

  /**
   * Server handler callback method.
   *
   * @param handle - Handle function to trigger when the route is executed.
   */
  handle<THandleFn extends HandleFn<this["args"], this["state"]["result"]>>(handle: THandleFn): Procedure<Omit<TState, "handle"> & { handle: THandleFn }> {
    return new Procedure({ ...this.state, handle });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factories
 |--------------------------------------------------------------------------------
 */

export const rpc: {
  method<const TMethod extends string>(method: TMethod): Procedure<{ type: "rpc"; method: TMethod }>;
} = {
  method<const TMethod extends string>(method: TMethod): Procedure<{ type: "rpc"; method: TMethod }> {
    return new Procedure({ type: "rpc", method });
  },
};

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type State = {
  method: string;
  params?: ZodType;
  actions?: Array<Action>;
  result?: ZodType;
  handle?: HandleFn;
};

type ActionFn<TAction extends Action, TState extends State> = TState["params"] extends ZodType
  ? (params: z.infer<TState["params"]>) => TAction["state"]["input"] extends ZodType ? z.infer<TAction["state"]["input"]> : void
  : () => TAction["state"]["input"] extends ZodType ? z.infer<TAction["state"]["input"]> : void;

type HandleFn<TArgs extends Array<any> = any[], TResponse = any> = (
  ...args: TArgs
) => TResponse extends ZodType ? Promise<z.infer<TResponse> | Response | RelayError> : Promise<Response | RelayError | void>;

type Args<TState extends State = State> = [
  ...(TState["params"] extends ZodType ? [z.infer<TState["params"]>] : []),
  ...(TState["actions"] extends Array<Action> ? [UnionToIntersection<MergeAction<TState["actions"]>>] : []),
];

type MergeAction<TActions extends Array<Action>> =
  TActions[number] extends Action<infer TState> ? (TState["output"] extends ZodObject ? z.infer<TState["output"]> : object) : object;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
