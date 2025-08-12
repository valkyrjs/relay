import { code } from "@spec/schemas/auth/routes.ts";
import cookie from "cookie";

import { auth, config } from "~libraries/auth/mod.ts";
import { logger } from "~libraries/logger/mod.ts";
import { Account } from "~stores/event-store/aggregates/account.ts";
import { Code } from "~stores/event-store/aggregates/code.ts";
import { eventStore } from "~stores/event-store/event-store.ts";

export default code.access("public").handle(async ({ params: { accountId, codeId, value }, query: { next } }) => {
  const code = await eventStore.aggregate.getByStream(Code, codeId);

  if (code === undefined) {
    return logger.info({
      type: "code:claimed",
      session: false,
      message: "Invalid Code ID",
      received: codeId,
    });
  }

  if (code.claimedAt !== undefined) {
    return logger.info({
      type: "code:claimed",
      session: false,
      message: "Code Already Claimed",
      received: codeId,
    });
  }

  await code.claim().save();

  if (code.value !== value) {
    return logger.info({
      type: "code:claimed",
      session: false,
      message: "Invalid Value",
      expected: code.value,
      received: value,
    });
  }

  if (code.identity.accountId !== accountId) {
    return logger.info({
      type: "code:claimed",
      session: false,
      message: "Invalid Account ID",
      expected: code.identity.accountId,
      received: accountId,
    });
  }

  const account = await eventStore.aggregate.getByStream(Account, accountId);
  if (account === undefined) {
    return logger.info({
      type: "code:claimed",
      session: false,
      message: "Account Not Found",
      expected: code.identity.accountId,
      received: undefined,
    });
  }

  logger.info({ type: "code:claimed", session: true });

  const options = config.cookie(1000 * 60 * 60 * 24 * 7);

  if (next !== undefined) {
    return new Response(null, {
      status: 302,
      headers: {
        location: next,
        "set-cookie": cookie.serialize("token", await auth.generate({ accountId: account.id }, "1 week"), options),
      },
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "set-cookie": cookie.serialize("token", await auth.generate({ accountId: account.id }, "1 week"), options),
    },
  });
});
