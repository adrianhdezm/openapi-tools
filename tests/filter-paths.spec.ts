import { describe, it, expect, vi } from 'vitest';
import { filterOpenApiPaths } from '../src/utils/filter-openapi-paths';

const openApiDoc = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/v1/chat/completions': {
      post: {
        summary: 'Chat',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatResponse' }
              }
            }
          }
        }
      }
    },
    '/v1/models': {
      get: {
        summary: 'Models',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ModelList' }
              }
            }
          }
        }
      }
    },
    '/v1/other': {
      get: {
        summary: 'Other',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Other' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ChatRequest: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      ChatResponse: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          meta: { $ref: '#/components/schemas/Meta' }
        }
      },
      ModelList: {
        type: 'array',
        items: { $ref: '#/components/schemas/Model' }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      Meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string' }
        }
      },
      Model: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      Other: {
        type: 'object',
        properties: {
          foo: { type: 'string' }
        }
      }
    }
  }
};

describe('filterOpenApiPaths', () => {
  it('filters by a single path and includes only referenced schemas', () => {
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/v1/models']);
    expect(filtered.paths).toHaveProperty('/v1/models');
    expect(filtered.paths).not.toHaveProperty('/v1/chat/completions');
    expect(filtered.paths).not.toHaveProperty('/v1/other');
    // Should include only ModelList and Model schemas
    expect(Object.keys(filtered.components!.schemas!)).toEqual(['ModelList', 'Model']);
  });

  it('filters by multiple paths and includes all referenced schemas recursively', () => {
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/v1/chat/completions', '/v1/models']);
    expect(filtered.paths).toHaveProperty('/v1/chat/completions');
    expect(filtered.paths).toHaveProperty('/v1/models');
    expect(filtered.paths).not.toHaveProperty('/v1/other');
    // Should include all schemas referenced by both paths, recursively
    expect(Object.keys(filtered.components!.schemas!).sort()).toEqual(
      ['ChatRequest', 'ChatResponse', 'Meta', 'Model', 'ModelList', 'User'].sort()
    );
  });

  it('returns the original document if none match', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const filtered = filterOpenApiPaths(openApiDoc as any, ['/notfound']);
    // Should return the original doc if no paths matched
    expect(filtered).toEqual(openApiDoc);
    expect(warnSpy).toHaveBeenCalledWith('\x1b[33m[openapi-tools] Warning:\x1b[0m Path "/notfound" not found in the OpenAPI spec.');
    warnSpy.mockRestore();
  });
});
