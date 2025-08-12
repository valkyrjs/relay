import { makeSchemaParser } from "@spec/shared";
import z from "zod";

export const RoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  permissions: z.record(z.string(), z.array(z.string())),
});

export const parseRole = makeSchemaParser(RoleSchema);

export type Role = z.infer<typeof RoleSchema>;
