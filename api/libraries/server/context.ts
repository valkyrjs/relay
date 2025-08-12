import { ServerContext, UnauthorizedError } from "@spec/relay";

import { Session } from "../auth/auth.ts";
import { req } from "./request.ts";

declare module "@spec/relay" {
  interface ServerContext {
    /**
     * Current request instance being  handled.
     */
    request: Request;

    /**
     * Get request session instance.
     */
    session: Session;

    /**
     * Get account id from session, throws an error if the request
     * does not have a valid session.
     */
    accountId: string;
  }
}

export function getRequestContext(request: Request): ServerContext {
  return {
    request,

    get session(): Session {
      if (req.session === undefined) {
        throw new UnauthorizedError();
      }
      return req.session;
    },

    get accountId() {
      return this.session.accountId;
    },
  };
}
