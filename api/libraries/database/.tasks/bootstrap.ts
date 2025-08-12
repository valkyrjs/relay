import { config } from "../config.ts";
import { getMongoClient } from "../connection.ts";
import { container } from "../container.ts";

container.set("client", getMongoClient(config.mongo));
