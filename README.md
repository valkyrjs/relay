<p align="center">
  <img src="https://user-images.githubusercontent.com/1998130/229430454-ca0f2811-d874-4314-b13d-c558de8eec7e.svg" />
</p>

# Relay

Relay is a full stack protocol for communicating between client and server. It is also built around the major HTTP methods allowing for creating public API endpoints.

## Quick Start

Following quick start guide gives a three part setup approach for `Relay`, `RelayAPI`, and `RelayClient`.

### Relay

First thing we need is a relay instance, this is where our base route configuration is defined. This space should be environment agnostic meaning we should be able to import our relay instance in both back end front end environments.

```ts
import { Relay } from "@valkyr/relay";

export const relay = new Relay([
  route
    .post("/users")
    .body(
      z.object({
        name: z.string(),
        email: z.string().check(z.email()),
      })
    )
    .response(z.string()),
]);
```

As we can see in the above example we are defining a new `POST` route with an expected `body` and `response` contracts defined using zod schemas.

### API

To be able to process relay requests on our server we create a `RelayAPI` instance which consumes our relay routes. We do this by retrieving the route from the relay and attaching a handler to it. When we define new route methods we get a new instance which we apply to the api, this ensures that the changes to the route on the server only affects the relay on the server.

```ts
import { RelayAPI, NotFoundError } from "@valkyr/relay";

import { relay } from "@project/relay";

export const api = new RelayAPI({
  routes: [
    relay
      .route("POST", "/users")
      .handle(async ({ name, email }) => {
        const user = await db.users.insert({ name, email });
        if (user === undefined) {
          return new NotFoundError();
        }
        return user.id;
      }),
  ],
});
```

With the above example we now have a `POST` handler for the `/users` route.

### Web

Now that we have both our relay and api ready to recieve requests we can trigger a user creation request in our web application by creating a new `RelayClient` instance.

```ts
import { RelayClient } from "@valkyr/relay";
import { adapter } from "@valkyr/relay/http";

import { relay } from "@project/relay";

const client = new RelayClient({
  url: "http://localhost:8080",
  adapter,
  routes: relay.routes
})

const userId = await client.post("/users", {
  name: "John Doe",
  email: "john.doe@fixture.none"
});

console.log(userId); // => string
```
