import { event } from "@valkyr/event-store";
import z from "zod";

const CodeIdentitySchema = z.object({
  accountId: z.string(),
});

export default [
  event.type("code:created").data(
    z.object({
      identity: CodeIdentitySchema,
      value: z.string(),
    }),
  ),
  event.type("code:claimed"),
];

export type CodeIdentity = z.infer<typeof CodeIdentitySchema>;
