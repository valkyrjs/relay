import z from "zod";

import { action } from "../../libraries/action.ts";
import { BadRequestError } from "../../mod.ts";

export const addTwoNumbers = action
  .make("addTwoNumbers")
  .input({ a: z.number(), b: z.number() })
  .output({ added: z.number() })
  .handle(async ({ a, b }) => {
    if (a < 0 || b < 0) {
      return new BadRequestError("Invalid input numbers added");
    }
    return {
      added: a + b,
    };
  });
