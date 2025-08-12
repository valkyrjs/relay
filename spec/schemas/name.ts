import { z } from "zod";

export const NameSchema = z.object({
  family: z.string().nullable().describe("Family name, also known as last name or surname."),
  given: z.string().nullable().describe("Given name, also known as first name."),
});

export type Name = z.infer<typeof NameSchema>;
