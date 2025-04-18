import { Api } from "../../libraries/api.ts";
import { NotFoundError } from "../../mod.ts";
import { relay } from "./relay.ts";
import { User } from "./user.ts";

export let users: User[] = [];

export const api = new Api([
  relay.route("POST", "/users").handle(async ({ name, email }) => {
    const id = crypto.randomUUID();
    users.push({ id, name, email, createdAt: new Date() });
    return id;
  }),
  relay.route("GET", "/users/:userId").handle(async ({ userId }) => {
    const user = users.find((user) => user.id === userId);
    if (user === undefined) {
      return new NotFoundError();
    }
    return user;
  }),
  relay.route("PUT", "/users/:userId").handle(async ({ userId, name, email }) => {
    for (const user of users) {
      if (user.id === userId) {
        user.name = name;
        user.email = email;
        break;
      }
    }
  }),
  relay.route("DELETE", "/users/:userId").handle(async ({ userId }) => {
    users = users.filter((user) => user.id !== userId);
  }),
]);
