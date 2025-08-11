import { load } from "@std/dotenv";
import type { z } from "zod";

import { Env, Parser, toServiceEnv, toString } from "./parsers.ts";

const env = await load();

/**
 * Get an environment variable and parse it to the desired type.
 *
 * @param key   - Environment key to resolve.
 * @param parse - Parser function to convert the value to the desired type. Default: `string`.
 */
export function getEnvironmentVariable(key: string, fallback?: string): string;
export function getEnvironmentVariable<T extends Parser>(key: string, parse: T, fallback?: string): ReturnType<T>;
export function getEnvironmentVariable<T extends Parser>(key: string, parse?: T, fallback?: string): ReturnType<T> {
  if (typeof parse === "string") {
    fallback = parse;
    parse = undefined;
  }
  const value = env[key] ?? Deno.env.get(key);
  if (value === undefined) {
    if (fallback !== undefined) {
      return parse ? parse(fallback) : fallback;
    }
    throw new Error(`Config Exception: Missing ${key} variable in configuration`);
  }
  return parse ? parse(value) : toString(value);
}

/**
 * Get an environment variable, select value based on ENV map and parse it to the desired type. Can be used with simple primitives or objects / arrays
 *
 * @export
 * @param {{
 *   key: string;
 *   envFallback?: FallbackEnvMap;
 *   fallback: string;
 *   validation: z.ZodTypeAny,
 * }} options
 * @param {string} options.key - the name of the env variable
 * @param {object} options.envFallback - map with env specific fallbacks that will be used if none value provided
 * @param {string} options.envFallback.local - example "local" SERVICE_ENV target fallback value
 * @param {string} options.fallback - string fallback that will be used if no env variable found
 * @param {z.ZodTypeAny} options.validation - Zod validation object or validation primitive
 * @returns {z.infer<typeof validation>} - Returns the inferred type of the validation provided
 */
export function validateEnvVariable({
  key,
  envFallback,
  fallback,
  validation,
}: {
  key: string;
  validation: z.ZodTypeAny;
  envFallback?: FallbackEnvMap;
  fallback?: string;
}): z.infer<typeof validation> {
  const serviceEnv = getEnvironmentVariable("SERVICE_ENV", toServiceEnv, "local");
  const providedValue = env[key] ?? Deno.env.get(key);
  const fallbackValue = typeof envFallback === "object" ? (envFallback[serviceEnv] ?? fallback) : fallback;
  const toBeUsed = providedValue ?? fallbackValue;
  try {
    if (typeof toBeUsed === "string" && (toBeUsed.trim().startsWith("{") || toBeUsed.trim().startsWith("["))) {
      return validation.parse(JSON.parse(toBeUsed));
    }
    return validation.parse(toBeUsed);
  } catch (e) {
    throw new Deno.errors.InvalidData(`Config Exception: Missing valid ${key} variable in configuration`, { cause: e });
  }
}

type FallbackEnvMap = Partial<Record<Env, string>> & {
  testing?: string;
  local?: string;
  stg?: string;
  demo?: string;
  prod?: string;
};
