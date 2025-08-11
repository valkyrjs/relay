import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

export const idIndex: [IndexSpecification, CreateIndexesOptions] = [{ id: 1 }, { unique: true }];
