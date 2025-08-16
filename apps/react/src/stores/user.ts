import { ContactSchema } from "@spec/schemas/contact.ts";
import { NameSchema } from "@spec/schemas/name.ts";
import z from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: NameSchema,
  contact: ContactSchema,
});

export type User = z.infer<typeof UserSchema>;
