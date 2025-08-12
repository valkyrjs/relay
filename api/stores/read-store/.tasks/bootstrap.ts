import { idIndex } from "~libraries/database/id.ts";
import { register } from "~libraries/database/registrar.ts";

import { db } from "../database.ts";

await register(db.db, [
  {
    name: "accounts",
    indexes: [
      idIndex,
      [{ "strategies.type": 1, "strategies.alias": 1 }, { name: "strategy.password" }],
      [{ "strategies.type": 1, "strategies.value": 1 }, { name: "strategy.email" }],
    ],
  },
  {
    name: "roles",
    indexes: [idIndex, [{ name: 1 }, { name: "role.name" }]],
  },
]);
