import { MongoClient } from "mongodb";

export function getMongoClient(config: MongoConnectionInfo) {
  return new MongoClient(getConnectionUrl(config));
}

export function getConnectionUrl({ host, port, user, pass }: MongoConnectionInfo): MongoConnectionUrl {
  return `mongodb://${user}:${pass}@${host}:${port}`;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type MongoConnectionUrl = `mongodb://${string}:${string}@${string}:${number}`;

export type MongoConnectionInfo = {
  host: string;
  port: number;
  user: string;
  pass: string;
};
