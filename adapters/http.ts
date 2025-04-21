import type { RelayAdapter, RelayRequestInput, RelayResponse } from "../libraries/adapter.ts";

export class HttpAdapter implements RelayAdapter {
  #id: number = 0;

  constructor(readonly url: string) {}

  async send({ method, params }: RelayRequestInput): Promise<RelayResponse> {
    const res = await fetch(this.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method, params, id: this.#id++ }) });
    if (res.headers.get("content-type")?.includes("application/json") === false) {
      throw new Error("Unexpected return type");
    }
    return res.json();
  }
}
