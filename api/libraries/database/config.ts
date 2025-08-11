import { getEnvironmentVariable, toNumber } from "~libraries/config/mod.ts";

export const config = {
  mongo: {
    host: getEnvironmentVariable("DB_MONGO_HOST", "localhost"),
    port: getEnvironmentVariable("DB_MONGO_PORT", toNumber, "27017"),
    user: getEnvironmentVariable("DB_MONGO_USER", "root"),
    pass: getEnvironmentVariable("DB_MONGO_PASSWORD", "password"),
  },
};
