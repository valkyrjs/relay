import { Link } from "@tanstack/react-router";

import { makeControllerView } from "../../libraries/view.ts";
import { TodosController } from "./todos.controller.ts";

export const TodosView = makeControllerView(
  TodosController,
  ({ state: { form, todos }, actions: { remove, stress } }) => {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 font-sans">
        <div className="w-full max-w-2xl space-y-8">
          {/* Heading */}
          <header className="text-center">
            <h1 className="text-3xl font-semibold text-gray-800">Todo Lists</h1>
            <p className="text-gray-500 mt-2">Create and manage your collections of tasks</p>
          </header>

          {/* Create form */}
          <form onSubmit={form.submit} className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="Enter todo list name..."
              {...form.register("name")}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 bg-gray-50"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              Create
            </button>
          </form>

          {/* Todo list output */}
          <section>
            <h2 className="text-lg font-medium text-gray-700 mb-4">Your Lists</h2>
            {todos?.length > 0 ? (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center justify-between px-4 py-3">
                    {/* List name */}
                    <span className="text-gray-800 font-medium">{todo.name}</span>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to="/todos/$id"
                        params={{ id: todo.id }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(todo.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No todo lists yet. Create one above!</p>
            )}
          </section>
        </div>
      </div>
    );
  },
);
