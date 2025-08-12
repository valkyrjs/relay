import { route } from "@spec/relay";
import { NameSchema } from "@spec/shared";
import z from "zod";

export const create = route.post("/api/v1/accounts").body(z.object({ name: NameSchema }));
