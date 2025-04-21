import z, { ZodLiteral, ZodNumber, ZodObject, ZodOptional, ZodString, ZodUnion, ZodUnknown } from "zod";

export const request: ZodObject<{
  relay: ZodLiteral<"1.0">;
  method: ZodString;
  params: ZodOptional<ZodUnknown>;
  id: ZodUnion<[ZodString, ZodNumber]>;
}> = z.object({
  relay: z.literal("1.0"),
  method: z.string(),
  params: z.unknown().optional(),
  id: z.string().or(z.number()),
});

export type RelayRequest = {
  /**
   * String specifying the version of the relay protocol. MUST be exactly "1.0".
   */
  relay: "1.0";

  /**
   * String containing the name of the method to be invoked.
   */
  method: string;

  /**
   * Structured value that holds the parameter values to be used during the
   * invocation of the method.
   */
  params?: unknown;

  /**
   * An identifier established by the Client that MUST contain a String, or non
   * fractional Number value.
   */
  id: string | number;
};
