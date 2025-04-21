import z from "zod";

import { BadRequestError, InternalServerError, NotFoundError, RelayError } from "./errors.ts";
import { Procedure } from "./procedure.ts";
import { RelayRequest, request } from "./request.ts";

export class RelayApi<TProcedures extends Procedure[]> {
  /**
   * Route index in the '${method} ${path}' format allowing for quick access to
   * a specific route.
   */
  readonly #index = new Map<string, Procedure>();

  /**
   * Instantiate a new Server instance.
   *
   * @param routes - Routes to register with the instance.
   */
  constructor({ procedures }: Config<TProcedures>) {
    for (const procedure of procedures) {
      this.#index.set(procedure.method, procedure);
    }
  }

  /**
   * Takes a request candidate and parses its json body.
   *
   * @param candidate - Request candidate to parse.
   */
  async parse(candidate: Request): Promise<RelayRequest> {
    return request.parseAsync(await candidate.json());
  }

  /**
   * Handle a incoming fetch request.
   *
   * @param method - Method name being executed.
   * @param params - Parameters provided with the method request.
   * @param id     - Request id used for response identification.
   */
  async call({ method, params, id }: RelayRequest): Promise<Response> {
    const procedure = this.#index.get(method);
    if (procedure === undefined) {
      return toResponse(new NotFoundError(`Method '' does not exist`), id);
    }

    // ### Context
    // Context is passed to every route handler and provides a suite of functionality
    // and request data.

    const args: any[] = [];

    // ### Params
    // If the route has a body schema we need to validate and parse the body.

    if (procedure.state.params !== undefined) {
      if (params === undefined) {
        return toResponse(new BadRequestError("Procedure expected 'params' but got 'undefined'."), id);
      }
      const result = await procedure.state.params.safeParseAsync(params);
      if (result.success === false) {
        return toResponse(new BadRequestError("Invalid request body", z.prettifyError(result.error)), id);
      }
      args.push(result.data);
    }

    // ### Actions
    // Run through all assigned actions for the route.

    const data: Record<string, unknown> = {};

    if (procedure.state.actions !== undefined) {
      for (const entry of procedure.state.actions) {
        let action = entry;
        let input: any;

        if (Array.isArray(entry)) {
          action = entry[0];
          input = entry[1](args[0]);
        }

        const result = (await action.state.input?.safeParseAsync(input)) ?? { success: true, data: {} };
        if (result.success === false) {
          return toResponse(new BadRequestError("Invalid action input", z.prettifyError(result.error)), id);
        }

        if (action.state.handle === undefined) {
          return toResponse(new InternalServerError(`Action '${action.state.name}' is missing handler.`), id);
        }

        const output = await action.state.handle(result.data);
        if (output instanceof RelayError) {
          return toResponse(output, id);
        }

        for (const key in output) {
          data[key] = output[key];
        }
      }
      args.push(data);
    }

    // ### Handler
    // Execute the route handler and apply the result.

    if (procedure.state.handle === undefined) {
      return toResponse(new InternalServerError(`Path '${procedure.method}' is missing request handler.`), id);
    }
    return toResponse(await procedure.state.handle(...args).catch((error) => error), id);
  }
}

/*
 |--------------------------------------------------------------------------------
 | Helpers
 |--------------------------------------------------------------------------------
 */

/**
 * Takes a server side request result and returns a fetch Response.
 *
 * @param result - Result to send back as a Response.
 * @param id     - Request id which can be used to identify the response.
 */
export function toResponse(result: object | RelayError | Response | void, id: string | number): Response {
  if (result === undefined) {
    return new Response(
      JSON.stringify({
        relay: "1.0",
        result: null,
        id,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
  if (result instanceof Response) {
    return result;
  }
  if (result instanceof RelayError) {
    return new Response(
      JSON.stringify({
        relay: "1.0",
        error: result,
        id,
      }),
      {
        status: result.status,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
  return new Response(
    JSON.stringify({
      relay: "1.0",
      result,
      id,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Config<TProcedures extends Procedure[]> = {
  procedures: TProcedures;
};
