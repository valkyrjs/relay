<p align="center">
  <img src="https://user-images.githubusercontent.com/1998130/229430454-ca0f2811-d874-4314-b13d-c558de8eec7e.svg" />
</p>

# Relay

Relay is a full stack protocol for communicating between client and server. It is also built around the major HTTP methods allowing for creating public API endpoints.

## Quick Start

For this quick start guide we assume the following project setup:

```
  api/
  relay/
  web/
```

### Relay

First we want to set up our relay space, from the structure above lets start by defining our route.

```ts
import { route } from "@valkyr/relay";
import z from "zod";

export default route
  .post("/users")
  .body(
    z.object({
      name: z.string(),
      email: z.string().check(z.email()),
    })
  )
  .response(z.string());
```

After creating our first route we mount it onto our relay instance.

```ts
import { Relay } from "@valkyr/relay";
import { adapter } from "@valkyr/relay/http";

import route from "./path/to/route.ts";

export const relay = new Relay({ url: "http://localhost:3000/api", adapter }, [
  route
]);
```

We have now finished defining our initial relay setup which we can now utilize in our `api` and `web` spaces.

### API

To be able to successfully execute our user create route we need to attach a handler in our `api`. Lets start off by defining our handler.

```ts
import { Api, UnprocessableContentError } from "@valkyr/relay";

import { relay } from "~project/relay/mod.ts";

export const api = new Api([
  relay
    .route("POST", "/users")
    .handle(async ({ name, email }) => {
      const user = await db.users.insert({ name, email });
      if (user === undefined) {
        return new UnprocessableContentError();
      }
      return user.id;
    })
]);
```

We now have a `POST` handler for the `/users` path.

### Web

Now that we have both our relay and api ready to recieve requests we can trigger a user creation request in our web application.

```ts
import { relay } from "~project/relay/mod.ts"

const userId = await relay.post("/users", {
  name: "John Doe",
  email: "john.doe@fixture.none"
});

console.log(userId); // => string
```
