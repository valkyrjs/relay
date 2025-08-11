import { idIndex } from "~libraries/database/id.ts";
import { register } from "~libraries/database/registrar.ts";

import { db } from "../database.ts";

await register(db.db, [
  {
    name: "accounts",
    indexes: [idIndex],
  },
]);
