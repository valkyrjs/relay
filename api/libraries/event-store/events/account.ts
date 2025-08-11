import { event } from "@valkyr/event-store";
import { email, name, phone } from "relay/schemas";
import z from "zod";

import { auditor } from "./auditor.ts";

const created = z.discriminatedUnion([
  z.object({
    type: z.literal("admin"),
  }),
  z.object({
    type: z.literal("consultant"),
  }),
  z.object({
    type: z.literal("organization"),
    organizationId: z.string(),
  }),
]);

export default [
  event.type("account:created").data(created).meta(auditor),
  event.type("account:avatar:added").data(z.string()).meta(auditor),
  event.type("account:name:added").data(name).meta(auditor),
  event.type("account:email:added").data(email).meta(auditor),
  event.type("account:phone:added").data(phone).meta(auditor),
  event.type("account:role:added").data(z.string()).meta(auditor),
];

export type AccountCreatedData = z.infer<typeof created>;
