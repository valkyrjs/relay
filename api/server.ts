import { resolve } from "@std/path";
import cookie from "cookie";

import { auth, type Session } from "~libraries/auth/mod.ts";
import { logger } from "~libraries/logger/mod.ts";
import { asyncLocalStorage } from "~libraries/server/mod.ts";
import { Api, resolveRoutes } from "~libraries/server/mod.ts";

import { config } from "./config.ts";

const MODULES_DIR = resolve(import.meta.dirname!, "modules");

const log = logger.prefix("Server");

/*
 |--------------------------------------------------------------------------------
 | Bootstrap
 |--------------------------------------------------------------------------------
 */

await import("./tasks/bootstrap.ts");

/*
 |--------------------------------------------------------------------------------
 | Service
 |--------------------------------------------------------------------------------
 */

const api = new Api(await resolveRoutes(MODULES_DIR));

/*
 |--------------------------------------------------------------------------------
 | Server
 |--------------------------------------------------------------------------------
 */

Deno.serve(
  {
    port: config.port,
    hostname: config.host,
    onListen({ port, hostname }) {
      logger.prefix("Server").info(`Listening at http://${hostname}:${port}`);
    },
  },
  async (request) => {
    const url = new URL(request.url);

    // ### Session

    let session: Session | undefined;

    const token = cookie.parse(request.headers.get("cookie") ?? "").token;
    if (token !== undefined) {
      const resolved = await auth.resolve(token);
      if (resolved.valid === false) {
        return new Response(resolved.message, {
          status: 401,
          headers: {
            "set-cookie": cookie.serialize("token", "", config.cookie(0)),
          },
        });
      }
      session = resolved;
    }

    // ### Headers
    // Set the default headers.

    const headers = new Headers();

    // ### Handle

    const ts = performance.now();

    return asyncLocalStorage.run(
      {
        session,
        info: {
          method: request.url,
          start: Date.now(),
        },
        response: {
          headers,
        },
      },
      async () => {
        return api.fetch(request).finally(() => {
          log.info(`${request.method} ${url.pathname} [${((performance.now() - ts) / 1000).toLocaleString()} seconds]`);
        });
      },
    );
  },
);
