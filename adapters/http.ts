import { RequestInput } from "../libraries/relay.ts";
import { RelayAdapter } from "../mod.ts";

export const http: RelayAdapter = {
  async fetch({ method, url, search, body }: RequestInput) {
    const res = await fetch(`${url}${search}`, { method, headers: { "content-type": "application/json" }, body });
    const data = await res.text();
    if (res.status >= 400) {
      throw new Error(data);
    }
    if (res.headers.get("content-type")?.includes("json")) {
      return JSON.parse(data);
    }
    return data;
  },
};
