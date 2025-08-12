import { email } from "@spec/schemas/auth/routes.ts";

import { logger } from "~libraries/logger/mod.ts";
import { Account, getAccountEmailRelation } from "~stores/event-store/aggregates/account.ts";
import { Code } from "~stores/event-store/aggregates/code.ts";
import { eventStore } from "~stores/event-store/event-store.ts";

export default email.access("public").handle(async ({ body: { base, email } }) => {
  const account = await eventStore.aggregate.getByRelation(Account, getAccountEmailRelation(email));
  if (account === undefined) {
    return logger.info({
      type: "auth:email",
      code: false,
      message: "Account Not Found",
      received: email,
    });
  }
  const code = await eventStore.aggregate.from(Code).create({ accountId: account.id }).save();
  logger.info({
    type: "auth:email",
    data: {
      code: code.id,
      accountId: account.id,
    },
    link: `${base}/api/v1/admin/auth/${account.id}/code/${code.id}/${code.value}?next=${base}/admin`,
  });
});
