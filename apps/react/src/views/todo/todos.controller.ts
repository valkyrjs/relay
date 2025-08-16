import z from "zod";

import { Controller } from "../../libraries/controller.ts";
import { Form } from "../../libraries/form.ts";
import { db } from "../../stores/database.ts";
import type { Todo } from "../../stores/todo.ts";

const inputs = {
  name: z.string(),
};

export class TodosController extends Controller<{
  form: Form<typeof inputs>;
  todos: Todo[];
}> {
  override async onInit() {
    return {
      form: new Form(inputs).onSubmit(async ({ name }) => {
        db.collection("todos").insertOne({ name, items: [] });
      }),
      todos: await this.query(db.collection("todos"), { limit: 10 }, "todos"),
    };
  }

  remove(id: string) {
    db.collection("todos").remove({ id });
  }
}
