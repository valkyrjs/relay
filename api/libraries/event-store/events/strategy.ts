import { event } from "@valkyr/event-store";
import z from "zod";

import { auditor } from "./auditor.ts";

export default [
  event.type("strategy:email:added").data(z.string()).meta(auditor),
  event.type("strategy:passkey:added").meta(auditor),
  event
    .type("strategy:password:added")
    .data(z.object({ alias: z.string(), password: z.string() }))
    .meta(auditor),
];
