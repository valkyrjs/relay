import { makeControllerView } from "../../libraries/view.ts";
import { CreateController } from "./create.controller.ts";

export const CreateAccountView = makeControllerView(CreateController, ({ state: { form } }) => {
  return (
    <form onSubmit={form.submit}>
      <input placeholder="Given Name" {...form.register("givenName")} />
      <input placeholder="Family Name" {...form.register("familyName")} />
      <input placeholder="Email" {...form.register("email")} />
      <button type="submit">Create</button>
    </form>
  );
});
