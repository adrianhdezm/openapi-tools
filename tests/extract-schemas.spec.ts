import { describe, it, expect } from 'vitest';
import { extractSchemas } from '../src/utils/extract-schemas';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

const doc: OpenAPI.Document = {
  openapi: '3.1.0',
  info: { title: 't', version: '1.0' },
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/User' } }
            }
          }
        }
      }
    },
    '/admin': {
      get: {
        responses: {
          '200': {
            description: 'ok',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Admin' } }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' }
        },
        required: ['id']
      },
      Address: {
        type: 'object',
        properties: { street: { type: 'string' } }
      },
      Admin: {
        type: 'object',
        properties: { role: { $ref: '#/components/schemas/Role' } }
      },
      Role: {
        type: 'string',
        enum: ['A', 'B']
      }
    }
  }
};

describe('extractSchemas', () => {
  it('returns all schemas when no prefixes provided', () => {
    const res = extractSchemas(doc, null);
    expect(Object.keys(res).sort()).toEqual(['Address', 'Admin', 'Role', 'User'].sort());
  });

  it('filters schemas by path prefixes recursively', () => {
    const res = extractSchemas(doc, ['/users']);
    expect(Object.keys(res).sort()).toEqual(['Address', 'User'].sort());
  });

  it('returns empty object when no paths match', () => {
    const res = extractSchemas(doc, ['/unknown']);
    expect(res).toEqual({});
  });
});
