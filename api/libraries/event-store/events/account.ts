import { EmailSchema, NameSchema } from "@spec/shared";
import { event } from "@valkyr/event-store";
import z from "zod";

import { auditor } from "./auditor.ts";

export default [
  event.type("account:avatar:added").data(z.string()).meta(auditor),
  event.type("account:name:added").data(NameSchema).meta(auditor),
  event.type("account:email:added").data(EmailSchema).meta(auditor),
  event.type("account:role:added").data(z.string()).meta(auditor),
];
