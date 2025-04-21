import type { RelayAdapter, RelayRequestInput, RelayResponse } from "../libraries/adapter.ts";
import { RelayError, UnprocessableContentError } from "../libraries/errors.ts";

export class HttpAdapter implements RelayAdapter {
  #id: number = 0;

  constructor(readonly url: string) {}

  async send({ method, params }: RelayRequestInput): Promise<RelayResponse> {
    const id = this.#id++;
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
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
}
