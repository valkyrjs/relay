import { AvatarSchema, ContactSchema, makeSchemaParser, NameSchema } from "@spec/shared";
import { z } from "zod";

import { RoleSchema } from "../access/role.ts";
import { StrategySchema } from "./strategies.ts";

export const AccountSchema = z.object({
  id: z.uuid(),
  avatar: AvatarSchema.optional(),
  name: NameSchema.optional(),
  contact: ContactSchema.default({
    emails: [],
  }),
  strategies: z.array(StrategySchema).default([]),
  roles: z.array(RoleSchema).default([]),
});

export const AccountDocumentSchema = AccountSchema.omit({ roles: true }).extend({ roles: z.string().array() });

export const parseAccount = makeSchemaParser(AccountSchema);

export type Account = z.infer<typeof AccountSchema>;
export type AccountDocument = z.infer<typeof AccountDocumentSchema>;
