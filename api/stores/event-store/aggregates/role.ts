import { AggregateRoot, getDate, makeAggregateReducer } from "@valkyr/event-store";

import { db } from "~libraries/read-store/database.ts";

import type { Auditor } from "../events/auditor.ts";
import { EventStoreFactory } from "../events/mod.ts";
import type { RoleCreatedData, RolePermissionOperation } from "../events/role.ts";
import { projector } from "../projector.ts";

export class Role extends AggregateRoot<EventStoreFactory> {
  static override readonly name = "role";

  id!: string;

  name!: string;
  permissions: { [resource: string]: Set<string> } = {};

  createdAt!: Date;
  updatedAt!: Date;

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  static #reducer = makeAggregateReducer(Role);

  static create(data: RoleCreatedData, meta: Auditor): Role {
    return new Role().push({
      type: "role:created",
      data,
      meta,
    });
  }

  static async getById(stream: string): Promise<Role | undefined> {
    return this.$store.reduce({ name: "role", stream, reducer: this.#reducer });
  }

  // -------------------------------------------------------------------------
  // Reducer
  // -------------------------------------------------------------------------

  override with(event: EventStoreFactory["$events"][number]["$record"]): void {
    switch (event.type) {
      case "role:created": {
        this.id = event.stream;
        this.createdAt = getDate(event.created);
        this.updatedAt = getDate(event.created);
        break;
      }
      case "role:name-set": {
        this.name = event.data;
        this.updatedAt = getDate(event.created);
        break;
      }
      case "role:permissions-set": {
        for (const operation of event.data) {
          if (operation.type === "grant") {
            if (this.permissions[operation.resource] === undefined) {
              this.permissions[operation.resource] = new Set();
            }
            this.permissions[operation.resource].add(operation.action);
          }
          if (operation.type === "deny") {
            if (operation.action === undefined) {
              delete this.permissions[operation.resource];
            } else {
              this.permissions[operation.resource]?.delete(operation.action);
            }
          }
        }
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  setName(name: string, meta: Auditor): this {
    return this.push({
      type: "role:name-set",
      stream: this.id,
      data: name,
      meta,
    });
  }

  setPermissions(operations: RolePermissionOperation[], meta: Auditor): this {
    return this.push({
      type: "role:permissions-set",
      stream: this.id,
      data: operations,
      meta,
    });
  }
}

/*
 |--------------------------------------------------------------------------------
 | Projectors
 |--------------------------------------------------------------------------------
 */

projector.on("role:created", async ({ stream, data: { name, permissions } }) => {
  await db.collection("roles").insertOne({
    id: stream,
    name,
    permissions: permissions.reduce(
      (map, permission) => {
        map[permission.resource] = permission.actions;
        return map;
      },
      {} as Record<string, string[]>,
    ),
  });
});
