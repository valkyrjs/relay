import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { SerializeOptions } from "cookie";

import { getEnvironmentVariable, toBoolean } from "~libraries/config/mod.ts";

export const config = {
  privateKey: getEnvironmentVariable(
    "AUTH_PRIVATE_KEY",
    await readFile(resolve(import.meta.dirname!, ".keys", "private"), "utf-8"),
  ),
  publicKey: getEnvironmentVariable(
    "AUTH_PUBLIC_KEY",
    await readFile(resolve(import.meta.dirname!, ".keys", "public"), "utf-8"),
  ),
  cookie: (maxAge: number) =>
    ({
      httpOnly: true,
      secure: getEnvironmentVariable("AUTH_COOKIE_SECURE", toBoolean, "false"), // Set to true for HTTPS in production
      maxAge,
      path: "/",
      sameSite: "strict",
    }) satisfies SerializeOptions,
};
