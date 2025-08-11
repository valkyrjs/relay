import type { CreateIndexesOptions, Db, IndexSpecification } from "mongodb";

import { getCollectionsSet } from "./utilities.ts";

/**
 * Takes a mongo database and registers the event store collections and
 * indexes defined internally.
 *
 * @param db         - Mongo database to register event store collections against.
 * @param registrars - List of registrars to register with the database.
 * @param logger     - Logger method to print internal logs.
 */
export async function register(db: Db, registrars: Registrar[], logger?: (...args: any[]) => any) {
  const list = await getCollectionsSet(db);
  for (const { name, indexes } of registrars) {
    if (list.has(name) === false) {
      await db.createCollection(name);
    }
    for (const [indexSpec, options] of indexes) {
      await db.collection(name).createIndex(indexSpec, options);
      logger?.("Mongo Event Store > Collection '%s' is indexed [%O] with options %O", name, indexSpec, options ?? {});
    }
    logger?.("Mongo Event Store > Collection '%s' is registered", name);
  }
}

export type Registrar = {
  name: string;
  indexes: [IndexSpecification, CreateIndexesOptions?][];
};
