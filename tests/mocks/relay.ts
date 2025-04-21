import z from "zod";

import { procedure } from "../../libraries/procedure.ts";
import { Relay } from "../../libraries/relay.ts";
import { UserSchema } from "./user.ts";

export const relay = new Relay({
  user: {
    create: procedure
      .method("user:create")
      .params(UserSchema.omit({ id: true, createdAt: true }))
      .result(z.string()),
    get: procedure.method("user:get").params(z.string().check(z.uuid())).result(UserSchema),
    update: procedure.method("user:update").params(
      z.tuple([
        z.string(),
        z.object({
          name: z.string().optional(),
          email: z.string().check(z.email()).optional(),
        }),
      ]),
    ),
    delete: procedure.method("user:delete").params(z.string().check(z.uuid())),
  },
  numbers: {
    add: procedure
      .method("number:add")
      .params(z.tuple([z.number(), z.number()]))
      .result(z.number()),
  },
});
