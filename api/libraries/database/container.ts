import { Container } from "@valkyr/inverse";
import { MongoClient } from "mongodb";

export const container = new Container<{
  client: MongoClient;
}>("database");
