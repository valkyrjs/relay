import "./mocks/server.ts";

import { assertEquals, assertObjectMatch, assertRejects } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";

import { relay } from "./mocks/relay.ts";
import { api, users } from "./mocks/server.ts";

describe("Relay", () => {
  let server: Deno.HttpServer<Deno.NetAddr>;

  beforeAll(() => {
    server = Deno.serve(
      {
        port: 36573,
        hostname: "localhost",
        onListen({ port, hostname }) {
          console.log(`Listening at http://${hostname}:${port}`);
        },
      },
      async (request) => api.handle(request),
    );
  });

  afterAll(async () => {
    await server.shutdown();
  });

  it("should successfully relay users", async () => {
    const userId = await relay.post("/users", { name: "John Doe", email: "john.doe@fixture.none" });

    assertEquals(typeof userId, "string");
    assertEquals(users.length, 1);

    const user = await relay.get("/users/:userId", { userId });

    assertEquals(user.createdAt instanceof Date, true);

    await relay.put("/users/:userId", { userId }, { name: "Jane Doe", email: "jane.doe@fixture.none" });

    assertEquals(users.length, 1);
    assertObjectMatch(users[0], {
      name: "Jane Doe",
      email: "jane.doe@fixture.none",
    });

    await relay.delete("/users/:userId", { userId });

    assertEquals(users.length, 0);
  });

  it("should successfully run .actions", async () => {
    assertEquals(await relay.get("/add-two", { a: 1, b: 1 }), 2);
  });

  it("should reject .actions with error", async () => {
    await assertRejects(() => relay.get("/add-two", { a: -1, b: 1 }), "Invalid input numbers added");
  });
});
