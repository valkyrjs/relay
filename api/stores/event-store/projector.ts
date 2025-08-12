import { Projector } from "@valkyr/event-store";

import { EventStoreFactory } from "./events/mod.ts";

export const projector = new Projector<EventStoreFactory>();
