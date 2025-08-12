import z from "zod";

import { makeSchemaParser } from "../database.ts";

export const RoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  permissions: z.record(z.string(), z.array(z.string())),
});

export const parseRole = makeSchemaParser(RoleSchema);

export type Role = z.infer<typeof RoleSchema>;
export type RoleDocument = z.infer<typeof RoleSchema>;
