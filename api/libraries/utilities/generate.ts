/**
 * Traverse path and look for a `generate.ts` file in each folder found under
 * the given path. If a `generate.ts` file is found it is imported so its content
 * is executed.
 *
 * @param path   - Path to resolve `generate.ts` files.
 * @param filter - Which folders found under the given path to ignore.
 */
export async function generate(path: string, filter: string[] = []): Promise<void> {
  const generate: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isDirectory === true) {
      const moduleName = path.split("/").pop();
      if (moduleName === undefined) {
        continue;
      }
      if (filter.length > 0 && filter.includes(moduleName) === false) {
        continue;
      }
      const filePath = `${path}/${entry.name}/.tasks/generate.ts`;
      if (await hasFile(filePath)) {
        generate.push(filePath);
      }
    }
  }
  for (const filePath of generate) {
    await import(filePath);
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
