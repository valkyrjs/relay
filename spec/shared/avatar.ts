import z from "zod";

export const AvatarSchema = z.object({
  url: z.string().describe("A valid URL pointing to the user's avatar image."),
});

export type Avatar = z.infer<typeof AvatarSchema>;
