import { MongoTestContainer } from "@valkyr/testcontainers/mongodb";

import { config } from "../config.ts";
import { ApiTestContainer } from "./api-container.ts";
import { DatabaseTestContainer } from "./database-container.ts";

export class TestContainer {
  readonly id = crypto.randomUUID();

  // ### Enablers
  // A map of services to enable when the TestContainer is started. These toggles
  // must be toggled before the container is started.

  #with: With = {
    mongodb: false,
    database: false,
    api: false,
  };

  // ### Needs

  #needs: Needs = {
    mongodb: [],
    database: ["mongodb"],
    api: ["mongodb", "database"],
  };

  // ### Services
  // Any services that has been enabled will be running under the following
  // assignments. Make sure to .stop any running services to avoid shutdown
  // leaks.

  #mongodb?: MongoTestContainer;
  #database?: DatabaseTestContainer;
  #api?: ApiTestContainer;

  /*
   |--------------------------------------------------------------------------------
   | Accessors
   |--------------------------------------------------------------------------------
   */

  get accountId() {
    if (this.#api === undefined) {
      throw new Error("TestContainer > .withApi() must be called before starting the TestContainer.");
    }
    return this.#api.accountId;
  }

  get mongodb(): MongoTestContainer {
    if (this.#mongodb === undefined) {
      throw new Error("TestContainer > .withMongo() must be called before starting the TestContainer.");
    }
    return this.#mongodb;
  }

  get database(): DatabaseTestContainer {
    if (this.#database === undefined) {
      throw new Error("TestContainer > .withDatabase() must be called before starting the TestContainer.");
    }
    return this.#database;
  }

  get api() {
    if (this.#api === undefined) {
      throw new Error("TestContainer > .withApi() must be called before starting the TestContainer.");
    }
    return this.#api.client;
  }

  get authorize() {
    if (this.#api === undefined) {
      throw new Error("TestContainer > .withApi() must be called before starting the TestContainer.");
    }
    return this.#api.authorize.bind(this.#api);
  }

  get unauthorize() {
    if (this.#api === undefined) {
      throw new Error("TestContainer > .withApi() must be called before starting the TestContainer.");
    }
    return this.#api.unauthorize.bind(this.#api);
  }

  /*
   |--------------------------------------------------------------------------------
   | Builder
   |--------------------------------------------------------------------------------
   */

  withMongo(): this {
    this.#with.mongodb = true;
    return this;
  }

  withDatabase(): this {
    this.#with.database = true;
    return this;
  }

  withApi(): this {
    this.#with.api = true;
    return this;
  }

  /*
   |--------------------------------------------------------------------------------
   | Lifecycle
   |--------------------------------------------------------------------------------
   */

  async start(): Promise<this> {
    const promises: Promise<void>[] = [];
    if (this.#isNeeded("mongodb") === true) {
      promises.push(
        (async () => {
          this.#mongodb = await MongoTestContainer.start(config.mongodb);
          if (this.#isNeeded("database") === true) {
            this.#database = await new DatabaseTestContainer(this.mongodb).start();
          }
        })(),
      );
    }
    if (this.#isNeeded("api") === true) {
      promises.push(
        (async () => {
          this.#api = await new ApiTestContainer().start();
        })(),
      );
    }
    await Promise.all(promises);
    return this;
  }

  async stop(): Promise<this> {
    await this.#api?.stop();
    await this.#database?.stop();
    await this.#mongodb?.stop();

    this.#api = undefined;
    this.#database = undefined;
    this.#mongodb = undefined;

    return this;
  }

  /*
   |--------------------------------------------------------------------------------
   | Helpers
   |--------------------------------------------------------------------------------
   */

  #isNeeded(target: keyof With): boolean {
    if (this.#with[target] !== false) {
      return true;
    }
    for (const key in this.#needs) {
      if (this.#with[key as keyof With] !== false && this.#needs[key as keyof With].includes(target) === true) {
        return true;
      }
    }
    return false;
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Needs = Record<keyof With, (keyof With)[]>;

type With = {
  mongodb: boolean;
  database: boolean;
  api: boolean;
};
