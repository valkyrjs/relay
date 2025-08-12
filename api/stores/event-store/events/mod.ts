import { EventFactory } from "@valkyr/event-store";

import account from "./account.ts";
import code from "./code.ts";
import organization from "./organization.ts";
import role from "./role.ts";
import strategy from "./strategy.ts";

export const events = new EventFactory([...account, ...code, ...organization, ...role, ...strategy]);

export type EventStoreFactory = typeof events;
