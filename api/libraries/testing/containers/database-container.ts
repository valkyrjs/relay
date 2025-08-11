import { MongoTestContainer } from "@valkyr/testcontainers/mongodb";

import { container } from "~database/container.ts";
import { logger } from "~libraries/logger/mod.ts";
import { bootstrap } from "~libraries/utilities/bootstrap.ts";
import { API_DOMAINS_DIR, API_PACKAGES_DIR } from "~paths";

export class DatabaseTestContainer {
  constructor(readonly mongo: MongoTestContainer) {
    container.set("client", mongo.client);
  }

  /*
   |--------------------------------------------------------------------------------
   | Lifecycle
   |--------------------------------------------------------------------------------
   */

  async start(): Promise<this> {
    logger.prefix("Database").info("DatabaseTestContainer Started");

    await bootstrap(API_DOMAINS_DIR);
    await bootstrap(API_PACKAGES_DIR);

    return this;
  }

  async truncate() {
    const promises: Promise<any>[] = [];
    for (const dbName of ["balto:auth", "balto:code", "balto:consultant", "balto:task"]) {
      const db = this.mongo.client.db(dbName);
      const collections = await db.listCollections().toArray();
      promises.push(...collections.map(({ name }) => db.collection(name).deleteMany({})));
    }
    await Promise.all(promises);
  }

  async stop() {
    logger.prefix("Database").info("DatabaseTestContainer stopped");
  }
}
