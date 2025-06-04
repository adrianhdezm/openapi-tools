import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { collectSchemaRefs } from './filter-paths.js';

export function extractSchemas(
  doc: OpenAPI.Document,
  prefixes: string[] | null
): Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> {
  const allSchemas = doc.components?.schemas ?? {};
  if (!prefixes || prefixes.length === 0) {
    return allSchemas;
  }

  const refs = new Set<string>();
  for (const [pathName, pathItem] of Object.entries(doc.paths ?? {})) {
    if (prefixes.some((p) => pathName.startsWith(p))) {
      for (const method of Object.values(pathItem ?? {})) {
        if (typeof method === 'object' && method !== null) {
          collectSchemaRefs(method, refs);
        }
      }
    }
  }

  if (refs.size === 0) {
    return {};
  }

  const collected: Record<string, OpenAPI.SchemaObject | OpenAPI.ReferenceObject> = {};
  const queue = Array.from(refs);
  const processed = new Set<string>();

  while (queue.length) {
    const name = queue.pop()!;
    if (processed.has(name)) continue;
    const schema = allSchemas[name];
    if (schema) {
      collected[name] = schema;
      processed.add(name);
      collectSchemaRefs(schema, refs);
      for (const ref of refs) {
        if (!processed.has(ref) && !queue.includes(ref)) {
          queue.push(ref);
        }
      }
    }
  }

  return collected;
}
