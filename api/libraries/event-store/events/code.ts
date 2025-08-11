import { event } from "@valkyr/event-store";
import z from "zod";

const identity = z.discriminatedUnion([
  z.object({
    type: z.literal("admin"),
    accountId: z.string(),
  }),
  z.object({
    type: z.literal("consultant"),
    accountId: z.string(),
  }),
  z.object({
    type: z.literal("organization"),
    organizationId: z.string(),
    accountId: z.string(),
  }),
]);

export default [
  event.type("code:created").data(
    z.object({
      value: z.string(),
      identity,
    }),
  ),
  event.type("code:claimed"),
];

export type CodeIdentity = z.infer<typeof identity>;
