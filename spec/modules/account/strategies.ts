import z from "zod";

const EmailStrategySchema = z.object({
  type: z.literal("email"),
  value: z.string(),
});

const PasswordStrategySchema = z.object({
  type: z.literal("password"),
  alias: z.string(),
  password: z.string(),
});

const PasskeyStrategySchema = z.object({
  type: z.literal("passkey"),
  credId: z.string(),
  credPublicKey: z.string(),
  webauthnUserId: z.string(),
  counter: z.number(),
  backupEligible: z.boolean(),
  backupStatus: z.boolean(),
  transports: z.string(),
  createdAt: z.date(),
  lastUsed: z.date(),
});

export const StrategySchema = z.discriminatedUnion("type", [
  EmailStrategySchema,
  PasswordStrategySchema,
  PasskeyStrategySchema,
]);

export type Strategy = z.infer<typeof StrategySchema>;
