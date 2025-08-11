import { AggregateRoot, getDate, makeAggregateReducer } from "@valkyr/event-store";

import { CodeIdentity } from "../events/code.ts";
import { EventStoreFactory } from "../events/mod.ts";

export class Code extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "code";

  id!: string;

  identity!: CodeIdentity;
  value!: string;

  createdAt!: Date;
  claimedAt?: Date;

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  static #reducer = makeAggregateReducer(Code);

  static create(identity: CodeIdentity): Code {
    return new Code().push({
      type: "code:created",
      data: {
        identity,
        value: crypto
          .getRandomValues(new Uint8Array(5))
          .map((v) => v % 10)
          .join(""),
      },
    });
  }

  static async getById(stream: string): Promise<Code | undefined> {
    return this.$store.reduce({
      name: "code",
      stream,
      reducer: this.#reducer,
    });
  }

  get isClaimed(): boolean {
    return this.claimedAt !== undefined;
  }

  // -------------------------------------------------------------------------
  // Folder
  // -------------------------------------------------------------------------

  with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "code:created": {
        this.id = event.stream;
        this.value = event.data.value;
        this.identity = event.data.identity;
        this.createdAt = getDate(event.created);
        break;
      }
      case "code:claimed": {
        this.claimedAt = getDate(event.created);
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  claim(): this {
    return this.push({
      type: "code:claimed",
      stream: this.id,
    });
  }
}
