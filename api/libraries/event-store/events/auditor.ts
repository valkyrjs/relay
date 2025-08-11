import z from "zod";

export const auditor = z.object({
  accountId: z.string(),
});

export type Auditor = z.infer<typeof auditor>;
