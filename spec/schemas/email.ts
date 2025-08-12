import z from "zod";

export const EmailSchema = z.object({
  type: z.enum(["personal", "work"]).describe("The context of the email address, e.g., personal or work."),
  value: z.email().describe("A valid email address string."),
  primary: z.boolean().describe("Indicates if this is the primary email."),
  verified: z.boolean().describe("True if the email address has been verified."),
  label: z.string().optional().describe("Optional display label for the email address."),
});

export type Email = z.infer<typeof EmailSchema>;
