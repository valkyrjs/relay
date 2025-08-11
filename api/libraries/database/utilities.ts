import type { Db } from "mongodb";
import z, { ZodType } from "zod";

/**
 * Get a Set of collections that exists on a given mongo database instance.
 *
 * @param db - Mongo database to fetch collection list for.
 */
export async function getCollectionsSet(db: Db) {
  return db
    .listCollections()
    .toArray()
    .then((collections) => new Set(collections.map((c) => c.name)));
}

export function toParsedDocuments<TSchema extends ZodType>(
  schema: TSchema,
): (documents: unknown[]) => Promise<z.infer<TSchema>[]> {
  return async function (documents: unknown[]) {
    const parsed = [];
    for (const document of documents) {
      parsed.push(await schema.parseAsync(document));
    }
    return parsed;
  };
}

export function toParsedDocument<TSchema extends ZodType>(
  schema: TSchema,
): (document?: unknown) => Promise<z.infer<TSchema> | undefined> {
  return async function (document: unknown) {
    if (document === undefined || document === null) {
      return undefined;
    }
    return schema.parseAsync(document);
  };
}
