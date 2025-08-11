import { db, takeOne } from "../database.ts";
import { type AccountSchema, fromAccountDriver } from "./schema.ts";

export async function getAccountById(id: string): Promise<AccountSchema | undefined> {
  return db.collection("accounts").find({ id }).toArray().then(fromAccountDriver).then(takeOne);
}
