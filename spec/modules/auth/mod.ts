import { authenticate } from "./routes/authenticate.ts";

export * from "./errors.ts";
export * from "./strategies.ts";

export const routes = {
  authenticate,
};
