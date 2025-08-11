import { config } from "~config";
import { getDatabaseAccessor } from "~libraries/database/accessor.ts";

import { AccountInsert } from "./account/schema.ts";

export const db = getDatabaseAccessor<{
  accounts: AccountInsert;
}>(`${config.name}:read-store`);

export function takeOne<TDocument>(documents: TDocument[]): TDocument | undefined {
  return documents[0];
}
