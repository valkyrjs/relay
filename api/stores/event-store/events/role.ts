import { event } from "@valkyr/event-store";
import z from "zod";

import { AuditorSchema } from "./auditor.ts";

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
  event.type("role:created").data(CreatedSchema).meta(AuditorSchema),
  event.type("role:name-set").data(z.string()).meta(AuditorSchema),
  event.type("role:permissions-set").data(z.array(OperationSchema)).meta(AuditorSchema),
];

export type RoleCreatedData = z.infer<typeof CreatedSchema>;

export type RolePermissionOperation = z.infer<typeof OperationSchema>;
