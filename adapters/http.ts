import type { RelayAdapter, RelayRESTInput } from "../libraries/adapter.ts";
import { RelayError, UnprocessableContentError } from "../libraries/errors.ts";
import { RelayProcedureInput, RelayProcedureResponse } from "../mod.ts";

export class HttpAdapter implements RelayAdapter {
  #id: number = 0;

  constructor(readonly url: string) {}

  async send({ method, params }: RelayProcedureInput): Promise<RelayProcedureResponse> {
    const id = this.#id++;
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "x-relay-type": "rpc", "content-type": "application/json" },
      body: JSON.stringify({ relay: "1.0", method, params, id }),
    });
    const contentType = res.headers.get("content-type");
    if (contentType !== "application/json") {
      return {
        relay: "1.0",
        error: new UnprocessableContentError(`Invalid 'content-type' in header header, expected 'application/json', received '${contentType}'`),
        id,
      };
    }
    const json = await res.json();
    if ("error" in json) {
      return {
        relay: "1.0",
        error: RelayError.fromJSON(json.error),
        id,
      };
    }
    return json;
  }

  async fetch({ method, url, query, body }: RelayRESTInput): Promise<any> {
    const res = await fetch(`${url}${query}`, {
      method,
      headers: { "x-relay-type": "rest", "content-type": "application/json" },
      body,
    });
    const data = await res.text();
    if (res.status >= 400) {
      throw new Error(data);
    }
    if (res.headers.get("content-type")?.includes("json")) {
      return JSON.parse(data);
    }
    return data;
  }
}
