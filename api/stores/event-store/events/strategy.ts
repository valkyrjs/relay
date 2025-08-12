import { event } from "@valkyr/event-store";
import z from "zod";

import { AuditorSchema } from "./auditor.ts";

export default [
  event.type("strategy:email:added").data(z.string()).meta(AuditorSchema),
  event.type("strategy:passkey:added").meta(AuditorSchema),
  event
    .type("strategy:password:added")
    .data(z.object({ alias: z.string(), password: z.string() }))
    .meta(AuditorSchema),
];
