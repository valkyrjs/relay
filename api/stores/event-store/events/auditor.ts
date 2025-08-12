import z from "zod";

export const AuditorSchema = z.object({
  auditor: z.union([
    z.object({
      type: z.literal("system"),
    }),
    z.object({
      type: z.literal("account"),
      accountId: z.string(),
    }),
  ]),
});

export const systemAuditor: Auditor = {
  auditor: {
    type: "system",
  },
};

export type Auditor = z.infer<typeof AuditorSchema>;
