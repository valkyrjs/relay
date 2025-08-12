import z from "zod";

import { Controller } from "../../libraries/controller.ts";
import { Form } from "../../libraries/form.ts";
import { api } from "../../services/api.ts";

const inputs = {
  givenName: z.string(),
  familyName: z.string(),
  email: z.string(),
};

export class CreateController extends Controller<{
  form: Form<typeof inputs>;
}> {
  async onInit() {
    return {
      form: new Form(inputs).onSubmit(async ({ givenName, familyName, email }) => {
        const response = await api.account.create({
          body: {
            name: {
              given: givenName,
              family: familyName,
            },
            email,
          },
        });
        if ("error" in response) {
          console.log(response.error);
        } else {
          console.log(response.data);
        }
      }),
    };
  }
}
