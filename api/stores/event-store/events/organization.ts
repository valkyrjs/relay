import { event } from "@valkyr/event-store";
import z from "zod";

import { AuditorSchema } from "./auditor.ts";

export default [
  event
    .type("organization:created")
    .data(z.object({ name: z.string() }))
    .meta(AuditorSchema),
];
