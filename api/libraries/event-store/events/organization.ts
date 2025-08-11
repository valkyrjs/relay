import { event } from "@valkyr/event-store";
import z from "zod";

import { auditor } from "./auditor.ts";

export default [
  event
    .type("organization:created")
    .data(z.object({ name: z.string() }))
    .meta(auditor),
];
