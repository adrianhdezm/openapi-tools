import { describe, it, expect } from 'vitest';
import { convertSchema } from '../src/utils/json-schema-to-zod';

describe('convertSchema', () => {
  it('converts enums', () => {
    const { zodString, imports } = convertSchema({
      type: 'string',
      enum: ['a', 'b']
    } as any);
    expect(zodString).toBe('z.enum(["a", "b"])');
    expect(imports.size).toBe(0);
  });

  it('converts arrays of refs', () => {
    const { zodString, imports } = convertSchema({
      type: 'array',
      items: { $ref: '#/components/schemas/User' }
    } as any);
    expect(zodString).toBe('z.array(z.lazy(() => User))');
    expect(imports.has('User')).toBe(true);
  });

  it('converts objects with optional fields', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id']
    } as any;
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
    } as any;
    const { zodString } = convertSchema(schema);
    expect(zodString).toBe('z.object({\n  id: z.string().meta({ description: "identifier" })\n})');
  });
});
