import type { RouteMethod } from "./route.ts";

export type RelayAdapter = {
  fetch(input: RequestInput): Promise<unknown>;
};

export type RequestInput = {
  method: RouteMethod;
  url: string;
  search: string;
  body?: string;
};
