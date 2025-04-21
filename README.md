<p align="center">
  <img src="https://user-images.githubusercontent.com/1998130/229430454-ca0f2811-d874-4314-b13d-c558de8eec7e.svg" />
</p>

# Relay

Relay is a full stack protocol for communicating between client and server. It is also built around the major HTTP methods allowing for creating public API endpoints.

## Quick Start

Following quick start guide gives a three part setup approach for `Relay`, `RelayApi`, and `RelayClient`.

### Relay

First thing we need is a relay instance, this is where our base procedure configuration is defined. This space should be environment agnostic meaning we should be able to import our relay instance in both back end front end environments.

```ts
import { Relay, procedure } from "@valkyr/relay";

export const relay = new Relay([
  procedure
    .method("user:create")
    .params(
      z.object({
        name: z.string(),
        email: z.string().check(z.email()),
      })
    )
    .result(z.string()),
]);
```

As we can see in the above example we are defining a new `method` procedure with an expected `params` and `result` contracts defined using zod schemas.

### API

To be able to process relay requests on our server we create a `RelayApi` instance which consumes our relay routes. We do this by retrieving the procedure from the relay and attaching a handler to it. When we define new procedure methods we get a new instance which we apply to the api, this ensures that the changes to the procedure on the server only affects the relay on the server.

```ts
import { RelayApi, NotFoundError } from "@valkyr/relay";

import { relay } from "@project/relay";

export const api = new RelayApi({
  routes: [
    relay
      .method("user:create")
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

With the above example we now have a `method` handler for the `user:create` method.

### Web

Now that we have both our relay and api ready to recieve requests we can trigger a user creation request in our web application by creating a new `client` instance.

```ts
import { HttpAdapter } from "@valkyr/relay/http";

import { relay } from "@project/relay";

const client = relay.client({
  adapter: new HttpAdapter("http://localhost:8080")
})

const userId = await client.user.create({
  name: "John Doe",
  email: "john.doe@fixture.none"
});

console.log(userId); // => string
```
