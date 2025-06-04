import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export interface ZodResult {
  zodString: string;
  imports: Set<string>;
}

export function convertSchema(schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): ZodResult {
  const imports = new Set<string>();

  function walk(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): string {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      const name = match ? match[1] : s.$ref;
      imports.add(name);
      return `z.lazy(() => ${name})`;
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
        const props = s.properties ?? {};
        const required = new Set(s.required ?? []);
        const fields = Object.entries(props).map(([key, value]) => {
          let expr = walk(value as any);
          if (!required.has(key)) {
            expr += '.optional()';
          }
          return `${JSON.stringify(key)}: ${expr}`;
        });
        return `z.object({ ${fields.join(', ')} })`;
      }
    }
  }

  const zodString = walk(schema);
  imports.delete('');
  imports.delete((schema as any).title as string); // not needed
  return { zodString, imports };
}
