import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export interface TypedDictResult {
  definition: string;
  typingImports: Set<string>;
}

export function convertToTypedDict(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): TypedDictResult {
  const typingImports = new Set<string>(['TypedDict']);
  const extraDefs: string[] = [];

  function toPascal(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
  }

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

  function buildClass(className: string, s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): void {
    const { bases, schema: flat } = flatten(s);
    if (!flat || flat.type !== 'object') {
      return;
    }
    const props = flat.properties ?? {};
    const required = new Set(flat.required ?? []);
    const fields: string[] = [];
    const attrLines: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      const typeStr = toType(value as any, `${className}${toPascal(key)}`);
      const desc = (value as any).description;
      if (required.has(key)) {
        typingImports.add('Required');
        fields.push(`    ${key}: Required[${typeStr}]`);
      } else {
        fields.push(`    ${key}: ${typeStr}`);
      }
      if (desc) {
        const descLines = String(desc).split('\n');
        attrLines.push(`${key}:`);
        for (const dl of descLines) {
          attrLines.push(`    ${dl}`);
        }
        attrLines.push('');
      }
    }
    if (fields.length === 0) {
      fields.push('    pass');
    }
    const baseList = bases.length > 0 ? `${bases.join(', ')}, ` : '';
    const header = [`class ${className}(${baseList}TypedDict, total=False):`];
    const docLines: string[] = [];
    if (flat.description) {
      docLines.push((flat.description as string).replace(/\n/g, ' '));
    }
    if (attrLines.length > 0) {
      if (attrLines[attrLines.length - 1] === '') attrLines.pop();
      if (flat.description) docLines.push('');
      docLines.push('Attributes:');
      for (const line of attrLines) {
        docLines.push(`    ${line}`);
      }
    }
    if (docLines.length > 0) {
      header.push(`    """\n    ${docLines.join('\n    ')}\n    """`);
    }
    extraDefs.push(`${header.join('\n')}\n${fields.join('\n')}`);
  }

  function toType(s: OpenAPI.SchemaObject | OpenAPI.ReferenceObject, className: string): string {
    if ('$ref' in s) {
      const match = s.$ref.match(/^#\/components\/schemas\/(.+)$/);
      const refName = match?.[1] ?? s.$ref;
      return `${refName}`;
    }

    if ('oneOf' in s && Array.isArray(s.oneOf)) {
      if (s.oneOf.length === 0) {
        typingImports.add('Any');
        return 'Any';
      }
      if (s.oneOf.length === 1) {
        return toType(s.oneOf[0] as any, className);
      }
      typingImports.add('Union');
      const parts = s.oneOf.map((sub, idx) => toType(sub as any, `${className}Option${idx}`)).join(', ');
      return `Union[${parts}]`;
    }

    if ('anyOf' in s && Array.isArray(s.anyOf)) {
      if (s.anyOf.length === 0) {
        typingImports.add('Any');
        return 'Any';
      }
      if (s.anyOf.length === 1) {
        return toType(s.anyOf[0] as any, className);
      }
      typingImports.add('Union');
      const parts = s.anyOf.map((sub, idx) => toType(sub as any, `${className}Option${idx}`)).join(', ');
      return `Union[${parts}]`;
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
        return `List[${toType(s.items, className)}]`;
      case 'object':
        if (s.properties && Object.keys(s.properties).length > 0) {
          buildClass(className, s);
          return className;
        }
        if (s.additionalProperties && typeof s.additionalProperties === 'object') {
          const valType = toType(s.additionalProperties as any, `${className}Additional`);
          return `dict[str, ${valType}]`;
        }
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
      const typeStr = toType(value as any, `${name}${toPascal(key)}`);
      const desc = (value as any).description;
      if (required.has(key)) {
        typingImports.add('Required');
        fields.push(`    ${key}: Required[${typeStr}]`);
      } else {
        fields.push(`    ${key}: ${typeStr}`);
      }
      if (desc) {
        const descLines = String(desc).split('\n');
        attrLines.push(`${key}:`);
        for (const dl of descLines) {
          attrLines.push(`    ${dl}`);
        }
        attrLines.push('');
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
      if (attrLines[attrLines.length - 1] === '') attrLines.pop();
      if (flat.description) docLines.push('');
      docLines.push('Attributes:');
      for (const line of attrLines) {
        docLines.push(`    ${line}`);
      }
    }
    if (docLines.length > 0) {
      header.push(`    """\n    ${docLines.join('\n    ')}\n    """`);
    }
    definition = `${header.join('\n')}\n${fields.join('\n')}`;
  } else {
    const typeStr = toType(schema, name);
    definition = `${name} = ${typeStr}`;
    if ((schema as any).description) {
      definition += `  # ${((schema as any).description as string).replace(/\n/g, ' ')}`;
    }
  }

  const combined = [...extraDefs, definition].filter(Boolean).join('\n\n');
  return { definition: combined, typingImports };
}
