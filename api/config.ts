import { config as auth } from "~libraries/auth/config.ts";
import { getEnvironmentVariable, toNumber } from "~libraries/config/mod.ts";

export const config = {
  name: "valkyr",
  host: getEnvironmentVariable("API_HOST", "0.0.0.0"),
  port: getEnvironmentVariable("API_PORT", toNumber, "8370"),
  ...auth,
};
