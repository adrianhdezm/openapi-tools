import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { toCamelCase } from './case.js';

export interface ZodResult {
  zodString: string;
  imports: Set<string>;
}

export function convertSchema(schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): ZodResult {
  const imports = new Set<string>();

  function walk(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): string {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      const raw = match?.[1] ?? s.$ref;
      const name = `${toCamelCase(raw)}Schema`;
      imports.add(name);
      return name;
    }

    if ('allOf' in s && Array.isArray(s.allOf)) {
      const items = s.allOf as Array<OpenAPI.SchemaObject | OpenAPI.ReferenceObject>;
      if (items.length === 0) {
        return 'z.any()';
      }
      let expr = walk(items[0]!);
      for (const sub of items.slice(1)) {
        expr = `z.intersection(${expr}, ${walk(sub)})`;
      }
      return expr;
    }

    if ('oneOf' in s && Array.isArray(s.oneOf)) {
      const items = s.oneOf as Array<OpenAPI.SchemaObject | OpenAPI.ReferenceObject>;
      if (items.length === 0) {
        return 'z.any()';
      }
      if (items.length === 1) {
        return walk(items[0]!);
      }
      const parts = items.map((sub) => walk(sub)).join(', ');
      return `z.union([${parts}])`;
    }

    if ('anyOf' in s && Array.isArray(s.anyOf)) {
      const items = s.anyOf as Array<OpenAPI.SchemaObject | OpenAPI.ReferenceObject>;
      if (items.length === 0) {
        return 'z.any()';
      }
      if (items.length === 1) {
        return walk(items[0]!);
      }
      const parts = items.map((sub) => walk(sub)).join(', ');
      return `z.union([${parts}])`;
    }

    if (s.enum) {
      const values = s.enum.map((v) => JSON.stringify(v)).join(', ');
      return `z.enum([${values}])`;
    }

    switch (s.type) {
      case 'string':
        return 'z.string()';
      case 'number':
      case 'integer':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'array':
        if (!s.items) return 'z.array(z.any())';
        return `z.array(${walk(s.items)})`;
      case 'object':
      default: {
        const hasProps = s.properties && Object.keys(s.properties).length > 0;
        if (!hasProps && typeof s.additionalProperties === 'object') {
          return `z.record(${walk(s.additionalProperties as any)})`;
        }
        const props = s.properties ?? {};
        const required = new Set(s.required ?? []);
        const fields = Object.entries(props).map(([key, value]) => {
          let expr = walk(value as any);
          if (!required.has(key)) {
            expr += '.optional()';
          }
          const desc = (value as any).description;
          const meta = desc ? `.meta({ description: ${JSON.stringify(desc.replace(/\n/g, ' '))} })` : '';
          return `${key}: ${expr}${meta}`;
        });
        const inner = fields.map((f) => `  ${f}`).join(',\n');
        return `z.object({\n${inner}\n})`;
      }
    }
  }

  const zodString = walk(schema);
  imports.delete('');
  imports.delete((schema as any).title as string); // not needed
  return { zodString, imports };
}
