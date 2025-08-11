import { AggregateRoot, getDate, makeAggregateReducer } from "@valkyr/event-store";

import { db } from "~libraries/read-store/mod.ts";

import { Auditor } from "../events/auditor.ts";
import { EventStoreFactory } from "../events/mod.ts";
import { projector } from "../projector.ts";

export class Organization extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "organization";

  id!: string;

  name!: string;

  createdAt!: Date;
  updatedAt!: Date;

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  static #reducer = makeAggregateReducer(Organization);

  static create(name: string, meta: Auditor): Organization {
    return new Organization().push({
      type: "organization:created",
      data: { name },
      meta,
    });
  }

  static async getById(stream: string): Promise<Organization | undefined> {
    return this.$store.reduce({ name: "organization", stream, reducer: this.#reducer });
  }

  // -------------------------------------------------------------------------
  // Reducer
  // -------------------------------------------------------------------------

  with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "organization:created": {
        this.id = event.stream;
        this.name = event.data.name;
        this.createdAt = getDate(event.created);
        break;
      }
    }
  }
}

/*
 |--------------------------------------------------------------------------------
 | Projectors
 |--------------------------------------------------------------------------------
 */

projector.on("organization:created", async ({ stream: id, data: { name }, created }) => {
  await db.collection("organizations").insertOne({
    id,
    name,
    createdAt: getDate(created),
  });
});
