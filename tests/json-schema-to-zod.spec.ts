import { describe, it, expect } from 'vitest';
import { convertSchema } from '../src/utils/json-schema-to-zod';
import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

describe('convertSchema', () => {
  it('converts enums', () => {
    const { zodString, imports } = convertSchema({
      type: 'string',
      enum: ['a', 'b']
    } as OpenAPI.SchemaObject);
    expect(zodString).toBe('z.enum(["a", "b"])');
    expect(imports.size).toBe(0);
  });

  it('converts arrays of refs', () => {
    const { zodString, imports } = convertSchema({
      type: 'array',
      items: { $ref: '#/components/schemas/User' }
    } as OpenAPI.SchemaObject);
    expect(zodString).toBe('z.array(User)');
    expect(imports.has('User')).toBe(true);
  });

  it('converts objects with optional fields', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id']
    } as OpenAPI.SchemaObject;
    const { zodString } = convertSchema(schema);
    expect(zodString).toBe('z.object({\n  id: z.string(),\n  name: z.string().optional()\n})');
  });

  it('adds descriptions as meta', () => {
    const schema = {
      type: 'object',
      description: 'User object',
      properties: {
        id: { type: 'string', description: 'identifier' }
      },
      required: ['id']
    } as OpenAPI.SchemaObject;
    const { zodString } = convertSchema(schema);
    expect(zodString).toBe('z.object({\n  id: z.string().meta({ description: "identifier" })\n})');
  });

  it('handles allOf with refs and properties', () => {
    const schema = {
      allOf: [{ $ref: '#/components/schemas/Base' }, { type: 'object', properties: { extra: { type: 'string' } }, required: ['extra'] }]
    } as OpenAPI.SchemaObject;
    const { zodString, imports } = convertSchema(schema);
    expect(zodString).toBe('z.intersection(Base, z.object({\n  extra: z.string()\n}))');
    expect(imports.has('Base')).toBe(true);
  });

  it('converts inline object properties', () => {
    const schema = {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            flag: { type: 'boolean' }
          },
          required: ['id']
        }
      },
      required: ['data']
    } as OpenAPI.SchemaObject;
    const { zodString } = convertSchema(schema);
    expect(zodString).toBe('z.object({\n  data: z.object({\n  id: z.string(),\n  flag: z.boolean().optional()\n})\n})');
  });
});
