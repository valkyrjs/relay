import z from "zod";

import { action } from "../../libraries/action.ts";
import { BadRequestError } from "../../mod.ts";

export const addNumbers = action
  .make("number:add")
  .input(z.tuple([z.number(), z.number()]))
  .output({ sum: z.number() })
  .handle(async ([a, b]) => {
    if (a < 0 || b < 0) {
      return new BadRequestError("Invalid numbers provided");
    }
    return { sum: a + b };
  });
