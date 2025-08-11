import type { EventData } from "@valkyr/event-store";

import { AccountCreated, AccountEmailAdded } from "~libraries/auth/.generated/events.ts";
import { Account } from "~libraries/auth/aggregates/account.ts";
import { Role } from "~libraries/auth/aggregates/role.ts";
import type { TestContainer } from "~libraries/testing/containers/test-container.ts";

type AuthorizationOptions = {
  name?: { family?: string; given?: string };
  email?: Partial<EventData<AccountEmailAdded>>;
};

/**
 * Return a function which provides the ability to create a new account which
 * is authorized and ready to use for testing authorized requests.
 *
 * @param container - Container to authorize against.
 */
export function authorize(container: TestContainer): AuthorizeFn {
  return async (data: EventData<AccountCreated>, { name = {}, email = {} }: AuthorizationOptions = {}) => {
    const role = await makeRole(data.type).save();
    const account = await Account.create(data, "test")
      .addName(name?.family ?? "Doe", name?.given ?? "John", "test")
      .addEmail({ value: "john.doe@fixture.none", type: "work", primary: true, verified: true, ...email }, "test")
      .addRole(role.id, "test")
      .save();
    await container.authorize(account.id);
    return account;
  };
}

function makeRole(type: "admin" | "consultant" | "organization"): Role {
  switch (type) {
    case "admin": {
      return Role.create(
        {
          name: "Admin",
          permissions: [
            { resource: "admin", actions: ["create", "update", "delete"] },
            { resource: "consultant", actions: ["create", "update", "delete"] },
            { resource: "organization", actions: ["create", "update", "delete"] },
          ],
        },
        "test",
      );
    }
    case "consultant": {
      return Role.create(
        {
          name: "Consultant",
          permissions: [{ resource: "consultant", actions: ["create", "update", "delete"] }],
        },
        "test",
      );
    }
    case "organization": {
      return Role.create(
        {
          name: "Organization",
          permissions: [{ resource: "organization", actions: ["create", "update", "delete"] }],
        },
        "test",
      );
    }
  }
}

type AuthorizeFn = (data: EventData<AccountCreated>, optional?: AuthorizationOptions) => Promise<Account>;
