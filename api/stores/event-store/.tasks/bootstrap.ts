import { register } from "@valkyr/event-store/mongo";

import { eventStore } from "../event-store.ts";

await register(eventStore.db.db, console.info);
