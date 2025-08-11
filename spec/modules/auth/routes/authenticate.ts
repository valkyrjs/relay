import { route } from "@spec/relay";

import { AuthenticationStrategyPayloadError } from "../errors.ts";
import { StrategyPayloadSchema } from "../strategies.ts";

export const authenticate = route
  .post("/api/v1/authenticate")
  .body(StrategyPayloadSchema)
  .errors([AuthenticationStrategyPayloadError]);
