import { describe, it, expect } from 'vitest';
import { collectSchemaRefs } from '../src/utils/filter-paths';

describe('collectSchemaRefs', () => {
  it('collects a single $ref', () => {
    const obj = { $ref: '#/components/schemas/Foo' };
    const refs = collectSchemaRefs(obj);
    expect(refs.has('Foo')).toBe(true);
    expect(refs.size).toBe(1);
  });

  it('collects multiple $refs at root and nested', () => {
    const obj = {
      $ref: '#/components/schemas/Foo',
      properties: {
        bar: { $ref: '#/components/schemas/Bar' },
        baz: {
          type: 'object',
          properties: {
            qux: { $ref: '#/components/schemas/Qux' }
          }
        }
      }
    };
    const refs = collectSchemaRefs(obj);
    expect(refs.has('Foo')).toBe(true);
    expect(refs.has('Bar')).toBe(true);
    expect(refs.has('Qux')).toBe(true);
    expect(refs.size).toBe(3);
  });

  it('ignores non-schema $refs', () => {
    const obj = {
      $ref: '#/components/parameters/Param',
      properties: {
        foo: { $ref: '#/components/schemas/Foo' }
      }
    };
    const refs = collectSchemaRefs(obj);
    expect(refs.has('Foo')).toBe(true);
    expect(refs.has('Param')).toBe(false);
    expect(refs.size).toBe(1);
  });

  it('handles arrays of objects with $refs', () => {
    const obj = {
      allOf: [{ $ref: '#/components/schemas/Foo' }, { $ref: '#/components/schemas/Bar' }],
      properties: {
        nested: {
          anyOf: [{ $ref: '#/components/schemas/Baz' }]
        }
      }
    };
    const refs = collectSchemaRefs(obj);
    expect(refs.has('Foo')).toBe(true);
    expect(refs.has('Bar')).toBe(true);
    expect(refs.has('Baz')).toBe(true);
    expect(refs.size).toBe(3);
  });

  it('handles duplicate $refs gracefully', () => {
    const obj = {
      $ref: '#/components/schemas/Foo',
      properties: {
        foo: { $ref: '#/components/schemas/Foo' },
        bar: { $ref: '#/components/schemas/Bar' },
        arr: [{ $ref: '#/components/schemas/Foo' }, { $ref: '#/components/schemas/Bar' }]
      }
    };
    const refs = collectSchemaRefs(obj);
    expect(refs.has('Foo')).toBe(true);
    expect(refs.has('Bar')).toBe(true);
    expect(refs.size).toBe(2);
  });
});
