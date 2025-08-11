import {
  assertServerErrorResponse,
  type RelayAdapter,
  type RelayInput,
  type RelayResponse,
  ServerError,
  type ServerErrorResponse,
  type ServerErrorType,
} from "@spec/relay";

export class HttpAdapter implements RelayAdapter {
  /**
   * Instantiate a new HttpAdapter instance.
   *
   * @param options - Adapter options.
   */
  constructor(readonly options: HttpAdapterOptions) {}

  /**
   * Override the initial url value set by instantiator.
   */
  set url(value: string) {
    this.options.url = value;
  }

  /**
   * Retrieve the URL value from options object.
   */
  get url() {
    return this.options.url;
  }

  /**
   * Return the full URL from given endpoint.
   *
   * @param endpoint - Endpoint to get url for.
   */
  getUrl(endpoint: string): string {
    return `${this.url}${endpoint}`;
  }

  /**
   * Send fetch request to the configured endpoint.
   *
   * @param input - Relay input parameters to use for the request.
   */
  async json({ method, endpoint, query, body, headers = new Headers() }: RelayInput): Promise<RelayResponse> {
    const init: RequestInit = { method, headers };

    // ### Before Request
    // If any before request hooks has been defined, we run them here passing in the
    // request headers for further modification.

    await this.#beforeRequest(headers);

    // ### Content Type
    // JSON requests are always of the type 'application/json' and this ensures that
    // we override any custom pre-hook values for 'content-type' when executing the
    // request via the 'json' method.

    headers.set("content-type", "application/json");

    // ### Body

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    // ### Response

    return this.request(`${endpoint}${query}`, init);
  }

  async data({ method, endpoint, query, body, headers = new Headers() }: RelayInput): Promise<RelayResponse> {
    const init: RequestInit = { method, headers };

    // ### Before Request
    // If any before request hooks has been defined, we run them here passing in the
    // request headers for further modification.

    await this.#beforeRequest(headers);

    // ### Content Type
    // For multipart uploads we let the browser set the correct boundaries.

    headers.delete("content-type");

    // ### Body

    const formData = new FormData();

    if (body !== undefined) {
      for (const key in body) {
        const entity = body[key];
        if (entity === undefined) {
          continue;
        }
        if (Array.isArray(entity)) {
          const isFileArray = entity.length > 0 && entity.every((candidate) => candidate instanceof File);
          if (isFileArray) {
            for (const file of entity) {
              formData.append(key, file, file.name);
            }
          } else {
            formData.append(key, JSON.stringify(entity));
          }
        } else {
          if (entity instanceof File) {
            formData.append(key, entity, entity.name);
          } else {
            formData.append(key, typeof entity === "string" ? entity : JSON.stringify(entity));
          }
        }
      }
      init.body = formData;
    }

    // ### Response

    return this.request(`${endpoint}${query}`, init);
  }

  /**
   * Send a fetch request using the given fetch options and returns
   * a relay formatted response.
   *
   * @param endpoint - Which endpoint to submit request to.
   * @param init     - Request init details to submit with the request.
   */
  async request(endpoint: string, init?: RequestInit): Promise<RelayResponse> {
    return this.#toResponse(await fetch(this.getUrl(endpoint), init));
  }

  /**
   * Run before request operations.
   *
   * @param headers - Headers to pass to hooks.
   */
  async #beforeRequest(headers: Headers) {
    if (this.options.hooks?.beforeRequest !== undefined) {
      for (const hook of this.options.hooks.beforeRequest) {
        await hook(headers);
      }
    }
  }

  /**
   * Convert a fetch response to a compliant relay response.
   *
   * @param response - Fetch response to convert.
   */
  async #toResponse(response: Response): Promise<RelayResponse> {
    const type = response.headers.get("content-type");

    // ### Content Type
    // Ensure that the server responds with a 'content-type' definition. We should
    // always expect the server to respond with a type.

    if (type === null) {
      return {
        result: "error",
        headers: response.headers,
        error: {
          status: response.status,
          message: "Missing 'content-type' in header returned from server.",
        },
      };
    }

    // ### Empty Response
    // If the response comes back with empty response status 204 we simply return a
    // empty success.

    if (response.status === 204) {
      return {
        result: "success",
        headers: response.headers,
        data: null,
      };
    }

    // ### SCIM
    // If the 'content-type' is of type 'scim' we need to convert the SCIM compliant
    // response to a valid relay response.

    if (type === "application/scim+json") {
      const parsed = await response.json();
      if (response.status >= 400) {
        return {
          result: "error",
          headers: response.headers,
          error: {
            status: response.status,
            message: parsed.detail,
          },
        };
      }
      return {
        result: "success",
        headers: response.headers,
        data: parsed,
      };
    }

    // ### JSON
    // If the 'content-type' contains 'json' we treat it as a 'json' compliant response
    // and attempt to resolve it as such.

    if (type.includes("json") === true) {
      const parsed = await response.json();
      if ("data" in parsed) {
        return {
          result: "success",
          headers: response.headers,
          data: parsed.data,
        };
      }
      if ("error" in parsed) {
        return {
          result: "error",
          headers: response.headers,
          error: this.#toError(parsed),
        };
      }
      return {
        result: "error",
        headers: response.headers,
        error: {
          status: response.status,
          message: "Unsupported 'json' body returned from server, missing 'data' or 'error' key.",
        },
      };
    }

    return {
      result: "error",
      headers: response.headers,
      error: {
        status: response.status,
        message: "Unsupported 'content-type' in header returned from server.",
      },
    };
  }

  #toError(candidate: unknown, status: number = 500): ServerErrorType | ServerErrorResponse["error"] {
    if (assertServerErrorResponse(candidate)) {
      return ServerError.fromJSON({ type: "relay", ...candidate.error });
    }
    if (typeof candidate === "string") {
      return {
        status,
        message: candidate,
      };
    }
    return {
      status,
      message: "Unsupported 'error' returned from server.",
    };
  }
}

export type HttpAdapterOptions = {
  url: string;
  hooks?: {
    beforeRequest?: ((headers: Headers) => Promise<void>)[];
  };
};
