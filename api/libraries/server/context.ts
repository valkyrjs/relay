import { RouteContext } from "@spec/relay";

export function getRequestContext(request: Request): RouteContext {
  return {
    request,
  };
}

declare module "@spec/relay" {
  interface RouteContext {
    /**
     * Current request instance being  handled.
     */
    request: Request;
  }
}
