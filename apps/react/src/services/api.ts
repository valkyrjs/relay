import { makeClient } from "@spec/relay";

import { HttpAdapter } from "../adapters/http.ts";

export const api = makeClient(
  {
    adapter: new HttpAdapter({
      url: window.location.origin,
    }),
  },
  {
    account: (await import("@spec/modules/account/mod.ts")).routes,
    auth: (await import("@spec/modules/auth/mod.ts")).routes,
  },
);
