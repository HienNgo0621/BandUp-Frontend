import { failure, type DomainRepositories, type Result } from '../domain/contracts';
import type { HttpTransport } from '../http/httpTransport';
import { createMockRepositories, type MockRepositoryOptions } from './mockRepositories';

export type ProviderConfiguration = { kind: 'mock'; options: MockRepositoryOptions } | {
  kind: 'express'; transport: HttpTransport;
  // Supplied only after Express DTOs, auth and routes have been confirmed.
  connect?: (transport: HttpTransport) => Result<DomainRepositories>;
};
export function selectRepositories(configuration: ProviderConfiguration): Result<DomainRepositories> {
  if (configuration.kind === 'mock') return { ok: true, value: createMockRepositories(configuration.options) };
  if (!configuration.connect) return failure('unsupported', 'The service connection is not available yet.');
  try { return configuration.connect(configuration.transport); }
  catch { return failure('not-ready', 'The service connection could not be prepared.'); }
}
