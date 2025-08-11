import { event } from "@valkyr/event-store";
import z from "zod";

import { auditor } from "./auditor.ts";

const created = z.object({
  name: z.string(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

const operation = z.discriminatedUnion([
  z.object({
    type: z.literal("grant"),
    resource: z.string(),
    action: z.string(),
  }),
  z.object({
    type: z.literal("deny"),
    resource: z.string(),
    action: z.string().optional(),
  }),
]);

export default [
  event.type("role:created").data(created).meta(auditor),
  event.type("role:name-set").data(z.string()).meta(auditor),
  event.type("role:permissions-set").data(z.array(operation)).meta(auditor),
];

export type RoleCreatedData = z.infer<typeof created>;

export type RolePermissionOperation = z.infer<typeof operation>;
