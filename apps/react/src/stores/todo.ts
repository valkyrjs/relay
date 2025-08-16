import z from "zod";

import { TodoItemSchema } from "./todo-item.ts";

export const TodoSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(TodoItemSchema).default([]),
});

export type Todo = z.infer<typeof TodoSchema>;
