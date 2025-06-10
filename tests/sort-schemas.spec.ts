import { describe, it, expect } from 'vitest';
import { sortSchemas } from '../src/utils/sort-schemas';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

const schemas: Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> = {
  User: {
    type: 'object',
    properties: { address: { $ref: '#/components/schemas/Address' } },
    required: ['address']
  },
  Address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] }
};

describe('sortSchemas', () => {
  it('orders schemas so dependencies come first', () => {
    const order = sortSchemas(schemas);
    expect(order.indexOf('Address')).toBeLessThan(order.indexOf('User'));
  });
});
