import { EmailSchema } from "@spec/schemas/email.ts";
import { NameSchema } from "@spec/schemas/name.ts";
import { event } from "@valkyr/event-store";
import z from "zod";

import { AuditorSchema } from "./auditor.ts";

export default [
  event.type("account:created").meta(AuditorSchema),
  event.type("account:avatar:added").data(z.string()).meta(AuditorSchema),
  event.type("account:name:added").data(NameSchema).meta(AuditorSchema),
  event.type("account:email:added").data(EmailSchema).meta(AuditorSchema),
  event.type("account:role:added").data(z.string()).meta(AuditorSchema),
];
