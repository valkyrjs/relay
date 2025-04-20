import z from "zod";

import { Relay } from "../../libraries/relay.ts";
import { route } from "../../libraries/route.ts";
import { UserSchema } from "./user.ts";

export const relay = new Relay([
  route
    .post("/users")
    .body(UserSchema.omit({ id: true, createdAt: true }))
    .response(z.string()),
  route
    .get("/users/:userId")
    .params({ userId: z.string().check(z.uuid()) })
    .response(UserSchema),
  route
    .put("/users/:userId")
    .params({ userId: z.string().check(z.uuid()) })
    .body(UserSchema.omit({ id: true, createdAt: true })),
  route.delete("/users/:userId").params({ userId: z.string().check(z.uuid()) }),
  route.get("/add-two").search({ a: z.coerce.number(), b: z.coerce.number() }).response(z.number()),
]);

export type RelayRoutes = typeof relay.$inferRoutes;
