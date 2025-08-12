import z from "zod";

import { EmailSchema } from "./email.ts";

export const ContactSchema = z.object({
  emails: z.array(EmailSchema).default([]).describe("A list of email addresses associated with the contact."),
});

export type Contact = z.infer<typeof ContactSchema>;
