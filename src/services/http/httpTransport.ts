import { failure, type DomainErrorCode, type Result } from '../domain/contracts';
import type { JsonValue } from '../../types/common';
import { serializeSnapshot } from '../storage/snapshotCodec';

export interface HttpRequest<T> {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: JsonValue;
  signal?: AbortSignal;
  // The future endpoint adapter must validate AND project a DTO. Undefined
  // denotes an empty body; the decoder decides whether that is permitted.
  decode: (payload: unknown) => Result<T>;
}
export interface HttpTransport { request<T>(request: HttpRequest<T>): Promise<Result<T>> }
export interface HttpTransportOptions {
  baseUrl: string;
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  authentication?: (signal?: AbortSignal) => Pick<RequestInit, 'headers' | 'credentials'> |
    Promise<Pick<RequestInit, 'headers' | 'credentials'>>;
}
const cancelled = () => failure('request-cancelled', 'This request was cancelled.');
const invalidResponse = () => failure('invalid-response', 'The response could not be verified. Please try again.');
function httpError(status: number): Result<never> {
  let code: DomainErrorCode = 'http-failed';
  if (status === 400 || status === 422) code = 'validation';
  if (status === 401) code = 'unauthenticated';
  if (status === 403) code = 'forbidden';
  if (status === 404) code = 'not-found';
  if (status === 409) code = 'conflict';
  if (status >= 500) code = 'server-error';
  const messages: Partial<Record<DomainErrorCode, string>> = {
    validation: 'Check the supplied information and try again.', unauthenticated: 'Please sign in to continue.',
    forbidden: 'You do not have permission to perform this action.', 'not-found': 'This item is unavailable.',
    conflict: 'This information has changed. Refresh before trying again.',
  };
  return failure(code, messages[code] ?? 'The request could not be completed. Please try again.', status >= 500 || status === 429);
}

/** No endpoints, tokens, cookie scheme, retries or runtime activation. */
export function createHttpTransport(options: HttpTransportOptions): Result<HttpTransport> {
  let base: URL;
  try {
    base = new URL(options.baseUrl);
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
    if (!base.pathname.endsWith('/')) base.pathname += '/';
  } catch { return failure('validation', 'A valid service address is required.'); }
  return { ok: true, value: {
    async request<T>(request: HttpRequest<T>): Promise<Result<T>> {
      if (request.signal?.aborted) return cancelled();
      let url: URL;
      try {
        if (!request.path || request.path.startsWith('//') || request.path.includes('\\') || /^[a-z][a-z0-9+.-]*:/i.test(request.path)) throw new Error();
        url = new URL(request.path.replace(/^\//, ''), base);
        if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.hash || url.username || url.password) throw new Error();
      } catch { return failure('validation', 'A valid service resource is required.'); }
      const method = request.method ?? 'GET';
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || (method === 'GET' && request.body !== undefined))
        return failure('validation', 'This request could not be prepared.');
      let body: string | undefined;
      if (request.body !== undefined) {
        // Reuse the accepted descriptor-safe plain-JSON boundary instead of
        // implementing a second serializer that could execute custom toJSON.
        const serialized = serializeSnapshot(request.body); if (!serialized.ok) return serialized;
        body = serialized.value;
      }
      let auth: Pick<RequestInit, 'headers' | 'credentials'>;
      try { auth = await options.authentication?.(request.signal) ?? {}; }
      catch { return request.signal?.aborted ? cancelled() : failure('unauthenticated', 'Please sign in to continue.'); }
      if (request.signal?.aborted) return cancelled();
      try {
        const headers = new Headers(auth.headers); headers.set('Accept', 'application/json');
        if (body !== undefined) headers.set('Content-Type', 'application/json');
        const response = await (options.fetch ?? globalThis.fetch)(url.href, {
          method, headers, body, credentials: auth.credentials ?? 'omit', signal: request.signal, redirect: 'error',
        });
        if (request.signal?.aborted) return cancelled();
        if (!response.ok) return httpError(response.status);
        const raw = await response.text();
        if (request.signal?.aborted) return cancelled();
        let payload: unknown;
        try { payload = raw.trim() === '' ? undefined : JSON.parse(raw); }
        catch { return invalidResponse(); }
        let decoded: Result<T>;
        try { decoded = request.decode(payload); } catch { return invalidResponse(); }
        if (request.signal?.aborted) return cancelled();
        // Endpoint schema diagnostics are private to the adapter; never forward
        // an arbitrary decoder message or server payload as user-facing copy.
        return decoded.ok ? decoded : invalidResponse();
      } catch (error) {
        if (request.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return cancelled();
        return failure('network-failed', 'The service could not be reached. Please try again.', true);
      }
    },
  } };
}
