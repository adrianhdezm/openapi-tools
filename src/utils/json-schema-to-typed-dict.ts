import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export interface TypedDictResult {
  definition: string;
  imports: Set<string>;
  typingImports: Set<string>;
}

export function convertToTypedDict(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): TypedDictResult {
  const imports = new Set<string>();
  const typingImports = new Set<string>(['TypedDict']);

  function toType(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): string {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      const refName = match?.[1] ?? s.$ref;
      imports.add(refName);
      return refName;
    }

    if (s.enum) {
      typingImports.add('Literal');
      const values = s.enum.map((v) => JSON.stringify(v)).join(', ');
      return `Literal[${values}]`;
    }

    switch (s.type) {
      case 'string':
        return 'str';
      case 'number':
        return 'float';
      case 'integer':
        return 'int';
      case 'boolean':
        return 'bool';
      case 'array':
        if (!s.items) return 'list[Any]';
        typingImports.add('list');
        return `list[${toType(s.items)}]`;
      case 'object':
        typingImports.add('Any');
        return 'dict[str, Any]';
      default:
        typingImports.add('Any');
        return 'Any';
    }
  }

  let definition = '';
  if (!('$ref' in schema) && schema.type === 'object') {
    const props = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const fields: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      const typeStr = toType(value as any);
      if (!required.has(key)) {
        typingImports.add('NotRequired');
        fields.push(`    ${key}: NotRequired[${typeStr}]`);
      } else {
        fields.push(`    ${key}: ${typeStr}`);
      }
    }
    if (fields.length === 0) {
      fields.push('    pass');
    }
    definition = `class ${name}(TypedDict):\n${fields.join('\n')}`;
  } else {
    const typeStr = toType(schema);
    definition = `${name} = ${typeStr}`;
  }

  return { definition, imports, typingImports };
}
