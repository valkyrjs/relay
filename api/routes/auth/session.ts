import { UnauthorizedError } from "@spec/relay/mod.ts";
import { session } from "@spec/schemas/auth/routes.ts";

import { getAccountById } from "~stores/read-store/methods.ts";

export default session.access("session").handle(async ({ accountId }) => {
  const account = await getAccountById(accountId);
  if (account === undefined) {
    return new UnauthorizedError();
  }
  return account;
});
