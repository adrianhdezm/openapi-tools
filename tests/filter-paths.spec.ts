import { describe, it, expect } from 'vitest';
import { filterOpenApiPaths } from '../src/utils/filter-paths';

const openApiDoc = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/v1/chat/completions': { post: { summary: 'Chat' } },
    '/v1/models': { get: { summary: 'Models' } },
    '/v1/other': { get: { summary: 'Other' } }
  }
};

describe('filterOpenApiPaths', () => {
  it('filters by a single path', () => {
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/v1/models']);
    expect(filtered.paths).toHaveProperty('/v1/models');
    expect(filtered.paths).not.toHaveProperty('/v1/chat/completions');
    expect(filtered.paths).not.toHaveProperty('/v1/other');
  });

  it('filters by multiple paths', () => {
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/v1/models', '/v1/chat/completions']);
    expect(filtered.paths).toHaveProperty('/v1/models');
    expect(filtered.paths).toHaveProperty('/v1/chat/completions');
    expect(filtered.paths).not.toHaveProperty('/v1/other');
  });

  it('returns the original document if none match', () => {
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/notfound']);
    // Should return the original doc if no paths matched
    expect(filtered).toEqual(openApiDoc);
  });
});
