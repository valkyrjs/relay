import { AggregateFactory } from "@valkyr/event-store";

import { Account } from "./account.ts";
import { Code } from "./code.ts";
import { Organization } from "./organization.ts";
import { Role } from "./role.ts";

export const aggregates = new AggregateFactory([Account, Code, Organization, Role]);
