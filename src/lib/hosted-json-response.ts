/**
 * Canonical Native JSON Body Reader and Validator for Hosted API responses.
 *
 * Implements chunked streaming UTF-8 decoding via response.body.getReader()
 * with size-limiting, standards-compliant fallback, and strict runtime
 * contract validation to prevent malformed responses from causing false-empty UI states.
 */

export const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return lower.includes('application/json') || lower.includes('+json');
}

export function parseNonJsonErrorMessage(
  status: number,
  serviceName: string = 'Customer service',
): string {
  if (status === 404) {
    return 'The hosted Customers endpoint is not available on the current deployment.';
  }
  if (status === 500) {
    return 'The hosted Customers service returned an unexpected server response.';
  }
  if (status >= 300 && status < 400) {
    return 'The hosted Customers endpoint redirected unexpectedly.';
  }
  return `${serviceName} returned an unexpected HTTP ${status} response instead of JSON.`;
}

export interface HostedJsonReadSuccess<T> {
  ok: true;
  data: T;
  bytesRead: number;
}

export interface HostedJsonReadError {
  ok: false;
  code: string;
  message: string;
  status: number;
  bytesRead?: number;
}

export type HostedJsonReadResult<T> =
  HostedJsonReadSuccess<T> | HostedJsonReadError;

/**
 * Safely reads the full body text of a Response using streaming chunk reading
 * and UTF-8 decoding. Handles multi-byte UTF-8 sequences split across chunks.
 */
export async function readResponseBodyText(
  response: Response,
  options?: {
    maxBytes?: number;
    serviceName?: string;
  },
): Promise<
  | { ok: true; text: string; bytesRead: number }
  | {
      ok: false;
      code: string;
      message: string;
      status: number;
      bytesRead: number;
    }
> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const serviceName = options?.serviceName ?? 'Customer service';
  const status = response.status;

  let totalBytes = 0;
  let text = '';

  if (response.body && typeof response.body.getReader === 'function') {
    let reader: ReadableStreamDefaultReader<Uint8Array>;
    try {
      reader = response.body.getReader();
    } catch {
      return {
        ok: false,
        code: 'HOSTED_RESPONSE_BODY_READ_ERROR',
        message: `${serviceName} failed to initialize response stream (HTTP ${status}).`,
        status,
        bytesRead: 0,
      };
    }

    const decoder = new TextDecoder('utf-8');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          text += decoder.decode(); // flush remaining bytes
          break;
        }

        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxBytes) {
            try {
              await reader.cancel();
            } catch {
              // Ignore cancellation failure
            }
            return {
              ok: false,
              code: 'HOSTED_RESPONSE_TOO_LARGE',
              message: `${serviceName} response exceeded maximum allowed size.`,
              status,
              bytesRead: totalBytes,
            };
          }
          text += decoder.decode(value, { stream: true });
        }
      }
    } catch {
      return {
        ok: false,
        code: 'HOSTED_RESPONSE_BODY_READ_ERROR',
        message: `${serviceName} failed while reading response stream (HTTP ${status}).`,
        status,
        bytesRead: totalBytes,
      };
    }
  } else if (typeof response.text === 'function') {
    try {
      text = await response.text();
      totalBytes = new TextEncoder().encode(text).byteLength;
      if (totalBytes > maxBytes) {
        return {
          ok: false,
          code: 'HOSTED_RESPONSE_TOO_LARGE',
          message: `${serviceName} response exceeded maximum allowed size.`,
          status,
          bytesRead: totalBytes,
        };
      }
    } catch {
      return {
        ok: false,
        code: 'HOSTED_RESPONSE_BODY_READ_ERROR',
        message: `${serviceName} failed to read response body (HTTP ${status}).`,
        status,
        bytesRead: 0,
      };
    }
  } else {
    return {
      ok: false,
      code: 'HOSTED_RESPONSE_BODY_READ_ERROR',
      message: `${serviceName} response body is unavailable (HTTP ${status}).`,
      status,
      bytesRead: 0,
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      code: 'HOSTED_RESPONSE_EMPTY',
      message: `${serviceName} returned an empty response (HTTP ${status}).`,
      status,
      bytesRead: totalBytes,
    };
  }

  return {
    ok: true,
    text: trimmed,
    bytesRead: totalBytes,
  };
}

export function isApiErrorEnvelope(
  value: unknown,
): value is { ok: false; code?: string; message?: string; error?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.ok === false;
}

/**
 * Reads and parses a JSON response from the hosted API, performing:
 * 1. Content-Type inspection
 * 2. Streaming chunk-by-chunk UTF-8 body consumption
 * 3. Single-pass JSON.parse()
 * 4. Error envelope extraction
 * 5. Optional runtime contract validation via type guard
 */
export async function readHostedJsonResponse<T>(
  response: Response,
  options?: {
    validator?: (data: unknown) => data is T;
    serviceName?: string;
    maxBytes?: number;
  },
): Promise<HostedJsonReadResult<T>> {
  const serviceName = options?.serviceName ?? 'Customer service';
  const status = response.status;

  const contentType = response.headers.get('content-type');
  if (!isJsonContentType(contentType)) {
    return {
      ok: false,
      code: 'HOSTED_API_NON_JSON_RESPONSE',
      message: parseNonJsonErrorMessage(status, serviceName),
      status,
    };
  }

  const bodyResult = await readResponseBodyText(response, {
    maxBytes: options?.maxBytes,
    serviceName,
  });

  if (!bodyResult.ok) {
    return bodyResult;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyResult.text);
  } catch {
    return {
      ok: false,
      code: 'HOSTED_RESPONSE_PARSE_ERROR',
      message: `${serviceName} returned an invalid JSON response (HTTP ${status}).`,
      status,
      bytesRead: bodyResult.bytesRead,
    };
  }

  // Handle explicit error envelopes (e.g. { ok: false, code: "...", message: "..." })
  if (isApiErrorEnvelope(parsed)) {
    const code =
      typeof parsed.code === 'string' && parsed.code
        ? parsed.code
        : `HTTP_${status}`;
    const message =
      typeof parsed.message === 'string' && parsed.message
        ? parsed.message
        : typeof parsed.error === 'string' && parsed.error
          ? parsed.error
          : `${serviceName} request failed with status ${status}.`;
    return {
      ok: false,
      code,
      message,
      status,
      bytesRead: bodyResult.bytesRead,
    };
  }

  // Handle HTTP error statuses that returned unexpected JSON
  if (!response.ok) {
    const errObj = (
      typeof parsed === 'object' && parsed !== null ? parsed : {}
    ) as {
      code?: unknown;
      message?: unknown;
      error?: unknown;
    };
    const code =
      typeof errObj.code === 'string' && errObj.code
        ? errObj.code
        : `HTTP_${status}`;
    const message =
      typeof errObj.message === 'string' && errObj.message
        ? errObj.message
        : typeof errObj.error === 'string' && errObj.error
          ? errObj.error
          : `${serviceName} request failed with status ${status}.`;
    return {
      ok: false,
      code,
      message,
      status,
      bytesRead: bodyResult.bytesRead,
    };
  }

  // Perform runtime type guard contract validation if provided
  if (options?.validator) {
    if (!options.validator(parsed)) {
      return {
        ok: false,
        code: 'HOSTED_RESPONSE_CONTRACT_ERROR',
        message: `${serviceName} returned an unexpected response format.`,
        status,
        bytesRead: bodyResult.bytesRead,
      };
    }
    return {
      ok: true,
      data: parsed,
      bytesRead: bodyResult.bytesRead,
    };
  }

  return {
    ok: true,
    data: parsed as T,
    bytesRead: bodyResult.bytesRead,
  };
}
