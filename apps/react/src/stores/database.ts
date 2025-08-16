import { IndexedDatabase } from "@valkyr/db";

import type { Todo } from "./todo.ts";
import type { TodoItem } from "./todo-item.ts";
import type { User } from "./user.ts";

export const db = new IndexedDatabase<{
  todos: Todo;
  todoItems: TodoItem;
  users: User;
}>({
  name: "app:valkyr",
  registrars: [{ name: "todos", indexes: [["name", { unique: true }]] }, { name: "todoItems" }, { name: "users" }],
});
