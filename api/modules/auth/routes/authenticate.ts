import { authenticate } from "@spec/modules/auth/routes/authenticate.ts";

export default authenticate.access("public").handle(async ({ body }) => {
  console.log({ body });
});
