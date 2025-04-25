import z from "zod";

import { rpc } from "../../libraries/procedure.ts";
import { Relay } from "../../libraries/relay.ts";
import { route } from "../../libraries/route.ts";
import { UserSchema } from "./user.ts";

export const relay = new Relay({
  rpc: {
    user: {
      create: rpc
        .method("user:create")
        .params(UserSchema.omit({ id: true, createdAt: true }))
        .result(z.string()),
      get: rpc.method("user:get").params(z.uuid()).result(UserSchema),
      update: rpc.method("user:update").params(
        z.tuple([
          z.string(),
          z.object({
            name: z.string().optional(),
            email: z.string().check(z.email()).optional(),
          }),
        ]),
      ),
      delete: rpc.method("user:delete").params(z.uuid()),
    },
    numbers: {
      add: rpc
        .method("number:add")
        .params(z.tuple([z.number(), z.number()]))
        .result(z.number()),
    },
  },
  rest: {
    user: {
      create: route
        .post("/users")
        .body(UserSchema.omit({ id: true, createdAt: true }))
        .response(z.string()),
      get: route.get("/users/:userId").params({ userId: z.string() }).response(UserSchema),
      update: route
        .put("/users/:userId")
        .params({ userId: z.string() })
        .body(
          z.object({
            name: z.string().optional(),
            email: z.string().check(z.email()).optional(),
          }),
        ),
      delete: route.delete("/users/:userId").params({ userId: z.uuid() }),
    },
    numbers: {
      add: route
        .post("/numbers/add")
        .body(z.tuple([z.number(), z.number()]))
        .response(z.number()),
    },
  },
});
