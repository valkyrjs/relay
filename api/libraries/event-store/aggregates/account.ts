import { Strategy } from "@spec/modules/account/strategies.ts";
import { Avatar, Contact, Email, Name } from "@spec/shared";
import { AggregateRoot, getDate } from "@valkyr/event-store";

import { db } from "~libraries/read-store/mod.ts";

import { eventStore } from "../event-store.ts";
import { Auditor } from "../events/auditor.ts";
import { EventStoreFactory } from "../events/mod.ts";
import { projector } from "../projector.ts";

export class Account extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "account";

  avatar?: Avatar;
  name?: Name;
  contact: Contact = {
    emails: [],
  };
  strategies: Strategy[] = [];

  createdAt!: Date;
  updatedAt!: Date;

  // -------------------------------------------------------------------------
  // Reducer
  // -------------------------------------------------------------------------

  with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "account:avatar:added": {
        this.avatar = { url: event.data };
        this.updatedAt = getDate(event.created);
        break;
      }
      case "account:name:added": {
        this.name = event.data;
        this.updatedAt = getDate(event.created);
        break;
      }
      case "account:email:added": {
        this.contact.emails.push(event.data);
        this.updatedAt = getDate(event.created);
        break;
      }
      case "strategy:email:added": {
        this.strategies.push({ type: "email", value: event.data });
        this.updatedAt = getDate(event.created);
        break;
      }
      case "strategy:password:added": {
        this.strategies.push({ type: "password", ...event.data });
        this.updatedAt = getDate(event.created);
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  addAvatar(url: string, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "account:avatar:added",
      data: url,
      meta,
    });
  }

  addName(name: Name, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "account:name:added",
      data: name,
      meta,
    });
  }

  addEmail(email: Email, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "account:email:added",
      data: email,
      meta,
    });
  }

  addRole(roleId: string, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "account:role:added",
      data: roleId,
      meta,
    });
  }

  addEmailStrategy(email: string, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "strategy:email:added",
      data: email,
      meta,
    });
  }

  addPasswordStrategy(alias: string, password: string, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "strategy:password:added",
      data: { alias, password },
      meta,
    });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Projectors
 |--------------------------------------------------------------------------------
 */

projector.on("account:avatar:added", async ({ stream: id, data: url }) => {
  await db.collection("accounts").updateOne({ id }, { $set: { avatar: { url } } }, { upsert: true });
});

projector.on("account:name:added", async ({ stream: id, data: name }) => {
  await db.collection("accounts").updateOne({ id }, { $set: { name } }, { upsert: true });
});

projector.on("account:email:added", async ({ stream: id, data: email }) => {
  await db.collection("accounts").updateOne({ id }, { $push: { "contact.emails": email } }, { upsert: true });
});

projector.on("account:role:added", async ({ stream: id, data: roleId }) => {
  await db.collection("accounts").updateOne({ id }, { $push: { roles: roleId } }, { upsert: true });
});

projector.on("strategy:email:added", async ({ stream: id, data: email }) => {
  await eventStore.relations.insert(`account:email:${email}`, id);
  await db
    .collection("accounts")
    .updateOne({ id }, { $push: { strategies: { type: "email", value: email } } }, { upsert: true });
});

projector.on("strategy:password:added", async ({ stream: id, data: strategy }) => {
  await eventStore.relations.insert(`account:alias:${strategy.alias}`, id);
  await db
    .collection("accounts")
    .updateOne({ id }, { $push: { strategies: { type: "password", ...strategy } } }, { upsert: true });
});
