import z from "zod";

import { adapter } from "../../adapters/http.ts";
import { Relay } from "../../libraries/relay.ts";
import { route } from "../../libraries/route.ts";
import { UserSchema } from "./user.ts";

export const relay = new Relay({ url: "http://localhost:36573", adapter }, [
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
]);
