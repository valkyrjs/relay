import z, { ZodObject } from "zod";

export function makeSchemaParser<TSchema extends ZodObject>(schema: TSchema): SchemaParserFn<TSchema> {
  return ((value: unknown | unknown[]) => {
    if (Array.isArray(value)) {
      return value.map((value: unknown) => schema.parse(value));
    }
    return schema.parse(value);
  }) as SchemaParserFn<TSchema>;
}

type SchemaParserFn<TSchema extends ZodObject> = {
  (value: unknown): z.infer<TSchema>;
  (value: unknown[]): z.infer<TSchema>[];
};
