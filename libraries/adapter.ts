import { RelayError } from "./errors.ts";
import type { RouteMethod } from "./route.ts";

export type RelayAdapter = {
  readonly url: string;
  fetch(input: RelayRESTInput): Promise<unknown>;
  send(input: RelayProcedureInput): Promise<RelayProcedureResponse>;
};

export type RelayRESTInput = {
  method: RouteMethod;
  url: string;
  query?: string;
  body?: string;
};

export type RelayProcedureInput = {
  method: string;
  params: any;
};

export type RelayProcedureResponse =
  | {
      relay: "1.0";
      result: unknown;
      id: string | number;
    }
  | {
      relay: "1.0";
      error: RelayError;
      id: string | number;
    };
