import { describe, expect, it } from 'vitest';
import {
  readHostedJsonResponse,
  readResponseBodyText,
  isJsonContentType,
  parseNonJsonErrorMessage,
} from '../src/lib/hosted-json-response';

function createStreamResponse(
  chunks: (Uint8Array | string)[],
  options?: {
    status?: number;
    contentType?: string;
  },
): Response {
  const encoder = new TextEncoder();
  const byteChunks: Uint8Array[] = chunks.map((c) =>
    typeof c === 'string' ? encoder.encode(c) : c,
  );

  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < byteChunks.length) {
        controller.enqueue(byteChunks[index++]);
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: options?.status ?? 200,
    headers: {
      'content-type': options?.contentType ?? 'application/json; charset=utf-8',
    },
  });
}

describe('hosted-json-response', () => {
  describe('isJsonContentType', () => {
    it('returns true for standard json content types', () => {
      expect(isJsonContentType('application/json')).toBe(true);
      expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
      expect(isJsonContentType('application/problem+json')).toBe(true);
    });

    it('returns false for null, empty, or HTML/text content types', () => {
      expect(isJsonContentType(null)).toBe(false);
      expect(isJsonContentType('')).toBe(false);
      expect(isJsonContentType('text/html; charset=utf-8')).toBe(false);
      expect(isJsonContentType('text/plain')).toBe(false);
    });
  });

  describe('parseNonJsonErrorMessage', () => {
    it('returns specific messages for 404, 500, and 3xx redirects without exposing raw body', () => {
      expect(parseNonJsonErrorMessage(404)).toContain('not available');
      expect(parseNonJsonErrorMessage(500)).toContain(
        'unexpected server response',
      );
      expect(parseNonJsonErrorMessage(308)).toContain('redirected');
      expect(parseNonJsonErrorMessage(502)).toContain('HTTP 502');
    });
  });

  describe('readResponseBodyText', () => {
    it('streams multiple chunks into a single decoded string', async () => {
      const response = createStreamResponse([
        '{"ok":',
        ' true,',
        ' "count": 42}',
      ]);
      const res = await readResponseBodyText(response);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.text).toBe('{"ok": true, "count": 42}');
        expect(res.bytesRead).toBeGreaterThan(0);
      }
    });

    it('handles UTF-8 multi-byte characters split across chunks seamlessly', async () => {
      // "María" -> 'M', 'a', 'r', (0xC3, 0xAD), 'a'
      // Split 0xC3 into chunk 1 and 0xAD into chunk 2
      const chunk1 = new Uint8Array([
        0x7b, 0x22, 0x6e, 0x61, 0x6d, 0x65, 0x22, 0x3a, 0x22, 0x4d, 0x61, 0x72,
        0xc3,
      ]);
      const chunk2 = new Uint8Array([0xad, 0x61, 0x22, 0x7d]);

      const response = createStreamResponse([chunk1, chunk2]);
      const res = await readResponseBodyText(response);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.text).toBe('{"name":"María"}');
      }
    });

    it('rejects responses exceeding maxBytes with HOSTED_RESPONSE_TOO_LARGE', async () => {
      const response = createStreamResponse(['a'.repeat(200)], { status: 200 });
      const res = await readResponseBodyText(response, { maxBytes: 100 });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('HOSTED_RESPONSE_TOO_LARGE');
        expect(res.message).toContain('exceeded maximum allowed size');
      }
    });

    it('returns HOSTED_RESPONSE_EMPTY when body is empty or whitespace', async () => {
      const response = createStreamResponse(['   ', '']);
      const res = await readResponseBodyText(response);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('HOSTED_RESPONSE_EMPTY');
      }
    });
  });

  describe('readHostedJsonResponse', () => {
    it('returns HOSTED_API_NON_JSON_RESPONSE if content-type is not JSON', async () => {
      const response = new Response('<html>404 Not Found</html>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      });
      const res = await readHostedJsonResponse(response);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('HOSTED_API_NON_JSON_RESPONSE');
        expect(res.message).not.toContain('<html>');
      }
    });

    it('returns HOSTED_RESPONSE_PARSE_ERROR when JSON syntax is invalid', async () => {
      const response = createStreamResponse(['{"incomplete": true, ']);
      const res = await readHostedJsonResponse(response);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('HOSTED_RESPONSE_PARSE_ERROR');
        expect(res.message).toContain('invalid JSON response');
      }
    });

    it('returns error when API error envelope { ok: false, code, message } is received', async () => {
      const response = createStreamResponse([
        JSON.stringify({
          ok: false,
          code: 'UNAUTHORIZED_BRANCH',
          message: 'Branch access not allowed.',
        }),
      ]);
      const res = await readHostedJsonResponse(response);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('UNAUTHORIZED_BRANCH');
        expect(res.message).toBe('Branch access not allowed.');
      }
    });

    it('returns HOSTED_RESPONSE_CONTRACT_ERROR when validator fails', async () => {
      const response = createStreamResponse([
        JSON.stringify({
          ok: true,
          unexpectedKey: 123,
        }),
      ]);
      const validator = (
        data: unknown,
      ): data is { ok: true; requiredField: string } => {
        return (
          typeof data === 'object' &&
          data !== null &&
          typeof (data as Record<string, unknown>).requiredField === 'string'
        );
      };

      const res = await readHostedJsonResponse(response, { validator });
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe('HOSTED_RESPONSE_CONTRACT_ERROR');
        expect(res.message).toBe(
          'Customer service returned an unexpected response format.',
        );
      }
    });

    it('returns parsed data on valid contract success', async () => {
      const payload = { ok: true, score: 99 };
      const response = createStreamResponse([JSON.stringify(payload)]);
      const validator = (data: unknown): data is typeof payload => {
        return (
          typeof data === 'object' &&
          data !== null &&
          (data as { ok: boolean }).ok === true
        );
      };

      const res = await readHostedJsonResponse(response, { validator });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual(payload);
      }
    });
  });
});
