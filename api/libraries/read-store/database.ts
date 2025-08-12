import type { AccountDocument } from "@spec/modules/account/account.ts";

import { config } from "~config";
import { getDatabaseAccessor } from "~libraries/database/accessor.ts";

export const db = getDatabaseAccessor<{
  accounts: AccountDocument;
}>(`${config.name}:read-store`);

export function takeOne<TDocument>(documents: TDocument[]): TDocument | undefined {
  return documents[0];
}
