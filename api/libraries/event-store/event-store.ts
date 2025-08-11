import { EventStore } from "@valkyr/event-store";
import { MongoAdapter } from "@valkyr/event-store/mongo";

import { container } from "~libraries/database/container.ts";

import { aggregates } from "./aggregates/mod.ts";
import { events } from "./events/mod.ts";
import { projector } from "./projector.ts";

export const eventStore = new EventStore({
  adapter: new MongoAdapter(() => container.get("client"), "balto:event-store"),
  events,
  aggregates,
  snapshot: "auto",
});

eventStore.onEventsInserted(async (records, { batch }) => {
  if (batch !== undefined) {
    await projector.pushMany(batch, records);
  } else {
    for (const record of records) {
      await projector.push(record, { hydrated: false, outdated: false });
    }
  }
});
