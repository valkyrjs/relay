import { RelayApi } from "../../libraries/api.ts";
import { NotFoundError } from "../../mod.ts";
import { addNumbers } from "./actions.ts";
import { relay } from "./relay.ts";
import { User } from "./user.ts";

export let users: User[] = [];

export const api = new RelayApi({
  procedures: [
    relay.method("user:create").handle(async ({ name, email }) => {
      const id = crypto.randomUUID();
      users.push({ id, name, email, createdAt: new Date() });
      return id;
    }),
    relay.method("user:get").handle(async (userId) => {
      const user = users.find((user) => user.id === userId);
      if (user === undefined) {
        return new NotFoundError();
      }
      return user;
    }),
    relay.method("user:update").handle(async ([userId, { name, email }]) => {
      for (const user of users) {
        if (user.id === userId) {
          user.name = name ?? user.name;
          user.email = email ?? user.email;
          break;
        }
      }
    }),
    relay.method("user:delete").handle(async (userId) => {
      users = users.filter((user) => user.id !== userId);
    }),
    relay
      .method("number:add")
      .actions([[addNumbers, (params) => params]])
      .handle(async (_, { sum }) => {
        return sum;
      }),
  ],
});
