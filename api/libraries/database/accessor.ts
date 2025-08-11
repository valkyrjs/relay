import { Collection, type CollectionOptions, type Db, type Document, type MongoClient } from "mongodb";

import { container } from "./container.ts";

export function getDatabaseAccessor<TSchemas extends Record<string, Document>>(
  database: string,
): DatabaseAccessor<TSchemas> {
  let instance: Db | undefined;
  return {
    get db(): Db {
      if (instance === undefined) {
        instance = this.client.db(database);
      }
      return instance;
    },
    get client(): MongoClient {
      return container.get("client");
    },
    collection<TSchema extends keyof TSchemas>(
      name: TSchema,
      options?: CollectionOptions,
    ): Collection<TSchemas[TSchema]> {
      return this.db.collection<TSchemas[TSchema]>(name.toString(), options);
    },
  };
}

export type DatabaseAccessor<TSchemas extends Record<string, Document>> = {
  /**
   * Database for given accessor.
   */
  db: Db;

  /**
   * Lazy loaded mongo client.
   */
  client: MongoClient;

  /**
   * Returns a reference to a MongoDB Collection. If it does not exist it will be created implicitly.
   *
   * Collection namespace validation is performed server-side.
   *
   * @param name    - Collection name we wish to access.
   * @param options - Optional settings for the command.
   */
  collection<TSchema extends keyof TSchemas>(name: TSchema, options?: CollectionOptions): Collection<TSchemas[TSchema]>;
};
