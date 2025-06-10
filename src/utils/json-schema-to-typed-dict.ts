import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export interface TypedDictResult {
  definition: string;
  typingImports: Set<string>;
}

export function convertToTypedDict(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): TypedDictResult {
  const typingImports = new Set<string>(['TypedDict']);

  function flatten(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): { bases: string[]; schema: OpenAPI.SchemaObject | null } {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      return { bases: [match?.[1] ?? s.$ref], schema: null };
    }

    if ('allOf' in s && Array.isArray(s.allOf)) {
      const bases: string[] = [];
      const merged: OpenAPI.SchemaObject = { type: 'object', properties: {}, required: [] };
      for (const sub of s.allOf as Array<OpenAPI.SchemaObject | OpenAPI.ReferenceObject>) {
        const res = flatten(sub);
        bases.push(...res.bases);
        if (res.schema) {
          Object.assign(merged.properties!, res.schema.properties);
          merged.required = Array.from(new Set([...(merged.required ?? []), ...(res.schema.required ?? [])]));
        }
      }
      return { bases, schema: merged };
    }

    return { bases: [], schema: s };
  }

  function toType(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): string {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      const refName = match?.[1] ?? s.$ref;
      return `${refName}`;
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
        if (!s.items) return 'List[Any]';
        typingImports.add('List');
        return `List[${toType(s.items)}]`;
      case 'object':
        typingImports.add('Any');
        return 'dict[str, Any]';
      default:
        typingImports.add('Any');
        return 'Any';
    }
  }

  const { bases, schema: flat } = flatten(schema);

  let definition = '';
  if (flat && flat.type === 'object') {
    const props = flat.properties ?? {};
    const required = new Set(flat.required ?? []);
    const fields: string[] = [];
    const attrLines: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      const typeStr = toType(value as any);
      const desc = (value as any).description;
      if (required.has(key)) {
        typingImports.add('Required');
        fields.push(`    ${key}: Required[${typeStr}]`);
      } else {
        fields.push(`    ${key}: ${typeStr}`);
      }
      if (desc) {
        attrLines.push(`${key}: ${desc.replace(/\n/g, ' ')}`);
      }
    }
    if (fields.length === 0) {
      fields.push('    pass');
    }
    const baseList = bases.length > 0 ? `${bases.join(', ')}, ` : '';
    const header = [`class ${name}(${baseList}TypedDict, total=False):`];
    const docLines: string[] = [];
    if (flat.description) {
      docLines.push((flat.description as string).replace(/\n/g, ' '));
    }
    if (attrLines.length > 0) {
      if (flat.description) docLines.push('');
      docLines.push('Attributes:');
      for (const line of attrLines) {
        docLines.push(`    ${line}`);
      }
    }
    if (docLines.length > 0) {
      header.push(`    """\n    ${docLines.join('\n')}\n    """`);
    }
    definition = `${header.join('\n')}\n${fields.join('\n')}`;
  } else {
    const typeStr = toType(schema);
    definition = `${name} = ${typeStr}`;
    if ((schema as any).description) {
      definition += `  # ${((schema as any).description as string).replace(/\n/g, ' ')}`;
    }
  }

  return { definition, typingImports };
}
