import { route, UnauthorizedError } from "@spec/relay";
import z from "zod";

import { AccountSchema } from "../account/account.ts";

export * from "./errors.ts";
export * from "./strategies.ts";

export const email = route.post("/api/v1/auth/email").body(
  z.object({
    base: z.url(),
    email: z.email(),
  }),
);

export const password = route.post("/api/v1/auth/password").body(
  z.object({
    alias: z.string(),
    password: z.string(),
  }),
);

export const code = route
  .get("/api/v1/auth/code/:accountId/code/:codeId/:value")
  .params({
    accountId: z.string(),
    codeId: z.string(),
    value: z.string(),
  })
  .query({
    next: z.string().optional(),
  });

export const session = route.get("/api/v1/auth/session").response(AccountSchema).errors([UnauthorizedError]);

export const routes = {
  email,
  password,
  code,
  session,
};
