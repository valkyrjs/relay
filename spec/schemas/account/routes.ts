import { route } from "@spec/relay";
import z from "zod";

import { NameSchema } from "../name.ts";
import { AccountEmailClaimedError } from "./errors.ts";

export const create = route
  .post("/api/v1/accounts")
  .body(
    z.object({
      name: NameSchema,
      email: z.email(),
    }),
  )
  .errors([AccountEmailClaimedError])
  .response(z.uuid());

export const routes = {
  create,
};
