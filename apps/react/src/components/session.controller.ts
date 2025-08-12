import { Controller } from "../libraries/controller.ts";
import { api } from "../services/api.ts";

export class SessionController extends Controller<{
  error?: string;
}> {
  async onInit() {
    await this.getSessionCookie();
  }

  async getSessionCookie() {
    const response = await api.auth.authenticate({
      body: {
        type: "email",
        email: "john.doe@fixture.none",
      },
    });
    if ("error" in response) {
      this.setState("error", undefined);
    }
  }
}
