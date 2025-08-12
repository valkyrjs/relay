import { resolve } from "node:path";

import { logger } from "~libraries/logger/mod.ts";

const LIBRARIES_DIR = resolve(import.meta.dirname!, "..", "libraries");
const STORES_DIR = resolve(import.meta.dirname!, "..", "stores");

const log = logger.prefix("Bootstrap");

/*
 |--------------------------------------------------------------------------------
 | Database
 |--------------------------------------------------------------------------------
 */

await import("~libraries/database/.tasks/bootstrap.ts");

/*
 |--------------------------------------------------------------------------------
 | Packages
 |--------------------------------------------------------------------------------
 */

await bootstrap(LIBRARIES_DIR);
await bootstrap(STORES_DIR);

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

/**
 * Traverse path and look for a `bootstrap.ts` file in each folder found under
 * the given path. If a `boostrap.ts` file is found it is imported so its content
 * is executed.
 *
 * @param path - Path to resolve `bootstrap.ts` files.
 */
export async function bootstrap(path: string): Promise<void> {
  const bootstrap: { name: string; path: string }[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory === true) {
      const moduleName = path.split("/").pop();
      if (moduleName === undefined) {
        continue;
      }
      const filePath = `${path}/${entry.name}/.tasks/bootstrap.ts`;
      if (await hasFile(filePath)) {
        bootstrap.push({ name: entry.name, path: filePath });
      }
    }
  }
  for (const entry of bootstrap) {
    log.info(entry.name);
    await import(entry.path);
  }
}

async function hasFile(filePath: string) {
  try {
    await Deno.lstat(filePath);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    return false;
  }
  return true;
}
