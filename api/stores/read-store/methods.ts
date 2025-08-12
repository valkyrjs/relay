import { type Account, fromAccountDocument } from "@spec/schemas/account/account.ts";
import { PasswordStrategy } from "@spec/schemas/auth/strategies.ts";

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
    .then(fromAccountDocument)
    .then(takeOne);
}

/*
 |--------------------------------------------------------------------------------
 | Auth
 |--------------------------------------------------------------------------------
 */

/**
 * Get strategy details for the given password strategy alias.
 *
 * @param alias - Alias to get strategy for.
 */
export async function getPasswordStrategyByAlias(
  alias: string,
): Promise<({ accountId: string } & PasswordStrategy) | undefined> {
  const account = await db.collection("accounts").findOne({
    strategies: {
      $elemMatch: { type: "password", alias },
    },
  });
  if (account === null) {
    return undefined;
  }
  const strategy = account.strategies.find((strategy) => strategy.type === "password" && strategy.alias === alias);
  if (strategy === undefined) {
    return undefined;
  }
  return { accountId: account.id, ...strategy } as { accountId: string } & PasswordStrategy;
}
