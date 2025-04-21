import z from "zod";

export const request = z.object({
  relay: z.literal("1.0"),
  method: z.string(),
  params: z.unknown(),
  id: z.string().or(z.number()),
});

export type RelayRequest = z.infer<typeof request>;
