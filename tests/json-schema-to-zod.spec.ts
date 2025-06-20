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
    expect(zodString).toBe('z.array(userSchema)');
    expect(imports.has('userSchema')).toBe(true);
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
    expect(zodString).toBe('z.intersection(baseSchema, z.object({\n  extra: z.string()\n}))');
    expect(imports.has('baseSchema')).toBe(true);
  });

  it('handles oneOf with refs', () => {
    const schema = {
      oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }]
    } as OpenAPI.SchemaObject;
    const { zodString, imports } = convertSchema(schema);
    expect(zodString).toBe('z.union([aSchema, bSchema])');
    expect(imports.has('aSchema')).toBe(true);
    expect(imports.has('bSchema')).toBe(true);
  });

  it('handles oneOf with a single ref', () => {
    const schema = {
      oneOf: [{ $ref: '#/components/schemas/A' }]
    } as OpenAPI.SchemaObject;
    const { zodString, imports } = convertSchema(schema);
    expect(zodString).toBe('aSchema');
    expect(imports.has('aSchema')).toBe(true);
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

  it('converts objects with additional properties', () => {
    const schema = {
      type: 'object',
      properties: {
        logit_bias: {
          type: 'object',
          additionalProperties: { type: 'integer' }
        },
        metadata: {
          type: 'object',
          additionalProperties: { type: 'string' }
        }
      }
    } as OpenAPI.SchemaObject;
    const { zodString } = convertSchema(schema);
    expect(zodString).toBe('z.object({\n  logit_bias: z.record(z.number()).optional(),\n  metadata: z.record(z.string()).optional()\n})');
  });
});
