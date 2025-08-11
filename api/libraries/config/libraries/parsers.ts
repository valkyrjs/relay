const SERVICE_ENV = ["testing", "local", "stg", "demo", "prod"] as const;

/**
 * Convert an variable to a string.
 *
 * @param value - Value to convert.
 */
export function toString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  throw new Error(`Config Exception: Cannot convert ${value} to string`);
}

/**
 * Convert an variable to a number.
 *
 * @param value - Value to convert.
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return parseInt(value);
  }
  throw new Error(`Config Exception: Cannot convert ${value} to number`);
}

/**
 * Convert an variable to a boolean.
 *
 * @param value - Value to convert.
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true" || value === "1";
  }
  throw new Error(`Config Exception: Cannot convert ${value} to boolean`);
}

/**
 * Convert a variable to an array of strings.
 *
 * Expects a comma seprated, eg. foo,bar,foobar
 *
 * @param value - Value to convert.
 */
export function toArray(value: unknown): string[] {
  if (typeof value === "string") {
    if (value === "") {
      return [];
    }
    return value.split(",");
  }
  throw new Error(`Config Exception: Cannot convert ${value} to array`);
}

/**
 * Ensure the given value is a valid SERVICE_ENV variable.
 *
 * @param value - Value to validate.
 */
export function toServiceEnv(value: unknown): Env {
  assertServiceEnv(value);
  return value;
}

/*
 |--------------------------------------------------------------------------------
 | Assertions
 |--------------------------------------------------------------------------------
 */

function assertServiceEnv(value: unknown): asserts value is Env {
  if (typeof value !== "string") {
    throw new Error(`Config Exception: Env ${value} is not a string`);
  }
  if ((SERVICE_ENV as unknown as string[]).includes(value) === false) {
    throw new Error(`Config Exception: Invalid env ${value} provided`);
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type Parser = (value: unknown) => any;

export type Env = (typeof SERVICE_ENV)[number];
