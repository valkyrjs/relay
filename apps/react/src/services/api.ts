import { makeClient } from "@spec/relay";

import { HttpAdapter } from "../adapters/http.ts";

export const api = makeClient(
  {
    adapter: new HttpAdapter({
      url: window.location.origin,
    }),
  },
  {
    account: (await import("@spec/schemas/account/routes.ts")).routes,
    auth: (await import("@spec/schemas/auth/routes.ts")).routes,
  },
);
