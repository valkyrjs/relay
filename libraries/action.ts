import z, { ZodObject, ZodRawShape } from "zod";

export class Action<TActionState extends ActionState = ActionState> {
  constructor(readonly state: TActionState) {}

  /**
   * Input object required by the action to fulfill its function.
   *
   * @param input - Schema defining the input requirements of the action.
   */
  input<TInput extends ZodRawShape>(input: TInput): Action<Omit<TActionState, "input"> & { input: ZodObject<TInput> }> {
    return new Action({ ...this.state, input: z.object(input) as any });
  }

  /**
   * Output object defining the result shape of the action.
   *
   * @param output - Schema defining the result shape.
   */
  output<TOutput extends ZodRawShape>(output: TOutput): Action<Omit<TActionState, "output"> & { output: ZodObject<TOutput> }> {
    return new Action({ ...this.state, output: z.object(output) as any });
  }

  /**
   * Add handler method to the action.
   *
   * @param handle - Handler method.
   */
  handle<THandleFn extends ActionHandlerFn<this["state"]["input"], this["state"]["output"]>>(
    handle: THandleFn,
  ): Action<Omit<TActionState, "handle"> & { handle: THandleFn }> {
    return new Action({ ...this.state, handle });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Factory
 |--------------------------------------------------------------------------------
 */

export const action: {
  make(name: string): Action;
} = {
  make(name: string) {
    return new Action({ name });
  },
};

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type ActionState = {
  name: string;
  input?: ZodObject;
  output?: ZodObject;
  handle?: ActionHandlerFn;
};

type ActionHandlerFn<TInput = any, TOutput = any> = TInput extends ZodObject
  ? (input: z.infer<TInput>) => TOutput extends ZodObject ? Promise<z.infer<TOutput>> : Promise<void>
  : () => TOutput extends ZodObject ? Promise<z.infer<TOutput>> : Promise<void>;
