import { BadRequestError } from "@spec/relay";
import { password as route } from "@spec/schemas/auth/routes.ts";
import cookie from "cookie";

import { config } from "~config";
import { auth } from "~libraries/auth/mod.ts";
import { password } from "~libraries/crypto/mod.ts";
import { logger } from "~libraries/logger/mod.ts";
import { getPasswordStrategyByAlias } from "~stores/read-store/methods.ts";

export default route.handle(async ({ body: { alias, password: userPassword } }) => {
  const strategy = await getPasswordStrategyByAlias(alias);
  if (strategy === undefined) {
    return logger.info({
      type: "auth:password",
      message: "Failed to get account with 'password' strategy.",
      alias,
    });
  }

  const isValidPassword = await password.verify(userPassword, strategy.password);
  if (isValidPassword === false) {
    return new BadRequestError("Invalid email/password provided.");
  }

  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": cookie.serialize(
        "token",
        await auth.generate({ accountId: strategy.accountId }, "1 week"),
        config.cookie(1000 * 60 * 60 * 24 * 7),
      ),
    },
  });
});
