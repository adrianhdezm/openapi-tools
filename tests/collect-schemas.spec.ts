import { describe, it, expect } from 'vitest';
import { collectSchemas } from '../src/utils/collect-schemas';
import { collectSchemaRefs } from '../src/utils/collect-schema-refs';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

const doc: OpenAPI.Document = {
  openapi: '3.1.0',
  info: { title: 't', version: '1.0' },
  paths: {},
  components: {
    schemas: {
      A: { type: 'object', properties: { b: { $ref: '#/components/schemas/B' } } },
      B: { type: 'object', properties: { c: { $ref: '#/components/schemas/C' } } },
      C: { type: 'string' }
    }
  }
};

describe('collectSchemas', () => {
  it('collects schemas recursively from refs', () => {
    const refs = new Set<string>();
    collectSchemaRefs({ $ref: '#/components/schemas/A' }, refs);
    const result = collectSchemas(doc, refs);
    expect(Object.keys(result).sort()).toEqual(['A', 'B', 'C']);
  });

  it('returns empty object when refs empty', () => {
    const result = collectSchemas(doc, new Set());
    expect(result).toEqual({});
  });
});
