import { RelayError } from "./errors.ts";

export type RelayAdapter = {
  send(input: RelayRequestInput): Promise<RelayResponse>;
};

export type RelayRequestInput = {
  method: string;
  params: any;
};

export type RelayResponse =
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
