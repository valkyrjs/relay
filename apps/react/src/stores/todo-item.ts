import z from "zod";

export const TodoItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  completedAt: z.string(),
});

export type TodoItem = z.infer<typeof TodoItemSchema>;
