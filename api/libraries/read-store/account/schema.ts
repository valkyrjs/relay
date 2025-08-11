import { z } from "zod";

const account = z.object({
  id: z.uuid(),
  name: z.object({
    given: z.string(),
    family: z.string(),
  }),
  email: z.email(),
});

/*
 |--------------------------------------------------------------------------------
 | Parsers
 |--------------------------------------------------------------------------------
 */

const select = account;
const insert = account;

export function toAccountDriver(documents: unknown): AccountInsert {
  return insert.parse(documents);
}

export function fromAccountDriver(documents: unknown[]): AccountSchema[] {
  return documents.map((document) => select.parse(document));
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type AccountSchema = z.infer<typeof select>;
export type AccountInsert = z.infer<typeof insert>;
