import { getArgsVariable } from "~libraries/config/mod.ts";

export const config = {
  level: getArgsVariable("LOG_LEVEL", "info"),
};
