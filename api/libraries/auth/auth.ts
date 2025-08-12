import { Auth, ResolvedSession } from "@valkyr/auth";
import z from "zod";

import { db } from "~stores/read-store/database.ts";

import { config } from "./config.ts";

export const auth = new Auth(
  {
    settings: {
      algorithm: "RS256",
      privateKey: config.privateKey,
      publicKey: config.publicKey,
      issuer: "http://localhost",
      audience: "http://localhost",
    },
    session: z.object({
      accountId: z.string(),
    }),
    permissions: {} as const,
    guards: [],
  },
  {
    roles: {
      async add(role) {
        await db.collection("roles").insertOne(role);
      },

      async getById(id) {
        const role = await db.collection("roles").findOne({ id });
        if (role === null) {
          return undefined;
        }
        return role;
      },

      async getBySession({ accountId }) {
        const account = await db.collection("accounts").findOne({ id: accountId });
        if (account === null) {
          return [];
        }
        return db
          .collection("roles")
          .find({ id: { $in: account.roles } })
          .toArray();
      },

      async setPermissions() {
        throw new Error("MongoRolesProvider > .setPermissions is managed by Role aggregate projections");
      },

      async delete(id) {
        await db.collection("roles").deleteOne({ id });
      },

      async assignAccount(roleId: string, accountId: string): Promise<void> {
        await db.collection("accounts").updateOne(
          { id: accountId },
          {
            $push: {
              roles: roleId,
            },
          },
        );
      },

      async removeAccount(roleId: string, accountId: string): Promise<void> {
        await db.collection("roles").updateOne(
          { id: accountId },
          {
            $pull: {
              roles: roleId,
            },
          },
        );
      },
    },
  },
);

export type Session = ResolvedSession<typeof auth>;
export type Permissions = (typeof auth)["$permissions"];
