import { describe, expect, it, vi } from 'vitest';
import { failure, type Result } from '../../domain/contracts';
import { createHttpTransport, type HttpTransportOptions } from '../httpTransport';

function value<T>(r: Result<T>): T { expect(r.ok).toBe(true); if (!r.ok) throw new Error(r.error.code); return r.value; }
const decode = (payload: unknown): Result<{ id: string }> => {
  if (payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string')
    return { ok: true, value: { id: payload.id } };
  return failure('validation', 'PRIVATE decoder detail');
};
const empty = (payload: unknown): Result<void> => payload === undefined ? { ok: true, value: undefined } : failure('validation', 'Unexpected body');
function setup(response: Response = new Response('{"id":"synthetic"}', { status: 200 })) {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => response);
  return { fetch, transport: value(createHttpTransport({ baseUrl: 'https://service.example.test/api/', fetch })) };
}

describe('HTTP transport lifecycle - BU-026, NFR-21, Q17 (fake fetch, no Express integration)', () => {
  it('validates and projects successful JSON, strips unknown credentials through the endpoint decoder', async () => {
    const { transport, fetch } = setup(new Response('{"id":"synthetic","passwordHash":"PRIVATE"}', { status: 200 }));
    expect(await transport.request({ path: 'resource', decode })).toEqual({ ok: true, value: { id: 'synthetic' } });
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toBe('https://service.example.test/api/resource');
    const init = fetch.mock.calls[0][1]; expect(init.credentials).toBe('omit'); expect(init.redirect).toBe('error');
    expect(new Headers(init.headers).get('Accept')).toBe('application/json');
  });
  it.each([200, 204])('accepts an explicitly permitted empty response, status %s', async (status) => {
    const { transport } = setup(new Response(null, { status })); expect(await transport.request({ path: 'resource', decode: empty })).toEqual({ ok: true, value: undefined });
  });
  it('rejects empty response when the endpoint requires a payload', async () => {
    const { transport } = setup(new Response(null, { status: 204 })); expect(await transport.request({ path: 'resource', decode })).toMatchObject({ ok: false, error: { code: 'invalid-response' } });
  });
  it.each([[400, 'validation'], [422, 'validation'], [401, 'unauthenticated'], [403, 'forbidden'], [404, 'not-found'], [409, 'conflict'], [429, 'http-failed'], [500, 'server-error'], [503, 'server-error'], [302, 'http-failed']] as const)
  ('maps HTTP %s to %s without exposing the error payload or decoding it', async (status, code) => {
    const { transport, fetch } = setup(new Response('PRIVATE exception and account payload', { status })); const decoder = vi.fn(decode);
    const result = await transport.request({ path: 'resource', decode: decoder }); expect(result).toMatchObject({ ok: false, error: { code } });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|account payload/); expect(decoder).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(['{broken', '<html>private page</html>', 'undefined'])('rejects invalid JSON %j', async (raw) => {
    const { transport } = setup(new Response(raw)); expect(await transport.request({ path: 'resource', decode })).toMatchObject({ ok: false, error: { code: 'invalid-response' } });
  });
  it.each(['{}', 'null', '[]', '{"id":19}'])('rejects an unexpected response shape %s', async (raw) => {
    const { transport } = setup(new Response(raw)); const result = await transport.request({ path: 'resource', decode });
    expect(result).toMatchObject({ ok: false, error: { code: 'invalid-response' } }); expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
  it('sanitizes a throwing decoder', async () => {
    const { transport } = setup(); expect(await transport.request({ path: 'resource', decode: () => { throw new Error('PRIVATE'); } }))
      .toEqual(failure('invalid-response', 'The response could not be verified. Please try again.'));
  });
  it('maps network exceptions and does not retry a mutation', async () => {
    const fetch = vi.fn(async () => { throw new TypeError('PRIVATE network detail'); });
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test/api', fetch }));
    const result = await transport.request({ path: 'resource', method: 'POST', body: { name: 'Synthetic' }, decode });
    expect(result).toEqual(failure('network-failed', 'The service could not be reached. Please try again.', true)); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not retry server-failed non-idempotent mutations', async () => {
    const { transport, fetch } = setup(new Response('private', { status: 503 }));
    expect((await transport.request({ path: 'resource', method: 'POST', body: { enabled: false, count: 0, text: '', nullable: null }, decode })).ok).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1); expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({ enabled: false, count: 0, text: '', nullable: null });
  });
  it('supports an explicit authentication hook without assuming JWT/cookies or mutating its headers', async () => {
    const headers = new Headers({ 'X-Synthetic-Session': 'fixture-only' }); const authentication = vi.fn(() => ({ headers, credentials: 'include' as const }));
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => new Response('{"id":"ok"}'));
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch, authentication }));
    value(await transport.request({ path: 'resource', decode })); expect(authentication).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].credentials).toBe('include'); expect(new Headers(fetch.mock.calls[0][1].headers).get('X-Synthetic-Session')).toBe('fixture-only');
    expect(headers.has('Accept')).toBe(false);
  });
  it('sanitizes a failed authentication hook before fetching', async () => {
    const fetch = vi.fn(); const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch,
      authentication: () => { throw new Error('PRIVATE token failure'); } }));
    expect(await transport.request({ path: 'resource', decode })).toEqual(failure('unauthenticated', 'Please sign in to continue.')); expect(fetch).not.toHaveBeenCalled();
  });
  it('cancels before starting authentication/fetch', async () => {
    const controller = new AbortController(); controller.abort(); const fetch = vi.fn(), authentication = vi.fn();
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch, authentication }));
    expect(await transport.request({ path: 'resource', signal: controller.signal, decode })).toMatchObject({ ok: false, error: { code: 'request-cancelled' } });
    expect(fetch).not.toHaveBeenCalled(); expect(authentication).not.toHaveBeenCalled();
  });
  it('forwards cancellation to fetch and returns cancelled rather than network failure', async () => {
    const controller = new AbortController(); let entered: (() => void) | undefined;
    const started = new Promise<void>((resolve) => { entered = resolve; });
    const fetch: NonNullable<HttpTransportOptions['fetch']> = async (_url, init) => {
      entered?.(); return new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('Synthetic', 'AbortError')), { once: true }));
    };
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch }));
    const request = transport.request({ path: 'resource', signal: controller.signal, decode }); await started; controller.abort();
    expect(await request).toMatchObject({ ok: false, error: { code: 'request-cancelled' } });
  });
  it('discards late successful data when a transport ignores cancellation', async () => {
    const controller = new AbortController(); let complete: ((response: Response) => void) | undefined;
    let entered: (() => void) | undefined; const started = new Promise<void>((resolve) => { entered = resolve; });
    const fetch = vi.fn(() => { entered?.(); return new Promise<Response>((resolve) => { complete = resolve; }); });
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch })); const decoder = vi.fn(decode);
    const request = transport.request({ path: 'resource', signal: controller.signal, decode: decoder }); await started; controller.abort(); complete?.(new Response('{"id":"late"}'));
    expect(await request).toMatchObject({ ok: false, error: { code: 'request-cancelled' } }); expect(decoder).not.toHaveBeenCalled();
  });
  it('cancels while authentication is pending without starting fetch', async () => {
    const controller = new AbortController(); let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => { release = resolve; }); const fetch = vi.fn();
    const transport = value(createHttpTransport({ baseUrl: 'https://service.example.test', fetch, authentication: async () => { await waiting; return {}; } }));
    const request = transport.request({ path: 'resource', signal: controller.signal, decode }); controller.abort(); release?.();
    expect(await request).toMatchObject({ ok: false, error: { code: 'request-cancelled' } }); expect(fetch).not.toHaveBeenCalled();
  });
  it('discards an aborted response body and never decodes its late payload', async () => {
    const controller = new AbortController(); let release: ((body: string) => void) | undefined; let entered: (() => void) | undefined;
    const started = new Promise<void>((resolve) => { entered = resolve; }); const response = new Response(null);
    response.text = async () => { entered?.(); return new Promise<string>((resolve) => { release = resolve; }); };
    const { transport } = setup(response); const decoder = vi.fn(decode);
    const request = transport.request({ path: 'resource', signal: controller.signal, decode: decoder }); await started; controller.abort(); release?.('{"id":"late private"}');
    expect(await request).toMatchObject({ ok: false, error: { code: 'request-cancelled' } }); expect(decoder).not.toHaveBeenCalled();
  });
  it.each(['file:///private', 'https://user:secret@service.example.test/', 'https://service.example.test/?token=private', 'not a URL'])('rejects invalid/credential-bearing base %j', (baseUrl) => {
    expect(createHttpTransport({ baseUrl })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
  it.each(['https://other.example.test/private', '//other.example.test/private', '../outside', '\\outside', 'resource#secret', ''])('rejects escaping/malformed resource %j before authentication or fetching', async (path) => {
    const { transport, fetch } = setup(); expect(await transport.request({ path, decode })).toMatchObject({ ok: false, error: { code: 'validation' } }); expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the configured base path for a leading-slash resource and query', async () => {
    const { transport, fetch } = setup(); value(await transport.request({ path: '/resource?page=2', decode })); expect(fetch.mock.calls[0][0]).toBe('https://service.example.test/api/resource?page=2');
  });
  it('rejects unsupported custom serialization before fetching and does not call the hook', async () => {
    const { transport, fetch } = setup(); const body = { mustPreserve: 'meaningful' }; const hook = vi.fn(() => ({})); Object.defineProperty(body, 'toJSON', { value: hook });
    expect(await transport.request({ path: 'resource', method: 'POST', body, decode })).toMatchObject({ ok: false, error: { code: 'serialization-failed' } });
    expect(hook).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects a GET body instead of attempting an unsafe request', async () => {
    const { transport, fetch } = setup(); expect(await transport.request({ path: 'resource', body: {}, decode })).toMatchObject({ ok: false, error: { code: 'validation' } }); expect(fetch).not.toHaveBeenCalled();
  });
});
