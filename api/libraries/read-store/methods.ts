import { type Account, parseAccount } from "@spec/modules/account/account.ts";

import { db, takeOne } from "./database.ts";

/*
 |--------------------------------------------------------------------------------
 | Accounts
 |--------------------------------------------------------------------------------
 */

/**
 * Retrieve a single account by its primary identifier.
 *
 * @param id - Account identifier.
 */
export async function getAccountById(id: string): Promise<Account | undefined> {
  return db
    .collection("accounts")
    .aggregate([
      {
        $match: { id },
      },
      {
        $lookup: {
          from: "roles",
          localField: "roles",
          foreignField: "id",
          as: "roles",
        },
      },
    ])
    .toArray()
    .then(parseAccount)
    .then(takeOne);
}
