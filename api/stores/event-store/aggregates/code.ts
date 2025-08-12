import { AggregateRoot, getDate } from "@valkyr/event-store";

import { CodeIdentity } from "../events/code.ts";
import { EventStoreFactory } from "../events/mod.ts";

export class Code extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "code";

  identity!: CodeIdentity;
  value!: string;

  createdAt!: Date;
  claimedAt?: Date;

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  get isClaimed(): boolean {
    return this.claimedAt !== undefined;
  }

  // -------------------------------------------------------------------------
  // Folder
  // -------------------------------------------------------------------------

  with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "code:created": {
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

  create(identity: CodeIdentity): this {
    return this.push({
      type: "code:created",
      stream: this.id,
      data: {
        identity,
        value: crypto
          .getRandomValues(new Uint8Array(5))
          .map((v) => v % 10)
          .join(""),
      },
    });
  }

  claim(): this {
    return this.push({
      type: "code:claimed",
      stream: this.id,
    });
  }
}
