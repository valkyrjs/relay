import { makeClient } from "@spec/relay";

import { HttpAdapter } from "../adapters/http.ts";

export const api = makeClient(
  {
    adapter: new HttpAdapter({
      url: window.location.origin,
    }),
  },
  {
    auth: (await import("@spec/modules/auth/mod.ts")).routes,
  },
);
