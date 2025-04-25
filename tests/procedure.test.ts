import { assertEquals, assertObjectMatch, assertRejects } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { HttpAdapter } from "../adapters/http.ts";
import { relay } from "./mocks/relay.ts";
import { api, users } from "./mocks/server.ts";

describe("Procedure", () => {
  let server: Deno.HttpServer<Deno.NetAddr>;
  let client: typeof relay.$inferClient;

  beforeAll(async () => {
    server = Deno.serve(
      {
        port: 8080,
        hostname: "localhost",
        onListen({ port, hostname }) {
          console.log(`Listening at http://${hostname}:${port}`);
        },
      },
      async (request) => {
        switch (request.headers.get("x-relay-type")) {
          case "rest": {
            return api.rest(request);
          }
          case "rpc": {
            return api.rpc(await api.parse(request));
          }
        }
        return new Response("Missing required 'x-relay-type' type in header.", { status: 400 });
      },
    );
    client = relay.client({
      adapter: new HttpAdapter("http://localhost:8080"),
    });
  });

  afterAll(async () => {
    await server.shutdown();
  });

  describe("RPC", () => {
    it("should successfully relay users", async () => {
      const userId = await client.rpc.user.create({ name: "John Doe", email: "john.doe@fixture.none" });

      assertEquals(typeof userId, "string");
      assertEquals(users.length, 1);

      const user = await client.rpc.user.get(userId);

      assertEquals(user.createdAt instanceof Date, true);

      await client.rpc.user.update([userId, { name: "Jane Doe", email: "jane.doe@fixture.none" }]);

      assertEquals(users.length, 1);
      assertObjectMatch(users[0], {
        name: "Jane Doe",
        email: "jane.doe@fixture.none",
      });

      await client.rpc.user.delete(userId);

      assertEquals(users.length, 0);
    });

    it("should successfully run .actions", async () => {
      assertEquals(await client.rpc.numbers.add([1, 1]), 2);
    });

    it("should reject .actions with error", async () => {
      await assertRejects(() => client.rpc.numbers.add([-1, 1]), "Invalid input numbers added");
    });
  });

  describe("REST", () => {
    it("should successfully relay users", async () => {
      const userId = await client.rest.user.create({ name: "John Doe", email: "john.doe@fixture.none" });

      assertEquals(typeof userId, "string");
      assertEquals(users.length, 1);

      const user = await client.rest.user.get({ userId });

      assertEquals(user.createdAt instanceof Date, true);

      await client.rest.user.update({ userId }, { name: "Jane Doe", email: "jane.doe@fixture.none" });

      assertEquals(users.length, 1);
      assertObjectMatch(users[0], {
        name: "Jane Doe",
        email: "jane.doe@fixture.none",
      });

      await client.rest.user.delete({ userId });

      assertEquals(users.length, 0);
    });

    it("should successfully run .actions", async () => {
      assertEquals(await client.rest.numbers.add([1, 1]), 2);
    });

    it("should reject .actions with error", async () => {
      await assertRejects(() => client.rest.numbers.add([-1, 1]), "Invalid input numbers added");
    });
  });
});
