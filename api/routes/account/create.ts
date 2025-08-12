import { AccountEmailClaimedError } from "@spec/schemas/account/errors.ts";
import { create } from "@spec/schemas/account/routes.ts";

import { Account, isEmailClaimed } from "~stores/event-store/aggregates/account.ts";
import { eventStore } from "~stores/event-store/event-store.ts";

export default create.access("public").handle(async ({ body: { name, email } }) => {
  if ((await isEmailClaimed(email)) === true) {
    return new AccountEmailClaimedError(email);
  }
  return eventStore.aggregate
    .from(Account)
    .create()
    .addName(name)
    .addEmailStrategy(email)
    .save()
    .then((account) => account.id);
});
