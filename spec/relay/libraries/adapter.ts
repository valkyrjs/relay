import z from "zod";

import type { ServerErrorType } from "./errors.ts";
import type { RouteMethod } from "./route.ts";

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

const ServerErrorResponseSchema = z.object({
  error: z.object({
    status: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }),
});

/*
 |--------------------------------------------------------------------------------
 | Utilities
 |--------------------------------------------------------------------------------
 */

/**
 * Check if the given candidate is a valid relay error response.
 *
 * @param candidate - Candidate to check.
 */
export function assertServerErrorResponse(candidate: unknown): candidate is ServerErrorResponse {
  return ServerErrorResponseSchema.safeParse(candidate).success;
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type RelayAdapter = {
  readonly url: string;

  /**
   * Return the full URL from given endpoint.
   *
   * @param endpoint - Endpoint to get url for.
   */
  getUrl(endpoint: string): string;

  /**
   * Send a 'application/json' request to the configured relay url.
   *
   * @param input - Request input parameters.
   */
  json(input: RelayInput): Promise<RelayResponse>;

  /**
   * Send a form data request to the configured relay url.
   *
   * @param input - Request input parameters.
   */
  data(input: RelayInput): Promise<RelayResponse>;

  /**
   * Sends a fetch request using the given options and returns a
   * raw response.
   *
   * @param options - Relay request options.
   */
  request(input: RequestInfo | URL, init?: RequestInit): Promise<RelayResponse>;
};

export type RelayInput = {
  method: RouteMethod;
  endpoint: string;
  query?: string;
  body?: Record<string, unknown>;
  headers?: Headers;
};

export type RelayResponse<TData = unknown, TError = ServerErrorType | ServerErrorResponse["error"]> =
  | {
      result: "success";
      data: TData;
    }
  | {
      result: "error";
      error: TError;
    };

export type ServerErrorResponse = z.infer<typeof ServerErrorResponseSchema>;
