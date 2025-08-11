import { getAvailablePort } from "@std/net";
import cookie from "cookie";

import { auth, Session } from "~libraries/auth/mod.ts";
import { Code } from "~libraries/code/aggregates/code.ts";
import { handler } from "~libraries/server/handler.ts";

import { Api, QueryMethod } from "../.generated/api.ts";

export class ApiTestContainer {
  #server?: Deno.HttpServer;
  #client?: Api;
  #cookie?: string;
  #session?: Session;

  /*
   |--------------------------------------------------------------------------------
   | Accessors
   |--------------------------------------------------------------------------------
   */

  get accountId(): string | undefined {
    if (this.#session?.valid === true) {
      return this.#session.accountId;
    }
  }

  get client() {
    if (this.#client === undefined) {
      throw new Error("ApiContainer > .start() has not been executed.");
    }
    return this.#client;
  }

  /*
   |--------------------------------------------------------------------------------
   | Lifecycle
   |--------------------------------------------------------------------------------
   */

  async start(): Promise<this> {
    const port = await getAvailablePort();
    this.#server = await Deno.serve({ port, hostname: "127.0.0.1" }, handler);
    this.#client = makeApiClient(port, {
      onBeforeRequest: (headers: Headers) => {
        if (this.#cookie !== undefined) {
          headers.set("cookie", this.#cookie);
        }
      },
      onAfterResponse: (response) => {
        const cookie = response.headers.get("set-cookie");
        if (cookie !== null) {
          this.#cookie = cookie;
        }
      },
    });
    return this;
  }

  async stop() {
    await this.#server?.shutdown();
  }

  /*
   |--------------------------------------------------------------------------------
   | Utilities
   |--------------------------------------------------------------------------------
   */

  async authorize(accountId: string): Promise<void> {
    const code = await Code.create({ identity: { type: "admin", accountId } }).save();
    await this.client.auth.code(accountId, code.id, code.value, {});
    this.#session = await this.getSession();
  }

  async getSession(): Promise<Session | undefined> {
    const token = cookie.parse(this.#cookie ?? "").token;
    if (token !== undefined) {
      const session = await auth.resolve(token);
      if (session.valid === true) {
        return session;
      }
    }
  }

  unauthorize(): void {
    this.#cookie = undefined;
  }
}

function makeApiClient(
  port: number,
  {
    onBeforeRequest,
    onAfterResponse,
  }: {
    onBeforeRequest: (headers: Headers) => void;
    onAfterResponse: (response: Response) => void;
  },
): Api {
  return new Api({
    async command(payload) {
      const headers = new Headers();
      onBeforeRequest(headers);
      headers.set("content-type", "application/json");
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/command`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      if (response.status >= 300) {
        console.error(
          `Command '${payload.method}' responded with error status '${response.status} ${response.statusText}'.`,
        );
      }
      if (response.headers.get("content-type")?.includes("json") === true) {
        return JSON.parse(text);
      }
    },
    async query(method: QueryMethod, path: string, query: Record<string, unknown>, body: any = {}) {
      const headers = new Headers();
      onBeforeRequest(headers);
      if (method !== "GET") {
        headers.set("content-type", "application/json");
      }
      const response = await fetch(`http://127.0.0.1:${port}${path}${getSearchQuery(query)}`, {
        method,
        headers,
        body: method === "GET" ? undefined : JSON.stringify(body),
      });
      onAfterResponse(response);
      const text = await response.text();
      if (response.status >= 300) {
        console.error(`Query '${path}' responded with error status '${response.status} ${response.statusText}'.`);
        throw new Error(response.statusText);
      }
      if (response.headers.get("content-type")?.includes("json") === true) {
        return JSON.parse(text);
      }
    },
  });
}

function getSearchQuery(query: Record<string, unknown>): string {
  const search: string[] = [];
  for (const key in query) {
    search.push(`${key}=${query[key]}`);
  }
  if (search.length === 0) {
    return "";
  }
  return `?${search.join("&")}`;
}
