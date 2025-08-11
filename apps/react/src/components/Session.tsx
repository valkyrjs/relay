import { makeControllerView } from "../libraries/view.ts";
import { SessionController } from "./session.controller.ts";

export const Session = makeControllerView(SessionController, ({ state: { error } }) => {
  if (error !== undefined) {
    return "Failed to fetch session";
  }
  return <div>Session OK!</div>;
});
