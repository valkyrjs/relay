export type RelayAdapter = {
  send(input: RelayRequestInput): Promise<RelayResponse>;
};

export type RelayRequestInput = {
  method: string;
  params: any;
};

export type RelayResponse =
  | {
      result: unknown;
      id: string;
    }
  | {
      error: {
        message: string;
      };
      id: string;
    };
