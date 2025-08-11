import { AggregateRoot, getDate, makeAggregateReducer } from "@valkyr/event-store";
import { Avatar, Contact, Email, Name, Phone, Strategy } from "relay/schemas";

import { db, toAccountDriver } from "~libraries/read-store/mod.ts";

import { eventStore } from "../event-store.ts";
import { AccountCreatedData } from "../events/account.ts";
import { Auditor } from "../events/auditor.ts";
import { EventStoreFactory } from "../events/mod.ts";
import { projector } from "../projector.ts";

export class Account extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "account";

  id!: string;
  organizationId?: string;

  type!: "admin" | "consultant" | "organization";

  avatar?: Avatar;
  name?: Name;
  contact: Contact = {
    emails: [],
    phones: [],
  };
  strategies: Strategy[] = [];

  createdAt!: Date;
  updatedAt!: Date;

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  static #reducer = makeAggregateReducer(Account);

  static create(data: AccountCreatedData, meta: Auditor): Account {
    return new Account().push({
      type: "account:created",
      data,
      meta,
    });
  }

  static async getById(stream: string): Promise<Account | undefined> {
    return this.$store.reduce({ name: "account", stream, reducer: this.#reducer });
  }

  static async getByEmail(email: string): Promise<Account | undefined> {
    return this.$store.reduce({ name: "account", relation: Account.emailRelation(email), reducer: this.#reducer });
  }

  // -------------------------------------------------------------------------
  // Relations
  // -------------------------------------------------------------------------

  static emailRelation(email: string): `account:email:${string}` {
    return `account:email:${email}`;
  }

  static passwordRelation(alias: string): `account:password:${string}` {
    return `account:password:${alias}`;
  }

  // -------------------------------------------------------------------------
  // Reducer
  // -------------------------------------------------------------------------

  with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "account:created": {
        this.id = event.stream;
        this.organizationId = event.data.type === "organization" ? event.data.organizationId : undefined;
        this.type = event.data.type;
        this.createdAt = getDate(event.created);
        break;
      }
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
      case "account:phone:added": {
        this.contact.phones.push(event.data);
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

  addPhone(phone: Phone, meta: Auditor): this {
    return this.push({
      stream: this.id,
      type: "account:phone:added",
      data: phone,
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

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  toSession(): Session {
    if (this.type === "organization") {
      if (this.organizationId === undefined) {
        throw new Error("Account .toSession failed, no organization id present");
      }
      return {
        type: this.type,
        accountId: this.id,
        organizationId: this.organizationId,
      };
    }
    return {
      type: this.type,
      accountId: this.id,
    };
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Session =
  | {
      type: "organization";
      accountId: string;
      organizationId: string;
    }
  | {
      type: "admin" | "consultant";
      accountId: string;
    };

/*
 |--------------------------------------------------------------------------------
 | Projectors
 |--------------------------------------------------------------------------------
 */

projector.on("account:created", async ({ stream, data }) => {
  const schema: any = {
    id: stream,
    type: data.type,
    contact: {
      emails: [],
      phones: [],
    },
    strategies: [],
    roles: [],
  };
  if (data.type === "organization") {
    schema.organizationId = data.organizationId;
  }
  await db.collection("accounts").insertOne(toAccountDriver(schema));
});

projector.on("account:avatar:added", async ({ stream: id, data: url }) => {
  await db.collection("accounts").updateOne({ id }, { $set: { avatar: { url } } });
});

projector.on("account:name:added", async ({ stream: id, data: name }) => {
  await db.collection("accounts").updateOne({ id }, { $set: { name } });
});

projector.on("account:email:added", async ({ stream: id, data: email }) => {
  await db.collection("accounts").updateOne({ id }, { $push: { "contact.emails": email } });
});

projector.on("account:phone:added", async ({ stream: id, data: phone }) => {
  await db.collection("accounts").updateOne({ id }, { $push: { "contact.phones": phone } });
});

projector.on("account:role:added", async ({ stream: id, data: roleId }) => {
  await db.collection("accounts").updateOne({ id }, { $push: { roles: roleId } });
});

projector.on("strategy:email:added", async ({ stream: id, data: email }) => {
  await eventStore.relations.insert(Account.emailRelation(email), id);
  await db.collection("accounts").updateOne({ id }, { $push: { strategies: { type: "email", value: email } } });
});

projector.on("strategy:password:added", async ({ stream: id, data: strategy }) => {
  await eventStore.relations.insert(Account.passwordRelation(strategy.alias), id);
  await db.collection("accounts").updateOne({ id }, { $push: { strategies: { type: "password", ...strategy } } });
});
