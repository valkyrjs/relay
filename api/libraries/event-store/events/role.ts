import { event } from "@valkyr/event-store";
import z from "zod";

import { auditor } from "./auditor.ts";

const CreatedSchema = z.object({
  name: z.string(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

const OperationSchema = z.discriminatedUnion("type", [
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
  event.type("role:created").data(CreatedSchema).meta(auditor),
  event.type("role:name-set").data(z.string()).meta(auditor),
  event.type("role:permissions-set").data(z.array(OperationSchema)).meta(auditor),
];

export type RoleCreatedData = z.infer<typeof CreatedSchema>;

export type RolePermissionOperation = z.infer<typeof OperationSchema>;
